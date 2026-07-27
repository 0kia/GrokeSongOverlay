// ---- Fill this in after creating your Spotify app ----
const CLIENT_ID = '4d6e9ac0717940a6ba59970c3abf8077';
const REDIRECT_URI = 'https://0kia.github.io/OkiaOverlay/pages/callback.html';
const SCOPES = 'user-read-currently-playing user-read-playback-state';
// --------------------------------------------------------

const loginButton = document.getElementById('login-button');

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
  const verifier = generateRandomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));

  // callback.html needs this again to complete the token exchange
  localStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge
  });

  window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
}

loginButton.addEventListener('click', redirectToSpotify);
