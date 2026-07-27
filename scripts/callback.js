// Must match the Client ID used in auth.js
const CLIENT_ID = '4d6e9ac0717940a6ba59970c3abf8077';
const REDIRECT_URI = 'https://0kia.github.io/OkiaOverlay/pages/callback.html';
const OVERLAY_URL = 'https://0kia.github.io/OkiaOverlay/pages/overlay.html';

const statusEl = document.getElementById('status');

async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem('pkce_verifier');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) {
    statusEl.textContent = 'Login failed — check your Client ID and redirect URI.';
    return;
  }

  const data = await res.json();

  const overlayUrl = OVERLAY_URL + '?' + data.refresh_token;

  statusEl.innerHTML = 'Paste this into your OBS browser source (DO NOT LEAK):<br><br>'
    + '<code id="overlay-link">' + '*'.repeat(40) + '</code><br><br>'
    + '<button id="copy-link">Copy link</button>';

  document.getElementById('copy-link').addEventListener('click', () => {
    navigator.clipboard.writeText(overlayUrl);
  });

  // Clean the code out of the URL bar now that we're done with it
  window.history.replaceState({}, document.title, REDIRECT_URI);
}

const params = new URLSearchParams(window.location.search);
const code = params.get('code');

if (code) {
  exchangeCodeForToken(code);
} else {
  statusEl.textContent = 'No login code found — go back and click "Login with Spotify" again.';
}
