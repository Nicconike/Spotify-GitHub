import express from 'express';
import dotenv from 'dotenv';
import nowPlaying from './now-playing.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Serve the main HTML page
app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Spotify Now Playing</title>
      </head>
      <body>
          <div id="track-info"></div>

          <!-- Include Spotify Web Playback SDK -->
          <script src="https://sdk.scdn.co/spotify-player.js"></script>
          <!-- Inline JavaScript for Web Playback SDK -->
          <script>
              async function getAccessToken() {
                  const response = await fetch('/api/token'); // Ensure you have an endpoint to provide tokens
                  const data = await response.json();
                  return data.accessToken;
              }

              window.onSpotifyWebPlaybackSDKReady = async () => {
                  const token = await getAccessToken();
                  const player = new Spotify.Player({
                      name: 'Web Playback SDK Player',
                      getOAuthToken: cb => { cb(token); }
                  });

                  player.addListener('player_state_changed', state => {
                      if (!state) {
                          document.getElementById('track-info').textContent = 'No music playing';
                          return;
                      }

                      updateUI(state);
                  });

                  player.connect();
              };

              function updateUI(state) {
                  const track = state.track_window.current_track;
                  const position = state.position;
                  const duration = state.duration;

                  document.getElementById('track-info').innerHTML = \`
                      <img src="\${track.album.images[0].url}" alt="Album cover" width="100" />
                      <p>Currently Playing: \${track.name}</p>
                      <p>Artist: \${track.artists.map(artist => artist.name).join(', ')}</p>
                      <p>Progress: \${formatTime(position)} / \${formatTime(duration)}</p>
                      <progress value="\${position}" max="\${duration}"></progress>
                  \`;
              }

              function formatTime(ms) {
                  const minutes = Math.floor(ms / 60000);
                  const seconds = Math.floor((ms % 60000) / 1000);
                  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
              }
          </script>
      </body>
      </html>
    `);
});

// Handle API requests for now playing
app.get('/api/now-playing', nowPlaying);
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/api/now-playing`);
});
