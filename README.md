# Excalidraw Recording

A web application that integrates [Excalidraw](https://excalidraw.com/) with screen recording capabilities. Draw on a whiteboard while recording your voice, camera, and live captions — then export the result as a video file, all processed locally in the browser.

![Excalidraw Recording](https://raw.githubusercontent.com/encoreshao/excalidraw-recording/main/assets/images/recording.png)

## Features

- **Full Excalidraw whiteboard** — All drawing tools, shapes, text, and collaboration features from Excalidraw, available without login
- **Area selection with aspect ratio presets** — Select a recording area with one click using presets for YouTube (16:9), TikTok (9:16), RedNote (3:4), Square (1:1), Classic (4:3), or draw a custom region
- **Camera overlay** — Draggable circular camera bubble composited into the recording
- **Microphone capture** — Record audio alongside your drawing session
- **Live speech-to-text captions** — Real-time voice transcription displayed as draggable subtitles, automatically cleared after each sentence
- **Mouse cursor effects** — Highlight or spotlight effect follows your cursor in the recorded output
- **Local video export** — All recording and encoding happens in the browser using MediaRecorder. No server upload required. Supports MP4 (where available) and WebM
- **Configurable settings** — Caption styling, camera bubble size, canvas padding, cursor effects, recording FPS, video bitrate — all persisted to localStorage
- **Optional Google authentication** — Sign in with Google to display your avatar; the app is fully functional without login and without any Google configuration
- **Draggable action bar** — The recording toolbar can be repositioned anywhere on screen; position is persisted across sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite 6](https://vite.dev/) |
| Whiteboard | [@excalidraw/excalidraw](https://www.npmjs.com/package/@excalidraw/excalidraw) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Auth | [Google Identity Services](https://developers.google.com/identity) via [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google) |
| Recording | Browser [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) + Canvas compositing |
| Speech-to-Text | Browser [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) |
| Persistence | `localStorage` for settings, user profile, and UI positions |

## Project Structure

```
src/
├── App.tsx                          # Root component (GoogleOAuthProvider optional)
├── main.tsx                         # Entry point
├── index.css                        # Global styles & Tailwind imports
├── components/
│   ├── BoardPage.tsx                # Main page — Excalidraw + all overlays
│   ├── AreaSelector.tsx             # Drag-to-select recording area with aspect ratio presets
│   ├── CameraPreview.tsx            # Draggable circular camera feed bubble
│   ├── CaptionOverlay.tsx           # Draggable live speech-to-text caption box
│   ├── RecordingControls.tsx        # Draggable bottom toolbar with tooltips
│   ├── SettingsDialog.tsx           # Settings popup (captions, camera, recording, cursor)
│   └── ExportDialog.tsx             # Post-recording video preview & download
├── contexts/
│   └── AuthContext.tsx              # Google OAuth state + localStorage persistence
├── hooks/
│   ├── useMediaDevices.ts           # Camera & microphone access management
│   ├── useRecorder.ts              # Canvas compositing, MediaRecorder, frame loop
│   ├── useSettings.ts              # App settings with localStorage persistence
│   └── useSpeechToText.ts          # Web Speech API hook with auto-clear
└── types/
    └── index.ts                     # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A Google OAuth Client ID *(optional — only needed for Google sign-in)*

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/encoreshao/excalidraw-recording.git
   cd excalidraw-recording
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) — the app is fully usable immediately with all drawing, recording, and export features.

4. **Configure Google sign-in** *(optional)*

   If you want the Google authentication button to work, create a `.env` file in the project root:

   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

   To get a Client ID:
   - Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   - Create an OAuth 2.0 Client ID for a Web application
   - Add `http://localhost:5173` as an authorized JavaScript origin

   > Without this variable the app runs normally — the Google sign-in button is simply disabled with a tooltip explaining the missing configuration.

### Build for Production

```bash
npm run build
npm run preview
```

### Docker

Build and run with Docker — no Node.js required on the host:

```bash
# Build the image (without Google sign-in)
docker build -t excalidraw-recording .

# Or build with Google sign-in enabled
docker build --build-arg VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com -t excalidraw-recording .

# Run the container
docker run -p 8080:80 excalidraw-recording
```

Open [http://localhost:8080](http://localhost:8080)

## Usage

1. **Draw** — Use the Excalidraw toolbar to sketch diagrams, write text, and create drawings
2. **Set up recording** — Toggle camera, microphone, and captions using the bottom toolbar
3. **Select area** — Click the area icon and pick an aspect ratio preset (or draw a custom region)
4. **Record** — Click "Record" to start. The toolbar collapses to show only timer, pause, and stop
5. **Export** — After stopping, preview the video and download it as MP4/WebM, support custom file name

## Key Design Decisions

- **No server required** — All recording, compositing, and encoding happens client-side using the Canvas API and MediaRecorder. Video files never leave the user's machine.
- **No Firebase** — Google authentication uses the lightweight `@react-oauth/google` package with a single Client ID, avoiding the overhead of a full Firebase project. The app starts and works without any Google configuration; sign-in is entirely optional.
- **Settings persistence** — All preferences (caption colors, corner radius, camera bubble size, FPS, bitrate, cursor effect, toolbar position) are stored in `localStorage` so they survive page refreshes.
- **Composited recording** — The recorder captures Excalidraw canvas layers, camera feed, captions, and cursor effects onto an offscreen canvas at configurable FPS, then pipes it through MediaRecorder.
- **Speech-to-text** — Uses the browser's built-in `SpeechRecognition` API (Chrome/Edge). No external transcription service needed. Captions auto-clear after each sentence.

## Browser Support

- **Chrome / Edge** — Full support (MediaRecorder, SpeechRecognition, all features)
- **Firefox** — Recording works; speech-to-text is not available
- **Safari** — Limited MediaRecorder support; speech-to-text not available
- **Arc** — Limited MediaRecorder support; speech-to-text not available

## License

This project is open source under the [MIT License](LICENSE).

## Links

- [GitHub](https://github.com/encoreshao)
- [X / Twitter](https://x.com/encoreshao)
