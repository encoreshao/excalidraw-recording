import { useRef, useEffect, useState, useCallback } from "react";

interface CameraPreviewProps {
  stream: MediaStream | null;
  visible: boolean;
}

export default function CameraPreview({ stream, visible }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Set initial position to bottom-right
  useEffect(() => {
    if (visible && !initialized) {
      setPosition({
        x: window.innerWidth - 160 - 24,
        y: window.innerHeight - 160 - 100,
      });
      setInitialized(true);
    }
  }, [visible, initialized]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - 160));
      const newY = Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - 160));
      setPosition({ x: newX, y: newY });
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
        {/* Glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 opacity-50 blur-sm group-hover:opacity-70 transition-opacity" />

        {/* Video container */}
        <div className="relative w-36 h-36 rounded-full overflow-hidden border-[3px] border-white shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

        {/* Drag hint */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] text-gray-500 font-mono shadow-sm">
          CAMERA
        </div>
      </div>
    </div>
  );
}
