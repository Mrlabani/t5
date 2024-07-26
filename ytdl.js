addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

// Track the start time for uptime calculation and request count
const startTime = Date.now();
let requestCount = 0;

// Replace with your channel username (without @)
const REQUIRED_CHANNEL = '@NOOBPrivate';

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const message = body.message;

            if (message && message.text) {
                const chatId = message.chat.id;
                const text = message.text.trim().toLowerCase();

                requestCount++; // Increment request count

                // Check if the user is subscribed to the required channel
                const isSubscribed = await checkSubscription(chatId);

                if (!isSubscribed) {
                    await sendMessage(chatId, `Please subscribe to our channel ${REQUIRED_CHANNEL} to use the bot.`);
                    return new Response('OK', { status: 200 });
                }

                if (text.startsWith('/download')) {
                    const [command, ...args] = text.split(' ');
                    const url = args[0];
                    const quality = args.slice(1).join(' ') || 'best'; // Default to 'best' quality if none provided

                    if (url) {
                        let downloadLink;
                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                            // Handle YouTube URLs
                            downloadLink = await downloadFromYouTube(url, command, quality);
                        } else {
                            // Handle Terabox URLs
                            downloadLink = await downloadFromTerabox(url);
                        }

                        if (downloadLink) {
                            await sendMessage(chatId, `Here is your download link: ${downloadLink}`);
                        } else {
                            await sendMessage(chatId, 'Failed to retrieve the download link.');
                        }
                    } else {
                        await sendMessage(chatId, 'Please provide a valid URL.');
                    }
                } else if (text === '/ping') {
                    await sendMessage(chatId, 'Pong!');
                } else if (text === '/uptime') {
                    const uptime = getUptime();
                    await sendMessage(chatId, `Bot uptime: ${uptime}`);
                } else if (text === '/status') {
                    const status = await getStatus();
                    await sendMessage(chatId, `Bot status:\n${status}`);
                } else if (text === '/help') {
                    await sendMessage(chatId, getHelpText());
                } else if (text.startsWith('/broadcast')) {
                    const [command, ...args] = text.split(' ');
                    const broadcastMessage = args.join(' ');

                    if (broadcastMessage) {
                        await sendBroadcast(broadcastMessage);
                        await sendMessage(chatId, 'Broadcast message sent.');
                    } else {
                        await sendMessage(chatId, 'Please provide a message to broadcast.');
                    }
                } else if (text === '/stats') {
                    const stats = getStats();
                    await sendMessage(chatId, `Bot stats:\n${stats}`);
                } else if (text === '/restart') {
                    await sendMessage(chatId, 'Bot is restarting...');
                    // Simulating restart logic here
                } else {
                    await sendMessage(chatId, 'Invalid command. Use /download <URL> [quality], /ping, /uptime, /status, /help, /broadcast <message>, /stats, or /restart');
                }
            }
        } catch (error) {
            console.error('Error handling request:', error);
            return new Response('Error processing request', { status: 500 });
        }
    }

    return new Response('OK', { status: 200 });
}

function getUptime() {
    const uptimeMs = Date.now() - startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days} days, ${hours % 24} hours, ${minutes % 60} minutes, ${seconds % 60} seconds`;
}

async function getStatus() {
    // Example: Return basic status information
    const uptime = getUptime();
    return `Uptime: ${uptime}\nStatus: Running\nRequests Handled: ${requestCount}`;
}

function getHelpText() {
    return `Available commands:
    /download <URL> [quality] - Download files from Terabox or YouTube with specified quality. Quality options for YouTube include 'best', '720p', '480p', '360p', etc.
    /ping - Check if the bot is active.
    /uptime - Get the bot's uptime.
    /status - Get the bot's status.
    /help - Get a list of available commands.
    /broadcast <message> - Broadcast a message to all users (simulated here).
    /stats - Get bot statistics.
    /restart - Restart the bot (simulated here).`;
}

async function sendBroadcast(message) {
    // Example: Simulate broadcasting a message to all users
    // Implement actual broadcasting logic if needed
    console.log(`Broadcasting message: ${message}`);
}

function getStats() {
    // Return bot statistics
    return `Requests Handled: ${requestCount}`;
}

async function downloadFromYouTube(url, command, quality) {
    // Example: Replace with actual YouTube download logic
    try {
        let apiUrl;
        if (command === '/downloadvideo') {
            apiUrl = `https://noob-ytdl-api.lbni.workers.dev/download/video?url=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}`;
        } else if (command === '/downloadsongs') {
            apiUrl = `https://noob-ytdl-api.lbni.workers.dev/download/song?url=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}`;
        } else if (command === '/downloadplaylist') {
            apiUrl = `https://noob-ytdl-api.lbni.workers.dev/download/playlist?url=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}`;
        } else {
            return null;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error('Error downloading from YouTube:', response.statusText);
            return null;
        }

        const responseData = await response.json();
        return responseData.downloadLink; // Adjust based on actual API response
    } catch (error) {
        console.error('Error fetching YouTube content:', error);
        return null;
    }
}

async function downloadFromTerabox(url) {
    // Example: Replace with actual Terabox download logic
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Error downloading from Terabox:', response.statusText);
            return null;
        }

        const responseData = await response.json();
        return responseData.downloadLink; // Adjust based on actual API response
    } catch (error) {
        console.error('Error fetching Terabox file:', error);
        return null;
    }
}

async function sendMessage(chatId, text) {
    const token = '7342764885:AAGw5qWi7LUhY6z4lFKWQO-C5-g86Bgjkbc'; // Replace with your Telegram bot token
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const payload = {
        chat_id: chatId,
        text: text
    };

    const init = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch(url, init);
        if (!response.ok) {
            console.error('Error sending message to Telegram:', await response.text());
        }
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
    }
}

async function checkSubscription(chatId) {
    const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // Replace with your Telegram bot token
    const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${REQUIRED_CHANNEL}&user_id=${chatId}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.ok && data.result.status === 'member') {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}
