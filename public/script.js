/* ── TranscriptLab – Main Script ───────────────────── */

// State
let currentVideoId = null;
let currentTranscript = [];
let player = null;
let playerReady = false;
let isSelectMode = false;
let selectedItems = new Set();
let deletedIndices = new Set();
let updateInterval = null;

// DOM Elements
const homeSection = document.getElementById('homeSection');
const resultSection = document.getElementById('resultSection');
const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const errorMessage = document.getElementById('errorMessage');
const backBtn = document.getElementById('backBtn');
const transcriptList = document.getElementById('transcriptList');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const timestampToggle = document.getElementById('timestampToggle');
const themeToggle = document.getElementById('themeToggle');
const selectModeBtn = document.getElementById('selectModeBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const aiPromptsBtn = document.getElementById('aiPromptsBtn');
const aiPromptsModal = document.getElementById('aiPromptsModal');
const closeAiModal = document.getElementById('closeAiModal');
const copyOptionsModal = document.getElementById('copyOptionsModal');
const closeCopyModal = document.getElementById('closeCopyModal');

// ── Theme Management ────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggle.addEventListener('click', function () {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// ── YouTube IFrame API ──────────────────────────────
window.onYouTubeIframeAPIReady = function () {
  console.log('YouTube IFrame API ready');
};

function createPlayer(videoId) {
  if (player) {
    player.loadVideoById(videoId);
    return;
  }

  player = new YT.Player('player', {
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0
    },
    events: {
      onReady: function () {
        playerReady = true;
        startTimeUpdater();
      },
      onStateChange: function (event) {
        if (event.data === YT.PlayerState.PLAYING) {
          startTimeUpdater();
        } else {
          stopTimeUpdater();
        }
      }
    }
  });
}

