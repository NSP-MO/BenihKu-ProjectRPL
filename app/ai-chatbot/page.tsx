// app/ai-chatbot/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Paperclip, Send, CornerDownLeft, UserCircle, Sparkles, Image as ImageIcon, X as XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  id: string
  text: string
  displayText?: string
  sender: "user" | "ai"
  timestamp: Date
  imagePreview?: string
  imageUrl?: string
  error?: string
  isTyping?: boolean
}

const TYPING_SPEED = 2; // ms

const parseSimpleMarkdown = (text: string) => {
  if (!text) return { __html: "" };
  let html = text;
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\n/g, "<br />");
  if (html.includes("<br />- ") || html.startsWith("- ")) {
    const lines = html.split("<br />");
    let inList = false;
    html = lines.map(line => {
      if (line.trim().startsWith("- ")) {
        const listItem = `<li>${line.trim().substring(2)}</li>`;
        if (!inList) {
          inList = true;
          return `<ul>${listItem}`;
        }
        return listItem;
      } else {
        if (inList) {
          inList = false;
          return `</ul>${line}`;
        }
        return line;
      }
    }).join("<br />");
    if (inList) {
      html += "</ul>";
    }
    html = html.replace(/<\/ul><br \/>/g, "</ul>");
    html = html.replace(/<br \/><ul>/g, "<ul>");
  }
  return { __html: html };
};

