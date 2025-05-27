// app/api/benihku-ai-service/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, ChatSession } from "@google/generative-ai";
import { supabase } from "@/lib/supabase"; //

const MODEL_NAME = "gemini-1.5-flash-latest";
const API_KEY = "AIzaSyBDcloTUn38rUFaxqVcL8NKoVpprAlUyN0"; // KUNCI API DISEMATKAN LANGSUNG

async function fileToGenerativePart(file: File): Promise<Part> { //
  const base64EncodedData = Buffer.from(await file.arrayBuffer()).toString("base64"); //
  return {
    inlineData: { //
      data: base64EncodedData, //
      mimeType: file.type, //
    },
  };
}

export async function POST(request: NextRequest) {
  console.log("BENIHKU AI SERVICE API: POST handler reached at", new Date().toISOString());

  if (!API_KEY) {
    console.error("BENIHKU AI SERVICE API: GEMINI_API_KEY is missing or empty!");
    return NextResponse.json({
      id: `ai-error-config-${Date.now()}`,
      text: "Maaf, layanan AI tidak dapat diinisialisasi karena masalah konfigurasi API Key di server.",
      sender: "ai",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }

  let genAI;
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log("BENIHKU AI SERVICE API: GoogleGenerativeAI initialized successfully.");
  } catch (initError: any) {
    console.error("BENIHKU AI SERVICE API: Failed to initialize GoogleGenerativeAI:", initError);
    return NextResponse.json({
        id: `ai-init-error-${Date.now()}`,
        error: "Gagal menginisialisasi layanan AI.",
        detail: initError.message || "Kunci API mungkin tidak valid atau ada masalah jaringan.",
        text: `Error: ${initError.message || "Tidak dapat menginisialisasi layanan AI."}`,
        sender: "ai",
        timestamp: new Date().toISOString(),
     }, { status: 500 });
  }

  const generationConfig = {
    temperature: 0.8,
    topK: 64,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  try {
    const formData = await request.formData();
    const userMessage = formData.get("message") as string | null;
    const imageFile = formData.get("image") as File | null;
    const historyJson = formData.get("history") as string | null;

    let conversationHistory: Array<{ role: "user" | "model"; parts: Part[] }> = [];
    if (historyJson) {
      try {
        const parsedHistory = JSON.parse(historyJson);
        if (Array.isArray(parsedHistory)) {
          conversationHistory = parsedHistory.map((msg: { sender: 'user' | 'ai'; text: string; imageUrl?: string }) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          }));
        }
      } catch (e) {
        console.warn("BENIHKU AI SERVICE API: Could not parse conversation history JSON.", e);
      }
    }

    console.log("BENIHKU AI SERVICE API: FormData parsed. Message:", userMessage, "ImageName:", imageFile?.name, "History items:", conversationHistory.length);

    let currentUserParts: Part[] = [];
    let systemInstructionText = `Anda adalah BenihKu AI, asisten virtual untuk toko tanaman BenihKu.
    Anda ramah, membantu, dan berpengetahuan tentang tanaman dan operasional website BenihKu.
    Tujuan Anda adalah membantu pengguna dengan pertanyaan tentang produk tanaman (nama, harga, stok, kategori, deskripsi, perawatan), cara bernavigasi di website (misalnya, cara mencari produk, cara ke halaman checkout), informasi tentang pesanan, dan cara menghubungi layanan pelanggan.
    Anda memiliki akses ke informasi dari database produk, pesanan, dan pelanggan BenihKu untuk menjawab pertanyaan secara akurat.
    Gunakan riwayat percakapan (jika ada) untuk memahami konteks pertanyaan lanjutan, termasuk kata ganti dan referensi ke topik sebelumnya.
    Jika pengguna mengunggah gambar, coba identifikasi tanaman dalam gambar tersebut dan berikan informasi yang relevan jika memungkinkan.
    Jika pertanyaan di luar topik tanaman, BenihKu, atau operasional website, tolak dengan sopan.
    Selalu jawab dalam Bahasa Indonesia.
    Struktur Database Utama BenihKu:
    - Tabel 'products': id, name, price, image, category, description, is_popular, care_instructions (JSONB), seller (JSONB), created_at, updated_at, is_published, stock, image_path, image_bucket.
      - 'care_instructions' format: {"light": "string", "water": "string", "soil": "string", "humidity": "string", "temperature": "string", "fertilizer": "string"}
      - 'seller' format: {"name": "string", "rating": float, "response_time": "string"}
    - Tabel 'orders': id (SERIAL/UUID), user_id (UUID), total_amount (DECIMAL/INTEGER), shipping_address (TEXT/JSONB), payment_method (VARCHAR), status (VARCHAR), created_at, updated_at, customer_name (VARCHAR), customer_email (VARCHAR), customer_phone (VARCHAR).
      - 'status' bisa berupa: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'.
    - Tabel 'order_items': id (SERIAL/UUID), order_id, product_id, quantity (INTEGER), price (DECIMAL/INTEGER), created_at, product_name (TEXT), subtotal (INTEGER).
    - Tabel 'cart_items': id (SERIAL/UUID), user_id (UUID), product_id (INTEGER), product_name (TEXT), price (DECIMAL/INTEGER), quantity (INTEGER), image_url (TEXT), created_at, updated_at.
    - Tabel 'profiles': id (UUID), name (TEXT), email (TEXT), role (TEXT), created_at, updated_at, avatar_url (TEXT), avatar_path (TEXT).
    - Tabel 'settings' (atau 'app_settings'): id (UUID), key (TEXT UNIQUE), value (JSONB), created_at, updated_at. Contoh key: 'show_draft_products', 'homepage_product_limit'.
    Website BenihKu memiliki halaman utama, kategori produk, detail produk, keranjang, checkout, profil pengguna, riwayat pesanan, dan halaman Tentang Kami.
    Admin memiliki dashboard untuk manajemen produk, pesanan, analitik, dan pengaturan.
    Fitur utama termasuk pencarian produk, filter kategori, QR scanner untuk produk, dan BenihKu AI ini.`;


    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile); //
      currentUserParts.push(imagePart);
      systemInstructionText += "\nPengguna telah mengunggah gambar. Fokus pada gambar tersebut jika ada pertanyaan terkait.";
      if (userMessage && userMessage.trim() !== "") {
        currentUserParts.push({ text: `\nPertanyaan terkait gambar: ${userMessage}` });
      } else {
        currentUserParts.push({ text: "\nDeskripsikan tanaman pada gambar ini dan berikan informasi perawatannya jika Anda tahu." });
      }
    } else if (userMessage && userMessage.trim() !== "") {
      currentUserParts.push({ text: userMessage }); //
      const lowerMessage = userMessage.toLowerCase();

      // Dynamic data fetching based on keywords
      if (lowerMessage.includes("daftar produk") || lowerMessage.includes("semua produk") || lowerMessage.includes("produk apa saja")) {
        systemInstructionText += `\nPengguna meminta daftar produk. Berikan beberapa contoh produk dari database BenihKu.`;
        const { data: products, error } = await supabase
          .from('products')
          .select('name, category, price, stock, is_published')
          .eq('is_published', true)
          .limit(5); // Provide a few examples
        if (error) console.error("Supabase query error for product list:", error);
        else if (products && products.length > 0) {
          let productInfo = "\n[Beberapa Contoh Produk dari Database BenihKu]:";
          products.forEach(p => {
            productInfo += `\n- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}, Stok: ${p.stock > 0 ? p.stock : 'Habis'})`;
          });
          currentUserParts.push({ text: productInfo });
        } else {
          currentUserParts.push({ text: `\n[Info Tambahan: Saat ini tidak ada produk yang dapat ditampilkan dari database BenihKu.]`});
        }
      }
      else if (lowerMessage.includes("kategori") && (lowerMessage.includes("apa saja") || lowerMessage.includes("daftar"))) {
        systemInstructionText += `\nPengguna menanyakan daftar kategori produk. Sebutkan kategori yang ada di database BenihKu.`;
        const { data: categories, error } = await supabase
          .from('products')
          .select('category')
          .eq('is_published', true);
        if (error) console.error("Supabase query error for categories:", error);
        else if (categories && categories.length > 0) {
          const uniqueCategories = [...new Set(categories.map(c => c.category).filter(Boolean))];
          currentUserParts.push({ text: `\n[Daftar Kategori dari Database BenihKu]: \n- ${uniqueCategories.join('\n- ')}` });
        } else {
          currentUserParts.push({ text: `\n[Info Tambahan: Belum ada kategori produk di database BenihKu.]`});
        }
      }
      // Existing logic for stock, care, recommendations
      else if (lowerMessage.includes("stok") || lowerMessage.includes("tersedia")) {
        const productNameMatch = lowerMessage.match(/(?:stok|tersedia)\s*(?:untuk|dari|produk)?\s*([^?.\n]+)/i);
        const productName = productNameMatch?.[1]?.trim();
        if (productName) {
          systemInstructionText += `\nPengguna menanyakan stok produk. Cari informasi stok untuk produk yang mirip dengan "${productName}" dari database produk BenihKu.`;
          const { data: products, error } = await supabase
            .from('products')
            .select('name, stock, category, price, description, is_published')
            .ilike('name', `%${productName}%`)
            .limit(3);
          if (error) console.error("Supabase query error for stock:", error);
          else if (products && products.length > 0) {
            let productInfo = "\n[Info Stok & Produk dari Database BenihKu tentang ketersediaan]:";
            products.forEach(p => {
              if (p.is_published) {
                productInfo += `\n- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}, Stok: ${p.stock > 0 ? p.stock : 'Habis'}). Deskripsi singkat: ${p.description.substring(0, 50)}...`;
              } else {
                productInfo += `\n- ${p.name} (Saat ini tidak dipublikasikan).`;
              }
            });
            currentUserParts.push({ text: productInfo });
          } else {
            currentUserParts.push({ text: `\n[Info Tambahan: Tidak ditemukan produk yang cocok atau tersedia untuk "${productName}" di database BenihKu.]`});
          }
        } else {
            currentUserParts.push({ text: "\n[Info Tambahan: Pengguna menanyakan stok secara umum atau nama produk tidak jelas. Minta pengguna untuk menyebutkan nama produk spesifik.]"});
        }
      }
      else if (lowerMessage.includes("rawat") || lowerMessage.includes("perawatan")) {
         const plantNameMatch = lowerMessage.match(/(?:rawat|perawatan)\s*(?:untuk|dari|tanaman)?\s*([^?.\n]+)/i);
         const plantName = plantNameMatch?.[1]?.trim();
         if (plantName) {
            systemInstructionText += `\nPengguna menanyakan cara perawatan untuk tanaman "${plantName}". Berikan panduan perawatan berdasarkan informasi dari database BenihKu jika ada, atau berikan tips umum.`;
            const { data: productCare, error } = await supabase
              .from('products')
              .select('name, care_instructions, description, is_published')
              .ilike('name', `%${plantName}%`)
              .eq('is_published', true)
              .limit(1);
            if (error) console.error("Supabase query error for care:", error);
            else if (productCare && productCare.length > 0) {
              let careInfo = `\n[Info Perawatan dari Database untuk ${productCare[0].name}]:`;
              if (productCare[0].care_instructions) {
                const careData = typeof productCare[0].care_instructions === 'string'
                                 ? JSON.parse(productCare[0].care_instructions)
                                 : productCare[0].care_instructions;
                careInfo += ` ${JSON.stringify(careData)}.`;
              } else careInfo += " Informasi perawatan spesifik belum tersedia.";
              if(productCare[0].description) careInfo += ` Deskripsi: ${productCare[0].description.substring(0,100)}...`;
              currentUserParts.push({ text: careInfo });
            } else {
              currentUserParts.push({ text: `\n[Info Tambahan: Tidak ditemukan info perawatan spesifik untuk "${plantName}" di database BenihKu.]`});
            }
         } else {
            currentUserParts.push({ text: "\n[Info Tambahan: Pengguna menanyakan perawatan secara umum atau nama tanaman tidak jelas.]"});
         }
      }
       else if (lowerMessage.includes("rekomendasi") || lowerMessage.includes("sarankan")) {
        systemInstructionText += `\nPengguna meminta rekomendasi tanaman. Berikan beberapa rekomendasi produk yang tersedia (is_published = true).`;
        const { data: randomProducts, error } = await supabase
            .from('products')
            .select('name, category, description, price')
            .eq('is_published', true).limit(5).order('created_at', { ascending: false }); //
        if(error) console.error("Supabase query error for recommendations:", error);
        else if (randomProducts && randomProducts.length > 0) {
            let recInfo = "\n[Contoh Produk dari Database BenihKu untuk Inspirasi Rekomendasi]:";
            randomProducts.forEach(p => {
                recInfo += `\n- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}). ${p.description.substring(0,50)}...`;
            });
            currentUserParts.push({ text: recInfo });
        } else {
          currentUserParts.push({ text: "\n[Info Tambahan: Saat ini belum ada produk yang bisa direkomendasikan dari database.]"});
        }
      }
      else if (lowerMessage.includes("tentang kami") || lowerMessage.includes("alamat") || lowerMessage.includes("kontak")) {
        systemInstructionText += `\nPengguna menanyakan informasi tentang BenihKu (alamat, kontak, dll). Berikan informasi dari halaman 'Tentang Kami'.`;
        currentUserParts.push({ text: `\n[Info Tambahan untuk AI dari Halaman Tentang Kami BenihKu]:
        Alamat: Jl. Raya Dramaga, Kampus IPB Dramaga Bogor, 16680 West Java, Indonesia.
        Email: benihku.site@gmail.com.
        Telepon: +62 895 0757 4743.
        BenihKu adalah platform e-commerce tanaman yang menghubungkan pecinta tanaman dengan penjual berkualitas, menyediakan berbagai jenis tanaman dengan informasi perawatan lengkap. Didirikan tahun 2020, telah melayani lebih dari 50.000 pelanggan.
        Keunggulan: Kualitas Terjamin, Informasi Lengkap, Dukungan Pelanggan.` });
      }
       else if (lowerMessage.includes("cara order") || lowerMessage.includes("cara pesan") || lowerMessage.includes("checkout")) {
        systemInstructionText += `\nPengguna menanyakan cara melakukan pemesanan atau checkout. Jelaskan prosesnya berdasarkan alur website BenihKu.`;
        currentUserParts.push({ text: `\n[Info Tambahan untuk AI tentang Proses Pemesanan di BenihKu]:
        1. Pengguna menambahkan produk ke keranjang dari halaman detail produk./page.tsx]
        2. Pengguna dapat melihat isi keranjang di halaman keranjang (/cart).
        3. Dari halaman keranjang, pengguna melanjutkan ke halaman checkout (/checkout).
        4. Di halaman checkout, pengguna mengisi informasi pengiriman (nama, email, telepon, alamat lengkap) dan memilih metode pengiriman serta metode pembayaran (Transfer Bank, COD, E-Wallet).
        5. Setelah menyelesaikan pesanan, order akan dibuat dengan status 'pending' dan pengguna diarahkan ke halaman detail pesanan.
        6. Pengguna dapat melihat riwayat pesanannya di halaman profil -> pesanan (/orders).` }); //
      }

    } else {
      // If no user message but there is an image, this case is handled above.
      // If neither message nor image, it's handled by the empty currentUserParts check.
      if (currentUserParts.length === 0) { // Ensure this condition is met if no user message and no image
        console.log("BENIHKU AI SERVICE API: No valid user message or image file provided.");
        return NextResponse.json({
          id: `ai-error-input-${Date.now()}`,
          text: "Mohon berikan pesan atau unggah gambar untuk memulai percakapan.",
          sender: "ai",
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }
    }

    if (currentUserParts.length === 0) {
        console.log("BENIHKU AI SERVICE API: currentUserParts is empty. Cannot call Gemini.");
        return NextResponse.json({
            id: `ai-error-empty-prompt-${Date.now()}`,
            text: "Tidak ada input yang dapat diproses. Silakan ketik pesan atau unggah gambar.",
            sender: "ai",
            timestamp: new Date().toISOString(),
        }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: { role: "system", parts: [{text: systemInstructionText}]} }); //
    const chat: ChatSession = model.startChat({ //
        history: conversationHistory, //
        generationConfig, //
        safetySettings, //
    });

    console.log("BENIHKU AI SERVICE API: Sending request to Gemini with current user parts:", JSON.stringify(currentUserParts.map(p => 'text' in p ? p.text : '[IMAGE_DATA]')));
    const result = await chat.sendMessage(currentUserParts); //


    if (result.response.promptFeedback && result.response.promptFeedback.blockReason) { //
        console.error("BENIHKU AI SERVICE API: Gemini API response blocked:", result.response.promptFeedback);
        let blockMessage = `Permintaan Anda diblokir oleh sistem keamanan AI karena: ${result.response.promptFeedback.blockReason}.`; //
        if (result.response.promptFeedback.safetyRatings && result.response.promptFeedback.safetyRatings.length > 0) { //
            blockMessage += ` Detail: ${result.response.promptFeedback.safetyRatings.map(r => `${r.category} - ${r.probability}`).join(', ')}.`; //
        }
        blockMessage += " Mohon coba pertanyaan atau gambar lain.";
        return NextResponse.json({
            id: `ai-blocked-${Date.now()}`,
            text: blockMessage,
            sender: "ai",
            timestamp: new Date().toISOString(),
        }, { status: 400 });
    }

    const responseText = result.response.text(); //
    console.log("BENIHKU AI SERVICE API: Received response from Gemini:", responseText);

    return NextResponse.json({
      id: `ai-response-${Date.now()}`,
      text: responseText, //
      sender: "ai",
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("BENIHKU AI SERVICE API: Unhandled error in POST handler:", error);
    let errorMessage = "Terjadi kesalahan internal pada server AI kami. Mohon coba lagi nanti.";
    if (error.message) {
        errorMessage = error.message; //
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    return NextResponse.json({
        id: `ai-critical-error-${Date.now()}`,
        text: `Error: ${errorMessage}`,
        sender: "ai",
        timestamp: new Date().toISOString(),
     }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log("BENIHKU AI SERVICE API: GET handler reached at", new Date().toISOString());
  return NextResponse.json({ message: "BenihKu AI Service is running (GET)" });
}
