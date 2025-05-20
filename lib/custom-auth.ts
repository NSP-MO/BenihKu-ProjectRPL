import { supabase } from "./supabase"
import crypto from "crypto"

// Function to hash password
const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// Function to register a user with Supabase Auth but with minimal validation
export const registerUser = async (name: string, email: string, password: string) => {
  try {
    console.log("Starting registration with minimal validation...")

    // Minimal email cleaning - just trim and lowercase
    const cleanEmail = email.trim().toLowerCase()

    // Very basic validation - just check if it has @ and .
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return { success: false, error: "Email harus mengandung @ dan ." }
    }

    // Check if password is at least 6 characters
    if (password.length < 6) {
      return { success: false, error: "Password harus minimal 6 karakter" }
    }

    console.log("Attempting to sign up with Supabase Auth...")

    // Try to sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          role: "user",
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      console.error("Supabase Auth signup error:", error)

      // Special handling for email validation errors
      if (error.message.includes("invalid format") || error.message.includes("validate email")) {
        return {
          success: false,
          error: "Format email tidak valid. Coba gunakan email yang lebih sederhana seperti nama@example.com",
        }
      }

      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Gagal membuat pengguna" }
    }

    console.log("Successfully signed up with Supabase Auth")

    // Insert into profiles table
    try {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        name,
        email: cleanEmail,
        role: "user",
      })

      if (profileError) {
        console.error("Error creating profile:", profileError)
        // Don't return error here, as the user is already created
      }
    } catch (profileErr) {
      console.error("Exception creating profile:", profileErr)
      // Continue anyway
    }

    // Return success but don't automatically log in the user
    // They need to verify their email first
    return {
      success: true,
      requiresEmailVerification: true,
      user: null,
    }
  } catch (error: any) {
    console.error("Registration exception:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat pendaftaran" }
  }
}

// Update the loginUser function to store user data in localStorage
export const loginUser = async (email: string, password: string) => {
  try {
    const cleanEmail = email.trim().toLowerCase()

    console.log("Attempting to sign in with Supabase Auth...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Email atau password salah." }
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
      return {
        success: false,
        error: "Email belum diverifikasi. Silakan periksa email Anda untuk link verifikasi.",
      }
    }

    console.log("Successfully signed in with Supabase Auth")

    // Get name from metadata or use email username as fallback
    const userName = getUserNameFromMetadata(data.user) || getNameFromEmail(data.user.email || "")

    // Create user object
    const user = {
      id: data.user.id,
      email: data.user.email || "",
      name: userName,
      role: data.user.user_metadata?.role || "user",
    }

    // Store user in localStorage
    localStorage.setItem("benihku_user", JSON.stringify(user))

    return {
      success: true,
      user,
    }
  } catch (error: any) {
    console.error("Login exception:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat login" }
  }
}

// Function to sign in with Google
export const signInWithGoogleProvider = async () => {
  try {
    // Use the Supabase callback URL directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Don't specify redirectTo - let Supabase handle it with its default callback
        queryParams: {
          // Optional: Add access_type=offline to get a refresh token
          access_type: "offline",
          // Optional: Prompt for consent to ensure you get a refresh token
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.error("Google sign in error:", error)
      return { success: false, error: error.message }
    }

    // For OAuth, we don't immediately get the user since it redirects to Google
    // The user will be handled in the callback
    return { success: true }
  } catch (error: any) {
    console.error("Google sign in exception:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat login dengan Google" }
  }
}

// Helper function to extract name from email
export const getNameFromEmail = (email: string): string => {
  if (!email) return "User"

  // Get the part before @ symbol
  const username = email.split("@")[0]

  // Convert to title case (capitalize first letter of each word)
  return username
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Helper function to get user name from metadata
export const getUserNameFromMetadata = (user: any): string | null => {
  if (!user) return null

  // Check various possible name fields in metadata
  return user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.preferred_username || null
}

// Function to handle auth state change and store user in localStorage
export const handleAuthStateChange = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session && session.user) {
      // Get name from metadata or use email username as fallback
      const userName = getUserNameFromMetadata(session.user) || getNameFromEmail(session.user.email || "")

      // Get user data from session
      const user = {
        id: session.user.id,
        email: session.user.email || "",
        name: userName,
        role: session.user.user_metadata?.role || "user",
      }

      // Store user in localStorage
      localStorage.setItem("benihku_user", JSON.stringify(user))

      // Update user metadata if name is missing
      if (!getUserNameFromMetadata(session.user) && session.user.email) {
        await supabase.auth.updateUser({
          data: { name: userName },
        })
      }

      return user
    } else {
      // Clear user from localStorage if no session
      localStorage.removeItem("benihku_user")
      return null
    }
  } catch (error) {
    console.error("Error handling auth state change:", error)
    return null
  }
}

// Update the logoutUser function to clear localStorage
export const logoutUser = async () => {
  try {
    await supabase.auth.signOut()
    // Clear user from localStorage
    localStorage.removeItem("benihku_user")
    return { success: true }
  } catch (error: any) {
    console.error("Logout error:", error)
    return { success: false, error: error.message }
  }
}

// Function to get the current user
export const getCurrentUser = async () => {
  try {
    const { data } = await supabase.auth.getSession()

    if (!data.session || !data.session.user) {
      return null
    }

    const user = data.session.user

    // Get name from metadata or use email username as fallback
    const userName = getUserNameFromMetadata(user) || getNameFromEmail(user.email || "")

    return {
      id: user.id,
      email: user.email || "",
      name: userName,
      role: user.user_metadata?.role || "user",
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Function to extract and process access token from URL hash
export const processAuthResponse = async () => {
  if (typeof window !== "undefined" && window.location.hash) {
    try {
      // Extract the hash without the # character
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token")

      if (accessToken) {
        // Get user data using the access token
        const { data, error } = await supabase.auth.getUser(accessToken)

        if (error) {
          console.error("Error getting user from access token:", error)
          return null
        }

        if (data.user) {
          // Get name from metadata or use email username as fallback
          const userName = getUserNameFromMetadata(data.user) || getNameFromEmail(data.user.email || "")

          // Create user object
          const user = {
            id: data.user.id,
            email: data.user.email || "",
            name: userName,
            role: data.user.user_metadata?.role || "user",
          }

          // Store user in localStorage
          localStorage.setItem("benihku_user", JSON.stringify(user))

          // Update user metadata if name is missing
          if (!getUserNameFromMetadata(data.user) && data.user.email) {
            await supabase.auth.updateUser({
              data: { name: userName },
            })
          }

          // Clear the hash fragment
          window.history.replaceState(null, document.title, window.location.pathname)

          return user
        }
      }
    } catch (error) {
      console.error("Error processing auth response:", error)
    }
  }

  return null
}
