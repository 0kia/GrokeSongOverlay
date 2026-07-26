const token = window.location.search.slice(1); // everything after "?"
const artistEl = document.getElementById('artist');
const trackEl = document.getElementById('track');

// Matches: ▶️ Artist - "Song" -> link
const SONG_PATTERN = /^(?:▶️\s*)?(.+?)\s*-\s*"(.+)"\s*->/;

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

if (!token) {
  trackEl.textContent = 'Add ?yourtoken to the URL.';
} else {
  // must run through cloudfare worker because of CORS
  const url = 'https://song-proxy.okiabetter10.workers.dev/?' + token;

  async function updateSong() {
    try {
      const res = await fetch(url);
      renderSong(await res.text());
    } catch (e) {
      console.error(e);
    }
  }

  updateSong();
  setInterval(updateSong, 10000); // refresh every 10s
}
