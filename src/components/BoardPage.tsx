import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useSettings } from "../hooks/useSettings";
import { useRecorder } from "../hooks/useRecorder";
import AreaSelector from "./AreaSelector";
import CameraPreview from "./CameraPreview";
import CaptionOverlay from "./CaptionOverlay";
import RecordingControls from "./RecordingControls";
import SettingsDialog from "./SettingsDialog";
import ExportDialog from "./ExportDialog";
import type { SelectionArea } from "../types";

// Import Excalidraw's own stylesheet
import "@excalidraw/excalidraw/index.css";

const ExcalidrawWithMenu = lazy(async () => {
  const mod = await import("@excalidraw/excalidraw");
  const { Excalidraw, MainMenu } = mod;

  // eslint-disable-next-line react/display-name
  const Component = (props: {
    renderTopRightUI: () => React.JSX.Element;
  }) => (
    <Excalidraw
      theme="light"
      renderTopRightUI={props.renderTopRightUI}
      UIOptions={{
        canvasActions: {
          export: { saveFileToDisk: true },
        },
      }}
    >
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.Group title="My Links">
          <MainMenu.ItemLink
            href="https://github.com/encoreshao"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            }
          >
            GitHub
          </MainMenu.ItemLink>
          <MainMenu.ItemLink
            href="https://x.com/encoreshao"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            }
          >
            Follow us
          </MainMenu.ItemLink>
        </MainMenu.Group>
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
    </Excalidraw>
  );

  return { default: Component };
});

