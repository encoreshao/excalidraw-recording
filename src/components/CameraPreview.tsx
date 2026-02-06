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

  // Keep a stable ref to the current stream so the callback ref can read it
  const streamRef = useRef(stream);
  streamRef.current = stream;

  // Callback ref: attaches srcObject every time the <video> element mounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  // Also re-attach when stream itself changes while the element is already mounted
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
        {/* Soft glow ring */}
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-green-400/40 to-emerald-500/30 blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Video container */}
        <div className="relative w-36 h-36 rounded-full overflow-hidden border-[3px] border-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <video
            ref={combinedVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

        {/* Drag hint */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-100 text-[9px] text-gray-400 font-mono shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          CAMERA
        </div>
      </div>
    </div>
  );
}
