import { useState, useEffect, useCallback } from "react";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ── Section data ── */
type Section = {
  id: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  content: React.ReactNode;
};

/* ── Keyboard shortcut badge ── */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[11px] font-mono font-medium text-gray-600 leading-none">
      {children}
    </kbd>
  );
}

/* ── Step card ── */
function Step({ number, title, description }: { number: number; title: string; description: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

export default function HelpPanel({ open, onClose }: HelpPanelProps) {
  const [activeSection, setActiveSection] = useState("overview");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when panel open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const sections: Section[] = [
    {
      id: "overview",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      label: "Home",
      title: "Welcome to the Studio",
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
            <h4 className="text-sm font-bold text-green-800 mb-1.5">Excalidraw Recording Studio</h4>
            <p className="text-xs text-green-700/80 leading-relaxed">
              A creative workspace that combines Excalidraw's infinite whiteboard with screen recording and
              slide presentation capabilities. Draw, record, and present — all in one place.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">What you can do</h4>
            <div className="grid gap-2.5">
              <FeatureCard
                icon="🎨"
                title="Draw & Collaborate"
                desc="Use Excalidraw's full drawing toolkit — shapes, text, arrows, embeds, and more"
              />
              <FeatureCard
                icon="🎬"
                title="Record Your Canvas"
                desc="Capture a selected area of the canvas as video with optional camera & microphone"
              />
              <FeatureCard
                icon="📊"
                title="Present Slides"
                desc="Create frames on the canvas and present them as a slideshow"
              />
              <FeatureCard
                icon="💬"
                title="Live Captions"
                desc="Speech-to-text captions appear in real-time during recordings"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "recording",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
      label: "Record",
      title: "Recording",
      content: (
        <div className="space-y-5">
          <p className="text-xs text-gray-500 leading-relaxed">
            Record any part of your canvas as a video. Perfect for tutorials, demos, and walkthroughs.
          </p>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">How to record</h4>
            <div className="space-y-3.5">
              <Step
                number={1}
                title="Select recording area"
                description={<>Click the <strong>Area</strong> button in the control bar, then drag on the canvas to define the capture region.</>}
              />
              <Step
                number={2}
                title="Toggle media (optional)"
                description={<>Enable <strong>Cam</strong> to show your webcam overlay, <strong>Mic</strong> for audio, and <strong>CC</strong> for live captions.</>}
              />
              <Step
                number={3}
                title="Start recording"
                description={<>Click the green <strong>Record</strong> button. A red border will indicate the active capture area.</>}
              />
              <Step
                number={4}
                title="Stop & export"
                description={<>Click <strong>Stop</strong> when done. An export dialog lets you preview and download the video.</>}
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Tip:</strong> You can pause and resume recording at any time. The control bar is draggable — reposition it so it's outside your recording area.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "presentation",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
        </svg>
      ),
      label: "Present",
      title: "Presentation Mode",
      content: (
        <div className="space-y-5">
          <p className="text-xs text-gray-500 leading-relaxed">
            Turn your canvas into a slide deck using Excalidraw frames. Each frame becomes one slide.
          </p>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">How to present</h4>
            <div className="space-y-3.5">
              <Step
                number={1}
                title="Create frames"
                description={<>Use the <strong>Frame tool</strong> (press <Kbd>F</Kbd>) to draw frames on your canvas. Each frame = one slide.</>}
              />
              <Step
                number={2}
                title="Add content to frames"
                description="Draw, write, or add images inside each frame. Content outside frames won't appear in slides."
              />
              <Step
                number={3}
                title="Click Present"
                description={<>Click the <strong>Present</strong> button (screen icon) in the control bar. The app enters fullscreen and shows your first slide.</>}
              />
              <Step
                number={4}
                title="Navigate slides"
                description={<>Use <Kbd>&larr;</Kbd> <Kbd>&rarr;</Kbd> arrow keys, click screen edges, or swipe on touch devices. Press <Kbd>Esc</Kbd> to exit.</>}
              />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide order</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Slides are automatically ordered in <strong>reading direction</strong> — top-to-bottom, then left-to-right. Arrange your frames on the canvas accordingly.
            </p>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Tip:</strong> Name your frames (double-click the frame title) to see slide titles during the presentation.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "shortcuts",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
      label: "Keys",
      title: "Keyboard Shortcuts",
      content: (
        <div className="space-y-5">
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Presentation mode</h4>
            <div className="space-y-0.5">
              <ShortcutRow keys={["→"]} label="Next slide" />
              <ShortcutRow keys={["←"]} label="Previous slide" />
              <ShortcutRow keys={["Space"]} label="Next slide" />
              <ShortcutRow keys={["Home"]} label="First slide" />
              <ShortcutRow keys={["End"]} label="Last slide" />
              <ShortcutRow keys={["Esc"]} label="Exit presentation" />
            </div>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Excalidraw essentials</h4>
            <div className="space-y-0.5">
              <ShortcutRow keys={["F"]} label="Frame tool (create slides)" />
              <ShortcutRow keys={["V"]} label="Selection tool" />
              <ShortcutRow keys={["R"]} label="Rectangle" />
              <ShortcutRow keys={["D"]} label="Diamond" />
              <ShortcutRow keys={["O"]} label="Ellipse" />
              <ShortcutRow keys={["A"]} label="Arrow" />
              <ShortcutRow keys={["L"]} label="Line" />
              <ShortcutRow keys={["T"]} label="Text" />
              <ShortcutRow keys={["Ctrl", "Z"]} label="Undo" />
              <ShortcutRow keys={["Ctrl", "D"]} label="Duplicate" />
              <ShortcutRow keys={["Ctrl", "G"]} label="Group elements" />
              <ShortcutRow keys={["Alt", "scroll"]} label="Zoom in/out" />
              <ShortcutRow keys={["Space", "drag"]} label="Pan canvas" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tips",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      ),
      label: "Tips",
      title: "Tips & Tricks",
      content: (
        <div className="space-y-3">
          <TipCard
            emoji="🖱️"
            title="Draggable control bar"
            desc="Grab the dotted handle on the control bar to drag it anywhere on screen. Position it outside your recording area."
          />
          <TipCard
            emoji="🎯"
            title="Cursor effects"
            desc="In Settings, you can enable cursor highlighting or a spotlight effect that appears in your recordings."
          />
          <TipCard
            emoji="📐"
            title="Frame naming"
            desc="Double-click a frame's title to rename it. Named frames show their title during presentations."
          />
          <TipCard
            emoji="🎨"
            title="Custom captions"
            desc="Customize caption colors, font size, corner radius and auto-clear delay in Settings."
          />
          <TipCard
            emoji="📱"
            title="Touch support"
            desc="Presentation mode supports touch swipe gestures — swipe left/right to navigate between slides."
          />
          <TipCard
            emoji="🔄"
            title="Combine features"
            desc="Record a presentation! Select your frame area, start recording, then use keyboard arrows to navigate slides while recording."
          />
          <TipCard
            emoji="💾"
            title="Save your work"
            desc="Use the Excalidraw menu to save your canvas to a file. You can load it back later to continue working."
          />
        </div>
      ),
    },
  ];

  if (!open) return null;

  const activeContent = sections.find((s) => s.id === activeSection);

  return (
    <div
      className="fixed inset-0 z-[9998] backdrop-enter"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Panel */}
      <div className="absolute top-0 right-0 h-full w-full max-w-[460px] help-panel-enter">
        <div className="h-full flex bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/10 border-l border-gray-200/60">

          {/* ════════════════════════════════════════
              LEFT — Icon sidebar navigation
              ════════════════════════════════════════ */}
          <div className="flex flex-col items-center w-[68px] shrink-0 border-r border-gray-100 bg-gray-50/60 py-3 gap-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    relative flex flex-col items-center justify-center gap-0.5
                    w-[56px] h-[52px] rounded-xl text-center
                    transition-all duration-200 ease-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50
                    ${isActive
                      ? "bg-white text-green-700 shadow-sm border border-green-100"
                      : "text-gray-400 hover:text-gray-600 hover:bg-white/80"
                    }
                  `}
                  title={section.title}
                >
                  <span className={isActive ? "text-green-600" : ""}>{section.icon}</span>
                  <span className={`text-[9px] font-semibold leading-none ${isActive ? "text-green-600" : ""}`}>
                    {section.label}
                  </span>
                </button>
              );
            })}

            {/* spacer */}
            <div className="flex-1" />

            {/* Close button at bottom of sidebar */}
            <button
              onClick={onClose}
              className="flex flex-col items-center justify-center gap-0.5
                         w-[56px] h-[52px] rounded-xl
                         text-gray-300 hover:text-gray-500 hover:bg-white/80
                         transition-all duration-200"
              title="Close (Esc)"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              <span className="text-[9px] font-semibold leading-none">Close</span>
            </button>
          </div>

          {/* ════════════════════════════════════════
              RIGHT — Content area
              ════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-green-500/20">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 truncate">{activeContent?.title}</h2>
                <p className="text-[10px] text-gray-400">Help & Guide</p>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              {activeContent?.content}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-300">
                <Kbd>Esc</Kbd> <span className="ml-1">to close</span>
              </span>
              <a
                href="https://github.com/encoreshao"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-gray-300 hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                RanBOT Labs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
      <span className="text-lg leading-none mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Shortcut row ── */
function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300 text-[10px]">+</span>}
            <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[11px] font-mono font-medium text-gray-500 leading-none">
              {key}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Tip card ── */
function TipCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{emoji}</span>
        <p className="text-sm font-medium text-gray-800">{title}</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed pl-6">{desc}</p>
    </div>
  );
}
