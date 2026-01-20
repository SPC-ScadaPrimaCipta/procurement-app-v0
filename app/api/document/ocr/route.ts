import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        // Check API key
        if (!process.env.OPENAI_API_KEY) {
            console.error("OPENAI_API_KEY is not set");
            return NextResponse.json(
                { error: "OpenAI API key not configured" },
                { status: 500 }
            );
        }

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validasi file type - Accept images only (PDF will be converted client-side)
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Please convert PDF to image first or upload JPG/PNG" },
                { status: 400 }
            );
        }

        // Validasi file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Max 10MB" },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const mimeType = file.type;

        console.log("Processing file:", {
            name: file.name,
            size: file.size,
            type: mimeType,
            apiKeySet: !!process.env.OPENAI_API_KEY,
        });

        // GPT-4 Vision untuk OCR dengan model terbaru
        const response = await openai.chat.completions.create({
            model: "gpt-4o-2024-11-20", // Latest model with better vision accuracy
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `PENTING: Ini adalah formulir surat masuk KEMENTERIAN PERHUBUNGAN dengan format STANDAR.

LOKASI FIELD DI DOKUMEN:
- BAGIAN ATAS: Header "KEMENTERIAN PERHUBUNGAN - SEKRETARIAT JENDERAL - BIRO UMUM"
- TABEL METADATA (Kiri dokumen):
  * Surat Dari: [nama pengirim]
  * Nomor Surat: [format: XX.XXX/X/XX/XXX/XXXX]
  * Tanggal Surat: [DD Bulan YYYY]
  * Perihal: [subjek surat]
  * Diterima Tanggal: [DD Bulan YYYY]
  * No. Agenda: [format: XXX/X.XX/XXXX]
  * No. Urut: [nomor]

- KOTAK "DITERUSKAN KEPADA YTH":
  Checkbox di KIRI:
  * KABAG 1: Kabag TU Pimpinan dan Keprotokolan
  * KABAG 2: Kabag Persuratan, Kearsipan dan Pelaporan
  * KABAG 3: Kabag Rumah Tangga
  * KABAG 4: Kabag Perencanaan dan Keuangan
  * TU VI: Ketua Tim TU Biro
  
  Checkbox di KANAN:
  * PPK
  * SPM
  * BENDAHARA
  * SESPRI

- KOTAK "ISI DISPOSISI":
  Checkbox instruksi (cari yang ada tanda centang ✓):
  * Agendakan/Jadwalkan
  * Teliti dan Proses
  * Telaah/Evaluasi/Saran
  * Sesuai arahan Menteri/WaMen/Sesjen
  * Siapkan Bahan
  * Ditindaklanjuti
  * Diselesaikan
  * Harap Mewakili dan Laporkan
  * Hadir Bersama Saya
  * Diketahui & Dipergunakan
  * Dipelajari/Untuk Referensi
  * Dikoordinasikan
  * Dipantau/Dikuti Perkembangannya
  * Laporkan

- KOTAK "CATATAN DISPOSISI": Tulisan tangan (jika ada)

TUGAS ANDA:
Ekstrak data berikut dalam format JSON dengan TELITI:

{
  "nomor_surat": "nomor surat LENGKAP dengan format",
  "tanggal_surat": "konversi ke format DD/MM/YYYY",
  "dari_asal": "nama pengirim dari field 'Surat Dari'",
  "cc_tembusan": "kosongkan jika tidak ada",
  "perihal": "dari field 'Perihal', copy lengkap",
  "agenda_scope": "Biro" atau "Bagian",
  "agenda_number": "dari field 'No. Agenda'",
  "disposition_date": "dari field 'Diterima Tanggal', format DD/MM/YYYY",
  "disposition_note": "dari 'CATATAN DISPOSISI', tulisan tangan (jika terbaca)",
  "disposition_actions": ["hanya nama instruksi yang TERCENTANG ✓"],
  "forward_to": ["hanya nama penerima yang TERCENTANG ✓, gunakan nama LENGKAP seperti di form"]
}

ATURAN KETAT:
1. Untuk checkbox: HANYA ambil yang ada tanda centang/checkmark ✓
2. Checkbox kosong = JANGAN masukkan ke array
3. Gunakan NAMA LENGKAP dari form, contoh: "Kabag Persuratan, Kearsipan dan Pelaporan" (bukan "Kabag Persuratan")
4. Tanggal: konversi format Indonesia ke DD/MM/YYYY
5. Return ONLY valid JSON, NO markdown formatting
6. Jika field kosong/tidak terbaca, gunakan null atau ""`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
            temperature: 0.1,
        });

        const result = response.choices[0]?.message?.content;

        if (!result) {
            throw new Error("No response from OCR service");
        }

        // Clean response (remove markdown if exists)
        const cleanJson = result
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        let extracted;
        try {
            extracted = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("Failed to parse OCR response:", cleanJson);
            throw new Error("Invalid JSON response from OCR");
        }

        return NextResponse.json({
            success: true,
            data: extracted,
            raw_response: result, // untuk debugging
        });

    } catch (error: any) {
        console.error("OCR Error Details:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
            response: error.response?.data,
        });
        
        return NextResponse.json(
            { 
                error: error.message || "Failed to process document",
                details: error.response?.data?.error?.message || error.message,
            },
            { status: 500 }
        );
    }
}
