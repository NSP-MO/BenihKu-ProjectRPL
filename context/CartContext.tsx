// This file redirects imports from the incorrect path to the correct one
// This ensures backward compatibility with any code using the wrong import path

export { CartProvider, useCart, type CartItem } from "@/contexts/cart-context"
