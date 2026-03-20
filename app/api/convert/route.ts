// ============================================================
// API Route: POST /api/convert
// ============================================================
// Este es un Route Handler de Next.js (App Router).
// Recibe una imagen en base64, la procesa en el servidor y
// devuelve el resultado en ASCII como JSON.
//
// Next.js App Router usa el archivo route.ts dentro de app/api/
// para definir endpoints REST. Cada funcion exportada (GET, POST,
// etc.) se convierte en el handler del metodo HTTP correspondiente.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { CHARSET_STANDARD } from "@/lib/ascii";

export const runtime = "nodejs";

// Tipos de la respuesta
interface ConvertResponse {
  ascii: string;
  cols: number;
  rows: number;
  charset: string;
  processingTimeMs: number;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ConvertResponse | ErrorResponse>> {
  const start = Date.now();

  try {
    const body = await req.json();
    const { imageBase64, cols = 80, rows = 40, charset = CHARSET_STANDARD } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Se requiere el campo 'imageBase64'" },
        { status: 400 }
      );
    }

    if (typeof cols !== "number" || typeof rows !== "number") {
      return NextResponse.json(
        { error: "'cols' y 'rows' deben ser numeros" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // Decodificamos el base64 (con o sin prefijo data:image/...)
    // -------------------------------------------------------
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const inputBuffer = Buffer.from(base64Data, "base64");

    // -------------------------------------------------------
    // sharp redimensiona la imagen a cols×rows pixeles y
    // nos da los canales RGB en un Buffer plano.
    // Cada pixel = 3 bytes: [R, G, B, R, G, B, ...]
    // -------------------------------------------------------
    const { data, info } = await sharp(inputBuffer)
      .resize(cols, rows, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // -------------------------------------------------------
    // Convertimos cada pixel a un caracter ASCII
    // usando luminancia perceptual como índice en el charset.
    // -------------------------------------------------------
    let ascii = "";

    for (let row = 0; row < info.height; row++) {
      for (let col = 0; col < info.width; col++) {
        const idx = (row * info.width + col) * 3; // 3 canales: R G B
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Luminancia perceptual 
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const charIdx = Math.floor((brightness / 255) * (charset.length - 1));
        ascii += charset[charIdx];
      }
      ascii += "\n";
    }


    const processingTimeMs = Date.now() - start;

    return NextResponse.json({
      ascii,
      cols: info.width,
      rows: info.height,
      charset: charset.slice(0, 10) + "...",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/convert] Error:", err);
    return NextResponse.json(
      { error: "Error interno al procesar la imagen" },
      { status: 500 }
    );
  }
}

// GET — Documentacion del endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: "POST /api/convert",
    description: "Convierte una imagen a arte ASCII en el servidor",
    body: {
      imageBase64: "string (requerido) — Imagen en base64 con o sin prefijo data:image/",
      cols: "number (opcional, default: 80) — Columnas de caracteres",
      rows: "number (opcional, default: 40) — Filas de caracteres",
      charset: "string (opcional) — Caracteres a usar (de oscuro a claro)",
    },
    example: {
      imageBase64: "data:image/png;base64,iVBORw0KGgo...",
      cols: 80,
      rows: 40,
    },
  });
}
