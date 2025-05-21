"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { noStore } from 'next/cache';

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
  noStore(); 
  console.log("getRealAnalytics: Fetching new analytics data at", new Date().toISOString());
  
  const supabase = createServerSupabaseClient();
  try {
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, category")

    if (productsError) {
      console.error("getRealAnalytics: Error fetching products:", productsError.message)
      throw productsError // Lempar error agar ditangkap oleh catch utama
    }
    console.log(`getRealAnalytics: Fetched ${productsData?.length ?? 0} products.`);

    if (!productsData || productsData.length === 0) { // Periksa jika productsData kosong
        console.warn("getRealAnalytics: No product data returned or products table is empty. Returning empty analytics.")
        return { products: [], categories: [], overall: { totalSales: 0, totalRevenue: 0 } };
    }

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, subtotal, product_name")

    if (orderItemsError) {
      console.error("getRealAnalytics: Error fetching order items:", orderItemsError.message)
      throw orderItemsError // Lempar error
    }
    console.log(`getRealAnalytics: Fetched ${orderItemsData?.length ?? 0} order items.`);


    if (!orderItemsData || orderItemsData.length === 0) { // Periksa jika orderItemsData kosong
      console.warn("getRealAnalytics: No order items data returned. Products will have 0 sales/revenue.");
      // Jika tidak ada item pesanan, kita tetap bisa menampilkan produk dengan sales/revenue 0
      const productsWithNoSales = productsData.map(p => ({
        id: p.id,
        name: p.name,
        sales: 0,
        revenue: 0,
      }));
      // Kategori juga akan memiliki sales/revenue 0
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
            });
        }
        const ca = categoryAnalyticsMap.get(p.category)!
        ca.productCount +=1;
      });
      const categoriesWithNoSales = Array.from(categoryAnalyticsMap.values()).map(c => ({...c, avgRevenuePerProduct: 0}));

      return {
          products: productsWithNoSales,
          categories: categoriesWithNoSales,
          overall: { totalSales: 0, totalRevenue: 0 }
      };
    }

    // --- Pemrosesan data ---
    const productAnalyticsMap = new Map<number, ProductAnalyticsData>()
    productsData.forEach(p => {
      productAnalyticsMap.set(p.id, { id: p.id, name: p.name, sales: 0, revenue: 0 });
    });

    orderItemsData.forEach(item => {
      if (item.product_id === null) return;
      const pa = productAnalyticsMap.get(item.product_id);
      if (pa) {
        pa.sales += item.quantity;
        const itemRevenue = typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0);
        pa.revenue += itemRevenue;
      } else {
         if (item.product_id && item.product_name) {
            // Jika produk tidak ada di map (misal, produk telah dihapus), kita bisa menambahkannya
            // Atau log sebagai peringatan
            console.warn(`Product with ID ${item.product_id} (${item.product_name}) found in order_items but not in products master list. Adding to analytics.`);
            productAnalyticsMap.set(item.product_id, {
                id: item.product_id,
                name: `${item.product_name} (From Orders)`,
                sales: item.quantity,
                revenue: typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0),
            });
         }
      }
    });
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
        });
      }
      const ca = categoryAnalyticsMap.get(p.category)!;
      ca.productCount +=1;
    });

    orderItemsData.forEach(item => {
      if (item.product_id === null) return;
      const productDetails = productsData.find(p => p.id === item.product_id);
      if (productDetails && productDetails.category) {
        const ca = categoryAnalyticsMap.get(productDetails.category);
        if (ca) {
          ca.sales += item.quantity;
          const itemRevenue = typeof item.subtotal === 'number' ? item.subtotal : (typeof item.price === 'number' ? item.price * item.quantity : 0);
          ca.revenue += itemRevenue;
        }
      }
    });
    const finalCategoryAnalytics = Array.from(categoryAnalyticsMap.values()).map(c => ({
        ...c,
        avgRevenuePerProduct: c.productCount > 0 ? Math.round(c.revenue / c.productCount) : 0
    }));

    const totalSales = finalProductAnalytics.reduce((sum, p) => sum + p.sales, 0);
    const totalRevenue = finalProductAnalytics.reduce((sum, p) => sum + p.revenue, 0);
    
    console.log("getRealAnalytics: Processed finalProductAnalytics count:", finalProductAnalytics.length);
    console.log("getRealAnalytics: Processed finalCategoryAnalytics count:", finalCategoryAnalytics.length);
    console.log("getRealAnalytics: Overall - Total Sales:", totalSales, "Total Revenue:", totalRevenue);


    return {
      products: finalProductAnalytics,
      categories: finalCategoryAnalytics,
      overall: { totalSales, totalRevenue }
    }

  } catch (error: any) {
    console.error("getRealAnalytics: Critical error during execution:", error.message)
    // Mengembalikan struktur data default jika terjadi error kritikal
    return {
      products: [],
      categories: [],
      overall: { totalSales: 0, totalRevenue: 0 }
    }
  }
}
