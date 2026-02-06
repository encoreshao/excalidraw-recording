export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
  mimeType: string;
}

export interface MediaDevicesState {
  cameraStream: MediaStream | null;
  micStream: MediaStream | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraError: string | null;
  micError: string | null;
}
