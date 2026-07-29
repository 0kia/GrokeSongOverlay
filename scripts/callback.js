const CLIENT_ID = localStorage.getItem('spotify_client_id');
const REDIRECT_URI = 'https://0kia.github.io/OkiaOverlay/pages/callback.html';
const OVERLAY_URL = 'https://0kia.github.io/OkiaOverlay/pages/overlay.html';

const statusEl = document.getElementById('status');
// display album art option
const albumArtOption = document.getElementById('album-art-option');
const showAlbumArtCheckbox = document.getElementById('show-album-art');
// fade out enable option
const fadeOption = document.getElementById('fade-option');
const enableFadeCheckbox = document.getElementById('enable-fade');
// background color option
const bgColorOption = document.getElementById('bg-color-option');
const enableBgColorCheckbox = document.getElementById('enable-bg-color');
const bgColorPicker = document.getElementById('bg-color-picker');

const params = new URLSearchParams(window.location.search);
const code = params.get('code');

let overlayUrl = '';

async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem('pkce_verifier');

  if (!verifier) {
    statusEl.textContent =
      'Login failed — PKCE verifier not found. Please go back and try again.';
    return;
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    statusEl.textContent =
      'Login failed — check your Client ID and redirect URI.';
    return;
  }

  const data = await res.json();

  function updateOverlayUrl() {
    const urlParams = {
      refresh_token: data.refresh_token,
      client_id: CLIENT_ID,
      album_art: showAlbumArtCheckbox.checked,
      fade: enableFadeCheckbox.checked
    };

    if (enableBgColorCheckbox.checked) {
      urlParams.bg_color = bgColorPicker.value;
    }

    overlayUrl = OVERLAY_URL + '?' + new URLSearchParams(urlParams).toString();
  }

  updateOverlayUrl();

  albumArtOption.style.display = 'block';
  fadeOption.style.display = 'block';
  bgColorOption.style.display = 'block';

  showAlbumArtCheckbox.addEventListener('change', () => {
    updateOverlayUrl();
  });

  enableFadeCheckbox.addEventListener('change', () => {
    updateOverlayUrl();
  });

  enableBgColorCheckbox.addEventListener('change', () => {
    bgColorPicker.disabled = !enableBgColorCheckbox.checked;
    updateOverlayUrl();
  });

  bgColorPicker.addEventListener('input', () => {
    updateOverlayUrl();
  });

  statusEl.innerHTML =
    'Paste this into your OBS browser source (DO NOT LEAK):<br><br>' +
    '<code id="overlay-link">' +
    '*'.repeat(40) +
    '</code><br><br>' +
    '<button id="copy-link">Copy link</button>';

  document.getElementById('copy-link').addEventListener('click', () => {
    navigator.clipboard.writeText(overlayUrl);
  });

  window.history.replaceState({}, document.title, REDIRECT_URI);
}

if (!CLIENT_ID) {
  statusEl.textContent =
    'No Spotify Client ID found — go back and enter your Client ID.';
} else if (code) {
  exchangeCodeForToken(code);
} else {
  statusEl.textContent =
    'No login code found — go back to the home page and log in again.';
}