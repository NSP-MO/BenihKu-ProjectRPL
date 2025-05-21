"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  processAuthResponse,
  getNameFromEmail,
  getUserNameFromMetadata,
  requestPasswordResetEmail,
  updateUserPassword,
} from "@/lib/custom-auth"
import { supabase } from "@/lib/supabase" //

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
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }> // <-- Tambahkan ini
  resetPasswordFromContext: (newPassword: string) => Promise<{ success: boolean; error?: string; user?: any }> // <-- Tambahkan ini (ubah nama agar lebih jelas)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      try {
        const userFromHash = await processAuthResponse()

        if (userFromHash) {
          setUser(userFromHash)
          if (window.location.hash) {
            router.push("/")
          }
        } else {
          const storedUser = localStorage.getItem("benihku_user")
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser)
              if (parsedUser && parsedUser.id && parsedUser.email) {
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

          const { data } = await supabase.auth.getSession()
          if (data.session?.user && !user) {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event detected. User should be on reset password page.")
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session) {
          const userName = getUserNameFromMetadata(session.user) || getNameFromEmail(session.user.email || "")
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            name: userName,
            role: session.user.user_metadata?.role || "user",
          }
          setUser(userData)
          localStorage.setItem("benihku_user", JSON.stringify(userData))
          if (event === "SIGNED_IN" && !getUserNameFromMetadata(session.user) && session.user.email) {
            await supabase.auth.updateUser({
              data: { name: userName },
            })
          }
          if (
            pathname &&
            !pathname.includes("/auth/reset-password") &&
            (pathname.includes("/auth/login") || pathname.includes("/auth/signup"))
          ) {
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
  }, [router, pathname]) // Added pathname dependency

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error from Supabase:", error)
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: "Login gagal" }
      }

      const userName = getUserNameFromMetadata(data.user) || getNameFromEmail(data.user.email || "")
      const userData = {
        id: data.user.id,
        email: data.user.email || "",
        name: userName,
        role: data.user.user_metadata?.role || "user",
      }

      setUser(userData)
      localStorage.setItem("benihku_user", JSON.stringify(userData))
      return { success: true }
    } catch (error: any) {
      console.error("Login exception:", error)
      return { success: false, error: error.message || "Terjadi kesalahan saat login" }
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "user",
          },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        requiresEmailVerification: data?.user?.identities?.length === 0 || data?.user?.email_confirmed_at === null,
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem("benihku_user")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const refreshUser = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        const userName = getUserNameFromMetadata(data.session.user) || getNameFromEmail(data.session.user.email || "")
        const userData = {
          id: data.session.user.id,
          email: data.session.user.email || "",
          name: userName,
          role: data.session.user.user_metadata?.role || "user",
        }
        setUser(userData)
        localStorage.setItem("benihku_user", JSON.stringify(userData))
      }
    } catch (error) {
      console.error("Refresh user error:", error)
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      return await requestPasswordResetEmail(email)
    } catch (error: any) {
      console.error("Request password reset exception in context:", error)
      return { success: false, error: error.message }
    }
  }

  const resetPasswordFromContext = async (newPassword: string) => {
    try {
      return await updateUserPassword(newPassword)
    } catch (error: any) {
      console.error("Reset password exception in context:", error)
      return { success: false, error: error.message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        signInWithGoogle,
        requestPasswordReset,
        resetPasswordFromContext,
      }}
    >
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

    if (!user || !user.id || !user.email) {
      localStorage.removeItem("benihku_user")
      return null
    }

    if (!user.name) {
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
