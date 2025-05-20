// Store the navigation path in session storage
export const storeNavigationPath = (path: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("previousPath", path)
  }
}

// Get the stored navigation path or fallback to homepage
export const getPreviousPath = (): string => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("previousPath") || "/"
  }
  return "/"
}

// Handle back navigation with fallback
export const handleBackNavigation = (router: any) => {
  if (typeof window !== "undefined") {
    // Try to use browser history first
    if (window.history.length > 1) {
      router.back()
    } else {
      // If no history, use stored path or fallback to homepage
      const previousPath = getPreviousPath()
      router.push(previousPath)
    }
  } else {
    // Server-side fallback
    router.push("/")
  }
}
