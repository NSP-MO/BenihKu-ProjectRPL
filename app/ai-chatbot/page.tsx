// app/ai-chatbot/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Paperclip, Send, CornerDownLeft, Bot, UserCircle, Image as ImageIcon, X as XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card";

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
  imagePreview?: string
  imageUrl?: string
  error?: string // Tambahkan properti error opsional
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
        text: "Halo! Saya BenihKu AI. Siap membantu Anda!",
        sender: "ai",
        timestamp: new Date(),
      },
    ])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" && !uploadedImage) return

    const userMessageText = inputMessage.trim()
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
      imagePreview: imagePreview || undefined,
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    const currentInput = inputMessage; // Simpan input sebelum direset
    const currentImageFile = uploadedImage; // Simpan file gambar sebelum direset
    setInputMessage("")
    setUploadedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setIsLoading(true)

    let aiResponseMessage: Message | null = null;

    try {
      const formData = new FormData();
      formData.append("message", currentInput); // Gunakan currentInput
      if (currentImageFile) { // Gunakan currentImageFile
        formData.append("image", currentImageFile);
        formData.append("imageName", currentImageFile.name);
        formData.append("imageType", currentImageFile.type);
      }

      console.log("Frontend: Sending request to /api/benihku-ai-service");
      const response = await fetch("/api/benihku-ai-service", { // URL API Route Baru
        method: "POST",
        body: formData,
      });

      console.log(`Frontend: Raw response status: ${response.status}`);
      console.log("Frontend: Raw response headers:", Object.fromEntries(response.headers.entries()));

      let responseData;
      const responseText = await response.text(); // Selalu baca sebagai teks dulu
      console.log("Frontend: Raw response text:", responseText);


      if (!response.ok) {
         // Jika status tidak OK, coba parse sebagai JSON jika content-type mengindikasikan
         // Jika tidak, gunakan responseText sebagai pesan error
        let errorMessageFromServer = `Request failed with status ${response.status}.`;
        if (response.headers.get("content-type")?.includes("application/json")) {
            try {
                const errorJson = JSON.parse(responseText);
                errorMessageFromServer = errorJson.error || errorJson.text || errorJson.detail || responseText;
            } catch (e) {
                // Biarkan responseText sebagai pesan error jika parsing JSON gagal
                errorMessageFromServer = responseText.substring(0, 200) + "...";
            }
        } else {
            errorMessageFromServer = responseText.substring(0, 200) + "...";
        }
        throw new Error(errorMessageFromServer);
      }

      try {
        responseData = JSON.parse(responseText); // Parse teks yang sudah dibaca
        console.log("Frontend: Parsed JSON response:", responseData);
      } catch (jsonError) {
        console.error("Frontend: Failed to parse JSON response from text. Error:", jsonError);
        throw new Error(`Server returned malformed JSON. Content: ${responseText.substring(0, 200)}...`);
      }
      
      aiResponseMessage = {
        id: responseData.id || `ai-fallback-${Date.now()}`,
        text: responseData.text || "Tidak ada respons teks dari AI.",
        sender: "ai",
        timestamp: new Date(responseData.timestamp || Date.now()),
        imageUrl: responseData.imageUrl,
      };

    } catch (error: any) {
      console.error("Frontend: Error in handleSendMessage:", error);
      toast({
        title: "Koneksi Error",
        description: error.message || "Gagal menghubungi layanan AI.",
        variant: "destructive",
      });
      
      aiResponseMessage = {
        id: `error-${Date.now()}`,
        text: `Maaf, terjadi kesalahan: ${error.message || "Tidak dapat memproses permintaan."}`,
        sender: "ai",
        timestamp: new Date(),
        error: error.message,
      };
    } finally {
      if (aiResponseMessage) {
        setMessages((prevMessages) => [...prevMessages, aiResponseMessage!]);
      }
      setIsLoading(false);
    }
  };

  // Fungsi handleImageUpload, triggerFileInput, removeImagePreview tetap sama
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast({
          title: "Ukuran Gambar Terlalu Besar",
          description: "Mohon unggah gambar dengan ukuran kurang dari 5MB.",
          variant: "destructive",
        })
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format File Tidak Didukung",
          description: "Mohon unggah file gambar (contoh: JPG, PNG, WEBP).",
          variant: "destructive",
        })
        return;
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
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 container py-6 flex flex-col">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">BenihKu AI</h1>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden dark:border-gray-700">
          <ScrollArea className="flex-1 p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : ""}`}
              >
                {msg.sender === "ai" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/logo.png" alt="BenihKu AI" /> 
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow-sm ${ 
                    msg.sender === "user"
                      ? "bg-green-600 text-white rounded-br-none"
                      : (msg.error ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-bl-none" 
                                   : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none")
                  }`}
                >
                  {msg.imagePreview && (
                    <div className="mb-2 relative">
                       <Image src={msg.imagePreview} alt="Uploaded preview" width={150} height={150} className="rounded-md border dark:border-gray-600"/>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                      msg.sender === 'user' ? 'text-green-200' 
                      : msg.error ? 'text-red-400 dark:text-red-400' 
                      : 'text-gray-400 dark:text-gray-500'
                    }`
                  }>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === "user" && (
                  <Avatar className="h-8 w-8">
                     <AvatarFallback><UserCircle className="h-6 w-6"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
                <div className="flex items-end gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/logo.png" alt="BenihKu AI" />
                         <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm">
                        <div className="flex items-center space-x-1">
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-200"></span>
                        </div>
                    </div>
                </div>
            )}
          </ScrollArea>

          <div className="border-t p-4 dark:border-gray-700 bg-background">
            {imagePreview && (
              <div className="mb-2 flex items-center gap-2 p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                <Image src={imagePreview} alt="Preview" width={48} height={48} className="rounded-md border dark:border-gray-500"/>
                <span className="text-sm text-muted-foreground truncate max-w-xs">{uploadedImage?.name}</span>
                <Button variant="ghost" size="icon" onClick={removeImagePreview} className="ml-auto text-muted-foreground hover:text-destructive">
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
              />
              <Button variant="outline" size="icon" type="button" onClick={triggerFileInput} aria-label="Unggah Gambar" disabled={isLoading} className="dark:border-gray-600">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan Anda atau unggah gambar..."
                className="flex-1 dark:bg-gray-800 dark:border-gray-600"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button type="submit" disabled={isLoading || (inputMessage.trim() === "" && !uploadedImage)} className="bg-green-600 hover:bg-green-700">
                {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-white border-r-white"></span> : <Send className="h-5 w-5" />}
              </Button>
            </form>
             <p className="text-xs text-muted-foreground mt-2 text-center">
              Tekan <CornerDownLeft className="inline h-3 w-3" /> untuk mengirim, Shift + <CornerDownLeft className="inline h-3 w-3" /> untuk baris baru.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}
