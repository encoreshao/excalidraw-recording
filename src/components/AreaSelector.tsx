import { useState, useCallback, useRef, useEffect } from "react";
import type { SelectionArea } from "../types";

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
  const dragStart = useRef({ x: 0, y: 0 });
  const dragAreaStart = useRef<SelectionArea | null>(null);

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
      // Don't start a new selection if we already have one
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
    [getRelativePosition, selectionArea, onSelectionChange],
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
      {/* Dark overlay with cutout - pointer-events-none so clicks pass through to buttons */}
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
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#selection-mask)"
        />
      </svg>

      {/* Selection rectangle border & handles */}
      {hasSelection && selectionArea && (
        <>
          {/* Selection border + move area */}
          <div
            className="absolute border-2 border-accent rounded-[4px]"
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
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-accent text-white text-xs font-mono whitespace-nowrap">
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
                className="absolute w-4 h-4 bg-white border-2 border-accent rounded-full shadow-md z-10"
                style={{
                  left:
                    (isLeft
                      ? selectionArea.x
                      : selectionArea.x + selectionArea.width) - 8,
                  top:
                    (isTop
                      ? selectionArea.y
                      : selectionArea.y + selectionArea.height) - 8,
                  cursor: `${corner}-resize`,
                }}
                onMouseDown={(e) =>
                  handleResizeStart(e, `resize-${corner}` as DragMode)
                }
              />
            );
          })}

          {/* Action buttons - positioned relative to selection bottom */}
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
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover active:scale-[0.97] transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                Confirm Area
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      {!hasSelection && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl border border-gray-200 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl px-8 py-6 text-center">
            <p className="text-gray-900 font-semibold text-lg mb-1">
              Select Recording Area
            </p>
            <p className="text-gray-500 text-sm">
              Click and drag to select the area you want to record
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
