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

const CAPTION_TEXT_PRESETS = [
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Yellow", value: "#FBBF24" },
  { label: "Green", value: "#22C55E" },
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/25 backdrop-blur-sm backdrop-enter"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 w-full max-w-[580px] max-h-[85vh] overflow-hidden flex flex-col dialog-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Settings</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Auto-saved to your browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7 custom-scrollbar">
          {/* ── Caption Settings ── */}
          <Section
            title="Captions"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            }
          >
            <SettingRow label="Background">
              <ColorSwatches
                colors={CAPTION_BG_PRESETS}
                selected={settings.captionBgColor}
                onChange={(v) => onUpdate("captionBgColor", v)}
              />
            </SettingRow>

            <SettingRow label="Text Color">
              <ColorSwatches
                colors={CAPTION_TEXT_PRESETS}
                selected={settings.captionTextColor}
                onChange={(v) => onUpdate("captionTextColor", v)}
              />
            </SettingRow>

            <SettingRow label="Corner Radius">
              <SliderRow
                min={0}
                max={24}
                step={2}
                value={settings.captionCornerRadius}
                onChange={(v) => onUpdate("captionCornerRadius", v)}
                suffix="px"
              />
            </SettingRow>

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

            <SettingRow label="Auto-Clear">
              <SliderRow
                min={1}
                max={10}
                step={1}
                value={settings.captionClearDelay}
                onChange={(v) => onUpdate("captionClearDelay", v)}
                suffix="s"
              />
            </SettingRow>
          </Section>

          {/* ── Camera Settings ── */}
          <Section
            title="Camera"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            }
          >
            <SettingRow label="Show in Recording">
              <Toggle
                checked={settings.showCameraInRecording}
                onChange={(v) => onUpdate("showCameraInRecording", v)}
              />
            </SettingRow>

            <SettingRow label="Bubble Size">
              <SegmentedControl
                options={[
                  { label: "Small", value: "small" },
                  { label: "Medium", value: "medium" },
                  { label: "Large", value: "large" },
                ]}
                value={settings.cameraBubbleSize}
                onChange={(v) => onUpdate("cameraBubbleSize", v as AppSettings["cameraBubbleSize"])}
              />
            </SettingRow>
          </Section>

          {/* ── Recording Settings ── */}
          <Section
            title="Recording"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            }
          >
            <SettingRow label="Canvas Padding">
              <SliderRow
                min={0}
                max={60}
                step={5}
                value={settings.canvasPadding}
                onChange={(v) => onUpdate("canvasPadding", v)}
                suffix="px"
              />
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
                  { label: "Med", value: "5" },
                  { label: "High", value: "8" },
                  { label: "Max", value: "12" },
                ]}
                value={String(settings.videoBitrate)}
                onChange={(v) => onUpdate("videoBitrate", Number(v))}
              />
            </SettingRow>
          </Section>

          {/* ── Cursor Effect ── */}
          <Section
            title="Mouse Cursor"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
              </svg>
            }
          >
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
              <SettingRow label="Color">
                <ColorSwatches
                  colors={CURSOR_COLOR_PRESETS}
                  selected={settings.cursorColor}
                  onChange={(v) => onUpdate("cursorColor", v)}
                />
              </SettingRow>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button
            onClick={onReset}
            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 px-5 py-2 rounded-xl transition-all duration-150 hover:shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────── */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="space-y-4 pl-0.5">{children}</div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-gray-600 whitespace-nowrap">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

/* ── Color Swatches ── */
function ColorSwatches({
  colors,
  selected,
  onChange,
}: {
  colors: { label: string; value: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {colors.map((c) => {
        const isSelected = selected === c.value;
        const isDark =
          c.value.includes("0, 0, 0") ||
          c.value === "#000000" ||
          c.value.includes("37, 99") ||
          c.value.includes("147, 51") ||
          c.value.includes("220, 38");
        return (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className={`relative w-7 h-7 rounded-full transition-all duration-150 cursor-pointer
              ${isSelected
                ? "ring-2 ring-green-500 ring-offset-2 scale-110"
                : "ring-1 ring-gray-200 hover:ring-gray-300 hover:scale-105"
              }`}
            style={{ background: c.value }}
            title={c.label}
          >
            {isSelected && (
              <svg
                className={`absolute inset-0 m-auto w-3.5 h-3.5 ${isDark ? "text-white" : "text-gray-800"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Slider Row ── */
function SliderRow({
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-3 w-44">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="text-[11px] text-gray-400 font-mono w-8 text-right tabular-nums">
        {value}{suffix}
      </span>
    </div>
  );
}

/* ── Toggle ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-out cursor-pointer ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-out
          ${checked ? "translate-x-5" : "translate-x-0"}
          shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)]`}
      />
    </button>
  );
}

/* ── Segmented Control ── */
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
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-150 cursor-pointer
            ${value === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
