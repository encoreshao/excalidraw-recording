import { useState, useCallback, useRef, useEffect } from "react";
import type { SelectionArea } from "../types";

import type { AppSettings } from "./useSettings";

interface CaptionData {
  text: string;
  position: { x: number; y: number };
  enabled: boolean;
}

interface UseRecorderOptions {
  excalidrawContainerRef: React.RefObject<HTMLDivElement | null>;
  selectionArea: SelectionArea | null;
  cameraStream: MediaStream | null;
  micStream: MediaStream | null;
  cameraEnabled: boolean;
  captionRef?: React.RefObject<CaptionData | null>;
  settingsRef?: React.RefObject<AppSettings | null>;
  mousePositionRef?: React.RefObject<{ x: number; y: number } | null>;
}

interface UseRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
  mimeType: string;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

function getSupportedMimeType(): string {
  const types = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

export function useRecorder({
  excalidrawContainerRef,
  selectionArea,
  cameraStream,
  micStream,
  cameraEnabled,
  captionRef,
  settingsRef,
  mousePositionRef,
}: UseRecorderOptions): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // Create a hidden video element for camera feed compositing
  useEffect(() => {
    if (cameraStream) {
      const video = document.createElement("video");
      video.srcObject = cameraStream;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
      cameraVideoRef.current = video;
    } else {
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
      cameraVideoRef.current = null;
    }
  }, [cameraStream]);

  const drawFrame = useCallback(() => {
    const container = excalidrawContainerRef.current;
    const recordingCanvas = recordingCanvasRef.current;
    if (!container || !recordingCanvas || !selectionArea) return;

    const ctx = recordingCanvas.getContext("2d");
    if (!ctx) return;

    const s = settingsRef?.current;
    const canvasPadding = s?.canvasPadding ?? 0;

    const canvases = container.querySelectorAll("canvas");
    if (canvases.length === 0) return;

    const dpr = window.devicePixelRatio || 1;

    // Clear with white + padding
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);

    // Content area after padding
    const padPx = canvasPadding * (recordingCanvas.width / selectionArea.width);
    const contentW = recordingCanvas.width - padPx * 2;
    const contentH = recordingCanvas.height - padPx * 2;

    canvases.forEach((srcCanvas) => {
      try {
        ctx.drawImage(
          srcCanvas,
          selectionArea.x * dpr,
          selectionArea.y * dpr,
          selectionArea.width * dpr,
          selectionArea.height * dpr,
          padPx,
          padPx,
          contentW,
          contentH,
        );
      } catch {
        // tainted canvas
      }
    });

    // ── Mouse cursor effect ──
    const cursorEffect = s?.cursorEffect ?? "none";
    if (cursorEffect !== "none" && mousePositionRef?.current) {
      const mp = mousePositionRef.current;
      const scaleX = recordingCanvas.width / selectionArea.width;
      const scaleY = recordingCanvas.height / selectionArea.height;
      const cx = (mp.x - selectionArea.x) * scaleX;
      const cy = (mp.y - selectionArea.y) * scaleY;
      const cursorColor = s?.cursorColor ?? "#FBBF24";

      if (
        cx > 0 && cx < recordingCanvas.width &&
        cy > 0 && cy < recordingCanvas.height
      ) {
        ctx.save();
        if (cursorEffect === "highlight") {
          const radius = 18;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = cursorColor + "55"; // semi-transparent
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = cursorColor + "AA";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (cursorEffect === "spotlight") {
          const radius = 60;
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, "rgba(0,0,0,0)");
          gradient.addColorStop(0.7, "rgba(0,0,0,0)");
          gradient.addColorStop(1, "rgba(0,0,0,0.25)");
          // Draw darkened overlay with spotlight hole
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
        }
        ctx.restore();
      }
    }

    // ── Camera overlay ──
    const showCamera = s?.showCameraInRecording ?? true;
    if (showCamera && cameraEnabled && cameraVideoRef.current) {
      const video = cameraVideoRef.current;
      const sizeMultiplier =
        s?.cameraBubbleSize === "small" ? 0.15 :
        s?.cameraBubbleSize === "large" ? 0.28 : 0.22;
      const bubbleSize = Math.min(recordingCanvas.width, recordingCanvas.height) * sizeMultiplier;
      const margin = 24;
      const centerX = recordingCanvas.width - bubbleSize / 2 - margin;
      const centerY = recordingCanvas.height - bubbleSize / 2 - margin;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, bubbleSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#1e1e2e";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();

      const videoAspect = video.videoWidth / (video.videoHeight || 1);
      let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
      if (videoAspect > 1) { sw = video.videoHeight; sx = (video.videoWidth - sw) / 2; }
      else { sh = video.videoWidth; sy = (video.videoHeight - sh) / 2; }

      ctx.drawImage(video, sx, sy, sw, sh,
        centerX - bubbleSize / 2 + 3, centerY - bubbleSize / 2 + 3,
        bubbleSize - 6, bubbleSize - 6);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, bubbleSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(22, 163, 74, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // ── Caption text overlay ──
    if (captionRef?.current?.enabled && captionRef.current.text && selectionArea) {
      const caption = captionRef.current;
      const scaleX = recordingCanvas.width / selectionArea.width;
      const scaleY = recordingCanvas.height / selectionArea.height;
      const captionX = (caption.position.x - selectionArea.x) * scaleX;
      const captionY = (caption.position.y - selectionArea.y) * scaleY;

      const captionBg = s?.captionBgColor ?? "rgba(0,0,0,0.75)";
      const captionTextColor = s?.captionTextColor ?? "#ffffff";
      const captionRadius = s?.captionCornerRadius ?? 12;
      const fontSizeMultiplier =
        s?.captionFontSize === "small" ? 0.028 :
        s?.captionFontSize === "large" ? 0.045 : 0.035;

      const maxWidth = recordingCanvas.width * 0.8;
      const fontSize = Math.max(14, Math.round(recordingCanvas.height * fontSizeMultiplier));
      ctx.save();
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const words = caption.text.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.4;
      const padding = fontSize * 0.6;
      const boxHeight = lines.length * lineHeight + padding * 2;
      const boxWidth = Math.min(
        maxWidth + padding * 2,
        Math.max(...lines.map((l) => ctx.measureText(l).width)) + padding * 2,
      );
      const boxX = Math.max(0, Math.min(captionX, recordingCanvas.width - boxWidth));
      const boxY = Math.max(0, Math.min(captionY, recordingCanvas.height - boxHeight));

      // Rounded rect background
      const r = captionRadius * (recordingCanvas.width / selectionArea.width);
      ctx.beginPath();
      ctx.moveTo(boxX + r, boxY);
      ctx.lineTo(boxX + boxWidth - r, boxY);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - r, boxY + boxHeight);
      ctx.lineTo(boxX + r, boxY + boxHeight);
      ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
      ctx.lineTo(boxX, boxY + r);
      ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
      ctx.closePath();
      ctx.fillStyle = captionBg;
      ctx.fill();

      ctx.fillStyle = captionTextColor;
      lines.forEach((line, i) => {
        ctx.fillText(line, boxX + boxWidth / 2, boxY + padding + i * lineHeight, maxWidth);
      });
      ctx.restore();
    }
  }, [excalidrawContainerRef, selectionArea, cameraEnabled, captionRef, settingsRef, mousePositionRef]);

  const startRecording = useCallback(() => {
    if (!selectionArea || !excalidrawContainerRef.current) return;

    // Create recording canvas
    const canvas = document.createElement("canvas");
    const maxDim = 1920;
    const aspect = selectionArea.width / selectionArea.height;

    if (aspect > 1) {
      canvas.width = Math.min(selectionArea.width * (window.devicePixelRatio || 1), maxDim);
      canvas.height = Math.round(canvas.width / aspect);
    } else {
      canvas.height = Math.min(selectionArea.height * (window.devicePixelRatio || 1), maxDim);
      canvas.width = Math.round(canvas.height * aspect);
    }

    // Ensure even dimensions (required for some codecs)
    canvas.width = Math.round(canvas.width / 2) * 2;
    canvas.height = Math.round(canvas.height / 2) * 2;

    recordingCanvasRef.current = canvas;

    const fps = settingsRef?.current?.recordingFps ?? 30;

    // Start frame drawing loop
    frameIntervalRef.current = window.setInterval(() => {
      drawFrame();
    }, 1000 / fps);

    // Capture canvas stream
    const canvasStream = canvas.captureStream(fps);

    // Combine streams
    const tracks: MediaStreamTrack[] = [
      ...canvasStream.getVideoTracks(),
    ];

    if (micStream) {
      tracks.push(...micStream.getAudioTracks());
    }

    const combinedStream = new MediaStream(tracks);

    // Create MediaRecorder
    const selectedMimeType = getSupportedMimeType();
    setMimeType(selectedMimeType);

    const bitrate = (settingsRef?.current?.videoBitrate ?? 5) * 1_000_000;
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: bitrate,
    });

    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });
      setRecordedBlob(blob);
    };

    recorder.start(1000); // Collect data every second
    mediaRecorderRef.current = recorder;

    // Start duration timer
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    durationIntervalRef.current = window.setInterval(() => {
      setDuration(
        Math.floor(
          (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000,
        ),
      );
    }, 200);

    setIsRecording(true);
    setIsPaused(false);
    setRecordedBlob(null);
    setDuration(0);
  }, [selectionArea, excalidrawContainerRef, micStream, drawFrame, settingsRef]);

  const stopRecording = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      const fps = settingsRef?.current?.recordingFps ?? 30;
      frameIntervalRef.current = window.setInterval(() => {
        drawFrame();
      }, 1000 / fps);
      setIsPaused(false);
    }
  }, [drawFrame]);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setDuration(0);
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    recordedBlob,
    mimeType,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  };
}
