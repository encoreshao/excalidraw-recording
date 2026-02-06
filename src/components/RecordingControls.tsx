interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasSelection: boolean;
  isSelectingArea: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraError: string | null;
  micError: string | null;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onSelectArea: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function RecordingControls({
  isRecording,
  isPaused,
  duration,
  hasSelection,
  isSelectingArea,
  cameraEnabled,
  micEnabled,
  cameraError,
  micError,
  onToggleCamera,
  onToggleMic,
  onSelectArea,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
}: RecordingControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="glass-panel px-4 py-3 flex items-center gap-3">
        {/* Recording timer */}
        {isRecording && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
            <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
            <span className="font-mono text-base text-red-600 font-bold min-w-[60px] tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>
        )}

        {/* Divider */}
        {isRecording && <div className="w-px h-8 bg-gray-200" />}

        {/* Camera toggle */}
        <div className="relative group">
          <button
            onClick={onToggleCamera}
            disabled={isRecording}
            className={`btn-icon ${cameraEnabled ? "!bg-accent/10 !border-accent/40 !text-accent" : ""}`}
            title={cameraEnabled ? "Disable camera" : "Enable camera"}
          >
            {cameraEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-.409-7.232-7.232M8.25 5.25 4.21 9.29" />
              </svg>
            )}
          </button>
          {cameraError && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {cameraError}
            </div>
          )}
        </div>

        {/* Mic toggle */}
        <div className="relative group">
          <button
            onClick={onToggleMic}
            disabled={isRecording}
            className={`btn-icon ${micEnabled ? "!bg-accent/10 !border-accent/40 !text-accent" : ""}`}
            title={micEnabled ? "Disable microphone" : "Enable microphone"}
          >
            {micEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
            )}
          </button>
          {micError && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {micError}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Select area button */}
        <button
          onClick={onSelectArea}
          disabled={isRecording}
          className={`btn-secondary text-sm ${isSelectingArea ? "!bg-accent/10 !border-accent/40 !text-accent" : ""} ${hasSelection && !isSelectingArea ? "!border-green-500 !text-green-600" : ""}`}
          title="Select recording area"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
          </svg>
          {hasSelection ? "Area Selected" : "Select Area"}
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Record / Stop / Pause buttons */}
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            disabled={!hasSelection}
            className="btn-primary text-sm"
            title={!hasSelection ? "Select a recording area first" : "Start recording"}
          >
            <div className="w-3 h-3 rounded-full bg-white" />
            Start Recording
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Pause / Resume */}
            <button
              onClick={isPaused ? onResumeRecording : onPauseRecording}
              className="btn-icon"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {/* Stop */}
            <button onClick={onStopRecording} className="btn-danger text-sm">
              <div className="w-3 h-3 rounded-sm bg-white" />
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
