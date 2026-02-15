import { useState, useEffect, useCallback, useRef } from "react";

interface PresentationModeProps {
  excalidrawAPI: any;
  onExit: () => void;
}

export default function PresentationMode({ excalidrawAPI, onExit }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [frames, setFrames] = useState<any[]>([]);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // ── Collect & sort frames on mount ──
  useEffect(() => {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const frameElements = elements
      .filter((el: any) => el.type === "frame" && !el.isDeleted)
      .sort((a: any, b: any) => {
        // Reading order: top-to-bottom rows, then left-to-right within a row
        const rowThreshold = Math.min(a.height, b.height) * 0.3;
        if (Math.abs(a.y - b.y) < rowThreshold) {
          return a.x - b.x;
        }
        return a.y - b.y;
      });

    setFrames(frameElements);

    if (frameElements.length > 0) {
      scrollToFrame(frameElements[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI]);

  // ── Add presentation-active class to body ──
  useEffect(() => {
    document.body.classList.add("presentation-active");
    return () => {
      document.body.classList.remove("presentation-active");
    };
  }, []);

  // ── Try fullscreen ──
  useEffect(() => {
    const enter = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        /* user may deny */
      }
    };
    enter();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ── Auto-hide controls after inactivity ──
  useEffect(() => {
    const showControls = () => {
      setControlsVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000);
    };

    showControls();
    window.addEventListener("mousemove", showControls);
    window.addEventListener("touchstart", showControls);

    return () => {
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("touchstart", showControls);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // ── Scroll / zoom to a specific frame ──
  const scrollToFrame = useCallback(
    (frame: any) => {
      if (!excalidrawAPI || !frame) return;

      setIsTransitioning(true);
      excalidrawAPI.scrollToContent(frame, {
        fitToViewport: true,
        viewportZoomFactor: 0.95,
        animate: true,
        duration: 300,
      });

      setTimeout(() => setIsTransitioning(false), 350);
    },
    [excalidrawAPI],
  );

  // ── Navigation helpers ──
  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= frames.length || isTransitioning) return;
      setCurrentSlide(index);
      scrollToFrame(frames[index]);
    },
    [frames, scrollToFrame, isTransitioning],
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // ── Keyboard navigation (capture phase to beat Excalidraw) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          nextSlide();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          prevSlide();
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onExit();
          break;
        case "Home":
          e.preventDefault();
          e.stopPropagation();
          goToSlide(0);
          break;
        case "End":
          e.preventDefault();
          e.stopPropagation();
          goToSlide(frames.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [nextSlide, prevSlide, onExit, goToSlide, frames.length]);

  // ── Touch / swipe navigation ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
    },
    [nextSlide, prevSlide],
  );

  // ═══════════════════════════════════════════
  // RENDER — No frames (interactive guide)
  // ═══════════════════════════════════════════
  if (frames.length === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm">
        <div className="text-white max-w-lg w-full mx-4 dialog-enter">
          {/* Card */}
          <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-1">Create Slides to Present</h2>
              <p className="text-white/50 text-sm">Each <strong className="text-white/70">frame</strong> on your canvas = one slide</p>
            </div>

            {/* Steps */}
            <div className="px-6 pb-5 space-y-3">
              {/* Step 1 */}
              <div className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-400 text-xs font-bold">1</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white/90 text-sm font-medium">Open the Frame tool</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px] mx-0.5">F</kbd> on your keyboard, or find it in the toolbar (rectangle dropdown)
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-400 text-xs font-bold">2</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white/90 text-sm font-medium">Draw frames around your content</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Click and drag to create a frame. Each frame = one slide. Name them to add slide titles.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-400 text-xs font-bold">3</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white/90 text-sm font-medium">Click "Present" again</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Navigate with <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px] mx-0.5">&larr;</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px] mx-0.5">&rarr;</kbd> arrows, swipe, or click the edges of the screen
                  </p>
                </div>
              </div>
            </div>

            {/* Visual preview: mini canvas illustration */}
            <div className="mx-6 mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3 justify-center">
                {/* Mini frame illustrations */}
                {["Slide 1", "Slide 2", "Slide 3"].map((label, i) => (
                  <div
                    key={label}
                    className="relative w-20 h-14 rounded-lg border-2 border-dashed flex items-center justify-center transition-all"
                    style={{
                      borderColor: i === 0 ? "rgba(251, 191, 36, 0.5)" : "rgba(255,255,255,0.15)",
                      backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.08)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.4)" : "rgba(255,255,255,0.1)" }} />
                      <div className="w-6 h-1 rounded-full" style={{ backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.25)" : "rgba(255,255,255,0.06)" }} />
                    </div>
                    <span className="absolute -bottom-4 text-[9px] text-white/30 whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-[10px] text-center mt-5">Frames are read left-to-right, top-to-bottom</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={onExit}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-[0.98]"
              >
                Got it — Create Frames
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-medium transition-all border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // RENDER — Presentation view
  // ═══════════════════════════════════════════
  return (
    <div
      className="presentation-overlay fixed inset-0 z-[9999]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Invisible click zones for prev / next ── */}
      <div className="absolute inset-0 flex">
        {/* Left zone → previous */}
        <button
          className="presentation-nav-zone w-[28%] h-full focus:outline-none group"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          disabled={currentSlide === 0}
          style={{ cursor: currentSlide === 0 ? "default" : "w-resize" }}
        >
          <div className="h-full flex items-center pl-8">
            {currentSlide > 0 && (
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </div>
            )}
          </div>
        </button>

        {/* Center zone → no action, pass-through */}
        <div className="w-[44%] h-full pointer-events-none" />

        {/* Right zone → next */}
        <button
          className="presentation-nav-zone w-[28%] h-full focus:outline-none group"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          disabled={currentSlide === frames.length - 1}
          style={{
            cursor:
              currentSlide === frames.length - 1 ? "default" : "e-resize",
          }}
        >
          <div className="h-full flex items-center justify-end pr-8">
            {currentSlide < frames.length - 1 && (
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* ── Frame title (top center) ── */}
      {frames[currentSlide]?.name && (
        <div
          className={`absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl
                      bg-black/30 backdrop-blur-md text-white text-sm font-semibold
                      border border-white/10 shadow-lg pointer-events-none
                      transition-opacity duration-300
                      ${controlsVisible ? "opacity-100" : "opacity-0"}`}
        >
          {frames[currentSlide].name}
        </div>
      )}

      {/* ── Bottom control bar ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-6 py-5
                    bg-gradient-to-t from-black/50 via-black/20 to-transparent
                    transition-opacity duration-300
                    ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Slide counter */}
          <div className="flex items-center gap-2 min-w-[60px]">
            <span className="text-white/90 text-sm font-bold tabular-nums font-mono">
              {currentSlide + 1}
              <span className="text-white/40 mx-0.5">/</span>
              {frames.length}
            </span>
          </div>

          {/* Navigation arrows + progress dots */}
          <div className="flex items-center gap-4">
            {/* Prev arrow */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`p-1.5 rounded-lg transition-all duration-200
                         ${currentSlide === 0
                           ? "text-white/20 cursor-default"
                           : "text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                         }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 max-w-[40vw] overflow-x-auto presentation-dots">
              {frames.map((frame, i) => (
                <button
                  key={frame.id || i}
                  onClick={() => goToSlide(i)}
                  className={`shrink-0 rounded-full transition-all duration-300 ease-out focus:outline-none
                    ${i === currentSlide
                      ? "w-8 h-2 bg-white shadow-lg shadow-white/30"
                      : "w-2 h-2 bg-white/30 hover:bg-white/60"
                    }`}
                  title={`Slide ${i + 1}${frame.name ? `: ${frame.name}` : ""}`}
                />
              ))}
            </div>

            {/* Next arrow */}
            <button
              onClick={nextSlide}
              disabled={currentSlide === frames.length - 1}
              className={`p-1.5 rounded-lg transition-all duration-200
                         ${currentSlide === frames.length - 1
                           ? "text-white/20 cursor-default"
                           : "text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                         }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Exit button */}
          <div className="flex items-center gap-2 min-w-[60px] justify-end">
            <button
              onClick={onExit}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl
                         bg-white/10 hover:bg-white/20
                         text-white/70 hover:text-white text-xs font-semibold
                         transition-all backdrop-blur-sm
                         border border-white/10 hover:border-white/20"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                />
              </svg>
              <span>ESC</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Keyboard hints (shown briefly on first mount) ── */}
      <KeyboardHints />
    </div>
  );
}

/* ── Brief keyboard shortcut hint on entry ── */
function KeyboardHints() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none presentation-hints">
      <div className="flex items-center gap-6 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <kbd className="px-2 py-1 rounded-md bg-white/10 text-white/80 font-mono text-[11px] min-w-[28px] text-center">&larr;</kbd>
          <kbd className="px-2 py-1 rounded-md bg-white/10 text-white/80 font-mono text-[11px] min-w-[28px] text-center">&rarr;</kbd>
          <span className="ml-1">Navigate</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <kbd className="px-2 py-1 rounded-md bg-white/10 text-white/80 font-mono text-[11px]">ESC</kbd>
          <span className="ml-1">Exit</span>
        </div>
      </div>
    </div>
  );
}
