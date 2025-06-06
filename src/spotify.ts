// Spotify API integration
// Simple reactive implementation
type Ref<T> = { value: T };
function ref<T>(initialValue: T): Ref<T> {
  return { value: initialValue };
}

// Load environment variables from .env
const CLIENT_ID = '1790b2bb99c14557a7890f84d063049f';
const REDIRECT_URI = 'https://jasperhuting.github.io/shuffler/';

// Scopes for authorization
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read'
];

// State for authentication
export const accessToken = ref<string | null>(null);
export const userProfile = ref<any>(null);
export const topTracks = ref<any[]>([]);
export const isAuthenticated = ref(false);
export const authError = ref<string | null>(null);

/**
 * Generate a random string for the state parameter
 */
function generateRandomString(length: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Parse the access token from the URL hash
 */
export function parseHash(): void {
  if (window.location.hash) {
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1) // remove the #
    );
    
    const token = hashParams.get('access_token');
    const error = hashParams.get('error');
    
    if (token) {
      accessToken.value = token;
      isAuthenticated.value = true;
      
      // Clear the hash from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Store the token in session storage
      sessionStorage.setItem('spotify_access_token', token);
    } else if (error) {
      authError.value = error;
    }
  } else {
    // Check if we have a token in session storage
    const storedToken = sessionStorage.getItem('spotify_access_token');
    if (storedToken) {
      accessToken.value = storedToken;
      isAuthenticated.value = true;
    }
  }
}

/**
 * Get the authorization URL for the Spotify API
 */
export function getAuthorizationUrl(): string {
  const state = generateRandomString(16);
  
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  
  return authUrl.toString();
}

/**
 * Redirect to Spotify authorization page
 */
export function login(): void {
  window.location.href = getAuthorizationUrl();
}

/**
 * Logout from Spotify
 */
export function logout(): void {
  accessToken.value = null;
  userProfile.value = null;
  topTracks.value = [];
  isAuthenticated.value = false;
  sessionStorage.removeItem('spotify_access_token');
}

/**
 * Make an API call to Spotify Web API
 */
async function fetchWebApi(endpoint: string, method: string, body?: any): Promise<any> {
  if (!accessToken.value) {
    throw new Error('No access token available. Please login first.');
  }

  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json'
    },
    method,
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      // Token expired
      logout();
      throw new Error('Your session has expired. Please login again.');
    }
    
    const errorText = await res.text();
    throw new Error(`API call failed with status: ${res.status} - ${errorText}`);
  }
  
  return await res.json();
}

/**
 * Get the user's profile
 */
export async function getUserProfile(): Promise<any> {
  try {
    const data = await fetchWebApi('v1/me', 'GET');
    userProfile.value = data;
    return data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
}

/**
 * Get the user's top tracks
 */
export async function getTopTracks(timeRange: string = 'medium_term', limit: number = 20): Promise<any[]> {
  try {
    const data = await fetchWebApi(
      `v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, 'GET'
    );
    topTracks.value = data.items;
    return data.items;
  } catch (error) {
    console.error('Failed to get top tracks:', error);
    throw error;
  }
}
