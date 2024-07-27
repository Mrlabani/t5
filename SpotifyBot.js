const TELEGRAM_BOT_TOKEN = '7390073945:AAEXdd_b9M9FWvX4MpaoHSEg1CthPRqSjsY'; // Replace with your Telegram bot token
const SPOTIFY_CLIENT_ID = 'b9c2df50c0df4676bb9c8525d8dc586b'; // Replace with your Spotify client ID
const SPOTIFY_CLIENT_SECRET = 'd859816a46bb412eafd716d9056629bd'; // Replace with your Spotify client secret

// Function to get Spotify token
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
        const errorText = await response.text();
        console.error('Failed to get Spotify token:', errorText);
        throw new Error('Failed to get Spotify token');
    }

    const data = await response.json();
    return data.access_token;
}

// Function to search Spotify
async function searchSpotify(query) {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to search Spotify:', errorText);
        throw new Error('Failed to search Spotify');
    }

    const data = await response.json();
    return data.tracks.items;
}

// Function to handle Telegram updates
async function handleUpdate(update) {
    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text.toLowerCase() === '/start') {
        await sendMessage(chatId, "Welcome to the Spotify Downloader Bot! Use the following commands:\n/start - Welcome message\n/help - Get help information\n/full <song name> - Get full track link");
    } else if (text.toLowerCase() === '/help') {
        await sendMessage(chatId, "To use this bot, send me a song name to get the full track link. Use /full <song name>.");
    } else if (text.toLowerCase().startsWith('/full ')) {
        const query = text.substring('/full '.length);
        await handleFullTrack(chatId, query);
    } else {
        await sendMessage(chatId, "Unknown command. Use /help for a list of commands.");
    }
}

// Function to handle full track request
async function handleFullTrack(chatId, query) {
    try {
        const tracks = await searchSpotify(query);
        if (tracks.length > 0) {
            const buttons = tracks.map(track => ({
                text: `${track.name} by ${track.artists[0].name}`,
                callback_data: `track:${track.id}`
            }));

            const inlineKeyboard = {
                inline_keyboard: [buttons]
            };

            const responseText = "I found the following tracks. Please choose one:";
            await sendMessage(chatId, responseText, inlineKeyboard);
        } else {
            await sendMessage(chatId, "Sorry, I couldn't find that song. Please try another.");
        }
    } catch (error) {
        console.error('Error handling full track request:', error);
        await sendMessage(chatId, "An error occurred while processing your request. Please try again later.");
    }
}

// Function to handle callback queries
async function handleCallbackQuery(update) {
    const chatId = update.callback_query.message.chat.id;
    const trackId = update.callback_query.data.split(':')[1];

    try {
        const trackInfo = await getTrackInfo(trackId);

        const responseText = `Here is your track:\n` +
                             `**Title:** ${trackInfo.name}\n` +
                             `**Artist:** ${trackInfo.artist}\n` +
                             `**Album:** ${trackInfo.album}\n` +
                             `**Duration:** ${formatDuration(trackInfo.duration_ms)}\n` +
                             `**Release Date:** ${trackInfo.release_date}\n` +
                             `**File Size (approx.):** 4-6 MB (based on streaming quality)\n` +
                             `**Full Track:** [Listen on Spotify](${trackInfo.url})`;

        await sendMessage(chatId, responseText, null, true);
    } catch (error) {
        console.error('Error handling callback query:', error);
        await sendMessage(chatId, "An error occurred while processing your request. Please try again later.");
    }
}

// Function to get track information
async function getTrackInfo(trackId) {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get track info:', errorText);
        throw new Error('Failed to get track info');
    }

    const trackInfo = await response.json();
    return {
        name: trackInfo.name,
        artist: trackInfo.artists[0].name,
        album: trackInfo.album.name,
        duration_ms: trackInfo.duration_ms,
        release_date: trackInfo.album.release_date,
        url: trackInfo.external_urls.spotify
    };
}

// Function to format duration
function formatDuration(duration_ms) {
    const minutes = Math.floor(duration_ms / 60000);
    const seconds = Math.round((duration_ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Function to send messages
async function sendMessage(chatId, text, replyMarkup = null, parseMode = false) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: text,
        reply_markup: replyMarkup ? JSON.stringify(replyMarkup) : undefined,
        parse_mode: parseMode ? 'Markdown' : undefined
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send message:', errorText);
        throw new Error('Failed to send message');
    }
}

// Main function to handle requests
async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            if (update.message) {
                await handleUpdate(update);
            } else if (update.callback_query) {
                await handleCallbackQuery(update);
            }
            return new Response('ok', { status: 200 });
        } catch (error) {
            console.error('Error handling request:', error);
            return new Response('Bad Request', { status: 400 });
        }
    } else {
        return new Response('bot running...🍃', { status: 405 });
    }
}

// Event listener for fetch events
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
