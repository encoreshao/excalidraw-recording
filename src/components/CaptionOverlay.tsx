import { useRef, useState, useCallback, useEffect } from "react";

interface CaptionOverlayProps {
  text: string;
  visible: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  bgColor?: string;
  textColor?: string;
  cornerRadius?: number;
  fontSize?: "small" | "medium" | "large";
}

const FONT_SIZE_MAP = { small: "text-sm", medium: "text-base", large: "text-lg" };

export default function CaptionOverlay({
  text,
  visible,
  onPositionChange,
  bgColor = "rgba(0, 0, 0, 0.75)",
  textColor = "#ffffff",
  cornerRadius = 12,
  fontSize = "medium",
}: CaptionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (visible && !initialized) {
      const x = Math.max(0, (window.innerWidth - 480) / 2);
      const y = window.innerHeight - 140;
      setPosition({ x, y });
      onPositionChange?.({ x, y });
      setInitialized(true);
    }
  }, [visible, initialized, onPositionChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const boxWidth = containerRef.current?.offsetWidth || 480;
        const boxHeight = containerRef.current?.offsetHeight || 60;
        const newX = Math.max(0, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - boxWidth));
        const newY = Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - boxHeight));
        setPosition({ x: newX, y: newY });
        onPositionChange?.({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [onPositionChange],
  );

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9998] cursor-grab active:cursor-grabbing select-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative group max-w-[480px] min-w-[200px]">
        <div
          className="px-4 py-3 shadow-lg backdrop-blur-sm"
          style={{
            background: bgColor,
            borderRadius: `${cornerRadius}px`,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p
            className={`${FONT_SIZE_MAP[fontSize]} leading-relaxed font-medium text-center break-words`}
            style={{ color: textColor }}
          >
            {text || (
              <span style={{ color: textColor, opacity: 0.4 }} className="italic text-sm">
                Listening... speak to see captions
              </span>
            )}
          </p>
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-[9px] text-white/60 font-mono shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          CAPTIONS — drag to move
        </div>
      </div>
    </div>
  );
}
