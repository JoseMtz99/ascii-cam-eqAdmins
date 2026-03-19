"use client";

// ============================================================
// AsciiCamera — Componente principal de la cámara ASCII
// ============================================================
// Utiliza:
//   - useRef para referenciar el <video> y el <canvas> del DOM
//   - useEffect para iniciar/limpiar el stream de la cámara
//   - requestAnimationFrame para el loop de renderizado
//   - Canvas API para leer píxeles y convertirlos a ASCII
// ============================================================

import { useRef, useEffect, useState, useCallback } from "react";
import { imageDataToAscii, CHARSET_STANDARD } from "@/lib/ascii";

// Resolucion del output ASCII
const ASCII_COLS = 120;
const ASCII_ROWS = 60;

export default function AsciiCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [asciiOutput, setAsciiOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>("");
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef(Date.now());

  // Funcion principal del loop de renderizado
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Dibujamos el frame del video en el canvas
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Leemos los pixeles y convertimos a ASCII
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const ascii = imageDataToAscii(imageData, ASCII_COLS, ASCII_ROWS, CHARSET_STANDARD);
    setAsciiOutput(ascii);

    // Calcular FPS
    const now = Date.now();
    const delta = now - lastFrameTime.current;
    lastFrameTime.current = now;
    setFps(Math.round(1000 / delta));

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, []);

  // Iniciar la camara
  const startCamera = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsRunning(true);
      animFrameRef.current = requestAnimationFrame(renderFrame);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Error al acceder a la camara: ${err.message}`
          : "No se pudo acceder a la camara."
      );
    }
  }, [renderFrame]);

  // Detener la camara
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRunning(false);
    setAsciiOutput("");
    setFps(0);
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col flex-1 p-4 gap-4">
      {/* Canvas oculto para procesar frames */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="hidden"
      />
      {/* Video oculto — solo para capturar el stream */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="hidden"
      />

      {/* Controles */}
      <div className="flex items-center gap-4 flex-wrap">
        {!isRunning ? (
          <button
            onClick={startCamera}
            className="px-5 py-2 bg-green-900 hover:bg-green-800 text-green-300 border border-green-600 rounded text-sm transition-all cursor-pointer"
          >
            ▶ INICIAR CÁMARA
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-5 py-2 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 rounded text-sm transition-all cursor-pointer"
          >
            ■ DETENER
          </button>
        )}

        {/* Indicadores de estado */}
        <div className="flex items-center gap-3 text-xs text-green-700">
          <span>
            RES:{" "}
            <span className="text-green-500">
              {ASCII_COLS}×{ASCII_ROWS}
            </span>
          </span>
          {isRunning && (
            <span>
              FPS:{" "}
              <span className="text-green-400">{fps}</span>
            </span>
          )}
          <span>
            CHARSET:{" "}
            <span className="text-green-500 font-bold">STANDARD</span>
          </span>
        </div>

        {isRunning && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            <span className="text-xs text-green-600">LIVE</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-500 text-sm border border-red-900 bg-red-950 px-4 py-2 rounded">
          ⚠ {error}
        </div>
      )}

      {/* ASCII Output */}
      <div className="flex-1 bg-black border border-green-900 rounded overflow-auto relative">
        {!isRunning && !asciiOutput ? (
          <div className="flex items-center justify-center h-full min-h-[300px] text-green-800 text-sm">
            <div className="text-center">
              <div className="text-5xl mb-4 text-green-900">◉</div>
              <p>Presiona <span className="text-green-600">▶ INICIAR CAMARA</span> para comenzar</p>
              <p className="mt-1 text-xs text-green-900">Tu imagen sera convertida a ASCII</p>
            </div>
          </div>
        ) : (
          <pre className="ascii-output p-2 text-green-400 leading-none">
            {asciiOutput}
          </pre>
        )}
      </div>

    </div>
  );
}
