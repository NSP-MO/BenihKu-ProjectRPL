"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push("/auth/login")
      return
    }

    // If admin only and user is not admin, redirect to home
    if (
      !isLoading &&
      adminOnly &&
      user &&
      !(user.role === "admin" || user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin")
    ) {
      console.log("User is not admin, redirecting to home", user)
      router.push("/")
      return
    }
  }, [user, isLoading, router, adminOnly])

  // Update the render logic to be more strict
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    )
  }

  // If no user, show nothing (will redirect)
  if (!user) {
    return null
  }

  // If admin only and user is not admin, show nothing (will redirect)
  if (
    adminOnly &&
    !(user.role === "admin" || user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin")
  ) {
    return null
  }

  // Otherwise, show children
  return <>{children}</>
}
