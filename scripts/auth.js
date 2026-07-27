const REDIRECT_URI = 'https://0kia.github.io/OkiaOverlay/pages/callback.html';
const SCOPES = 'user-read-currently-playing user-read-playback-state';

const clientIdInput = document.getElementById('client-id');
const loginButton = document.getElementById('login-button');

loginButton.disabled = true;

clientIdInput.addEventListener('input', () => {
  loginButton.disabled = clientIdInput.value.trim() === '';
});

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array).slice(0, length);
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

async function redirectToSpotify() {
  const clientId = clientIdInput.value.trim();

  if (!clientId) {
    document.getElementById('status').textContent =
      'Please enter your Spotify Client ID.';
    return;
  }

  // Remember the Client ID for the callback and overlay
  localStorage.setItem('spotify_client_id', clientId);

  const verifier = generateRandomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));

  localStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge
  });

  window.location.href =
    'https://accounts.spotify.com/authorize?' + params.toString();
}

loginButton.addEventListener('click', redirectToSpotify);
