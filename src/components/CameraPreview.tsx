import { useRef, useEffect, useState, useCallback } from "react";

interface CameraPreviewProps {
  stream: MediaStream | null;
  visible: boolean;
}

export default function CameraPreview({ stream, visible }: CameraPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const streamRef = useRef(stream);
  streamRef.current = stream;

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  const videoNodeRef = useRef<HTMLVideoElement | null>(null);
  const combinedVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoNodeRef.current = node;
      videoCallbackRef(node);
    },
    [videoCallbackRef],
  );

  useEffect(() => {
    if (videoNodeRef.current && stream) {
      videoNodeRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (visible && !initialized) {
      setPosition({
        x: window.innerWidth - 160 - 24,
        y: window.innerHeight - 160 - 100,
      });
      setInitialized(true);
    }
  }, [visible, initialized]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: Math.max(0, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - 160)),
        y: Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - 160)),
      });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  if (!visible || !stream) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 cursor-grab active:cursor-grabbing select-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative group">
        {/* Animated gradient ring */}
        <div
          className="absolute -inset-[3px] rounded-full opacity-60 group-hover:opacity-90 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, #22c55e, #10b981, #059669, #22c55e)",
            backgroundSize: "300% 300%",
            animation: "gradientShift 4s ease infinite",
          }}
        />

        {/* White border ring */}
        <div className="absolute -inset-[1px] rounded-full bg-white" />

        {/* Video container */}
        <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
          <video
            ref={combinedVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

        {/* Drag hint label */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase">Live</span>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
