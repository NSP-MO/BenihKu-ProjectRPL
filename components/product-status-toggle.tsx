"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateProductPublishedStatus, updateProductPopularStatus } from "@/lib/products"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ProductStatusToggleProps {
  productId: number
  isPublished: boolean
  isPopular: boolean
  onStatusChange?: (type: "published" | "popular", value: boolean) => void
}

export function ProductStatusToggle({ productId, isPublished, isPopular, onStatusChange }: ProductStatusToggleProps) {
  const [publishedStatus, setPublishedStatus] = useState(isPublished)
  const [popularStatus, setPopularStatus] = useState(isPopular)
  const [isUpdatingPublished, setIsUpdatingPublished] = useState(false)
  const [isUpdatingPopular, setIsUpdatingPopular] = useState(false)

  const handlePublishedChange = async (checked: boolean) => {
    setIsUpdatingPublished(true)
    try {
      const result = await updateProductPublishedStatus(productId, checked)

      if (result.success) {
        setPublishedStatus(checked)
        toast({
          title: checked ? "Product Published" : "Product Unpublished",
          description: checked
            ? "The product is now visible to customers."
            : "The product is now hidden from customers.",
        })
        if (onStatusChange) {
          onStatusChange("published", checked)
        }
      } else {
        toast({
          title: "Error",
          description: `Failed to update product status: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update product status: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPublished(false)
    }
  }

  const handlePopularChange = async (checked: boolean) => {
    setIsUpdatingPopular(true)
    try {
      const result = await updateProductPopularStatus(productId, checked)

      if (result.success) {
        setPopularStatus(checked)
        toast({
          title: checked ? "Product Marked as Popular" : "Product Unmarked as Popular",
          description: checked
            ? "The product will be highlighted as popular."
            : "The product will no longer be highlighted as popular.",
        })
        if (onStatusChange) {
          onStatusChange("popular", checked)
        }
      } else {
        toast({
          title: "Error",
          description: `Failed to update product status: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update product status: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPopular(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="published">Published</Label>
          <p className="text-sm text-muted-foreground">
            {publishedStatus ? "Product is visible to customers" : "Product is hidden from customers"}
          </p>
        </div>
        <div className="flex items-center">
          {isUpdatingPublished && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <Switch
            id="published"
            checked={publishedStatus}
            onCheckedChange={handlePublishedChange}
            disabled={isUpdatingPublished}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="popular">Popular</Label>
          <p className="text-sm text-muted-foreground">
            {popularStatus ? "Product is highlighted as popular" : "Product is not highlighted as popular"}
          </p>
        </div>
        <div className="flex items-center">
          {isUpdatingPopular && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <Switch
            id="popular"
            checked={popularStatus}
            onCheckedChange={handlePopularChange}
            disabled={isUpdatingPopular}
          />
        </div>
      </div>
    </div>
  )
}
