import { useCallback } from "react";
import type { AppSettings } from "../hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onReset: () => void;
}

const CAPTION_BG_PRESETS = [
  { label: "Dark", value: "rgba(0, 0, 0, 0.75)" },
  { label: "Light", value: "rgba(255, 255, 255, 0.85)" },
  { label: "Blue", value: "rgba(37, 99, 235, 0.8)" },
  { label: "Green", value: "rgba(22, 163, 74, 0.8)" },
  { label: "Red", value: "rgba(220, 38, 38, 0.8)" },
  { label: "Purple", value: "rgba(147, 51, 234, 0.8)" },
];

const CURSOR_COLOR_PRESETS = [
  { label: "Yellow", value: "#FBBF24" },
  { label: "Red", value: "#EF4444" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#22C55E" },
  { label: "Pink", value: "#EC4899" },
  { label: "White", value: "#FFFFFF" },
];

export default function SettingsDialog({
  open,
  onClose,
  settings,
  onUpdate,
  onReset,
}: SettingsDialogProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Preferences are saved automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* ── Caption Settings ── */}
          <Section title="Captions">
            {/* Background color */}
            <SettingRow label="Background Color">
              <div className="flex gap-2 flex-wrap">
                {CAPTION_BG_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => onUpdate("captionBgColor", p.value)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      settings.captionBgColor === p.value
                        ? "border-accent ring-2 ring-accent/30 scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ background: p.value }}
                    title={p.label}
                  />
                ))}
              </div>
            </SettingRow>

            {/* Text color */}
            <SettingRow label="Text Color">
              <div className="flex gap-2">
                {["#ffffff", "#000000", "#FBBF24", "#22C55E"].map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdate("captionTextColor", c)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      settings.captionTextColor === c
                        ? "border-accent ring-2 ring-accent/30 scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </SettingRow>

            {/* Corner radius */}
            <SettingRow label="Corner Radius">
              <div className="flex items-center gap-3 w-full">
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={2}
                  value={settings.captionCornerRadius}
                  onChange={(e) => onUpdate("captionCornerRadius", Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="text-xs text-gray-500 font-mono w-8 text-right">
                  {settings.captionCornerRadius}px
                </span>
              </div>
            </SettingRow>

            {/* Font size */}
            <SettingRow label="Font Size">
              <SegmentedControl
                options={[
                  { label: "S", value: "small" },
                  { label: "M", value: "medium" },
                  { label: "L", value: "large" },
                ]}
                value={settings.captionFontSize}
                onChange={(v) => onUpdate("captionFontSize", v as AppSettings["captionFontSize"])}
              />
            </SettingRow>

            {/* Auto-clear delay */}
            <SettingRow label="Auto-Clear Delay">
              <div className="flex items-center gap-3 w-full">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={settings.captionClearDelay}
                  onChange={(e) => onUpdate("captionClearDelay", Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="text-xs text-gray-500 font-mono w-8 text-right">
                  {settings.captionClearDelay}s
                </span>
              </div>
            </SettingRow>
          </Section>

          {/* ── Camera Settings ── */}
          <Section title="Camera">
            <SettingRow label="Show in Recording">
              <Toggle
                checked={settings.showCameraInRecording}
                onChange={(v) => onUpdate("showCameraInRecording", v)}
              />
            </SettingRow>

            <SettingRow label="Bubble Size">
              <SegmentedControl
                options={[
                  { label: "S", value: "small" },
                  { label: "M", value: "medium" },
                  { label: "L", value: "large" },
                ]}
                value={settings.cameraBubbleSize}
                onChange={(v) => onUpdate("cameraBubbleSize", v as AppSettings["cameraBubbleSize"])}
              />
            </SettingRow>
          </Section>

          {/* ── Recording Settings ── */}
          <Section title="Recording">
            <SettingRow label="Canvas Padding">
              <div className="flex items-center gap-3 w-full">
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={settings.canvasPadding}
                  onChange={(e) => onUpdate("canvasPadding", Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="text-xs text-gray-500 font-mono w-8 text-right">
                  {settings.canvasPadding}px
                </span>
              </div>
            </SettingRow>

            <SettingRow label="Frame Rate">
              <SegmentedControl
                options={[
                  { label: "15", value: "15" },
                  { label: "24", value: "24" },
                  { label: "30", value: "30" },
                  { label: "60", value: "60" },
                ]}
                value={String(settings.recordingFps)}
                onChange={(v) => onUpdate("recordingFps", Number(v) as AppSettings["recordingFps"])}
              />
            </SettingRow>

            <SettingRow label="Video Quality">
              <SegmentedControl
                options={[
                  { label: "Low", value: "2" },
                  { label: "Medium", value: "5" },
                  { label: "High", value: "8" },
                  { label: "Max", value: "12" },
                ]}
                value={String(settings.videoBitrate)}
                onChange={(v) => onUpdate("videoBitrate", Number(v))}
              />
            </SettingRow>
          </Section>

          {/* ── Cursor Effect ── */}
          <Section title="Mouse Cursor">
            <SettingRow label="Effect">
              <SegmentedControl
                options={[
                  { label: "None", value: "none" },
                  { label: "Highlight", value: "highlight" },
                  { label: "Spotlight", value: "spotlight" },
                ]}
                value={settings.cursorEffect}
                onChange={(v) => onUpdate("cursorEffect", v as AppSettings["cursorEffect"])}
              />
            </SettingRow>

            {settings.cursorEffect !== "none" && (
              <SettingRow label="Cursor Color">
                <div className="flex gap-2">
                  {CURSOR_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => onUpdate("cursorColor", p.value)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        settings.cursorColor === p.value
                          ? "border-accent ring-2 ring-accent/30 scale-110"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ background: p.value }}
                      title={p.label}
                    />
                  ))}
                </div>
              </SettingRow>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="btn-primary text-sm !px-5 !py-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
        {label}
      </span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-accent" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          } ${opt.value !== options[0]?.value ? "border-l border-gray-200" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
