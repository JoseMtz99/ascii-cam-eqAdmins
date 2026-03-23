// ============================================================
// ASCII Conversion Library
// ============================================================
// Este archivo contiene la logica central de conversión de
// pixeles a caracteres ASCII usando el nivel de brillo de cada
// pixel como índice en un conjunto de caracteres.
// ============================================================

export const CHARSET_STANDARD = " .`'^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

// Equipo 5: Selector de charset — Conjuntos alternativos para el selector de charset (bloques, minimal y alta densidad)
export const CHARSET_BLOCKS  = " ░▒▓█";
export const CHARSET_MINIMAL = " .:-=";
export const CHARSET_DENSE   = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

// TODO #5 — EQUIPO 5: Selector de charset
// Implementar un selector que permita al usuario elegir entre
// distintos conjuntos de caracteres. Ejemplos:
//   CHARSET_STANDARD (el actual)
//   CHARSET_BLOCKS  = ' ░▒▓█'
//   CHARSET_MINIMAL = ' .:-='
//   CHARSET_DENSE   = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\'. '

/**
 * Convierte un ImageData (frame de canvas) a un string ASCII.
 * @param imageData - Datos de pixele del canvas
 * @param cols - Numero de columnas (caracteres por fila)
 * @param rows - Numero de filas
 * @param charset - Conjunto de caracteres a usar
 */
export function imageDataToAscii(
  imageData: ImageData,
  cols: number,
  rows: number,
  charset: string = CHARSET_STANDARD
): string {
  const { data, width, height } = imageData;
  const cellW = width / cols;
  const cellH = height / rows;
  let result = "";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculamos el pixel central de cada celda
      const px = Math.floor(col * cellW + cellW / 2);
      const py = Math.floor(row * cellH + cellH / 2);
      const idx = (py * width + px) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Luminancia 
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      // Mapeamos el brillo al indice del charset
      const charIdx = Math.floor((brightness / 255) * (charset.length - 1));
      result += charset[charIdx];
    }
    result += "\n";
  }

  return result;
}


/**
 * Convierte un Buffer de imagen a ASCII usando un canvas virtual (Node.js).
 * Se usa en el API Route del servidor.
 * @param base64 - Imagen en base64
 * @param cols - Columnas de caracteres
 * @param rows - Filas de caracteres
 */
export function base64ToAsciiServer(
  base64: string,
  cols: number = 100,
  rows: number = 50
): Promise<string> {
  // En el servidor usamos el API de Canvas de Node (next maneja esto via @vercel/og o sharp)
  // Para simplificar el demo, delegamos la logica al cliente via el mismo charset
  return Promise.resolve(
    `[Server conversion: ${cols}x${rows} chars from base64 image of length ${base64.length}]`
  );
}
