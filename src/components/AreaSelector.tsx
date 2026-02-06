import { useState, useCallback, useRef, useEffect } from "react";
import type { SelectionArea } from "../types";

interface AspectPreset {
  label: string;
  sublabel: string;
  ratio: [number, number] | null; // null = custom (drag)
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: "16:9", sublabel: "YouTube", ratio: [16, 9] },
  { label: "4:3", sublabel: "Classic", ratio: [4, 3] },
  { label: "3:4", sublabel: "RedNote", ratio: [3, 4] },
  { label: "9:16", sublabel: "TikTok", ratio: [9, 16] },
  { label: "1:1", sublabel: "Square", ratio: [1, 1] },
  { label: "Free", sublabel: "Custom", ratio: null },
];

interface AreaSelectorProps {
  active: boolean;
  selectionArea: SelectionArea | null;
  onSelectionChange: (area: SelectionArea | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

type DragMode =
  | "create"
  | "move"
  | "resize-nw"
  | "resize-ne"
  | "resize-sw"
  | "resize-se";

export default function AreaSelector({
  active,
  selectionArea,
  onSelectionChange,
  onConfirm,
  onCancel,
  containerRef,
}: AreaSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>("create");
  const [showPresets, setShowPresets] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragAreaStart = useRef<SelectionArea | null>(null);

  // Reset preset panel when area selector becomes active
  useEffect(() => {
    if (active) {
      setShowPresets(true);
    }
  }, [active]);

  // Calculate a centered area for a given aspect ratio
  const applyPreset = useCallback(
    (ratio: [number, number]) => {
      const container = containerRef.current;
      if (!container) return;

      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      const padding = 80;
      const availW = cw - padding * 2;
      const availH = ch - padding * 2;
      const [rw, rh] = ratio;

      let width: number;
      let height: number;
      if (availW / availH > rw / rh) {
        height = availH;
        width = (height * rw) / rh;
      } else {
        width = availW;
        height = (width * rh) / rw;
      }

      const x = (cw - width) / 2;
      const y = (ch - height) / 2;

      onSelectionChange({ x, y, width, height });
      setShowPresets(false);
    },
    [containerRef, onSelectionChange],
  );

  const handlePresetClick = useCallback(
    (preset: AspectPreset, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (preset.ratio) {
        applyPreset(preset.ratio);
      } else {
        setShowPresets(false);
      }
    },
    [applyPreset],
  );

  const getRelativePosition = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [containerRef],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (showPresets) return;
      if (selectionArea && selectionArea.width > 10 && selectionArea.height > 10)
        return;
      e.preventDefault();
      e.stopPropagation();

      const pos = getRelativePosition(e);
      dragStart.current = pos;
      setIsDragging(true);
      setDragMode("create");
      onSelectionChange({ x: pos.x, y: pos.y, width: 0, height: 0 });
    },
    [getRelativePosition, selectionArea, onSelectionChange, showPresets],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getRelativePosition(e);
      dragStart.current = pos;
      dragAreaStart.current = selectionArea ? { ...selectionArea } : null;
      setDragMode(mode);
      setIsDragging(true);
    },
    [getRelativePosition, selectionArea],
  );

  const handleMoveStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getRelativePosition(e);
      dragStart.current = pos;
      dragAreaStart.current = selectionArea ? { ...selectionArea } : null;
      setDragMode("move");
      setIsDragging(true);
    },
    [getRelativePosition, selectionArea],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getRelativePosition(e);
      const container = containerRef.current;
      if (!container) return;

      const bounds = {
        width: container.offsetWidth,
        height: container.offsetHeight,
      };

      if (dragMode === "create") {
        const x = Math.max(0, Math.min(dragStart.current.x, pos.x));
        const y = Math.max(0, Math.min(dragStart.current.y, pos.y));
        const width = Math.min(
          Math.abs(pos.x - dragStart.current.x),
          bounds.width - x,
        );
        const height = Math.min(
          Math.abs(pos.y - dragStart.current.y),
          bounds.height - y,
        );
        onSelectionChange({ x, y, width, height });
      } else if (dragMode === "move" && dragAreaStart.current) {
        const dx = pos.x - dragStart.current.x;
        const dy = pos.y - dragStart.current.y;
        const area = dragAreaStart.current;
        const x = Math.max(
          0,
          Math.min(area.x + dx, bounds.width - area.width),
        );
        const y = Math.max(
          0,
          Math.min(area.y + dy, bounds.height - area.height),
        );
        onSelectionChange({ x, y, width: area.width, height: area.height });
      } else if (dragAreaStart.current) {
        const area = dragAreaStart.current;
        const dx = pos.x - dragStart.current.x;
        const dy = pos.y - dragStart.current.y;
        const newArea = { ...area };
        const minSize = 100;

        switch (dragMode) {
          case "resize-nw":
            newArea.x = Math.max(
              0,
              Math.min(area.x + dx, area.x + area.width - minSize),
            );
            newArea.y = Math.max(
              0,
              Math.min(area.y + dy, area.y + area.height - minSize),
            );
            newArea.width = area.width - (newArea.x - area.x);
            newArea.height = area.height - (newArea.y - area.y);
            break;
          case "resize-ne":
            newArea.y = Math.max(
              0,
              Math.min(area.y + dy, area.y + area.height - minSize),
            );
            newArea.width = Math.max(
              minSize,
              Math.min(area.width + dx, bounds.width - area.x),
            );
            newArea.height = area.height - (newArea.y - area.y);
            break;
          case "resize-sw":
            newArea.x = Math.max(
              0,
              Math.min(area.x + dx, area.x + area.width - minSize),
            );
            newArea.width = area.width - (newArea.x - area.x);
            newArea.height = Math.max(
              minSize,
              Math.min(area.height + dy, bounds.height - area.y),
            );
            break;
          case "resize-se":
            newArea.width = Math.max(
              minSize,
              Math.min(area.width + dx, bounds.width - area.x),
            );
            newArea.height = Math.max(
              minSize,
              Math.min(area.height + dy, bounds.height - area.y),
            );
            break;
        }
        onSelectionChange(newArea);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    dragMode,
    getRelativePosition,
    onSelectionChange,
    containerRef,
  ]);

  if (!active) return null;

  const hasSelection =
    selectionArea && selectionArea.width > 10 && selectionArea.height > 10;

  return (
    <div
      className="absolute inset-0 z-[100] select-none"
      style={{ cursor: hasSelection && !isDragging ? "default" : "crosshair" }}
      onMouseDown={handleMouseDown}
    >
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="selection-mask">
            <rect width="100%" height="100%" fill="white" />
            {hasSelection && selectionArea && (
              <rect
                x={selectionArea.x}
                y={selectionArea.y}
                width={selectionArea.width}
                height={selectionArea.height}
                fill="black"
                rx="4"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.45)"
          mask="url(#selection-mask)"
        />
      </svg>

      {/* Selection rectangle border & handles */}
      {hasSelection && selectionArea && (
        <>
          {/* Selection border + move area */}
          <div
            className="absolute border-2 border-green-500 rounded-[4px]"
            style={{
              left: selectionArea.x,
              top: selectionArea.y,
              width: selectionArea.width,
              height: selectionArea.height,
            }}
          >
            <div
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMoveStart}
            />
            {/* Dimensions label */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-mono whitespace-nowrap">
              {Math.round(selectionArea.width)} x{" "}
              {Math.round(selectionArea.height)}
            </div>
          </div>

          {/* Corner resize handles */}
          {(["nw", "ne", "sw", "se"] as const).map((corner) => {
            const isLeft = corner.includes("w");
            const isTop = corner.includes("n");
            return (
              <div
                key={corner}
                className="absolute w-3.5 h-3.5 bg-white border-2 border-green-500 rounded-full shadow-md z-10"
                style={{
                  left:
                    (isLeft
                      ? selectionArea.x
                      : selectionArea.x + selectionArea.width) - 7,
                  top:
                    (isTop
                      ? selectionArea.y
                      : selectionArea.y + selectionArea.height) - 7,
                  cursor: `${corner}-resize`,
                }}
                onMouseDown={(e) =>
                  handleResizeStart(e, `resize-${corner}` as DragMode)
                }
              />
            );
          })}

          {/* Action buttons */}
          {!isDragging && (
            <div
              className="absolute z-20 flex gap-2"
              style={{
                top: selectionArea.y + selectionArea.height + 16,
                left: selectionArea.x + selectionArea.width / 2,
                transform: "translateX(-50%)",
              }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onConfirm();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-[13px] font-semibold text-white
                           shadow-lg shadow-green-600/25 hover:bg-green-500 active:scale-[0.97] transition-all duration-150 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Confirm
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm px-4 py-2 text-[13px] font-medium text-gray-600
                           shadow-sm hover:bg-white hover:text-gray-900 active:scale-[0.97] transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {/* Aspect ratio presets */}
      {!hasSelection && !isDragging && showPresets && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 px-7 py-6 max-w-md w-full dialog-enter">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
              </svg>
              <h3 className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Choose Aspect Ratio
              </h3>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={(e) => handlePresetClick(preset, e)}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-150 bg-gray-50/50 py-4 px-3
                             transition-all duration-150 ease-out cursor-pointer
                             hover:border-green-300 hover:bg-green-50/50 hover:shadow-sm
                             active:scale-[0.97]"
                >
                  {/* Visual ratio preview */}
                  {preset.ratio ? (
                    <RatioPreview ratio={preset.ratio} />
                  ) : (
                    <div className="w-7 h-7 rounded border-2 border-dashed border-gray-300 group-hover:border-green-400 transition-colors flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-[13px] font-semibold text-gray-700 group-hover:text-green-700 transition-colors block leading-tight">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-gray-400 group-hover:text-green-500 transition-colors">
                      {preset.sublabel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                Pick a ratio or draw freely
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel();
                }}
                className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom drag instructions */}
      {!hasSelection && !isDragging && !showPresets && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 px-8 py-6 text-center dialog-enter">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-[15px] mb-1">Draw Your Area</p>
            <p className="text-gray-400 text-[13px]">Click and drag to select the recording region</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Visual Ratio Preview Thumbnail ── */
function RatioPreview({ ratio }: { ratio: [number, number] }) {
  const [w, h] = ratio;
  const maxDim = 28;
  let displayW: number;
  let displayH: number;
  if (w > h) {
    displayW = maxDim;
    displayH = Math.round((maxDim * h) / w);
  } else {
    displayH = maxDim;
    displayW = Math.round((maxDim * w) / h);
  }
  return (
    <div
      className="rounded border-2 border-gray-300 group-hover:border-green-400 bg-white group-hover:bg-green-50 transition-colors"
      style={{ width: displayW, height: displayH, minWidth: 12, minHeight: 12 }}
    />
  );
}
