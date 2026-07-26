const token = window.location.search.slice(1); // everything after "?"
const songEl = document.getElementById('song');
const artistEl = document.getElementById('artist');
const trackEl = document.getElementById('track');

const VISIBLE_DURATION = 8000; // how long to stay visible before fading out

// Matches: ▶️ Artist - "Song" -> link
const SONG_PATTERN = /^(?:▶️\s*)?(.+?)\s*-\s*"(.+)"\s*->/;

let hideTimer = null;

function renderSong(raw) {
  const match = raw.trim().match(SONG_PATTERN);
  if (match) {
    artistEl.textContent = match[1];
    trackEl.textContent = match[2];
  } else {
    artistEl.textContent = '';
    trackEl.textContent = raw.trim();
  }
}

function showThenFade() {
  songEl.classList.add('is-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    songEl.classList.remove('is-visible');
  }, VISIBLE_DURATION);
}

if (!token) {
  trackEl.textContent = "URL must be of the form '...GrokeSongOverlay/?token'";
  songEl.classList.add('is-visible');
} else {
  // CORS proxy 
  const url = 'https://song-proxy.okiabetter10.workers.dev/?' + token;

  let currentRaw = null;

  const USAGE_HINT = "URL must be of the form '...GrokeSongOverlay/?token'";

  async function updateSong() {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        trackEl.textContent = USAGE_HINT;
        artistEl.textContent = '';
        songEl.classList.add('is-visible');
        clearTimeout(hideTimer);
        return;
      }

      const raw = (await res.text()).trim();

      if (raw !== currentRaw) {
        currentRaw = raw;
        renderSong(raw);
        showThenFade();
      }
    } catch (e) {
      trackEl.textContent = USAGE_HINT;
      artistEl.textContent = '';
      songEl.classList.add('is-visible');
      clearTimeout(hideTimer);
      console.error(e);
    }
  }

  updateSong();
  setInterval(updateSong, 15000); // refresh interval
}
