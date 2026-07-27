// Must match the Client ID used in auth.js
const CLIENT_ID = '4d6e9ac0717940a6ba59970c3abf8077';

const POLL_INTERVAL = 10000;   // how often to check Spotify
const VISIBLE_DURATION = 5000; // how long to stay visible before fading out

const songEl = document.getElementById('song');
const artistEl = document.getElementById('artist');
const trackEl = document.getElementById('track');

let hideTimer = null;
let currentTrackId = null;

const refreshToken = window.location.search.slice(1); // everything after "?"
let accessToken = null;
let accessTokenExpires = 0;

function showThenFade() {
  songEl.classList.add('is-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    songEl.classList.remove('is-visible');
  }, VISIBLE_DURATION);
}

function showError(message) {
  artistEl.textContent = '';
  trackEl.textContent = message;
  songEl.classList.add('is-visible');
  clearTimeout(hideTimer);
}

async function refreshAccessToken() {
  if (!refreshToken) return null;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) return null;

  const data = await res.json();
  accessToken = data.access_token;
  accessTokenExpires = Date.now() + data.expires_in * 1000;

  return accessToken;
}

async function getValidToken() {
  if (accessToken && Date.now() < accessTokenExpires - 5000) {
    return accessToken; // still valid, with a 5s safety buffer
  }

  return refreshAccessToken();
}

async function updateSong() {
  const token = await getValidToken();

  if (!token) {
    showError("URL must be of the form '...OkiaOverlay/overlay.html?token'");
    return;
  }

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (res.status === 204) {
      // Nothing currently playing — leave the overlay as-is (it'll fade out on its own)
      return;
    }

    if (!res.ok) {
      showError('Spotify request failed (' + res.status + ').');
      return;
    }

    const data = await res.json();
    if (!data || !data.item) return;

    if (data.item.id !== currentTrackId) {
      currentTrackId = data.item.id;
      artistEl.textContent = data.item.artists.map(a => a.name).join(', ');
      trackEl.textContent = data.item.name;
      showThenFade();
    }
  } catch (e) {
    console.error(e);
  }
}

updateSong();
setInterval(updateSong, POLL_INTERVAL);
