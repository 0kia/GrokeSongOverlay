const params = new URLSearchParams(window.location.search);
const refreshToken = params.get('refresh_token');
const CLIENT_ID = params.get('client_id');
const showAlbumArt = params.get('album_art') !== 'false';
const enableFade = params.get('fade') !== 'false';

const NORMAL_POLL_INTERVAL = 10000;
const EMPTY_POLL_INTERVAL = 15000;
const SLOW_POLL_INTERVAL = 30000;
const VISIBLE_DURATION = 7000;
const EMPTY_RESPONSE_LIMIT = 10;

const songEl = document.getElementById('song');
const albumArtEl = document.getElementById('album-art');
const artistEl = document.getElementById('artist');
const trackEl = document.getElementById('track');

let hideTimer = null;
let currentTrackId = null;
let consecutiveEmptyResponses = 0;

let accessToken = null;
let accessTokenExpires = 0;

function showThenFade() {
  songEl.classList.add('is-visible');
  clearTimeout(hideTimer);

  if (!enableFade) {
    return;
  }

  hideTimer = setTimeout(() => {
    songEl.classList.remove('is-visible');
  }, VISIBLE_DURATION);
}

function hideSong() {
  clearTimeout(hideTimer);
  songEl.classList.remove('is-visible');
}

function showError(message) {
  artistEl.textContent = '';
  trackEl.textContent = message;
  albumArtEl.style.display = 'none';

  songEl.classList.add('is-visible');
  clearTimeout(hideTimer);
}

function resetScrolling(element) {
  element.classList.remove('scrolling');
  element.style.removeProperty('--scroll-distance');
}

function setupScrolling(element) {
  resetScrolling(element);

  requestAnimationFrame(() => {
    if (element.scrollWidth > element.clientWidth) {
      const distance = element.scrollWidth - element.clientWidth;

      element.style.setProperty(
        '--scroll-distance',
        `-${distance}px`
      );

      element.classList.add('scrolling');
    }
  });
}

async function refreshAccessToken() {
  if (!refreshToken || !CLIENT_ID) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    console.log('Refresh token request failed:', res.status);
    console.log('Response:', await res.text());
    return null;
  }

  const data = await res.json();

  accessToken = data.access_token;
  accessTokenExpires = Date.now() + data.expires_in * 1000;

  return accessToken;
}

async function getValidToken() {
  if (accessToken && Date.now() < accessTokenExpires - 5000) {
    return accessToken;
  }

  return refreshAccessToken();
}

function getNextPollInterval() {
  if (consecutiveEmptyResponses >= EMPTY_RESPONSE_LIMIT) {
    return SLOW_POLL_INTERVAL;
  }

  if (consecutiveEmptyResponses > 0) {
    return EMPTY_POLL_INTERVAL;
  }

  return NORMAL_POLL_INTERVAL;
}

async function updateSong() {
  const token = await getValidToken();

  if (!token) {
    showError('Unable to authenticate with Spotify.');
    return;
  }

  try {
    const res = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: 'Bearer ' + token
        }
      }
    );
    
    if (res.status === 204) {
      consecutiveEmptyResponses++;
    
      artistEl.textContent = '';
      trackEl.textContent = 'No Song Playing';
      albumArtEl.style.display = 'none';
    
      resetScrolling(artistEl);
      resetScrolling(trackEl);
    
      showThenFade();
    
      return;
    }

    if (!res.ok) {
      showError('Spotify request failed (' + res.status + ').');
      return;
    }

    const data = await res.json();

    if (!data || !data.item) {
      consecutiveEmptyResponses++;
    
      artistEl.textContent = '';
      trackEl.textContent = 'No Song Playing';
      albumArtEl.style.display = 'none';
    
      resetScrolling(artistEl);
      resetScrolling(trackEl);
    
      showThenFade();
    
      return;
    }

    // A song is playing again, so return to normal polling.
    consecutiveEmptyResponses = 0;

    if (data.item.id !== currentTrackId) {
      currentTrackId = data.item.id;

      artistEl.textContent = data.item.artists
        .map(a => a.name)
        .join(', ');

      trackEl.textContent = data.item.name;

      if (showAlbumArt) {
        const albumArt = data.item.album?.images?.[0]?.url;

        if (albumArt) {
          albumArtEl.src = albumArt;
          albumArtEl.style.display = 'block';
        } else {
          albumArtEl.style.display = 'none';
        }
      } else {
        albumArtEl.style.display = 'none';
      }

      setupScrolling(artistEl);
      setupScrolling(trackEl);
    }

    showThenFade();
  } catch (e) {
    console.error('Spotify request error:', e);
  }
}

async function poll() {
  await updateSong();

  const nextInterval = getNextPollInterval();

  setTimeout(poll, nextInterval);
}

poll();
