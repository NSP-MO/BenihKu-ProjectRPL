// app/api/benihku-ai-service/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, ChatSession } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const MODEL_NAME = "gemini-1.5-flash-latest";
const API_KEY = "AIzaSyBDcloTUn38rUFaxqVcL8NKoVpprAlUyN0";

async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedData = Buffer.from(await file.arrayBuffer()).toString("base64");
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
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
    temperature: 0.7,
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
    Anda ramah, membantu, dan sangat akurat berdasarkan informasi yang diberikan.
    Prioritaskan informasi dari database BenihKu yang disediakan dalam prompt ini saat menjawab pertanyaan terkait produk (stok, harga, kategori, deskripsi, perawatan).
    Jika informasi spesifik (seperti stok atau harga) tersedia dari database dalam prompt, gunakan informasi tersebut dan HINDARI membuat nilai sendiri.
    Jika informasi tidak ditemukan di database, sampaikan bahwa informasi tersebut tidak tersedia atau minta pengguna memberikan detail lebih lanjut.
    Tujuan Anda adalah membantu pengguna dengan pertanyaan tentang produk tanaman, cara bernavigasi di website, informasi tentang pesanan, dan cara menghubungi layanan pelanggan.
    Gunakan riwayat percakapan untuk memahami konteks pertanyaan lanjutan.
    Jika pengguna mengunggah gambar, identifikasi tanaman tersebut dan berikan informasi relevan jika memungkinkan.
    Jika pertanyaan di luar topik tanaman, BenihKu, atau operasional website, tolak dengan sopan.
    Selalu jawab dalam Bahasa Indonesia.
    Informasi tambahan mengenai struktur data dan website BenihKu akan diberikan dalam prompt pengguna jika relevan dengan pertanyaan.`;


    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      currentUserParts.push(imagePart);
      // systemInstructionText += "\nPengguna telah mengunggah gambar. Fokus pada gambar tersebut jika ada pertanyaan terkait."; // Komentar ini bisa dihilangkan jika dirasa tidak perlu lagi secara eksplisit
      if (userMessage && userMessage.trim() !== "") {
        currentUserParts.push({ text: `\nPertanyaan terkait gambar: ${userMessage}` });
      } else {
        currentUserParts.push({ text: "\nDeskripsikan tanaman pada gambar ini dan berikan informasi perawatannya jika Anda tahu." });
      }
    } else if (userMessage && userMessage.trim() !== "") {
      currentUserParts.push({ text: userMessage });
      const lowerMessage = userMessage.toLowerCase();

      // Constructing contextual information without explicit markers for the AI to use naturally
      let dbContextInfo = "";

      if (lowerMessage.includes("daftar produk") || lowerMessage.includes("semua produk") || lowerMessage.includes("produk apa saja")) {
        const { data: products, error } = await supabase
          .from('products')
          .select('name, category, price, stock, is_published')
          .eq('is_published', true)
          .limit(5);
        if (!error && products && products.length > 0) {
          dbContextInfo += "\nBerikut beberapa contoh produk yang kami miliki:\n";
          products.forEach(p => {
            dbContextInfo += `- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}, Stok: ${p.stock > 0 ? p.stock : 'Habis'}).\n`;
          });
        } else {
          dbContextInfo += "\nSaat ini sepertinya belum ada produk yang bisa ditampilkan atau terjadi gangguan saat mengambil data produk.\n";
        }
      }
      else if (lowerMessage.includes("kategori") && (lowerMessage.includes("apa saja") || lowerMessage.includes("daftar"))) {
        const { data: categories, error } = await supabase
          .from('products')
          .select('category')
          .eq('is_published', true);
        if (!error && categories && categories.length > 0) {
          const uniqueCategories = [...new Set(categories.map(c => c.category).filter(Boolean))];
          dbContextInfo += `\nKami memiliki beberapa kategori produk, diantaranya:\n- ${uniqueCategories.join('\n- ')}\n`;
        } else {
          dbContextInfo += `\nInformasi kategori saat ini belum tersedia.\n`;
        }
      }
      else if (lowerMessage.includes("stok") || lowerMessage.includes("tersedia") || lowerMessage.includes("ada")) {
        const productNameMatch = lowerMessage.match(/(?:stok|tersedia|ada)\s*(?:untuk|dari|produk|tanaman)?\s*([^?.\n]+)/i);
        const productName = productNameMatch?.[1]?.trim();
        if (productName) {
          const { data: products, error } = await supabase
            .from('products')
            .select('name, stock, category, price, description, is_published')
            .ilike('name', `%${productName}%`);
         
          if (!error && products && products.length > 0) {
            dbContextInfo += `\nMengenai ketersediaan stok untuk produk yang mirip dengan "${productName}":\n`;
            products.forEach(p => {
              if (p.is_published) {
                dbContextInfo += `- Produk ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}), stok saat ini: ${p.stock > 0 ? p.stock + ' unit' : 'HABIS'}. Deskripsi: ${p.description.substring(0, 50)}...\n`;
              } else {
                dbContextInfo += `- Produk ${p.name} saat ini tidak dipublikasikan (status draft).\n`;
              }
            });
          } else {
            dbContextInfo += `\nUntuk produk "${productName}", sepertinya tidak ditemukan di sistem kami atau stoknya belum terdata.\n`;
          }
        } else {
            dbContextInfo += "\nUntuk informasi stok produk tertentu, bisa sebutkan nama produknya?\n";
        }
      }
      else if (lowerMessage.includes("rawat") || lowerMessage.includes("perawatan")) {
         const plantNameMatch = lowerMessage.match(/(?:rawat|perawatan)\s*(?:untuk|dari|tanaman)?\s*([^?.\n]+)/i);
         const plantName = plantNameMatch?.[1]?.trim();
         if (plantName) {
            const { data: productCare, error } = await supabase
              .from('products')
              .select('name, care_instructions, description, is_published')
              .ilike('name', `%${plantName}%`)
              .eq('is_published', true)
              .limit(1);
            if (!error && productCare && productCare.length > 0) {
              dbContextInfo += `\nBerikut informasi perawatan untuk ${productCare[0].name}:\n`;
              if (productCare[0].care_instructions) {
                const careData = typeof productCare[0].care_instructions === 'string'
                                 ? JSON.parse(productCare[0].care_instructions)
                                 : productCare[0].care_instructions;
                // Iterate care_instructions keys and values to form a natural string
                for (const key in careData) {
                    dbContextInfo += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${careData[key]}\n`;
                }
              } else dbContextInfo += " Informasi perawatan spesifik belum tersedia di database.\n";
              if(productCare[0].description) dbContextInfo += ` Deskripsi tambahan: ${productCare[0].description.substring(0,100)}...\n`;
            } else {
              dbContextInfo += `\nMaaf, informasi perawatan spesifik untuk "${plantName}" tidak ditemukan di database kami saat ini.\n`;
            }
         } else {
            dbContextInfo += "\nUntuk informasi perawatan, bisa sebutkan nama tanamannya?\n";
         }
      }
       else if (lowerMessage.includes("rekomendasi") || lowerMessage.includes("sarankan")) {
        const { data: randomProducts, error } = await supabase
            .from('products')
            .select('name, category, description, price, stock')
            .eq('is_published', true)
            .gt('stock', 0)
            .limit(5).order('created_at', { ascending: false });
        if(!error && randomProducts && randomProducts.length > 0) {
            dbContextInfo += "\nBerikut beberapa rekomendasi produk yang mungkin Anda sukai:\n";
            randomProducts.forEach(p => {
                dbContextInfo += `- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}, Stok: ${p.stock}). Sedikit tentang produk ini: ${p.description.substring(0,50)}...\n`;
            });
        } else {
          dbContextInfo += "\nSaat ini kami belum memiliki rekomendasi spesifik atau stok produk sedang kosong.\n";
        }
      }
      else if (lowerMessage.includes("tentang kami") || lowerMessage.includes("alamat") || lowerMessage.includes("kontak")) {
        dbContextInfo += `\nInformasi tentang BenihKu:
        Alamat kami di Jl. Raya Dramaga, Kampus IPB Dramaga Bogor, 16680 West Java, Indonesia.
        Anda bisa menghubungi kami via Email: benihku.site@gmail.com atau Telepon: +62 895 0757 4743.
        BenihKu adalah platform e-commerce tanaman yang menghubungkan pecinta tanaman dengan penjual berkualitas. Kami menyediakan berbagai jenis tanaman dengan informasi perawatan lengkap.
        Keunggulan kami adalah Kualitas Terjamin, Informasi Lengkap, dan Dukungan Pelanggan yang baik.\n`;
      }
       else if (lowerMessage.includes("cara order") || lowerMessage.includes("cara pesan") || lowerMessage.includes("checkout")) {
        dbContextInfo += `\nUntuk melakukan pemesanan di BenihKu:
        1. Tambahkan produk yang Anda inginkan ke keranjang dari halaman detail produk.
        2. Buka halaman keranjang Anda melalui ikon keranjang di bagian atas.
        3. Dari halaman keranjang, klik tombol untuk melanjutkan ke checkout.
        4. Di halaman checkout, isi detail pengiriman (nama, email, telepon, alamat) lalu pilih metode pengiriman dan pembayaran (Transfer Bank, COD, atau E-Wallet).
        5. Setelah pesanan dikonfirmasi, statusnya akan 'pending' dan Anda akan diarahkan ke detail pesanan.
        6. Anda bisa selalu cek riwayat pesanan Anda di halaman profil.\n`;
      }

      if (dbContextInfo) {
        currentUserParts.push({ text: "\nKontekstual Informasi Tambahan:\n" + dbContextInfo });
      }

    } else {
      if (currentUserParts.length === 0) {
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

    const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: { role: "system", parts: [{text: systemInstructionText}]} });
    const chat: ChatSession = model.startChat({
        history: conversationHistory,
        generationConfig,
        safetySettings,
    });

    console.log("BENIHKU AI SERVICE API: Sending request to Gemini with current user parts:", JSON.stringify(currentUserParts.map(p => 'text' in p ? p.text : '[IMAGE_DATA]')));
    const result = await chat.sendMessage(currentUserParts);


    if (result.response.promptFeedback && result.response.promptFeedback.blockReason) {
        console.error("BENIHKU AI SERVICE API: Gemini API response blocked:", result.response.promptFeedback);
        let blockMessage = `Permintaan Anda diblokir oleh sistem keamanan AI karena: ${result.response.promptFeedback.blockReason}.`;
        if (result.response.promptFeedback.safetyRatings && result.response.promptFeedback.safetyRatings.length > 0) {
            blockMessage += ` Detail: ${result.response.promptFeedback.safetyRatings.map(r => `${r.category} - ${r.probability}`).join(', ')}.`;
        }
        blockMessage += " Mohon coba pertanyaan atau gambar lain.";
        return NextResponse.json({
            id: `ai-blocked-${Date.now()}`,
            text: blockMessage,
            sender: "ai",
            timestamp: new Date().toISOString(),
        }, { status: 400 });
    }

    const responseText = result.response.text();
    console.log("BENIHKU AI SERVICE API: Received response from Gemini:", responseText);

    return NextResponse.json({
      id: `ai-response-${Date.now()}`,
      text: responseText,
      sender: "ai",
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("BENIHKU AI SERVICE API: Unhandled error in POST handler:", error);
    let errorMessage = "Terjadi kesalahan internal pada server AI kami. Mohon coba lagi nanti.";
    if (error.message) {
        errorMessage = error.message;
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
