"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export type CartItem = {
  id: number
  name: string
  price: number
  image: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  refreshCart: () => Promise<void> // Added refreshCart function
  totalItems: number
  totalPrice: number
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "benihku_cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const operationInProgress = useRef(false)
  const cartOperationTimeout = useRef<NodeJS.Timeout | null>(null)

  // Calculate total items and price
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0)

  // Fetch cart from database with caching
  const fetchCartFromDatabase = async () => {
    if (!user) return []

    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("cart_items").select("*").eq("user_id", user.id)

      if (error) {
        console.error("Error fetching cart from database:", error)
        return []
      }

      if (data && data.length > 0) {
        // Transform database data to CartItem format
        return data.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          image: item.image_url || "",
          quantity: item.quantity,
        }))
      }

      return []
    } catch (error) {
      console.error("Error fetching cart:", error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Load cart from database or localStorage
  const loadCart = async () => {
    setIsLoading(true)

    try {
      if (user) {
        // For logged-in users, always fetch from database
        const cartItems = await fetchCartFromDatabase()
        setItems(cartItems)
      } else {
        // For non-logged-in users, use localStorage
        const storedCart = localStorage.getItem(CART_STORAGE_KEY)
        if (storedCart) {
          try {
            const cartItems = JSON.parse(storedCart)
            setItems(Array.isArray(cartItems) ? cartItems : [])
          } catch (error) {
            console.error("Error parsing localStorage cart:", error)
            setItems([])
          }
        } else {
          setItems([])
        }
      }
    } catch (error) {
      console.error("Error loading cart:", error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  // Add refreshCart function to explicitly reload cart data
  const refreshCart = async () => {
    if (operationInProgress.current) return
    operationInProgress.current = true

    try {
      await loadCart()
    } finally {
      setTimeout(() => {
        operationInProgress.current = false
      }, 500)
    }
  }

  // Load cart when user changes
  useEffect(() => {
    loadCart()

    // Clean up any pending operations when user changes
    return () => {
      if (cartOperationTimeout.current) {
        clearTimeout(cartOperationTimeout.current)
      }
    }
  }, [user])

  // Save cart to localStorage for non-logged-in users
  useEffect(() => {
    if (!user && !isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isLoading, user])

  // Debounce function to prevent rapid successive calls
  const debounce = (fn: Function, delay: number) => {
    if (cartOperationTimeout.current) {
      clearTimeout(cartOperationTimeout.current)
    }

    return new Promise<void>((resolve) => {
      cartOperationTimeout.current = setTimeout(() => {
        resolve(fn())
      }, delay)
    })
  }

  // Add item to cart
  const addItem = async (item: Omit<CartItem, "quantity">) => {
    if (operationInProgress.current) return
    operationInProgress.current = true

    try {
      if (user) {
        // For logged-in users, add to database first
        setIsLoading(true)

        // Check if item already exists in cart - FIXED: don't use .single()
        const { data: existingItems, error: fetchError } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_id", item.id)

        if (fetchError) {
          console.error("Error checking existing cart item:", fetchError)
          toast({
            title: "Error",
            description: "Failed to add item to cart. Please try again.",
          })
          return
        }

        // Check if we found any existing items
        if (existingItems && existingItems.length > 0) {
          // If item exists, increase quantity
          const existingItem = existingItems[0]
          const newQuantity = existingItem.quantity + 1

          // Use debounce to prevent rapid successive updates
          await debounce(async () => {
            const { error: updateError } = await supabase
              .from("cart_items")
              .update({ quantity: newQuantity })
              .eq("user_id", user.id)
              .eq("product_id", item.id)

            if (updateError) {
              console.error("Error updating cart item:", updateError)
              toast({
                title: "Error",
                description: "Failed to update item quantity. Please try again.",
              })
              return
            }

            toast({
              title: "Jumlah ditambahkan",
              description: `${item.name} sekarang berjumlah ${newQuantity} di keranjang Anda.`,
            })
          }, 300)
        } else {
          // If item doesn't exist, add it with quantity 1
          await debounce(async () => {
            const { error: insertError } = await supabase.from("cart_items").insert({
              user_id: user.id,
              product_id: item.id,
              product_name: item.name,
              price: item.price,
              image_url: item.image || "",
              quantity: 1,
            })

            if (insertError) {
              console.error("Error adding cart item:", insertError)
              toast({
                title: "Error",
                description: "Failed to add item to cart. Please try again.",
              })
              return
            }

            toast({
              title: "Ditambahkan ke keranjang",
              description: `${item.name} telah ditambahkan ke keranjang Anda.`,
            })
          }, 300)
        }

        // Refresh cart from database
        const updatedCart = await fetchCartFromDatabase()
        setItems(updatedCart)
      } else {
        // For non-logged-in users, update local state
        setItems((currentItems) => {
          // Check if item already exists in cart
          const existingItemIndex = currentItems.findIndex((i) => i.id === item.id)

          if (existingItemIndex > -1) {
            // If item exists, increase quantity
            const updatedItems = [...currentItems]
            updatedItems[existingItemIndex].quantity += 1

            toast({
              title: "Jumlah ditambahkan",
              description: `${item.name} sekarang berjumlah ${updatedItems[existingItemIndex].quantity} di keranjang Anda.`,
            })

            return updatedItems
          } else {
            // If item doesn't exist, add it with quantity 1
            toast({
              title: "Ditambahkan ke keranjang",
              description: `${item.name} telah ditambahkan ke keranjang Anda.`,
            })

            return [...currentItems, { ...item, quantity: 1 }]
          }
        })
      }
    } catch (error) {
      console.error("Error adding item to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
      })
    } finally {
      setIsLoading(false)
      // Add a small delay before allowing next operation to prevent rapid clicks
      setTimeout(() => {
        operationInProgress.current = false
      }, 500)
    }
  }

  // Remove item from cart
  const removeItem = async (id: number) => {
    if (operationInProgress.current) return
    operationInProgress.current = true

    try {
      if (user) {
        // For logged-in users, remove from database first
        setIsLoading(true)

        // Get item name for toast message
        const itemToRemove = items.find((item) => item.id === id)

        await debounce(async () => {
          const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", id)

          if (error) {
            console.error("Error removing cart item:", error)
            toast({
              title: "Error",
              description: "Failed to remove item from cart. Please try again.",
            })
            return
          }

          if (itemToRemove) {
            toast({
              title: "Dihapus dari keranjang",
              description: `${itemToRemove.name} telah dihapus dari keranjang Anda.`,
            })
          }
        }, 300)

        // Refresh cart from database
        const updatedCart = await fetchCartFromDatabase()
        setItems(updatedCart)
      } else {
        // For non-logged-in users, update local state
        setItems((currentItems) => {
          const itemToRemove = currentItems.find((item) => item.id === id)

          if (itemToRemove) {
            toast({
              title: "Dihapus dari keranjang",
              description: `${itemToRemove.name} telah dihapus dari keranjang Anda.`,
            })
          }

          return currentItems.filter((item) => item.id !== id)
        })
      }
    } catch (error) {
      console.error("Error removing item from cart:", error)
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        operationInProgress.current = false
      }, 500)
    }
  }

  // Update item quantity
  const updateQuantity = async (id: number, quantity: number) => {
    if (operationInProgress.current) return
    operationInProgress.current = true

    try {
      if (quantity < 1) {
        await removeItem(id)
        return
      }

      if (user) {
        // For logged-in users, update in database first
        setIsLoading(true)

        await debounce(async () => {
          const { error } = await supabase
            .from("cart_items")
            .update({ quantity })
            .eq("user_id", user.id)
            .eq("product_id", id)

          if (error) {
            console.error("Error updating cart item quantity:", error)
            toast({
              title: "Error",
              description: "Failed to update item quantity. Please try again.",
            })
            return
          }
        }, 300)

        // Refresh cart from database
        const updatedCart = await fetchCartFromDatabase()
        setItems(updatedCart)
      } else {
        // For non-logged-in users, update local state
        setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
      }
    } catch (error) {
      console.error("Error updating item quantity:", error)
      toast({
        title: "Error",
        description: "Failed to update item quantity. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        operationInProgress.current = false
      }, 500)
    }
  }

  // Clear cart
  const clearCart = async () => {
    if (operationInProgress.current) return
    operationInProgress.current = true

    try {
      if (user) {
        // For logged-in users, clear from database first
        setIsLoading(true)

        await debounce(async () => {
          const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

          if (error) {
            console.error("Error clearing cart:", error)
            toast({
              title: "Error",
              description: "Failed to clear cart. Please try again.",
            })
            return
          }
        }, 300)

        // Refresh cart from database
        setItems([])
      } else {
        // For non-logged-in users, update local state
        setItems([])
      }

      toast({
        title: "Keranjang dikosongkan",
        description: "Semua item telah dihapus dari keranjang Anda.",
      })
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        operationInProgress.current = false
      }, 500)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart, // Added refreshCart to the context
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