// ── Fetch Transcript ────────────────────────────────
async function fetchTranscript() {
  const url = urlInput.value.trim();

  if (!url) {
    showError('Please enter a YouTube URL');
    return;
  }

  errorMessage.textContent = '';
  fetchBtn.disabled = true;
  fetchBtn.classList.add('loading');

  try {
    const response = await fetch(`/api/transcript?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transcript');
    }

    currentVideoId = data.videoId;
    currentTranscript = data.segments;
    deletedIndices.clear();
    selectedItems.clear();

    showResultSection();
    renderTranscript();
    createPlayer(currentVideoId);

  } catch (error) {
    showError(error.message);
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.classList.remove('loading');
  }
}

function showError(message) {
  errorMessage.textContent = message;
}

// ── UI Navigation ───────────────────────────────────
function showResultSection() {
  homeSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
}

function showHomeSection() {
  resultSection.classList.add('hidden');
  homeSection.classList.remove('hidden');
  urlInput.value = '';
  errorMessage.textContent = '';
  stopTimeUpdater();

  if (player) {
    player.stopVideo();
  }
}

// ── Render Transcript ───────────────────────────────
function renderTranscript(filter = '') {
  const showTimestamps = timestampToggle.checked;
  const lowerFilter = filter.toLowerCase();

  transcriptList.innerHTML = currentTranscript
    .map(function (segment, index) {
      if (deletedIndices.has(index)) {
        return '';
      }

      const text = segment.text;
      const matchesFilter = !filter || text.toLowerCase().includes(lowerFilter);

      if (!matchesFilter) {
        return '';
      }

      const timestamp = formatTime(segment.start);
      const displayText = filter ? highlightText(text, filter) : text;
      const selectedClass = selectedItems.has(index) ? 'selected' : '';

      const timestampHTML = showTimestamps
        ? `<span class="timestamp">${timestamp}</span>`
        : '';

      return `
        <div class="transcript-item ${selectedClass}" data-index="${index}" data-time="${segment.start}">
          ${timestampHTML}
          <div class="transcript-text">${displayText}</div>
        </div>
      `;
    })
    .join('');

  // Add click handlers
  document.querySelectorAll('.transcript-item').forEach(function (item) {
    item.addEventListener('click', handleTranscriptClick);
  });
}

function handleTranscriptClick(e) {
  const index = parseInt(this.getAttribute('data-index'));
  const time = parseFloat(this.getAttribute('data-time'));

  if (isSelectMode) {
    if (selectedItems.has(index)) {
      selectedItems.delete(index);
      this.classList.remove('selected');
    } else {
      selectedItems.add(index);
      this.classList.add('selected');
    }

    deleteSelectedBtn.classList.toggle('hidden', selectedItems.size === 0);
  } else {
    if (playerReady && player) {
      player.seekTo(time, true);
      player.playVideo();
    }
  }
}

// ── Time Formatting ─────────────────────────────────
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ── Highlight Active Line ───────────────────────────
function startTimeUpdater() {
  if (updateInterval) return;

  updateInterval = setInterval(function () {
    if (!playerReady || !player) return;

    try {
      const currentTime = player.getCurrentTime();
      updateActiveTranscript(currentTime);
    } catch (e) {
      // Player might not be ready
    }
  }, 500);
}

function stopTimeUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

function updateActiveTranscript(currentTime) {
  const items = document.querySelectorAll('.transcript-item');
  let activeIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const time = parseFloat(items[i].getAttribute('data-time'));
    if (currentTime >= time) {
      activeIndex = i;
    }
  }

  items.forEach(function (item, index) {
    item.classList.toggle('active', index === activeIndex);
  });

  // Auto-scroll to active item
  if (activeIndex >= 0 && items[activeIndex]) {
    const activeItem = items[activeIndex];
    const container = transcriptList;
    const itemTop = activeItem.offsetTop;
    const itemHeight = activeItem.offsetHeight;
    const containerScroll = container.scrollTop;
    const containerHeight = container.clientHeight;

    if (itemTop < containerScroll || itemTop + itemHeight > containerScroll + containerHeight) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// ── Search ──────────────────────────────────────────
searchInput.addEventListener('input', function () {
  const query = this.value.trim();
  renderTranscript(query);
  clearSearch.classList.toggle('hidden', !query);
});

clearSearch.addEventListener('click', function () {
  searchInput.value = '';
  renderTranscript();
  clearSearch.classList.add('hidden');
});

function highlightText(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Copy & Download ─────────────────────────────────
copyBtn.addEventListener('click', function () {
  copyOptionsModal.classList.remove('hidden');
});

closeCopyModal.addEventListener('click', function () {
  copyOptionsModal.classList.add('hidden');
});

document.querySelectorAll('.copy-option-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const withTimestamps = this.getAttribute('data-timestamps') === 'true';
    copyTranscript(withTimestamps);
    copyOptionsModal.classList.add('hidden');
  });
});

function copyTranscript(withTimestamps) {
  const text = getTranscriptText(withTimestamps);

  navigator.clipboard.writeText(text).then(function () {
    showToast('Transcript copied to clipboard!');
  }).catch(function () {
    showToast('Failed to copy', true);
  });
}

downloadBtn.addEventListener('click', function () {
  const text = getTranscriptText(true);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript-${currentVideoId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Transcript downloaded!');
});

function getTranscriptText(withTimestamps) {
  return currentTranscript
    .filter(function (_, index) {
      return !deletedIndices.has(index);
    })
    .map(function (segment) {
      const timestamp = formatTime(segment.start);
      return withTimestamps ? `[${timestamp}] ${segment.text}` : segment.text;
    })
    .join('\n');
}

// ── Select Mode & Delete ────────────────────────────
selectModeBtn.addEventListener('click', function () {
  isSelectMode = !isSelectMode;
  transcriptList.classList.toggle('select-mode', isSelectMode);
  this.textContent = isSelectMode ? 'Exit Select Mode' : 'Select Mode';

  if (!isSelectMode) {
    selectedItems.clear();
    deleteSelectedBtn.classList.add('hidden');
    renderTranscript(searchInput.value.trim());
  }
});

deleteSelectedBtn.addEventListener('click', function () {
  if (selectedItems.size === 0) return;

  selectedItems.forEach(function (index) {
    deletedIndices.add(index);
  });

  selectedItems.clear();
  isSelectMode = false;
  transcriptList.classList.remove('select-mode');
  selectModeBtn.textContent = 'Select Mode';
  deleteSelectedBtn.classList.add('hidden');

  renderTranscript(searchInput.value.trim());
  showToast(`Removed ${deletedIndices.size} line(s)`);
});

// ── AI Prompts ──────────────────────────────────────
aiPromptsBtn.addEventListener('click', function () {
  aiPromptsModal.classList.remove('hidden');
});

closeAiModal.addEventListener('click', function () {
  aiPromptsModal.classList.add('hidden');
});

document.querySelectorAll('.prompt-card').forEach(function (card) {
  card.addEventListener('click', function () {
    const promptTemplate = this.getAttribute('data-prompt');
    const transcript = getTranscriptText(false);
    const fullPrompt = `${promptTemplate}\n\n---\n\nTranscript:\n\n${transcript}`;

    navigator.clipboard.writeText(fullPrompt).then(function () {
      showToast('Prompt + transcript copied! Paste into ChatGPT or Claude.');
      aiPromptsModal.classList.add('hidden');
    }).catch(function () {
      showToast('Failed to copy', true);
    });
  });
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
  overlay.addEventListener('click', function () {
    this.parentElement.classList.add('hidden');
  });
});

// ── Toast Notification ──────────────────────────────
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.background = isError ? 'var(--danger)' : 'var(--text)';
  toast.classList.add('show');

  setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

// ── Event Listeners ─────────────────────────────────
fetchBtn.addEventListener('click', fetchTranscript);

urlInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    fetchTranscript();
  }
});

backBtn.addEventListener('click', showHomeSection);

timestampToggle.addEventListener('change', function () {
  renderTranscript(searchInput.value.trim());
});

// ── Initialize ──────────────────────────────────────
initTheme();
