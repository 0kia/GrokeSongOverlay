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
  trackEl.textContent = 'Add ?yourtoken to the URL.';
} else {
  // Replace with your deployed Cloudflare Worker URL
  const url = 'https://song-proxy.okiabetter10.workers.dev/?' + token;

  let currentRaw = null;

  async function updateSong() {
    try {
      const res = await fetch(url);
      const raw = (await res.text()).trim();

      if (raw !== currentRaw) {
        currentRaw = raw;
        renderSong(raw);
        showThenFade();
      }
    } catch (e) {
      console.error(e);
    }
  }

  updateSong();
  setInterval(updateSong, 10000); // refresh every 10s
}
