"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  registerUser,
  loginUser,
  logoutUser,
  signInWithGoogleProvider,
  handleAuthStateChange,
  processAuthResponse,
  getNameFromEmail,
  getUserNameFromMetadata,
} from "@/lib/custom-auth"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Handle auth state changes and URL hash tokens
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      try {
        // First check if we have a hash with access token (from OAuth)
        const userFromHash = await processAuthResponse()

        if (userFromHash) {
          setUser(userFromHash)

          // If we're on a page with hash params, redirect to home
          if (window.location.hash) {
            router.push("/")
          }
        } else {
          // Otherwise check localStorage and session
          const storedUser = localStorage.getItem("benihku_user")

          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser)
              if (parsedUser && parsedUser.id && parsedUser.email) {
                // Ensure name is not empty
                if (!parsedUser.name) {
                  parsedUser.name = getNameFromEmail(parsedUser.email)
                }
                setUser(parsedUser)
              }
            } catch (error) {
              console.error("Invalid user data in localStorage:", error)
              localStorage.removeItem("benihku_user")
            }
          }

          // Also check with Supabase for current session
          const { data } = await supabase.auth.getSession()
          if (data.session?.user && !user) {
            // Get name from metadata or use email username as fallback
            const userName =
              getUserNameFromMetadata(data.session.user) || getNameFromEmail(data.session.user.email || "")

            const userData = {
              id: data.session.user.id,
              email: data.session.user.email || "",
              name: userName,
              role: data.session.user.user_metadata?.role || "user",
            }

            setUser(userData)
            localStorage.setItem("benihku_user", JSON.stringify(userData))

            // Update user metadata if name is missing
            if (!getUserNameFromMetadata(data.session.user) && data.session.user.email) {
              await supabase.auth.updateUser({
                data: { name: userName },
              })
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session) {
          // Get name from metadata or use email username as fallback
          const userName = getUserNameFromMetadata(session.user) || getNameFromEmail(session.user.email || "")

          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            name: userName,
            role: session.user.user_metadata?.role || "user",
          }

          setUser(userData)
          localStorage.setItem("benihku_user", JSON.stringify(userData))

          // Update user metadata if name is missing
          if (event === "SIGNED_IN" && !getUserNameFromMetadata(session.user) && session.user.email) {
            await supabase.auth.updateUser({
              data: { name: userName },
            })
          }

          // If we're on a login or signup page, redirect to home
          if (pathname?.includes("/auth/login") || pathname?.includes("/auth/signup")) {
            router.push("/")
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        localStorage.removeItem("benihku_user")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  const login = async (email: string, password: string) => {
    try {
      const result = await loginUser(email, password)

      if (result.success && result.user) {
        setUser(result.user)
      }

      return result
    } catch (error: any) {
      console.error("Login exception:", error)
      return { success: false, error: error.message }
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      const result = await registerUser(name, email, password)

      // Don't set user here - we want them to verify email first
      return result
    } catch (error: any) {
      console.error("Signup exception:", error)
      return { success: false, error: error.message }
    }
  }

  const signInWithGoogle = async () => {
    try {
      return await signInWithGoogleProvider()
    } catch (error: any) {
      console.error("Google sign in exception:", error)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    logoutUser()
    setUser(null)
    router.push("/auth/login")
  }

  const refreshUser = async () => {
    const currentUser = await handleAuthStateChange()
    setUser(currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem("benihku_user")

    if (!storedUser) {
      return null
    }

    const user = JSON.parse(storedUser)

    // Validate the user object has required fields
    if (!user || !user.id || !user.email) {
      // Clear invalid user data
      localStorage.removeItem("benihku_user")
      return null
    }

    // Ensure name is not empty
    if (!user.name) {
      // Extract name from email
      const email = user.email
      user.name = email
        .split("@")[0]
        .split(/[._-]/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    // Clear invalid user data
    localStorage.removeItem("benihku_user")
    return null
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
