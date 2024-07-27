const TELEGRAM_BOT_TOKEN = '7390073945:AAHgJqfyV2nXaM2SCFyaf8k1sCSGZ1L91Q0'; // Replace with your Telegram bot token
const SPOTIFY_CLIENT_ID = 'b9c2df50c0df4676bb9c8525d8dc586b'; // Replace with your Spotify client ID
const SPOTIFY_CLIENT_SECRET = 'd859816a46bb412eafd716d9056629bd'; // Replace with your Spotify client secret

async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        console.error('Failed to get Spotify token:', await response.text());
        throw new Error('Failed to get Spotify token');
    }

    const data = await response.json();
    return data.access_token;
}

async function searchSpotify(query) {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        console.error('Failed to search Spotify:', await response.text());
        throw new Error('Failed to search Spotify');
    }

    const data = await response.json();
    return data;
}

async function handleUpdate(update) {
    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text.toLowerCase() === '/start') {
        await sendMessage(chatId, "Welcome to the Spotify Downloader Bot! Use the following commands:\n/start - Welcome message\n/help - Get help information\n<song name> - Search for a song");
    } else if (text.toLowerCase() === '/help') {
        await sendMessage(chatId, "To use this bot, send me a song name or a Spotify URL to search for tracks. For more details, visit the [Spotify API documentation](https://developer.spotify.com/documentation/web-api/).");
    } else {
        try {
            const searchResults = await searchSpotify(text);
            const track = searchResults.tracks.items[0];
            if (track) {
                const responseText = `I found:\nTitle: ${track.name}\nArtist: ${track.artists[0].name}\nAlbum: ${track.album.name}\nRelease Date: ${track.album.release_date}\nPreview: ${track.preview_url ? track.preview_url : 'No preview available'}`;
                await sendMessage(chatId, responseText);
            } else {
                await sendMessage(chatId, "Sorry, I couldn't find that song. Please try another.");
            }
        } catch (error) {
            console.error('Error handling update:', error);
            await sendMessage(chatId, "An error occurred while processing your request. Please try again later.");
        }
    }
}

async function sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: text,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        console.error('Failed to send message:', await response.text());
        throw new Error('Failed to send message');
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            await handleUpdate(update);
            return new Response('ok', { status: 200 });
        } catch (error) {
            console.error('Error handling request:', error);
            return new Response('Bad Request', { status: 400 });
        }
    } else {
        return new Response('Method Not Allowed', { status: 405 });
    }
}
