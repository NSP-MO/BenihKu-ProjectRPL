"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { noStore } from 'next/cache'; // Import noStore

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
  products: ProductAnalyticsData[],
  categories: CategoryAnalyticsData[],
  overall: { totalSales: number, totalRevenue: number }
}> {
  noStore(); // Panggil noStore di awal fungsi untuk mencegah caching
  console.log("getRealAnalytics: (noStore active) Fetching new analytics data at", new Date().toISOString());
  
  const supabase = createServerSupabaseClient();
  try {
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, category")

    if (productsError) {
      console.error("getRealAnalytics: Error fetching products:", productsError.message)
      throw productsError
    }
    console.log("getRealAnalytics: Fetched productsData count:", productsData?.length ?? 0);

    if (!productsData) {
        console.warn("getRealAnalytics: No product data returned.")
        return { products: [], categories: [], overall: { totalSales: 0, totalRevenue: 0 } };
    }

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, subtotal, product_name")

    if (orderItemsError) {
      console.error("getRealAnalytics: Error fetching order items:", orderItemsError.message)
      throw orderItemsError
    }
    console.log("getRealAnalytics: Fetched orderItemsData count:", orderItemsData?.length ?? 0);


    if (!orderItemsData) {
      console.warn("getRealAnalytics: No order items data returned.");
       return {
          products: productsData.map(p => ({
            id: p.id,
            name: p.name,
            sales: 0,
            revenue: 0,
          })),
          categories: [],
          overall: { totalSales: 0, totalRevenue: 0 }
        };
    }

    const productAnalyticsMap = new Map<number, ProductAnalyticsData>()

    productsData.forEach(p => {
      productAnalyticsMap.set(p.id, {
        id: p.id,
        name: p.name,
        sales: 0,
        revenue: 0,
      })
    })

    orderItemsData.forEach(item => {
      if (item.product_id === null) return;

      const pa = productAnalyticsMap.get(item.product_id)
      if (pa) {
        pa.sales += item.quantity
        const itemRevenue = typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0);
        pa.revenue += itemRevenue;
      } else {
         if (item.product_id && item.product_name) {
            const currentProductEntry = productAnalyticsMap.get(item.product_id);
            if (currentProductEntry) {
                currentProductEntry.sales += item.quantity;
                currentProductEntry.revenue += typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0);
            } else {
                 productAnalyticsMap.set(item.product_id, {
                    id: item.product_id,
                    name: `${item.product_name} (Data Pesanan)`,
                    sales: item.quantity,
                    revenue: typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0),
                });
            }
         }
      }
    })

    const finalProductAnalytics = Array.from(productAnalyticsMap.values());

    const categoryAnalyticsMap = new Map<string, CategoryAnalyticsData>()

    productsData.forEach(p => {
      if (!p.category) return; 
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
      ca.productCount +=1;
    });

    orderItemsData.forEach(item => {
      if (item.product_id === null) return;
      const productDetails = productsData.find(p => p.id === item.product_id)
      if (productDetails && productDetails.category) {
        const ca = categoryAnalyticsMap.get(productDetails.category)
        if (ca) {
          ca.sales += item.quantity
          const itemRevenue = typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0);
          ca.revenue += itemRevenue;
        }
      }
    })

    const finalCategoryAnalytics = Array.from(categoryAnalyticsMap.values()).map(c => ({
        ...c,
        avgRevenuePerProduct: c.productCount > 0 ? Math.round(c.revenue / c.productCount) : 0
    }));

    const totalSales = finalProductAnalytics.reduce((sum, p) => sum + p.sales, 0)
    const totalRevenue = finalProductAnalytics.reduce((sum, p) => sum + p.revenue, 0)
    
    console.log("getRealAnalytics: Processed finalProductAnalytics count:", finalProductAnalytics.length);
    console.log("getRealAnalytics: Processed finalCategoryAnalytics count:", finalCategoryAnalytics.length);

    return {
      products: finalProductAnalytics,
      categories: finalCategoryAnalytics,
      overall: { totalSales, totalRevenue }
    }

  } catch (error: any) {
    console.error("getRealAnalytics: Critical error during execution:", error.message)
    return {
      products: [],
      categories: [],
      overall: { totalSales: 0, totalRevenue: 0 }
    }
  }
}