export default function AiChatbotPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aiAvatarUrl = "https://source.boringavatars.com/beam/120/BenihKuAI?colors=264653,2a9d8f,e9c46a,f4a261,e76f51";

  useEffect(() => {
    const initialMessageText = "Halo! Saya BenihKu AI, asisten virtual Anda untuk semua hal tentang tanaman. Ada yang bisa saya bantu?";
    setMessages([
      {
        id: "welcome-ai",
        text: initialMessageText,
        displayText: initialMessageText,
        sender: "ai",
        timestamp: new Date(),
        isTyping: false,
      },
    ])
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messages.length > 0 && messages[messages.length-1].displayText]);


  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === "ai" && lastMessage.isTyping && lastMessage.text && lastMessage.displayText !== undefined && lastMessage.displayText.length < lastMessage.text.length) {
      const timer = setTimeout(() => {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === lastMessage.id
              ? { ...msg, displayText: msg.text.substring(0, (msg.displayText?.length || 0) + 1) }
              : msg
          )
        );
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    } else if (lastMessage && lastMessage.sender === "ai" && lastMessage.isTyping && lastMessage.text && lastMessage.displayText?.length === lastMessage.text.length) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === lastMessage.id ? { ...msg, isTyping: false } : msg
        )
      );
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" && !uploadedImage) return

    const userMessageText = inputMessage.trim()
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      displayText: userMessageText,
      sender: "user",
      timestamp: new Date(),
      imagePreview: imagePreview || undefined,
      isTyping: false,
    }

    // Prepare history for API: take all messages except the very first welcome message
    // And convert them to a simpler format for the API history
    const historyForApi = messages.slice(1).map(msg => ({
        sender: msg.sender,
        text: msg.text, // Send the original full text
        // imageUrl: msg.imageUrl, // If you need to pass image history too
    }));


    setMessages((prevMessages) => [...prevMessages, userMessage])
    const currentInput = inputMessage;
    const currentImageFile = uploadedImage;
    setInputMessage("")
    setUploadedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setIsLoading(true)

    const aiTypingPlaceholderId = `ai-typing-${Date.now()}`;
    const aiTypingPlaceholder: Message = {
        id: aiTypingPlaceholderId,
        text: "",
        displayText: "",
        sender: "ai",
        timestamp: new Date(),
        isTyping: true,
    };
    setMessages(prevMessages => [...prevMessages, aiTypingPlaceholder]);


    try {
      const formData = new FormData();
      formData.append("message", currentInput);
      if (currentImageFile) {
        formData.append("image", currentImageFile);
        formData.append("imageName", currentImageFile.name);
        formData.append("imageType", currentImageFile.type);
      }
      // Append history
      formData.append("history", JSON.stringify(historyForApi));


      const response = await fetch("/api/benihku-ai-service", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessageFromServer = `Request failed with status ${response.status}.`;
        if (response.headers.get("content-type")?.includes("application/json")) {
            try {
                const errorJson = JSON.parse(responseText);
                errorMessageFromServer = errorJson.error || errorJson.text || errorJson.detail || responseText;
            } catch (e) {
                errorMessageFromServer = responseText.substring(0, 200) + "...";
            }
        } else {
            errorMessageFromServer = responseText.substring(0, 200) + "...";
        }
        throw new Error(errorMessageFromServer);
      }
     
      const responseData = JSON.parse(responseText);
     
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === aiTypingPlaceholderId ? {
          ...msg,
          id: responseData.id || aiTypingPlaceholderId,
          text: responseData.text || "Tidak ada respons teks dari AI.",
          imageUrl: responseData.imageUrl,
          timestamp: new Date(responseData.timestamp || Date.now()),
          isTyping: true,
        } : msg
      ));

    } catch (error: any) {
      toast({
        title: "Koneksi Error",
        description: error.message || "Gagal menghubungi layanan AI.",
        variant: "destructive",
      });
     
       setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === aiTypingPlaceholderId ? {
            ...msg,
            text: `Maaf, terjadi kesalahan: ${error.message || "Tidak dapat memproses permintaan."}`,
            displayText: `Maaf, terjadi kesalahan: ${error.message || "Tidak dapat memproses permintaan."}`,
            error: error.message,
            isTyping: false,
        } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-slate-900 dark:to-neutral-900">
      <Header />
      <main className="flex-1 container mx-auto py-6 flex flex-col max-w-3xl overflow-hidden">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-2 hover:bg-green-100 dark:hover:bg-green-800/50 rounded-full p-2">
            <ArrowLeft className="h-5 w-5 text-green-700 dark:text-green-400" />
          </Button>
          <div className="flex items-center">
            <Sparkles className="h-7 w-7 text-yellow-400 mr-2" />
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-300">BenihKu AI</h1>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden shadow-xl rounded-xl border-gray-200 dark:border-gray-700/80 bg-white/80 dark:bg-gray-800/70 backdrop-blur-md">
          <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 mb-3 ${msg.sender === "user" ? "justify-end" : ""}`}
              >
                {msg.sender === "ai" && (
                  <Avatar className="h-9 w-9 shadow-sm self-end">
                    <AvatarImage src={aiAvatarUrl} alt="BenihKu AI Avatar" />
                    <AvatarFallback className="bg-green-500 text-white">
                        <Sparkles className="h-5 w-5"/>
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-xl shadow-md text-sm break-words ${
                    msg.sender === "user"
                      ? "bg-green-700 text-white rounded-br-none dark:bg-green-600"
                      : (msg.error
                          ? "bg-red-100 dark:bg-red-800/60 text-red-700 dark:text-red-300 rounded-bl-none border border-red-200 dark:border-red-700"
                          : "bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600/50")
                  }`}
                >
                  {msg.imagePreview && (
                    <div className="mb-2 relative">
                       <Image src={msg.imagePreview} alt="Uploaded preview" width={150} height={150} className="rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"/>
                    </div>
                  )}
                  {msg.sender === "ai" && msg.isTyping && msg.displayText === "" && !msg.text && !msg.error ? (
                     <div className="flex items-center space-x-2 py-1 text-gray-500 dark:text-gray-400">
                        <Sparkles className="h-4 w-4 animate-pulse text-yellow-400" />
                        <span>BenihKu AI sedang berpikir...</span>
                    </div>
                  ) : (
                    <div
                      className="whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-full prose-strong:font-semibold prose-ul:list-disc prose-ul:pl-5 prose-li:my-0.5"
                      dangerouslySetInnerHTML={parseSimpleMarkdown(msg.displayText || msg.text || "")}
                    />
                  )}
                  <p className={`text-xs mt-1.5 opacity-80 ${
                      msg.sender === 'user' ? 'text-green-100 dark:text-green-200'
                      : msg.error ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                    }`
                  }>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === "user" && (
                  <Avatar className="h-9 w-9 shadow-sm self-end">
                     <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                        <UserCircle className="h-5 w-5"/>
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <CardContent className="border-t p-4 dark:border-gray-700/80 bg-white/90 dark:bg-gray-800/80">
            {imagePreview && (
              <div className="mb-3 flex items-center gap-2 p-2.5 border border-gray-200 dark:border-gray-600/50 rounded-lg bg-gray-50 dark:bg-gray-700/30 shadow-sm">
                <Image src={imagePreview} alt="Preview" width={40} height={40} className="rounded-md border border-gray-300 dark:border-gray-500"/>
                <span className="text-sm text-muted-foreground truncate max-w-xs flex-1">{uploadedImage?.name}</span>
                <Button variant="ghost" size="icon" onClick={removeImagePreview} className="ml-auto text-muted-foreground hover:text-destructive h-7 w-7 rounded-full">
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
              <Button variant="outline" size="icon" type="button" onClick={triggerFileInput} aria-label="Unggah Gambar" disabled={isLoading} className="rounded-full h-10 w-10 dark:border-gray-600 hover:bg-green-100 dark:hover:bg-green-700/50 focus-visible:ring-green-500">
                <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan Anda..."
                className="flex-1 h-10 rounded-full px-4 dark:bg-gray-700 dark:border-gray-600 focus-visible:ring-green-500 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button type="submit" disabled={isLoading || (inputMessage.trim() === "" && !uploadedImage)} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-full h-10 w-10 p-0">
                {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-white border-r-white"></span> : <Send className="h-5 w-5" />}
              </Button>
            </form>
             <p className="text-xs text-muted-foreground mt-2 text-center">
              Tekan <CornerDownLeft className="inline h-3 w-3" /> untuk mengirim
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
