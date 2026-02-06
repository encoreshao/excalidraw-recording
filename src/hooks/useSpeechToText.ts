import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface UseSpeechToTextReturn {
  /** The current live transcript (interim + final for current session) */
  transcript: string;
  /** Whether speech recognition is active */
  isListening: boolean;
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Error message if any */
  error: string | null;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Toggle listening on/off */
  toggle: () => void;
  /** Clear the transcript */
  clear: () => void;
}

export function useSpeechToText(lang = "en-US", clearDelaySec = 3): UseSpeechToTextReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const restartingRef = useRef(false);
  const clearTimerRef = useRef<number | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Create recognition instance
  const getRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    return recognition;
  }, [isSupported, lang]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      restartingRef.current = false;
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const recognition = getRecognition();
    if (!recognition) return;

    setTranscript("");
    setError(null);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalSegment = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results.item(i);
        if (!result || !result[0]) continue;
        if (result.isFinal) {
          finalSegment += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Cancel any pending clear timer while user is still speaking
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }

      if (finalSegment) {
        // Show the completed sentence, then auto-clear after a short delay
        setTranscript(finalSegment.trim());
        clearTimerRef.current = window.setTimeout(() => {
          setTranscript("");
          clearTimerRef.current = null;
        }, clearDelaySec * 1000);
      } else if (interimTranscript) {
        // Show what the user is currently saying (interim/partial result)
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are not real errors - just the user being quiet or
      // the recognition being stopped programmatically
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("Speech recognition error:", event.error);
      setError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if we're supposed to be listening
      // (recognition stops after silence in some browsers)
      if (restartingRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          restartingRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    restartingRef.current = true;

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition.");
      restartingRef.current = false;
    }
  }, [isSupported, getRecognition]);

  const stop = useCallback(() => {
    restartingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const clear = useCallback(() => {
    if (clearTimerRef.current) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      restartingRef.current = false;
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    error,
    start,
    stop,
    toggle,
    clear,
  };
}
