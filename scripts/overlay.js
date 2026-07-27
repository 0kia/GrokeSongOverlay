const params = new URLSearchParams(window.location.search);
const refreshToken = params.get('refresh_token');
const CLIENT_ID = params.get('client_id');

const POLL_INTERVAL = 10000;
const VISIBLE_DURATION = 7000;

const songEl = document.getElementById('song');
const albumArtEl = document.getElementById('album-art');
const artistEl = document.getElementById('artist');
const trackEl = document.getElementById('track');

let hideTimer = null;
let currentTrackId = null;

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
    console.log('--- SCROLL DEBUG ---');
    console.log('Element:', element.id);
    console.log('Text:', element.textContent);
    console.log('scrollWidth:', element.scrollWidth);
    console.log('clientWidth:', element.clientWidth);
    console.log('offsetWidth:', element.offsetWidth);
    console.log('Parent:', element.parentElement);
    console.log('Parent clientWidth:', element.parentElement.clientWidth);
    console.log('Computed width:', getComputedStyle(element).width);
    console.log('Computed overflow:', getComputedStyle(element).overflow);

    if (element.scrollWidth > element.clientWidth) {
      const distance = element.scrollWidth - element.clientWidth;

      console.log('OVERFLOW DETECTED');
      console.log('Scroll distance:', distance);

      element.style.setProperty(
        '--scroll-distance',
        `-${distance}px`
      );

      element.classList.add('scrolling');
    } else {
      console.log('NO OVERFLOW');
    }
  });
}

async function refreshAccessToken() {
  if (!refreshToken || !CLIENT_ID) return null;

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

  if (!res.ok) return null;

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

      artistEl.textContent = data.item.artists
        .map(a => a.name)
        .join(', ');

      trackEl.textContent = data.item.name;

      const albumArt = data.item.album?.images?.[0]?.url;

      if (albumArt) {
        albumArtEl.src = albumArt;
        albumArtEl.style.display = 'block';
      } else {
        albumArtEl.style.display = 'none';
      }

      setupScrolling(artistEl);
      setupScrolling(trackEl);

      showThenFade();
    }
  } catch (e) {
    console.error(e);
  }
}

updateSong();
setInterval(updateSong, POLL_INTERVAL);
