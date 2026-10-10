const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Serve static files from public directory
app.use(express.static('public'));

// Extract video ID from various YouTube URL formats
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/  // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// API endpoint to fetch transcript
app.get('/api/transcript', async (req, res) => {
  try {
    const { url, lang } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video URL or video ID.' });
    }

    // Check cache
    const cacheKey = `${videoId}_${lang || 'default'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cached.data);
    }

    // Fetch transcript
    console.log(`Fetching transcript for video ID: ${videoId}${lang ? ` (lang: ${lang})` : ''}`);

    const options = lang ? { lang } : {};
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, options);

    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        error: 'No transcript found for this video. The video may not have captions available.'
      });
    }

    // Format response
    const response = {
      videoId,
      language: lang || 'auto',
      segments: transcript.map(segment => ({
        text: segment.text,
        start: segment.offset / 1000, // Convert to seconds
        duration: segment.duration / 1000
      }))
    };

    // Store in cache
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);

  } catch (error) {
    console.error('Error fetching transcript:', error);

    // Handle specific error cases
    if (error.message.includes('Could not find captions')) {
      return res.status(404).json({
        error: 'No captions available for this video. The video may not have transcripts enabled.'
      });
    }

    if (error.message.includes('Video unavailable') || error.message.includes('private')) {
      return res.status(403).json({
        error: 'This video is unavailable or private. Please check the URL and try again.'
      });
    }

    if (error.message.includes('Invalid video id')) {
      return res.status(400).json({
        error: 'Invalid video ID. Please check the YouTube URL.'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch transcript. Please try again later.',
      details: error.message
    });
  }
});

// Clear old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
      console.log(`Cleared cache for ${key}`);
    }
  }
}, CACHE_DURATION);

app.listen(PORT, () => {
  console.log(`TranscriptLab server running at http://localhost:${PORT}`);
});
