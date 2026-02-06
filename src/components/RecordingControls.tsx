import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasSelection: boolean;
  isSelectingArea: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
  captionsEnabled: boolean;
  captionsSupported: boolean;
  cameraError: string | null;
  micError: string | null;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleCaptions: () => void;
  onSelectArea: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onOpenSettings: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/* ── Tooltip wrapper ── */
function Tooltip({ label, children, position = "top" }: { label: string; children: ReactNode; position?: "top" | "bottom" }) {
  const pos = position === "top"
    ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
    : "top-full mt-2 left-1/2 -translate-x-1/2";
  return (
    <div className="relative group/tip">
      {children}
      <div
        className={`absolute ${pos} px-2.5 py-1 rounded-lg bg-gray-900 text-white text-[11px] font-medium whitespace-nowrap
                     shadow-lg pointer-events-none opacity-0 group-hover/tip:opacity-100
                     transition-opacity duration-150 z-10`}
      >
        {label}
      </div>
    </div>
  );
}

export default function RecordingControls({
  isRecording,
  isPaused,
  duration,
  hasSelection,
  isSelectingArea,
  cameraEnabled,
  micEnabled,
  captionsEnabled,
  captionsSupported,
  cameraError,
  micError,
  onToggleCamera,
  onToggleMic,
  onToggleCaptions,
  onSelectArea,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onOpenSettings,
}: RecordingControlsProps) {
  const POSITION_KEY = "excalidraw-recording-bar-position";
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Center the bar on initial mount if no saved position
  useEffect(() => {
    if (!position && containerRef.current) {
      const w = containerRef.current.offsetWidth;
      setPosition({
        x: (window.innerWidth - w) / 2,
        y: window.innerHeight - 80,
      });
    }
  }, [position]);

  // Clamp position when bar width changes (recording mode toggle)
  useEffect(() => {
    if (containerRef.current && position) {
      const w = containerRef.current.offsetWidth;
      const maxX = window.innerWidth - w;
      if (position.x > maxX) {
        setPosition((p) => p ? { ...p, x: Math.max(0, maxX) } : p);
      }
    }
  }, [isRecording, position]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    isDragging.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const w = containerRef.current?.offsetWidth || 300;
      const h = containerRef.current?.offsetHeight || 60;
      const newX = Math.max(0, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - w));
      const newY = Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - h));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const pos = { x: rect.left, y: rect.top };
        try { localStorage.setItem(POSITION_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] select-none"
      style={
        position
          ? { left: position.x, top: position.y }
          : { left: "50%", bottom: 24, transform: "translateX(-50%)" }
      }
    >
      <div
        className="glass-panel px-4 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        {/* ── RECORDING MODE: compact bar ── */}
        {isRecording ? (
          <>
            {/* Drag handle */}
            <div className="flex flex-col gap-0.5 mr-1 opacity-30">
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
            </div>

            {/* Timer */}
            <Tooltip label="Recording duration">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
                <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
                <span className="font-mono text-base text-red-600 font-bold min-w-[60px] tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            </Tooltip>

            <div className="w-px h-8 bg-gray-200" />

            {/* Pause / Resume */}
            <Tooltip label={isPaused ? "Resume recording" : "Pause recording"}>
              <button
                onClick={isPaused ? onResumeRecording : onPauseRecording}
                className="btn-icon"
              >
                {isPaused ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                )}
              </button>
            </Tooltip>

            {/* Stop */}
            <Tooltip label="Stop recording">
              <button onClick={onStopRecording} className="btn-danger text-sm !px-4 !py-2">
                <div className="w-3 h-3 rounded-sm bg-white" />
                Stop
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            {/* ── SETUP MODE: full toolbar ── */}

            {/* Drag handle */}
            <div className="flex flex-col gap-0.5 mr-1 opacity-30">
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
            </div>

            {/* Camera */}
            <Tooltip label={cameraEnabled ? "Camera on" : "Camera off"}>
              <div className="relative group">
                <button
                  onClick={onToggleCamera}
                  className={`btn-icon ${cameraEnabled ? "!bg-accent/10 !border-accent/40 !text-accent" : ""}`}
                >
                  {cameraEnabled ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-.409-7.232-7.232M8.25 5.25 4.21 9.29" />
                    </svg>
                  )}
                </button>
                {cameraError && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {cameraError}
                  </div>
                )}
              </div>
            </Tooltip>

            {/* Mic */}
            <Tooltip label={micEnabled ? "Mic on" : "Mic off"}>
              <div className="relative group">
                <button
                  onClick={onToggleMic}
                  className={`btn-icon ${micEnabled ? "!bg-accent/10 !border-accent/40 !text-accent" : ""}`}
                >
                  {micEnabled ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
                {micError && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {micError}
                  </div>
                )}
              </div>
            </Tooltip>

            {/* Captions */}
            {captionsSupported && (
              <Tooltip label={captionsEnabled ? "Captions on" : "Captions off"}>
                <button
                  onClick={onToggleCaptions}
                  className={`btn-icon ${captionsEnabled ? "!bg-accent/10 !border-accent/40 !text-accent" : ""}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                </button>
              </Tooltip>
            )}

            <div className="w-px h-8 bg-gray-200" />

            {/* Select area — icon only */}
            <Tooltip label={hasSelection ? "Area selected" : "Select area"}>
              <button
                onClick={onSelectArea}
                className={`btn-icon ${isSelectingArea ? "!bg-accent/10 !border-accent/40 !text-accent" : ""} ${hasSelection && !isSelectingArea ? "!border-green-500 !text-green-600" : ""}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
                </svg>
              </button>
            </Tooltip>

            <div className="w-px h-8 bg-gray-200" />

            {/* Record */}
            <Tooltip label={!hasSelection ? "Select an area first" : "Start recording"}>
              <button
                onClick={onStartRecording}
                disabled={!hasSelection}
                className="btn-primary text-sm"
              >
                <div className="w-3 h-3 rounded-full bg-white" />
                Record
              </button>
            </Tooltip>

            <div className="w-px h-8 bg-gray-200" />

            {/* Settings */}
            <Tooltip label="Settings">
              <button
                onClick={onOpenSettings}
                className="btn-icon"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
