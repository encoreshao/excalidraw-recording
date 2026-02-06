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
          className="px-5 py-3 backdrop-blur-md"
          style={{
            background: bgColor,
            borderRadius: `${cornerRadius}px`,
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
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
        {/* Drag hint */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-900/80 backdrop-blur-sm border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-0.5">
          <svg className="w-2.5 h-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12" />
          </svg>
          <span className="text-[9px] text-white/60 font-medium tracking-wide">Drag to move</span>
        </div>
      </div>
    </div>
  );
}
