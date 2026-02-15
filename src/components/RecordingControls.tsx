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

/* ── Tooltip ── */
function Tooltip({ label, children, position = "top" }: { label: string; children: ReactNode; position?: "top" | "bottom" }) {
  const pos = position === "top"
    ? "bottom-full mb-2.5 left-1/2 -translate-x-1/2"
    : "top-full mt-2.5 left-1/2 -translate-x-1/2";
  return (
    <div className="relative group/tip">
      {children}
      <div
        className={`absolute ${pos} flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/90 backdrop-blur-sm text-white text-[11px] font-medium whitespace-nowrap
                     shadow-lg pointer-events-none opacity-0 group-hover/tip:opacity-100
                     transition-all duration-150 ease-out translate-y-1 group-hover/tip:translate-y-0 z-10`}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="w-px h-7 bg-gradient-to-b from-transparent via-gray-200 to-transparent mx-0.5 shrink-0" />;
}

/* ── Media Toggle Pill — compact button with label and active state ── */
function MediaToggle({
  active,
  onClick,
  icon,
  activeIcon,
  label,
  error,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  activeIcon: ReactNode;
  label: string;
  error?: string | null;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ease-out cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:ring-offset-1
          ${active
            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30"
            : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80 hover:text-gray-700"
          }`}
      >
        <span className="w-4 h-4 shrink-0">{active ? activeIcon : icon}</span>
        <span className="hidden sm:inline leading-none">{label}</span>
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          {error}
        </div>
      )}
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

  useEffect(() => {
    if (!position && containerRef.current) {
      const w = containerRef.current.offsetWidth;
      setPosition({
        x: (window.innerWidth - w) / 2,
        y: window.innerHeight - 80,
      });
    }
  }, [position]);

  const prevWindowSize = useRef({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !position) return;
      const barW = containerRef.current.offsetWidth;
      const barH = containerRef.current.offsetHeight;
      const prevW = prevWindowSize.current.w;
      const prevH = prevWindowSize.current.h;
      const newW = window.innerWidth;
      const newH = window.innerHeight;

      const scaledX = prevW > 0 ? (position.x / prevW) * newW : position.x;
      const scaledY = prevH > 0 ? (position.y / prevH) * newH : position.y;

      const clampedX = Math.max(0, Math.min(scaledX, newW - barW));
      const clampedY = Math.max(0, Math.min(scaledY, newH - barH));

      prevWindowSize.current = { w: newW, h: newH };

      if (clampedX !== position.x || clampedY !== position.y) {
        const newPos = { x: clampedX, y: clampedY };
        setPosition(newPos);
        try { localStorage.setItem(POSITION_KEY, JSON.stringify(newPos)); } catch { /* ignore */ }
      }
    };

    if (containerRef.current && position) {
      const barW = containerRef.current.offsetWidth;
      const barH = containerRef.current.offsetHeight;
      const maxX = window.innerWidth - barW;
      const maxY = window.innerHeight - barH;
      const clampedX = Math.max(0, Math.min(position.x, maxX));
      const clampedY = Math.max(0, Math.min(position.y, maxY));
      if (clampedX !== position.x || clampedY !== position.y) {
        setPosition({ x: clampedX, y: clampedY });
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const iconCls = "w-4 h-4";

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
        className="glass-panel flex items-center cursor-grab active:cursor-grabbing transition-all duration-300 ease-out"
        onMouseDown={handleDragStart}
      >
        {/* ── RECORDING MODE ── */}
        {isRecording ? (
          <div className="flex items-center gap-1.5 px-3 py-2">
            <DragHandle />

            {/* Rec indicator + Timer */}
            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-red-50/80 border border-red-100">
              <div className="relative flex items-center justify-center w-3 h-3">
                <div className="absolute inset-0 rounded-full bg-red-500/20 recording-pulse" />
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <span className="font-mono text-sm text-red-600 font-bold min-w-[48px] tabular-nums tracking-tight leading-none">
                {formatDuration(duration)}
              </span>
            </div>

            <Divider />

            {/* Pause / Resume */}
            <Tooltip label={isPaused ? "Resume recording" : "Pause recording"}>
              <button
                onClick={isPaused ? onResumeRecording : onPauseRecording}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ease-out cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-amber-400/40
                  ${isPaused
                    ? "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/25 hover:shadow-lg"
                    : "bg-white/90 border border-gray-200/80 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300"
                  }`}
              >
                {isPaused ? (
                  <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                ) : (
                  <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                  </svg>
                )}
              </button>
            </Tooltip>

            {/* Stop */}
            <button
              onClick={onStopRecording}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 px-4 py-2 text-[13px] font-bold text-white
                         shadow-md shadow-red-600/25 transition-all duration-150 ease-out
                         hover:from-red-400 hover:to-red-500 hover:shadow-lg hover:shadow-red-500/30
                         active:scale-[0.97] cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-red-400/50"
            >
              <div className="w-2.5 h-2.5 rounded-[3px] bg-white/90" />
              <span>Stop</span>
            </button>
          </div>
        ) : (
          /* ── SETUP MODE ── */
          <div className="flex items-center gap-2 px-3 py-2">
            <DragHandle />

            {/* ── Media Toggles Group ── */}
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-gray-50/60">
              <MediaToggle
                active={cameraEnabled}
                onClick={onToggleCamera}
                label="Cam"
                error={cameraError}
                activeIcon={
                  <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                }
                icon={
                  <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-.409-7.232-7.232M8.25 5.25 4.21 9.29" />
                  </svg>
                }
              />

              <MediaToggle
                active={micEnabled}
                onClick={onToggleMic}
                label="Mic"
                error={micError}
                activeIcon={
                  <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                }
                icon={
                  <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  </svg>
                }
              />

              {captionsSupported && (
                <MediaToggle
                  active={captionsEnabled}
                  onClick={onToggleCaptions}
                  label="CC"
                  activeIcon={
                    <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  }
                  icon={
                    <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  }
                />
              )}
            </div>

            <Divider />

            {/* ── Area Selection ── */}
            <Tooltip label={hasSelection ? "Change recording area" : "Select recording area"}>
              <button
                onClick={onSelectArea}
                className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all duration-200 ease-out cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-green-400/40
                  ${hasSelection
                    ? "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100/80"
                    : "bg-white/90 border border-dashed border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/30"
                  }`}
              >
                <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
                </svg>
                <span className="hidden sm:inline leading-none">{hasSelection ? "Area" : "Area"}</span>
                {hasSelection && (
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            </Tooltip>

            <Divider />

            {/* ── Record Button ── */}
            {hasSelection ? (
              <button
                onClick={onStartRecording}
                className="inline-flex items-center gap-2 rounded-xl
                           bg-gradient-to-b from-green-500 to-green-600
                           pl-3.5 pr-5 py-2.5 text-[13px] font-bold text-white tracking-wide
                           shadow-lg shadow-green-600/25 transition-all duration-200 ease-out
                           hover:from-green-400 hover:to-green-500 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-px
                           active:translate-y-0 active:scale-[0.97]
                           cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-1"
              >
                <span className="relative flex items-center justify-center w-3.5 h-3.5">
                  <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-white" />
                </span>
                Record
              </button>
            ) : (
              <Tooltip label="Select a recording area first">
                <button
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl
                             bg-gray-200 px-5 py-2.5 text-[13px] font-bold text-gray-400 tracking-wide
                             cursor-not-allowed"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  Record
                </button>
              </Tooltip>
            )}

            <Divider />

            {/* ── Settings ── */}
            <Tooltip label="Settings">
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl
                           bg-white/80 border border-gray-200/80 text-gray-400
                           hover:bg-white hover:text-gray-700 hover:border-gray-300 hover:shadow-sm
                           transition-all duration-200 ease-out cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-gray-300/50
                           active:scale-[0.96]"
              >
                <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Drag Handle ── */
function DragHandle() {
  return (
    <div className="flex flex-col items-center gap-[3px] px-1.5 py-1 opacity-20 hover:opacity-40 transition-opacity cursor-grab shrink-0" title="Drag to reposition">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-[3px]">
          <div className="w-[3px] h-[3px] rounded-full bg-gray-500" />
          <div className="w-[3px] h-[3px] rounded-full bg-gray-500" />
        </div>
      ))}
    </div>
  );
}
