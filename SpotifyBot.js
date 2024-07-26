addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'POST') {
    const body = await request.json();

    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;

      if (text) {
        if (text.startsWith('/ping')) {
          const uptime = getUptime();
          const serverStatus = `
🏓 Pong!
Server Status:
- Uptime: ${uptime}
- Current Time: ${new Date().toISOString()}
          `;
          await sendMessage(chatId, serverStatus);
        } else if (text.startsWith('/help')) {
          const helpMessage = `
Available Commands:
/ping - Check server status and if the bot is alive
/help - Show this help message
/dl [track name] - Search for Spotify tracks
Upload a high-quality track file to get a confirmation message
          `;
          await sendMessage(chatId, helpMessage);
        } else if (text.startsWith('/dl ')) {
          const query = text.slice(4).trim();
          if (query.length > 0) {
            const results = await searchSpotify(query);
            const message = results.length > 0 
              ? results.map(track => `${track.title} by ${track.artists}\nStream on Spotify: [Listen](${track.url})`).join('\n\n')
              : 'No results found.';
            await sendMessage(chatId, message);
          } else {
            await sendMessage(chatId, 'Please provide a track name after the /dl command.');
          }
        } else {
          await sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
        }
      }
    }

    if (body.message && body.message.audio) {
      const chatId = body.message.chat.id;
      const fileId = body.message.audio.file_id;
      const fileName = body.message.audio.file_name || 'Unnamed track';
      const duration = body.message.audio.duration;
      const fileSize = body.message.audio.file_size;

      const startTime = Date.now();
      const fileUrl = await getFileUrl(fileId);
      const endTime = Date.now();
      const downloadTime = (endTime - startTime) / 1000;
      const downloadSpeed = (fileSize / downloadTime / (1024 * 1024)).toFixed(2); // MB/s

      const confirmationMessage = `
Received high-quality track: ${fileName}
Duration: ${duration} seconds
File URL: ${fileUrl}
File Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB
Download Speed: ${downloadSpeed} MB/s
      `;
      await sendMessage(chatId, confirmationMessage);
    }

    console.log(JSON.stringify(body, null, 2));

    return new Response('NOOB Developer', {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  return new Response('NOOB Developer', {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

function getUptime() {
  const now = Date.now();
  const startTime = new Date(globalThis.__START_TIME || now);
  globalThis.__START_TIME = startTime;
  const uptimeMilliseconds = now - startTime.getTime();
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const uptimeDays = Math.floor(uptimeHours / 24);
  
  return `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`;
}

async function searchSpotify(query) {
  const clientId = 'b9c2df50c0df4676bb9c8525d8dc586b';
  const clientSecret = 'd859816a46bb412eafd716d9056629bd';

  const authResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const searchData = await searchResponse.json();
  const tracks = searchData.tracks.items;

  return tracks.map(track => ({
    title: track.name,
    artists: track.artists.map(artist => artist.name).join(', '),
    url: track.external_urls.spotify,
    thumb_url: track.album.images[0]?.url
  }));
}

async function getFileUrl(fileId) {
  const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
  const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const fileData = await fileResponse.json();
  const filePath = fileData.result.file_path;
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

async function sendMessage(chatId, text) {
  const botToken = '7404279399:AAFlyzqSlcz4VkBM5Z-x4-zxzQNBf4Xydvk';
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}
