import { useState, useCallback, useRef, useEffect } from "react";

export interface MediaDevicesState {
  cameraStream: MediaStream | null;
  micStream: MediaStream | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraError: string | null;
  micError: string | null;
}

export function useMediaDevices() {
  const [state, setState] = useState<MediaDevicesState>({
    cameraStream: null,
    micStream: null,
    cameraEnabled: false,
    micEnabled: false,
    cameraError: null,
    micError: null,
  });

  const cameraRef = useRef<MediaStream | null>(null);
  const micRef = useRef<MediaStream | null>(null);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      cameraRef.current = stream;
      setState((prev) => ({
        ...prev,
        cameraStream: stream,
        cameraEnabled: true,
        cameraError: null,
      }));
      return stream;
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access in your browser settings."
          : "Could not access camera. Please check your device.";
      setState((prev) => ({
        ...prev,
        cameraError: message,
        cameraEnabled: false,
      }));
      return null;
    }
  }, []);

  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      micRef.current = stream;
      setState((prev) => ({
        ...prev,
        micStream: stream,
        micEnabled: true,
        micError: null,
      }));
      return stream;
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow mic access in your browser settings."
          : "Could not access microphone. Please check your device.";
      setState((prev) => ({
        ...prev,
        micError: message,
        micEnabled: false,
      }));
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.getTracks().forEach((t) => t.stop());
      cameraRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      cameraStream: null,
      cameraEnabled: false,
      cameraError: null,
    }));
  }, []);

  const stopMic = useCallback(() => {
    if (micRef.current) {
      micRef.current.getTracks().forEach((t) => t.stop());
      micRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      micStream: null,
      micEnabled: false,
      micError: null,
    }));
  }, []);

  const toggleCamera = useCallback(async () => {
    if (state.cameraEnabled) {
      stopCamera();
    } else {
      await requestCamera();
    }
  }, [state.cameraEnabled, stopCamera, requestCamera]);

  const toggleMic = useCallback(async () => {
    if (state.micEnabled) {
      stopMic();
    } else {
      await requestMic();
    }
  }, [state.micEnabled, stopMic, requestMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    ...state,
    requestCamera,
    requestMic,
    stopCamera,
    stopMic,
    toggleCamera,
    toggleMic,
  };
}
