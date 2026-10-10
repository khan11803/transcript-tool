# TranscriptLab

Get the transcript of any YouTube video instantly. Click on any line to jump to that moment in the video, copy the full transcript, or use AI prompts to transform the content.

## Features

- **Synced Playback**: Click any transcript line to seek to that moment in the video
- **Auto-Scroll**: The transcript automatically highlights and scrolls to match the current video position
- **Search & Highlight**: Find specific words or phrases in the transcript
- **Copy Options**: Copy with or without timestamps
- **Download**: Save transcript as a .txt file
- **Remove Sections**: Select and delete unwanted lines (e.g., sponsor segments) before copying
- **AI Prompt Library**: 8 ready-made prompts (Summary, Key Points, Study Notes, Quiz, Blog Post, Tweet Thread, Quotes, Q&A) that copy the prompt + transcript together, ready to paste into ChatGPT or Claude
- **Dark Mode**: Toggle between light and dark themes
- **Mobile-Friendly**: Fully responsive design

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser to:
```
http://localhost:3000
```

3. Paste any YouTube URL (watch, shorts, youtu.be, embed formats all work)

4. Click "Get Transcript"

## Tech Stack

**Backend:**
- Node.js + Express
- youtube-transcript package
- In-memory caching

**Frontend:**
- Plain HTML, CSS, JavaScript (no frameworks)
- YouTube IFrame API for video playback
- Responsive design with light/dark modes

## API

### GET /api/transcript

Fetch the transcript for a YouTube video.

**Query Parameters:**
- `url` (required): YouTube video URL or video ID
- `lang` (optional): Language code for captions (e.g., 'en', 'es')

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "segments": [
    {
      "text": "Never gonna give you up",
      "start": 0.5,
      "duration": 2.1
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "No captions available for this video."
}
```

## License

MIT
