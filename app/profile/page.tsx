"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, User, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { user, session, refreshUser } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [oldAvatarPath, setOldAvatarPath] = useState("")
  const [oldAvatarBucket, setOldAvatarBucket] = useState("")

  // Set initial values from user auth data immediately
  useEffect(() => {
    if (user) {
      console.log("User data available:", user)
      // Set default values from user auth data immediately
      setName(user.user_metadata?.name || "")
      setEmail(user.email || "")
      setAvatarUrl(user.user_metadata?.avatar_url || "")

      // Then try to load profile data in the background
      loadProfileData()
    } else if (!user && !session) {
      console.log("No user or session, redirecting to login")
      router.push("/auth/login")
    }

    setIsLoading(false)
  }, [user, session, router])

  // Load profile data in the background
  const loadProfileData = async () => {
    if (!user) {
      console.log("loadProfileData: No user available")
      return
    }

    if (!user.id) {
      console.log("loadProfileData: User ID is undefined")
      return
    }

    try {
      console.log("Loading profile data for user ID:", user.id)
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error loading profile:", error)

        // Create profile if it doesn't exist
        if (error.code === "PGRST116") {
          try {
            if (!user.id) {
              console.error("Cannot create profile: User ID is undefined")
              return
            }

            await supabase.from("profiles").insert({
              id: user.id,
              name: user.user_metadata?.name || "",
              email: user.email || "",
              avatar_url: user.user_metadata?.avatar_url || "",
              avatar_path: "",
            })
          } catch (insertErr) {
            console.error("Error creating profile:", insertErr)
          }
        }
      } else if (data) {
        // Update form values from profile
        setName(data.name || user.user_metadata?.name || "")
        setEmail(data.email || user.email || "")
        setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || "")

        // Store old avatar path for deletion if needed
        if (data.avatar_path) {
          setOldAvatarPath(data.avatar_path)
        }
        if (data.avatar_bucket) {
          setOldAvatarBucket(data.avatar_bucket)
        }
      }
    } catch (err) {
      console.error("Error loading profile data:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      })
      return
    }

    if (!user.id) {
      toast({
        title: "Error",
        description: "User ID is undefined. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    // Show success toast
    toast({
      title: "Profile Update",
      description: "Your profile is being updated...",
    })

    try {
      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          name,
          avatar_url: avatarUrl,
        },
      })

      // Force refresh the user data in auth context
      await refreshUser()

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      // Navigate to homepage with a full reload to refresh header
      window.location.href = "/"
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "Failed to update profile")

      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      })

      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!user.id) {
      toast({
        title: "Error",
        description: "User ID is undefined. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      // If we have an old avatar path, include it for deletion
      if (oldAvatarPath) {
        formData.append("oldAvatarPath", oldAvatarPath)
      }
      if (oldAvatarBucket) {
        formData.append("oldAvatarBucket", oldAvatarBucket)
      }

      const response = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const data = await response.json()

      // Update state with the returned URL and path
      setAvatarUrl(data.url)
      setOldAvatarPath(data.path)
      setOldAvatarBucket(data.bucket)

      // Update profile with new avatar info
      await supabase
        .from("profiles")
        .update({
          avatar_url: data.url,
          avatar_path: data.path,
          avatar_bucket: data.bucket,
        })
        .eq("id", user.id)

      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      })
    } catch (err: any) {
      console.error("Error uploading image:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>You must be logged in to view your profile.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/auth/login")}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Link href="/" className="inline-flex items-center mb-6">
        <Button variant="ghost" className="p-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Beranda
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profil Saya</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Perbarui informasi profil Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32">
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}

                  {avatarUrl ? (
                    <Image
                      src={avatarUrl || "/placeholder.svg"}
                      alt="Profile"
                      fill
                      className="object-cover rounded-full"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="w-full max-w-xs">
                  <Label htmlFor="avatar" className="block mb-2">
                    Profile Picture
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="w-full md:w-2/3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="h-4 w-4 inline mr-2" />
                    Nama
                  </Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input id="email" value={email} disabled className="bg-gray-100 dark:bg-gray-800" />
                  <p className="text-sm text-gray-500">Email tidak dapat diubah</p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSaving || isUploading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
