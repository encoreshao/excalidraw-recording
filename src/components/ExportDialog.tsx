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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg mx-4 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900">
                  Recording Complete
                </h2>
                <p className="text-gray-500 text-sm">
                  Your recording is ready to export
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video preview */}
        <div className="px-6 py-4">
          <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-200">
            <video
              src={previewUrl}
              controls
              className="w-full max-h-[300px] object-contain"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 pb-4 flex gap-4">
          <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-gray-400 text-xs mb-0.5">Duration</p>
            <p className="text-gray-900 font-mono font-medium">
              {formatDuration(duration)}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-gray-400 text-xs mb-0.5">Size</p>
            <p className="text-gray-900 font-mono font-medium">
              {formatFileSize(blob.size)}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-gray-400 text-xs mb-0.5">Format</p>
            <p className="text-gray-900 font-mono font-medium uppercase">
              {fileExtension}
            </p>
          </div>
        </div>

        {/* File name input */}
        <div className="px-6 pb-4">
          <label className="block text-xs text-gray-400 mb-1.5">File name</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDownload(); }}
              placeholder="Enter video name..."
              className="flex-1 bg-transparent text-sm text-gray-900 font-medium outline-none placeholder:text-gray-300"
              autoFocus
            />
            <span className="text-xs text-gray-400 font-mono">.{fileExtension}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary flex-1"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download {fileExtension.toUpperCase()}
              </>
            )}
          </button>
          <button onClick={onNewRecording} className="btn-secondary">
            New Recording
          </button>
        </div>

        {!isMP4 && (
          <div className="px-6 pb-4 -mt-2">
            <p className="text-gray-400 text-xs text-center">
              Recorded as WebM. For MP4, use Chrome or Edge which support native MP4 recording.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
