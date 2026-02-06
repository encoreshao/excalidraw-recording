import { useState, useCallback, useRef, useEffect } from "react";
import type { SelectionArea } from "../types";

interface UseRecorderOptions {
  excalidrawContainerRef: React.RefObject<HTMLDivElement | null>;
  selectionArea: SelectionArea | null;
  cameraStream: MediaStream | null;
  micStream: MediaStream | null;
  cameraEnabled: boolean;
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

    // Find all canvas elements inside the Excalidraw container
    const canvases = container.querySelectorAll("canvas");
    if (canvases.length === 0) return;

    const dpr = window.devicePixelRatio || 1;

    // Clear recording canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);

    // Composite each Excalidraw canvas layer
    canvases.forEach((srcCanvas) => {
      try {
        ctx.drawImage(
          srcCanvas,
          selectionArea.x * dpr,
          selectionArea.y * dpr,
          selectionArea.width * dpr,
          selectionArea.height * dpr,
          0,
          0,
          recordingCanvas.width,
          recordingCanvas.height,
        );
      } catch {
        // Canvas might be tainted if external images are loaded
      }
    });

    // Draw camera overlay (circular bubble in bottom-right)
    if (cameraEnabled && cameraVideoRef.current) {
      const video = cameraVideoRef.current;
      const bubbleSize = Math.min(recordingCanvas.width, recordingCanvas.height) * 0.22;
      const margin = 24;
      const centerX = recordingCanvas.width - bubbleSize / 2 - margin;
      const centerY = recordingCanvas.height - bubbleSize / 2 - margin;

      ctx.save();

      // Draw circular clip
      ctx.beginPath();
      ctx.arc(centerX, centerY, bubbleSize / 2, 0, Math.PI * 2);
      ctx.closePath();

      // Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Border
      ctx.fillStyle = "#1e1e2e";
      ctx.fill();

      // Reset shadow for video
      ctx.shadowColor = "transparent";

      // Clip and draw video
      ctx.clip();
      const videoAspect = video.videoWidth / (video.videoHeight || 1);
      let sx = 0,
        sy = 0,
        sw = video.videoWidth,
        sh = video.videoHeight;

      // Center-crop the video to fill the circle
      if (videoAspect > 1) {
        sw = video.videoHeight;
        sx = (video.videoWidth - sw) / 2;
      } else {
        sh = video.videoWidth;
        sy = (video.videoHeight - sh) / 2;
      }

      ctx.drawImage(
        video,
        sx,
        sy,
        sw,
        sh,
        centerX - bubbleSize / 2 + 3,
        centerY - bubbleSize / 2 + 3,
        bubbleSize - 6,
        bubbleSize - 6,
      );

      ctx.restore();

      // Draw border ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, bubbleSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 107, 53, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }, [excalidrawContainerRef, selectionArea, cameraEnabled]);

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

    // Start frame drawing loop (30fps)
    frameIntervalRef.current = window.setInterval(() => {
      drawFrame();
    }, 1000 / 30);

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30);

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

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 5_000_000,
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
  }, [selectionArea, excalidrawContainerRef, micStream, drawFrame]);

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
      frameIntervalRef.current = window.setInterval(() => {
        drawFrame();
      }, 1000 / 30);
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
