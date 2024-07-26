const SPOTIPY_CLIENT_ID = 'b9c2df50c0df4676bb9c8525d8dc586b';
const SPOTIPY_CLIENT_SECRET = 'd859816a46bb412eafd716d9056629bd';

// Get an access token from Spotify
async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(SPOTIPY_CLIENT_ID + ':' + SPOTIPY_CLIENT_SECRET),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

// Search for tracks by name
async function searchTracks(query, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch track data');
    }

    return response.json();
}

// Handle HTTP requests
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.searchParams.get('q');

    if (path === '/credits') {
        // Return credit information
        const credits = {
            "Script Credit": "NOOB Developer",
            "Description": "This script uses the Spotify API to search for tracks by name.",
            "Version": "1.0",
            "Documentation": "https://developer.spotify.com/documentation/web-api/"
        };
        return new Response(JSON.stringify(credits), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (path === '/' && query) {
        try {
            const accessToken = await getAccessToken();
            const searchResults = await searchTracks(query, accessToken);
            
            if (searchResults.tracks.items.length > 0) {
                const track = searchResults.tracks.items[0];
                const trackDetails = {
                    "Track Name": track.name,
                    "Artist": track.artists.map(artist => artist.name).join(', '),
                    "Album": track.album.name,
                    "Release Date": track.album.release_date,
                    "Preview URL": track.preview_url,
                    "Spotify URL": track.external_urls.spotify,
                    "Note": "Script developed by NOOB Developer"
                };

                return new Response(JSON.stringify(trackDetails), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return new Response('No tracks found', { status: 404 });
            }
        } catch (error) {
            return new Response('Error fetching data from Spotify', { status: 500 });
        }
    } else {
        return new Response('Please provide a query parameter `q` with the song name or use `/credits` for script credits', { status: 400 });
    }
}
