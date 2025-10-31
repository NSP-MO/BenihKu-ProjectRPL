// app/api/benihku-ai-service/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, ChatSession } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const MODEL_NAME = "gemini-flash-latest";
const API_KEY = "AIzaSyBCh_l4sdqAy3hU8Iv9xEUwxZnGPWDbQi4"; // KUNCI API DISEMATKAN LANGSUNG

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
    const historyJson = formData.get("history") as string | null; // Expect history as JSON string

    let conversationHistory: Array<{ role: "user" | "model"; parts: Part[] }> = [];
    if (historyJson) {
      try {
        const parsedHistory = JSON.parse(historyJson);
        if (Array.isArray(parsedHistory)) {
          // Convert to the format expected by Gemini
          conversationHistory = parsedHistory.map((msg: { sender: 'user' | 'ai'; text: string; imageUrl?: string }) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }], // Simplified: assumes text parts for history for now. Image handling in history can be complex.
          }));
        }
      } catch (e) {
        console.warn("BENIHKU AI SERVICE API: Could not parse conversation history JSON.", e);
      }
    }


    console.log("BENIHKU AI SERVICE API: FormData parsed. Message:", userMessage, "ImageName:", imageFile?.name, "History items:", conversationHistory.length);

    let currentUserParts: Part[] = [];
    let systemInstructionText = `Anda adalah BenihKu AI, asisten virtual untuk toko tanaman BenihKu.
    Anda ramah, membantu, dan berpengetahuan tentang tanaman.
    Tujuan Anda adalah membantu pengguna dengan pertanyaan tentang produk tanaman, benih, stok, cara perawatan, dan memberikan rekomendasi.
    Gunakan riwayat percakapan (jika ada) untuk memahami konteks pertanyaan lanjutan, termasuk kata ganti dan referensi ke topik sebelumnya.
    Jika pengguna mengunggah gambar, coba identifikasi tanaman dalam gambar tersebut dan berikan informasi yang relevan jika memungkinkan.
    Jika pertanyaan di luar topik tanaman atau BenihKu, tolak dengan sopan.
    Selalu jawab dalam Bahasa Indonesia.
    Jika ditanyakan rekomendasi, coba berikan rekomendasi terkait tanaman dahulu, dan 2 atau lebih benih`;

    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      currentUserParts.push(imagePart);
      systemInstructionText += "\nPengguna telah mengunggah gambar. Fokus pada gambar tersebut jika ada pertanyaan terkait.";
      if (userMessage && userMessage.trim() !== "") {
        currentUserParts.push({ text: `\nPertanyaan terkait gambar: ${userMessage}` });
      } else {
        currentUserParts.push({ text: "\nDeskripsikan tanaman pada gambar ini dan berikan informasi perawatannya jika Anda tahu." });
      }
    } else if (userMessage && userMessage.trim() !== "") {
      currentUserParts.push({ text: userMessage });
      const lowerMessage = userMessage.toLowerCase();

      // Contextual data fetching from Supabase (existing logic)
      if (lowerMessage.includes("stok") || lowerMessage.includes("tersedia")) {
        const productNameMatch = lowerMessage.match(/(?:stok|tersedia)\s*(?:untuk|dari|produk)?\s*([^?.\n]+)/i);
        const productName = productNameMatch?.[1]?.trim();
        if (productName) {
          systemInstructionText += `\nPengguna menanyakan stok produk. Cari informasi stok untuk produk yang mirip dengan "${productName}" dari database produk BenihKu.`;
          const { data: products, error } = await supabase
            .from('products')
            .select('name, stock, category, price, description')
            .ilike('name', `%${productName}%`)
            .eq('is_published', true)
            .limit(3);
          if (error) console.error("Supabase query error for stock:", error);
          else if (products && products.length > 0) {
            let productInfo = "\n[Info Stok & Produk dari Database BenihKu tentang ketersediaan]:";
            products.forEach(p => {
              productInfo += `\n- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price.toLocaleString('id-ID')}, Stok: ${p.stock > 0 ? p.stock : 'Habis'}). Deskripsi singkat: ${p.description.substring(0, 50)}...`;
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
              .select('name, care_instructions, description')
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
        systemInstructionText += `\nPengguna meminta rekomendasi tanaman. Berikan beberapa rekomendasi.`;
        const { data: randomProducts, error } = await supabase
            .from('products')
            .select('name, category, description, price')
            .eq('is_published', true).limit(5).order('created_at', { ascending: false }); // Ensure created_at exists or use a different order
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
