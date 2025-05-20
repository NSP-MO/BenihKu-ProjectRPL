"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

// Data produk tanaman
const plantsData = [
  {
    name: "Monstera Deliciosa",
    price: 250000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Hias",
    description:
      "Monstera Deliciosa atau Swiss Cheese Plant adalah tanaman hias populer dengan daun besar berlubang yang unik. Tanaman ini berasal dari hutan hujan tropis Amerika Tengah dan sangat cocok sebagai tanaman indoor.",
    is_popular: true,
    care_instructions: {
      light: "Cahaya tidak langsung yang terang. Hindari sinar matahari langsung yang dapat membakar daun.",
      water: "Siram saat lapisan atas tanah kering (sekitar seminggu sekali). Kurangi penyiraman di musim dingin.",
      soil: "Campuran tanah yang kaya nutrisi dengan drainase yang baik.",
      humidity: "Menyukai kelembaban tinggi. Semprotkan daun secara teratur atau gunakan humidifier.",
      temperature: "Suhu ideal 18-30°C. Hindari suhu di bawah 15°C.",
      fertilizer: "Pupuk setiap bulan selama musim pertumbuhan (musim semi dan musim panas).",
    },
    seller: {
      name: "Toko Tanaman Sejahtera",
      rating: 4.8,
      response_time: "± 1 jam",
    },
  },
  {
    name: "Fiddle Leaf Fig",
    price: 350000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Indoor",
    description:
      "Fiddle Leaf Fig (Ficus lyrata) adalah tanaman indoor populer dengan daun besar berbentuk biola. Tanaman ini berasal dari Afrika Barat dan menjadi favorit untuk dekorasi interior modern.",
    is_popular: true,
    care_instructions: {
      light: "Cahaya tidak langsung yang terang. Dapat mentolerir beberapa sinar matahari langsung di pagi hari.",
      water: "Siram saat 5-7 cm lapisan atas tanah kering. Jangan biarkan akar terendam air.",
      soil: "Tanah yang kaya nutrisi dengan drainase yang baik.",
      humidity: "Menyukai kelembaban sedang hingga tinggi. Semprotkan daun secara teratur.",
      temperature: "Suhu ideal 18-24°C. Hindari perubahan suhu yang drastis.",
      fertilizer: "Pupuk setiap 4-6 minggu selama musim pertumbuhan.",
    },
    seller: {
      name: "Garden Center Indonesia",
      rating: 4.9,
      response_time: "± 30 menit",
    },
  },
  {
    name: "Snake Plant",
    price: 150000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Indoor",
    description:
      "Snake Plant (Sansevieria) adalah tanaman yang sangat mudah dirawat dengan daun tegak yang kaku. Tanaman ini berasal dari Afrika Barat dan terkenal karena kemampuannya membersihkan udara dan bertahan dalam kondisi minim perawatan.",
    is_popular: true,
    care_instructions: {
      light: "Toleran terhadap berbagai kondisi cahaya, dari cahaya rendah hingga sinar matahari langsung.",
      water: "Siram hanya ketika tanah benar-benar kering. Biasanya setiap 2-6 minggu tergantung musim.",
      soil: "Campuran tanah kaktus atau tanah dengan drainase sangat baik.",
      humidity: "Toleran terhadap kelembaban rendah. Ideal untuk ruangan ber-AC.",
      temperature: "Suhu ideal 18-27°C. Dapat mentolerir suhu hingga 10°C.",
      fertilizer: "Pupuk ringan setiap 3-4 bulan.",
    },
    seller: {
      name: "Kebun Hijau",
      rating: 4.7,
      response_time: "± 2 jam",
    },
  },
  {
    name: "Peace Lily",
    price: 180000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Hias",
    description:
      "Peace Lily (Spathiphyllum) adalah tanaman berbunga elegan dengan daun hijau gelap dan bunga putih yang khas. Tanaman ini berasal dari Amerika Selatan dan dikenal sebagai pembersih udara yang efektif.",
    is_popular: true,
    care_instructions: {
      light: "Cahaya tidak langsung yang terang hingga cahaya rendah. Hindari sinar matahari langsung.",
      water: "Jaga tanah tetap lembab tapi tidak basah. Siram saat daun mulai sedikit layu.",
      soil: "Campuran tanah yang kaya nutrisi dengan drainase yang baik.",
      humidity: "Menyukai kelembaban tinggi. Semprotkan daun secara teratur.",
      temperature: "Suhu ideal 18-30°C. Hindari suhu di bawah 12°C.",
      fertilizer: "Pupuk ringan setiap 6-8 minggu selama musim pertumbuhan.",
    },
    seller: {
      name: "Toko Tanaman Sejahtera",
      rating: 4.8,
      response_time: "± 1 jam",
    },
  },
  {
    name: "ZZ Plant",
    price: 200000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Indoor",
    description:
      "ZZ Plant (Zamioculcas zamiifolia) adalah tanaman indoor yang sangat mudah dirawat dengan daun mengkilap. Tanaman ini berasal dari Afrika Timur dan terkenal karena ketahanannya dalam kondisi cahaya rendah dan penyiraman minimal.",
    is_popular: true,
    care_instructions: {
      light: "Toleran terhadap berbagai kondisi cahaya, dari cahaya rendah hingga cahaya terang tidak langsung.",
      water: "Siram hanya ketika tanah benar-benar kering. Biasanya setiap 2-3 minggu.",
      soil: "Campuran tanah dengan drainase yang baik.",
      humidity: "Toleran terhadap kelembaban rendah. Ideal untuk ruangan ber-AC.",
      temperature: "Suhu ideal 18-26°C. Hindari suhu di bawah 10°C.",
      fertilizer: "Pupuk ringan setiap 3 bulan selama musim pertumbuhan.",
    },
    seller: {
      name: "Garden Center Indonesia",
      rating: 4.9,
      response_time: "± 30 menit",
    },
  },
  {
    name: "Pothos",
    price: 120000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Gantung",
    description:
      "Pothos (Epipremnum aureum) adalah tanaman merambat yang sangat mudah dirawat dengan daun berbentuk hati. Tanaman ini berasal dari Kepulauan Solomon dan populer sebagai tanaman gantung atau merambat di dalam ruangan.",
    is_popular: true,
    care_instructions: {
      light: "Toleran terhadap berbagai kondisi cahaya, dari cahaya rendah hingga cahaya terang tidak langsung.",
      water: "Siram saat lapisan atas tanah kering. Biasanya setiap 1-2 minggu.",
      soil: "Campuran tanah standar dengan drainase yang baik.",
      humidity: "Toleran terhadap kelembaban rendah, tapi lebih suka kelembaban sedang.",
      temperature: "Suhu ideal 18-30°C. Hindari suhu di bawah 10°C.",
      fertilizer: "Pupuk ringan setiap 2-3 bulan selama musim pertumbuhan.",
    },
    seller: {
      name: "Kebun Hijau",
      rating: 4.7,
      response_time: "± 2 jam",
    },
  },
]

export async function seedProducts() {
  const supabase = createServerSupabaseClient()

  try {
    // Buat tabel products jika belum ada
    const { error: createTableError } = await supabase.rpc("create_products_table", {})

    if (createTableError) {
      console.error("Error creating products table:", createTableError)
      return { success: false, error: createTableError.message }
    }

    // Hapus data yang ada (opsional)
    const { error: deleteError } = await supabase.from("products").delete().neq("id", 0)

    if (deleteError) {
      console.error("Error deleting existing products:", deleteError)
    }

    // Masukkan data produk
    const { error: insertError } = await supabase.from("products").insert(plantsData)

    if (insertError) {
      console.error("Error inserting products:", insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error seeding products:", error)
    return { success: false, error: error.message }
  }
}

// Fungsi untuk membuat tabel profiles jika belum ada
export async function createProfilesTable() {
  const supabase = createServerSupabaseClient()

  try {
    // Buat tabel profiles jika belum ada
    const { error } = await supabase.rpc("create_profiles_table", {})

    if (error) {
      console.error("Error creating profiles table:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error creating profiles table:", error)
    return { success: false, error: error.message }
  }
}
