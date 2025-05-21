"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export type ProductAnalyticsData = {
  id: number
  name: string
  sales: number
  revenue: number
}

export type CategoryAnalyticsData = {
  id: string
  category: string
  productCount: number
  sales: number
  revenue: number
  avgRevenuePerProduct?: number
}

export async function getRealAnalytics(): Promise<{
  products: ProductAnalyticsData[]
  categories: CategoryAnalyticsData[]
  overall: { totalSales: number; totalRevenue: number }
}> {
  console.log("getRealAnalytics: Fetching new analytics data at", new Date().toISOString())

  const supabase = createServerSupabaseClient()
  try {
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, category")

    if (productsError) {
      console.error("getRealAnalytics: Error fetching products:", productsError.message)
      throw productsError
    }
    console.log(`getRealAnalytics: Fetched ${productsData?.length ?? 0} products.`)

    if (!productsData) {
      // productsData bisa null jika terjadi error yang tidak masuk ke blok catch di atas, atau [] jika tabel kosong
      console.warn("getRealAnalytics: No product data returned (null or undefined). Returning empty analytics.")
      return { products: [], categories: [], overall: { totalSales: 0, totalRevenue: 0 } }
    }
    if (productsData.length === 0) {
      console.warn("getRealAnalytics: Products table is empty. Returning empty analytics.")
      return { products: [], categories: [], overall: { totalSales: 0, totalRevenue: 0 } }
    }

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, subtotal, product_name")

    if (orderItemsError) {
      console.error("getRealAnalytics: Error fetching order items:", orderItemsError.message)
      throw orderItemsError
    }
    console.log(`getRealAnalytics: Fetched ${orderItemsData?.length ?? 0} order items.`)

    const productAnalyticsMap = new Map<number, ProductAnalyticsData>()
    productsData.forEach((p) => {
      // Pastikan p.id adalah angka
      const productId = Number(p.id)
      if (!isNaN(productId)) {
        productAnalyticsMap.set(productId, {
          id: productId,
          name: p.name || "Nama Tidak Diketahui",
          sales: 0,
          revenue: 0,
        })
      } else {
        console.warn(`Invalid product ID "${p.id}" in productsData. Skipping.`)
      }
    })

    if (!orderItemsData || orderItemsData.length === 0) {
      console.warn("getRealAnalytics: No order items data returned. Products will have 0 sales/revenue.")
      const categoriesWithNoSalesMap = new Map<string, CategoryAnalyticsData>()
      productsData.forEach((p) => {
        if (!p.category) return
        if (!categoriesWithNoSalesMap.has(p.category)) {
          categoriesWithNoSalesMap.set(p.category, {
            id: p.category,
            category: p.category,
            productCount: 0,
            sales: 0,
            revenue: 0,
          })
        }
        const ca = categoriesWithNoSalesMap.get(p.category)!
        ca.productCount += 1
      })
      const categoriesWithNoSales = Array.from(categoriesWithNoSalesMap.values()).map((c) => ({
        ...c,
        avgRevenuePerProduct: 0,
      }))

      return {
        products: Array.from(productAnalyticsMap.values()), // Mengembalikan daftar produk meskipun tidak ada penjualan
        categories: categoriesWithNoSales,
        overall: { totalSales: 0, totalRevenue: 0 },
      }
    }

    orderItemsData.forEach((item) => {
      if (item.product_id === null || item.product_id === undefined) {
        console.warn("Order item with null or undefined product_id found. Skipping item.")
        return
      }

      const productIdAsNumber = Number(item.product_id)
      if (isNaN(productIdAsNumber)) {
        console.warn(`Invalid product_id "${item.product_id}" in order_items. Skipping item.`)
        return
      }

      const currentQuantity = Number(item.quantity)
      const currentPrice = Number(item.price)
      const currentSubtotal = Number(item.subtotal)

      const pa = productAnalyticsMap.get(productIdAsNumber)
      if (pa) {
        pa.sales += isNaN(currentQuantity) ? 0 : currentQuantity
        const itemRevenue = !isNaN(currentSubtotal)
          ? currentSubtotal
          : !isNaN(currentPrice) && !isNaN(currentQuantity)
            ? currentPrice * currentQuantity
            : 0
        pa.revenue += itemRevenue
      } else {
        if (item.product_name) {
          console.warn(
            `Product with ID ${productIdAsNumber} (${item.product_name}) found in order_items but not in products master list. Adding to analytics as archived.`,
          )
          productAnalyticsMap.set(productIdAsNumber, {
            id: productIdAsNumber,
            name: `${item.product_name} (Arsip)`,
            sales: isNaN(currentQuantity) ? 0 : currentQuantity,
            revenue: !isNaN(currentSubtotal)
              ? currentSubtotal
              : !isNaN(currentPrice) && !isNaN(currentQuantity)
                ? currentPrice * currentQuantity
                : 0,
          })
        } else {
          console.warn(
            `Product with ID ${productIdAsNumber} found in order_items but has no name and is not in products master list. Skipping.`,
          )
        }
      }
    })
    const finalProductAnalytics = Array.from(productAnalyticsMap.values())

    const categoryAnalyticsMap = new Map<string, CategoryAnalyticsData>()
    productsData.forEach((p) => {
      if (!p.category) {
        console.warn(`Product with ID ${p.id} has null or undefined category. Skipping for category analytics.`)
        return
      }
      if (!categoryAnalyticsMap.has(p.category)) {
        categoryAnalyticsMap.set(p.category, {
          id: p.category,
          category: p.category,
          productCount: 0,
          sales: 0,
          revenue: 0,
        })
      }
      const ca = categoryAnalyticsMap.get(p.category)!
      ca.productCount += 1
    })

    orderItemsData.forEach((item) => {
      if (item.product_id === null || item.product_id === undefined) return
      const productIdAsNumber = Number(item.product_id)
      if (isNaN(productIdAsNumber)) return

      const currentQuantity = Number(item.quantity)
      const currentPrice = Number(item.price)
      const currentSubtotal = Number(item.subtotal)

      const productDetails = productsData.find((p) => Number(p.id) === productIdAsNumber)
      if (productDetails && productDetails.category) {
        const ca = categoryAnalyticsMap.get(productDetails.category)
        if (ca) {
          ca.sales += isNaN(currentQuantity) ? 0 : currentQuantity
          const itemRevenue = !isNaN(currentSubtotal)
            ? currentSubtotal
            : !isNaN(currentPrice) && !isNaN(currentQuantity)
              ? currentPrice * currentQuantity
              : 0
          ca.revenue += itemRevenue
        }
      }
    })
    const finalCategoryAnalytics = Array.from(categoryAnalyticsMap.values()).map((c) => ({
      ...c,
      avgRevenuePerProduct: c.productCount > 0 && c.revenue > 0 ? Math.round(c.revenue / c.productCount) : 0,
    }))

    const totalSales = finalProductAnalytics.reduce((sum, p) => sum + p.sales, 0)
    const totalRevenue = finalProductAnalytics.reduce((sum, p) => sum + p.revenue, 0)

    console.log("getRealAnalytics: Processed finalProductAnalytics count:", finalProductAnalytics.length)
    console.log("getRealAnalytics: Processed finalCategoryAnalytics count:", finalCategoryAnalytics.length)
    console.log("getRealAnalytics: Overall - Total Sales:", totalSales, "Total Revenue:", totalRevenue)

    return {
      products: finalProductAnalytics,
      categories: finalCategoryAnalytics,
      overall: { totalSales, totalRevenue },
    }
  } catch (error: any) {
    console.error("getRealAnalytics: Critical error during execution:", error.message)
    return {
      products: [],
      categories: [],
      overall: { totalSales: 0, totalRevenue: 0 },
    }
  }
}
