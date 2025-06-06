import './style.css'
import { parseHash, login, logout, isAuthenticated, getUserProfile, getTopTracks } from './spotify'

// Parse the hash on page load to check for authentication callback
parseHash();

// Main app container
const appDiv = document.querySelector<HTMLDivElement>('#app')!

// Function to render the app based on authentication state
function renderApp() {
  if (isAuthenticated.value) {
    renderAuthenticatedApp();
  } else {
    renderLoginScreen();
  }
}

// Render login screen
function renderLoginScreen() {
  appDiv.innerHTML = `
    <div class="container">
      <h1>Spotify Shuffler</h1>
      <p>Connect with your Spotify account to see your top tracks.</p>
      <button id="login-button" class="btn primary">Connect with Spotify</button>
    </div>
  `;
  
  // Add event listener to login button
  document.querySelector('#login-button')?.addEventListener('click', () => {
    login();
  });
}

// Render authenticated app
function renderAuthenticatedApp() {
  appDiv.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>Spotify Shuffler</h1>
        <div id="user-profile">Loading profile...</div>
        <button id="logout-button" class="btn secondary">Logout</button>
      </div>
      
      <div class="content">
        <h2>Your Top Tracks</h2>
        <div class="time-range-selector">
          <button class="btn time-range active" data-range="short_term">Last Month</button>
          <button class="btn time-range" data-range="medium_term">Last 6 Months</button>
          <button class="btn time-range" data-range="long_term">All Time</button>
        </div>
        <div id="tracks-container" class="tracks-container">
          <p>Loading your top tracks...</p>
        </div>
      </div>
    </div>
  `;
  
  // Add event listener to logout button
  document.querySelector('#logout-button')?.addEventListener('click', () => {
    logout();
    renderApp();
  });
  
  // Add event listeners to time range buttons
  document.querySelectorAll('.time-range').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const range = target.dataset.range || 'medium_term';
      
      // Update active button
      document.querySelectorAll('.time-range').forEach(btn => {
        btn.classList.remove('active');
      });
      target.classList.add('active');
      
      // Load tracks for selected time range
      loadTopTracks(range);
    });
  });
  
  // Load user profile and tracks
  loadUserProfile();
  loadTopTracks('medium_term');
}

// Load user profile
async function loadUserProfile() {
  try {
    const profile = await getUserProfile();
    const profileDiv = document.querySelector('#user-profile');
    if (profileDiv && profile) {
      profileDiv.innerHTML = `
        <div class="profile">
          ${profile.images && profile.images.length > 0 ? 
            `<img src="${profile.images[0].url}" alt="${profile.display_name}" class="profile-image">` : 
            ''
          }
          <span>${profile.display_name || profile.id}</span>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Load top tracks
async function loadTopTracks(timeRange = 'medium_term') {
  try {
    const tracks = await getTopTracks(timeRange);
    const tracksContainer = document.querySelector('#tracks-container');
    
    if (tracksContainer) {
      if (tracks && tracks.length > 0) {
        tracksContainer.innerHTML = `
          <ul class="tracks-list">
            ${tracks.map((track, index) => `
              <li class="track-item">
                <span class="track-number">${index + 1}</span>
                <div class="track-image">
                  ${track.album.images && track.album.images.length > 0 ?
                    `<img src="${track.album.images[track.album.images.length - 1].url}" alt="${track.name}">` :
                    ''
                  }
                </div>
                <div class="track-info">
                  <div class="track-name">${track.name}</div>
                  <div class="track-artist">${track.artists.map((artist: { name: string }) => artist.name).join(', ')}</div>
                </div>
                <a href="${track.external_urls.spotify}" target="_blank" class="track-play">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </a>
              </li>
            `).join('')}
          </ul>
        `;
      } else {
        tracksContainer.innerHTML = `<p>No tracks found. Try a different time range.</p>`;
      }
    }
  } catch (error) {
    console.error('Error loading tracks:', error);
    const tracksContainer = document.querySelector('#tracks-container');
    if (tracksContainer) {
      tracksContainer.innerHTML = `<p>Error loading tracks. Please try again later.</p>`;
    }
  }
}

// Initial render
renderApp();
