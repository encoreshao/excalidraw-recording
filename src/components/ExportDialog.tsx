import { useState, useMemo } from "react";

interface ExportDialogProps {
  blob: Blob;
  mimeType: string;
  duration: number;
  onClose: () => void;
  onNewRecording: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportDialog({
  blob,
  mimeType,
  duration,
  onClose,
  onNewRecording,
}: ExportDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [fileName, setFileName] = useState(
    () => `excalidraw-recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}`,
  );

  const previewUrl = useMemo(() => URL.createObjectURL(blob), [blob]);
  const isMP4 = mimeType.includes("mp4");
  const fileExtension = isMP4 ? "mp4" : "webm";

  const handleDownload = () => {
    setDownloading(true);
    const safeName = fileName.trim() || "excalidraw-recording";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25 backdrop-blur-sm backdrop-enter">
      <div className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 w-full max-w-lg mx-4 overflow-hidden dialog-enter">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Recording Complete</h2>
                <p className="text-gray-400 text-[12px] mt-0.5">Your video is ready to download</p>
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
        </div>

        {/* Video preview */}
        <div className="px-6 py-4">
          <div className="rounded-xl overflow-hidden bg-gray-950 ring-1 ring-gray-200">
            <video
              src={previewUrl}
              controls
              className="w-full max-h-[280px] object-contain"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 pb-4 grid grid-cols-3 gap-3">
          <StatCard label="Duration" value={formatDuration(duration)} />
          <StatCard label="Size" value={formatFileSize(blob.size)} />
          <StatCard label="Format" value={fileExtension.toUpperCase()} />
        </div>

        {/* File name input */}
        <div className="px-6 pb-4">
          <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
            File name
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-50 transition-all duration-150">
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDownload(); }}
              placeholder="Enter video name..."
              className="flex-1 bg-transparent text-[13px] text-gray-900 font-medium outline-none placeholder:text-gray-300"
              autoFocus
            />
            <span className="text-[11px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              .{fileExtension}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 flex-1 rounded-xl
                       bg-green-600 px-6 py-2.5 text-[13px] font-semibold text-white
                       shadow-md shadow-green-600/20 transition-all duration-150 ease-out
                       hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-px
                       active:translate-y-0 active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md
                       cursor-pointer"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download {fileExtension.toUpperCase()}
              </>
            )}
          </button>
          <button
            onClick={onNewRecording}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5
                       text-[13px] font-medium text-gray-600 transition-all duration-150 ease-out
                       hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                       active:scale-[0.98] cursor-pointer"
          >
            New
          </button>
        </div>

        {!isMP4 && (
          <div className="px-6 pb-4 -mt-2">
            <p className="text-gray-400 text-[11px] text-center">
              Recorded as WebM. For MP4, use Chrome or Edge.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-3.5 py-2.5 text-center">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-gray-900 font-mono text-[13px] font-semibold">{value}</p>
    </div>
  );
}
