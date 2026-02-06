import { useState, useCallback, useEffect } from "react";

export interface AppSettings {
  // Caption settings
  captionBgColor: string;
  captionTextColor: string;
  captionCornerRadius: number;
  captionFontSize: "small" | "medium" | "large";

  // Recording settings
  showCameraInRecording: boolean;
  cameraBubbleSize: "small" | "medium" | "large";
  canvasPadding: number;
  cursorEffect: "none" | "highlight" | "spotlight";
  cursorColor: string;
  recordingFps: 15 | 24 | 30 | 60;
  videoBitrate: number; // in Mbps

  // Caption auto-clear delay (seconds)
  captionClearDelay: number;
}

const STORAGE_KEY = "excalidraw-recording-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  captionBgColor: "rgba(0, 0, 0, 0.75)",
  captionTextColor: "#ffffff",
  captionCornerRadius: 12,
  captionFontSize: "medium",

  showCameraInRecording: true,
  cameraBubbleSize: "medium",
  canvasPadding: 0,
  cursorEffect: "highlight",
  cursorColor: "#FBBF24",
  recordingFps: 30,
  videoBitrate: 5,

  captionClearDelay: 3,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  // Persist on every change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettingsState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, updateSetting, resetSettings };
}
