import fetch from 'node-fetch';

export default async (_req, res) => {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
        }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Check currently playing track
    let response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    let song;
    let isPlaying = true;

    // If no track is currently playing, get the last played track
    if (response.status === 204 || response.status > 400) {
        response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        isPlaying = false;
    }

    const data = await response.json();
    song = data.item || data.items[0].track;

    const title = song.name;
    const artist = song.artists.map((artist) => artist.name).join(', ');
    const albumArtUrl = song.album.images[0].url;
    const positionMs = isPlaying ? data.progress_ms : 0;
    const durationMs = song.duration_ms;

    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#4b4848" />
          <image href="${albumArtUrl}" x="20" y="40" width="120" height="120"/>
          <text x="160" y="70" font-family="Arial" font-size="18" fill="#333">${isPlaying ? 'Now Playing:' : 'Last Played:'}</text>
          <text x="160" y="100" font-family="Arial" font-size="16" fill="#555">${title}</text>
          <text x="160" y="130" font-family="Arial" font-size="14" fill="#777">by ${artist}</text>
          <text x="160" y="160" font-family="Arial" font-size="14" fill="#777">Progress: ${formatTime(positionMs)} / ${formatTime(durationMs)}</text>
      </svg>
    `);
};
