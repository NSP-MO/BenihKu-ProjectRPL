"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Loader2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { uploadProfileImage } from "@/lib/upload"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ProfileImageUploadProps {
  currentImage?: string
  onImageUploaded: (url: string, path: string) => void
}

export function ProfileImageUpload({ currentImage, onImageUploaded }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file (PNG, JPG, JPEG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      })
      return
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload to Supabase
    setIsUploading(true)
    try {
      const result = await uploadProfileImage(file, user.id)

      if (result.success && result.url) {
        onImageUploaded(result.url, result.path)
        toast({
          title: "Success",
          description: "Profile image uploaded successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to upload image",
          variant: "destructive",
        })
        // Revert preview if upload failed
        setPreviewUrl(currentImage || null)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click handlers

    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageUploaded("", "")
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32">
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {previewUrl ? (
          <div className="relative w-32 h-32">
            <Image
              src={previewUrl || "/placeholder.svg?height=128&width=128"}
              alt="Profile preview"
              fill
              className="object-cover rounded-full"
              crossOrigin="anonymous"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 h-8 w-8 rounded-full z-20"
              onClick={clearImage}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />

      <Button variant="outline" onClick={triggerFileInput} disabled={isUploading} type="button" className="w-full">
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Change Profile Picture"
        )}
      </Button>
    </div>
  )
}
