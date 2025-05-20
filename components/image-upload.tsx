"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Loader2, Upload, X, AlertTriangle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { uploadProductImage } from "@/lib/upload"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImageUploadProps {
  currentImage?: string
  onImageUploaded: (url: string, path: string, bucket?: string) => void
  onError?: (error: string) => void
}

export function ImageUpload({ currentImage, onImageUploaded, onError }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [noBuckets, setNoBuckets] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleError = (message: string) => {
    // Check if the error is about no storage buckets
    if (message.includes("No storage buckets found") || message.includes("bucket not found")) {
      setNoBuckets(true)
    }

    if (onError) {
      onError(message)
    } else {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      handleError("Please upload an image file (PNG, JPG, JPEG, etc.)")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      handleError("Image size should be less than 5MB")
      return
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload to Supabase
    setIsUploading(true)
    setNoBuckets(false)
    try {
      const result = await uploadProductImage(file)

      if (result.success && result.url) {
        onImageUploaded(result.url, result.path, result.bucket)
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      } else {
        handleError(result.error || "Failed to upload image")
        // Revert preview if upload failed
        setPreviewUrl(currentImage || null)
      }
    } catch (error: any) {
      handleError(error.message || "An unexpected error occurred")
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearImage = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageUploaded("", "")
  }

  return (
    <div className="space-y-4">
      {noBuckets && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Not Configured</AlertTitle>
          <AlertDescription>
            No storage buckets found. Please{" "}
            <Link href="/admin/setup" className="font-medium underline">
              set up storage buckets
            </Link>{" "}
            before uploading images.
          </AlertDescription>
        </Alert>
      )}

      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <div className="mx-auto w-48 h-48 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden relative">
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {previewUrl ? (
            <>
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Product preview"
                fill
                className="object-contain"
                crossOrigin="anonymous"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full z-20"
                onClick={clearImage}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center">
              <Upload className="h-10 w-10 mb-2" />
              <span>No image</span>
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

        <div className="space-y-2">
          <Button variant="outline" onClick={triggerFileInput} disabled={isUploading || noBuckets} type="button">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Image"
            )}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">Format: JPG, PNG, WebP. Max size: 5MB.</p>
        </div>
      </div>
    </div>
  )
}