export default function BoardPage() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const excalidrawContainerRef = useRef<HTMLDivElement>(null);
  const { settings, updateSetting, resetSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Area selection state
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(
    null,
  );
  const [confirmedSelection, setConfirmedSelection] =
    useState<SelectionArea | null>(null);

  // Media devices
  const media = useMediaDevices();

  // Speech-to-text captions
  const speech = useSpeechToText("en-US", settings.captionClearDelay);
  const [captionPosition, setCaptionPosition] = useState({ x: 0, y: 0 });
  const captionRef = useRef<{
    text: string;
    position: { x: number; y: number };
    enabled: boolean;
  } | null>(null);

  // Keep captionRef in sync with latest values
  captionRef.current = {
    text: speech.transcript,
    position: captionPosition,
    enabled: speech.isListening,
  };

  // Settings ref for recorder (avoids re-creating callbacks on every settings change)
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Mouse position ref for cursor effect
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Recorder
  const recorder = useRecorder({
    excalidrawContainerRef,
    selectionArea: confirmedSelection,
    cameraStream: media.cameraStream,
    micStream: media.micStream,
    cameraEnabled: media.cameraEnabled,
    captionRef,
    settingsRef,
    mousePositionRef,
  });

  // Track mouse position for cursor effect in recordings
  useEffect(() => {
    if (!recorder.isRecording || settings.cursorEffect === "none") return;
    const handler = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [recorder.isRecording, settings.cursorEffect]);

  // Handlers
  const handleSelectArea = useCallback(() => {
    if (recorder.isRecording) return;
    setIsSelectingArea(true);
    setSelectionArea(null);
  }, [recorder.isRecording]);

  const handleConfirmArea = useCallback(() => {
    if (
      selectionArea &&
      selectionArea.width > 10 &&
      selectionArea.height > 10
    ) {
      setConfirmedSelection(selectionArea);
    }
    setIsSelectingArea(false);
  }, [selectionArea]);

  const handleCancelArea = useCallback(() => {
    setIsSelectingArea(false);
    setSelectionArea(null);
  }, []);

  const handleNewRecording = useCallback(() => {
    recorder.clearRecording();
    setConfirmedSelection(null);
    setSelectionArea(null);
  }, [recorder]);

  // Rendered inside Excalidraw's top-right UI slot
  const renderTopRightUI = useCallback(() => {
    return (
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        ) : user ? (
          /* Signed in: avatar + name + sign out */
          <div className="flex items-center gap-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white shadow-sm flex items-center justify-center text-green-700 text-xs font-bold">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate hidden sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        ) : (
          /* Not signed in: Google sign-in button */
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white
                       px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-all duration-200
                       hover:bg-gray-50 hover:border-gray-300 hover:shadow
                       active:scale-[0.97]"
            title="Sign in with Google"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Sign in</span>
          </button>
        )}
      </div>
    );
  }, [user, loading, signInWithGoogle, logout]);

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Full-viewport Excalidraw */}
      <div
        className="excalidraw-wrapper w-full h-full"
        ref={excalidrawContainerRef}
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading Excalidraw...</p>
              </div>
            </div>
          }
        >
          <ExcalidrawWithMenu renderTopRightUI={renderTopRightUI} />
        </Suspense>
      </div>

      {/* Selection area indicator (when confirmed but not selecting) */}
      {confirmedSelection && !isSelectingArea && !recorder.isRecording && (
        <div
          className="absolute pointer-events-none z-30 border-2 border-accent/50 rounded-[4px]"
          style={{
            left: confirmedSelection.x,
            top: confirmedSelection.y,
            width: confirmedSelection.width,
            height: confirmedSelection.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.03)",
          }}
        >
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-accent/90 text-white text-[10px] font-mono whitespace-nowrap">
            Recording Area
          </div>
        </div>
      )}

      {/* Recording indicator border */}
      {recorder.isRecording && confirmedSelection && (
        <div
          className="absolute pointer-events-none z-30 border-2 border-red-500 rounded-[4px] recording-pulse"
          style={{
            left: confirmedSelection.x,
            top: confirmedSelection.y,
            width: confirmedSelection.width,
            height: confirmedSelection.height,
          }}
        >
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-white recording-pulse" />
            REC
          </div>
        </div>
      )}

      {/* Area selector overlay */}
      <AreaSelector
        active={isSelectingArea}
        selectionArea={selectionArea}
        onSelectionChange={setSelectionArea}
        onConfirm={handleConfirmArea}
        onCancel={handleCancelArea}
        containerRef={excalidrawContainerRef}
      />

      {/* Camera preview */}
      <CameraPreview
        stream={media.cameraStream}
        visible={media.cameraEnabled && !isSelectingArea}
      />

      {/* Live captions overlay */}
      <CaptionOverlay
        text={speech.transcript}
        visible={speech.isListening && !isSelectingArea}
        onPositionChange={setCaptionPosition}
        bgColor={settings.captionBgColor}
        textColor={settings.captionTextColor}
        cornerRadius={settings.captionCornerRadius}
        fontSize={settings.captionFontSize}
      />

      {/* Recording controls */}
      {!isSelectingArea && (
        <RecordingControls
          isRecording={recorder.isRecording}
          isPaused={recorder.isPaused}
          duration={recorder.duration}
          hasSelection={!!confirmedSelection}
          isSelectingArea={isSelectingArea}
          cameraEnabled={media.cameraEnabled}
          micEnabled={media.micEnabled}
          captionsEnabled={speech.isListening}
          captionsSupported={speech.isSupported}
          cameraError={media.cameraError}
          micError={media.micError}
          onToggleCamera={media.toggleCamera}
          onToggleMic={media.toggleMic}
          onToggleCaptions={speech.toggle}
          onSelectArea={handleSelectArea}
          onStartRecording={recorder.startRecording}
          onStopRecording={recorder.stopRecording}
          onPauseRecording={recorder.pauseRecording}
          onResumeRecording={recorder.resumeRecording}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSetting}
        onReset={resetSettings}
      />

      {/* Export dialog */}
      {recorder.recordedBlob && (
        <ExportDialog
          blob={recorder.recordedBlob}
          mimeType={recorder.mimeType}
          duration={recorder.duration}
          onClose={() => recorder.clearRecording()}
          onNewRecording={handleNewRecording}
        />
      )}
    </div>
  );
}
