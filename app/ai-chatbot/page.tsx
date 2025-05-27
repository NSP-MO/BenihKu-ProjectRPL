// app/ai-chatbot/page.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Paperclip, Send, Bot, UserCircle, Image as ImageIcon, X as XIcon, CornerDownLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
  id: string
  text: string // Full text from AI or user
  displayText?: string // Text shown during typing effect for AI
  sender: "user" | "ai"
  timestamp: Date
  imagePreview?: string // For user's uploaded image before sending
  imageUrl?: string // For AI's image response, if any
  error?: string
  isTyping?: boolean // Flag for AI messages undergoing typing effect
}

export default function AiChatbotPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([
      {
        id: "welcome-ai",
        text: "Halo! Saya BenihKu AI. Siap membantu Anda dengan pertanyaan seputar tanaman dan produk kami!",
        displayText: "Halo! Saya BenihKu AI. Siap membantu Anda dengan pertanyaan seputar tanaman dan produk kami!",
        sender: "ai",
        timestamp: new Date(),
        isTyping: false,
      },
    ])
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Typing effect for AI messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.sender === "ai" && lastMessage.isTyping && lastMessage.text && !lastMessage.error) {
      const words = lastMessage.text.split(" ")
      let currentWordIndex = 0
      let currentDisplay = ""

      // Initialize displayText for the message being typed
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === lastMessage.id ? { ...msg, displayText: "" } : msg
        )
      )

      const intervalId = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentDisplay += (currentWordIndex > 0 ? " " : "") + words[currentWordIndex]
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === lastMessage.id ? { ...msg, displayText: currentDisplay } : msg
            )
          )
          currentWordIndex++
        } else {
          clearInterval(intervalId)
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === lastMessage.id ? { ...msg, isTyping: false, displayText: lastMessage.text } : msg
            )
          )
        }
      }, 100) // Adjust speed: 100ms per word

      return () => clearInterval(intervalId)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" && !uploadedImage) return

    const userMessageText = inputMessage.trim()
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
      imagePreview: imagePreview || undefined, // Keep preview for user message
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    const currentInput = inputMessage
    const currentImageFile = uploadedImage
    setInputMessage("")
    setUploadedImage(null)
    setImagePreview(null) // Clear preview after message is added to list
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setIsLoading(true)

    let aiResponseMessage: Message | null = null

    try {
      const formData = new FormData()
      formData.append("message", currentInput)
      if (currentImageFile) {
        formData.append("image", currentImageFile)
        formData.append("imageName", currentImageFile.name)
        formData.append("imageType", currentImageFile.type)
      }

      const response = await fetch("/api/benihku-ai-service", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      let responseData

      if (!response.ok) {
        let errorMessageFromServer = `Request failed with status ${response.status}.`
        try {
          const errorJson = JSON.parse(responseText)
          errorMessageFromServer = errorJson.error || errorJson.text || errorJson.detail || responseText
        } catch (e) {
          errorMessageFromServer = responseText.substring(0, 200) + "..."
        }
        throw new Error(errorMessageFromServer)
      }

      try {
        responseData = JSON.parse(responseText)
      } catch (jsonError) {
        throw new Error(`Server returned malformed JSON. Content: ${responseText.substring(0, 200)}...`)
      }

      aiResponseMessage = {
        id: responseData.id || `ai-fallback-${Date.now()}`,
        text: responseData.text || "Tidak ada respons teks dari AI.",
        displayText: "", // Will be populated by typing effect
        sender: "ai",
        timestamp: new Date(responseData.timestamp || Date.now()),
        imageUrl: responseData.imageUrl,
        isTyping: true, // Enable typing effect
      }
    } catch (error: any) {
      console.error("Frontend: Error in handleSendMessage:", error)
      toast({
        title: "Koneksi Error",
        description: error.message || "Gagal menghubungi layanan AI.",
        variant: "destructive",
      })

      aiResponseMessage = {
        id: `error-${Date.now()}`,
        text: `Maaf, terjadi kesalahan: ${error.message || "Tidak dapat memproses permintaan."}`,
        displayText: `Maaf, terjadi kesalahan: ${error.message || "Tidak dapat memproses permintaan."}`,
        sender: "ai",
        timestamp: new Date(),
        error: error.message,
        isTyping: false, // No typing effect for errors
      }
    } finally {
      if (aiResponseMessage) {
        setMessages((prevMessages) => [...prevMessages, aiResponseMessage!])
      }
      setIsLoading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ukuran Gambar Terlalu Besar",
          description: "Mohon unggah gambar dengan ukuran kurang dari 5MB.",
          variant: "destructive",
        })
        return
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format File Tidak Didukung",
          description: "Mohon unggah file gambar (contoh: JPG, PNG, WEBP).",
          variant: "destructive",
        })
        return
      }
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeImagePreview = () => {
    setUploadedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-6 flex flex-col max-w-3xl">
        <div className="flex items-center mb-4 px-2 md:px-0">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-2 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">BenihKu AI</h1>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-card dark:bg-slate-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-800">
          <ScrollArea className="flex-1 p-4 md:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <Avatar className="h-8 w-8 self-start flex-shrink-0">
                    <AvatarImage src="/logo.png" alt="BenihKu AI" />
                    <AvatarFallback><Bot className="h-5 w-5 text-green-600"/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] p-3 shadow-sm ${
                    msg.sender === "user"
                      ? "bg-green-600 text-white rounded-t-xl rounded-bl-xl"
                      : msg.error
                        ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-t-xl rounded-br-xl border border-red-200 dark:border-red-700"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-t-xl rounded-br-xl border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {msg.imagePreview && msg.sender === 'user' && (
                    <div className="mb-2 relative">
                      <Image src={msg.imagePreview} alt="Uploaded preview" width={150} height={150} className="rounded-md border dark:border-gray-600"/>
                    </div>
                  )}
                   {msg.imageUrl && msg.sender === 'ai' && (
                    <div className="mb-2 relative">
                       <Image src={msg.imageUrl} alt="AI generated image" width={200} height={200} className="rounded-md border dark:border-gray-600"/>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {(msg.sender === 'ai' && (msg.isTyping || msg.displayText !== undefined)) ? msg.displayText : msg.text}
                  </p>
                  <p className={`text-xs mt-1.5 ${
                      msg.sender === 'user' ? 'text-green-100 opacity-80'
                      : msg.error ? 'text-red-500 dark:text-red-400 opacity-80'
                      : 'text-gray-500 dark:text-gray-400 opacity-80'
                    }`
                  }>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.sender === "user" && (
                  <Avatar className="h-8 w-8 self-start flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                        <UserCircle className="h-6 w-6 text-gray-500 dark:text-gray-400"/>
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && messages[messages.length -1]?.sender === 'user' && ( // Show loading only if last message was user's
                <div className="flex items-end gap-2.5 justify-start">
                    <Avatar className="h-8 w-8 self-start flex-shrink-0">
                        <AvatarImage src="/logo.png" alt="BenihKu AI" />
                        <AvatarFallback><Bot className="h-5 w-5 text-green-600"/></AvatarFallback>
                    </Avatar>
                    <div className="max-w-[75%] p-3 shadow-sm bg-gray-100 dark:bg-gray-800 rounded-t-xl rounded-br-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-1.5">
                            <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-75"></span>
                            <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-150"></span>
                            <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-200"></span>
                        </div>
                    </div>
                </div>
            )}
          </ScrollArea>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 bg-background dark:bg-slate-800/50">
            {imagePreview && (
              <div className="mb-3 flex items-center gap-2 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 max-w-xs">
                <Image src={imagePreview} alt="Preview" width={40} height={40} className="rounded-md border border-gray-400 dark:border-gray-500"/>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{uploadedImage?.name}</span>
                <Button variant="ghost" size="icon" onClick={removeImagePreview} className="ml-auto text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 h-7 w-7">
                    <XIcon className="h-4 w-4"/>
                </Button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading}
              />
              <Button variant="outline" size="icon" type="button" onClick={triggerFileInput} aria-label="Unggah Gambar" disabled={isLoading} className="flex-shrink-0 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-500 dark:hover:border-green-500">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan Anda atau unggah gambar..."
                className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && (inputMessage.trim() !== "" || uploadedImage)) {
                       handleSendMessage();
                    }
                  }
                }}
              />
              <Button type="submit" disabled={isLoading || (inputMessage.trim() === "" && !uploadedImage)} className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
                {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-white border-r-white"></span> : <Send className="h-5 w-5" />}
              </Button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Tekan <CornerDownLeft className="inline h-3 w-3 align-middle" /> untuk mengirim, Shift + <CornerDownLeft className="inline h-3 w-3 align-middle" /> untuk baris baru.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
