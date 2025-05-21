// ... (fungsi lainnya yang sudah ada)
import { supabase } from "./supabase" //

// Process authentication response from URL hash
export const processAuthResponse = async (): Promise<any | null> => {
  try {
    // Check if there's a hash in the URL (typically after OAuth or email magic link)
    if (window.location.hash) {
      // Let Supabase handle the hash
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error processing auth response:", error)
        return null
      }

      if (data.session?.user) {
        const userName = getUserNameFromMetadata(data.session.user) || getNameFromEmail(data.session.user.email || "")
        const userData = {
          id: data.session.user.id,
          email: data.session.user.email || "",
          name: userName,
          role: data.session.user.user_metadata?.role || "user",
        }

        localStorage.setItem("benihku_user", JSON.stringify(userData))
        return userData
      }
    }
    return null
  } catch (error) {
    console.error("Error processing auth response:", error)
    return null
  }
}

// Function to request a password reset email
export const requestPasswordResetEmail = async (email: string) => {
  try {
    const cleanEmail = email.trim().toLowerCase()
    // Redirect URL for the password reset link.
    // This should point to your app's page that handles password reset.
    const redirectTo = `${window.location.origin}/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    })

    if (error) {
      console.error("Password reset request error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Password reset request exception:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat meminta reset password." }
  }
}

// Function to update the user's password after they've clicked the reset link
export const updateUserPassword = async (newPassword: string) => {
  try {
    // The user should have been redirected from the email link,
    // and the Supabase client should have picked up the recovery token from the URL hash.
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("Password update error:", error)
      // Check for specific errors like "Invalid token" or "Token expired"
      if (
        error.message.includes("Invalid Refresh Token: Already Used") ||
        error.message.includes("Token has expired")
      ) {
        return { success: false, error: "Link reset password tidak valid atau sudah kedaluwarsa. Silakan coba lagi." }
      }
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Gagal memperbarui password pengguna." }
    }

    // Sign out the user after successful password reset to force them to log in with the new password
    await supabase.auth.signOut()
    localStorage.removeItem("benihku_user")

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Password update exception:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat memperbarui password." }
  }
}

// Function to extract a name from an email address
export const getNameFromEmail = (email: string): string => {
  if (!email) return "User"

  // Extract the part before the @ symbol
  const namePart = email.split("@")[0]

  // Convert to title case and replace special characters with spaces
  return namePart
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

// Get user name from metadata
export const getUserNameFromMetadata = (user: any): string | null => {
  if (!user) return null

  // Try to get name from different possible locations in metadata
  return user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.preferred_username || null
}

// ... (sisa fungsi di custom-auth.ts)
