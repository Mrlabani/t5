/**
 * Telegram Bot and Spotify Integration
 * Developed by NOOB Developer
 * 
 * This Cloudflare Worker script interacts with a Telegram bot and Spotify API.
 * It handles inline queries and provides track information with streaming links.
 * 
 * This script allows users to search for tracks on Spotify and receive results
 * directly in their Telegram chat as inline results.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Check if this is a POST request from Telegram
  if (request.method === 'POST') {
    const body = await request.json()

    // Check if the update contains a message
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text

      if (text === '/ping') {
        const uptime = getUptime()
        const serverStatus = `
🏓 Pong!
Server Status:
- Uptime: ${uptime}
- Current Time: ${new Date().toISOString()}
        `
        await sendMessage(chatId, serverStatus)
      } else if (text === '/help') {
        const helpMessage = `
Available Commands:
/ping - Check server status and if the bot is alive
/help - Show this help message
Use inline queries to search for Spotify tracks by typing @YourBotName track name
        `
        await sendMessage(chatId, helpMessage)
      }

      return new Response('NOOB Developer', {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    // Check if the update contains an inline query
    if (body.inline_query) {
      const queryId = body.inline_query.id
      const query = body.inline_query.query

      const results = await searchSpotify(query)
      await answerInlineQuery(queryId, results)

      return new Response('NOOB Developer', {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    // Log the request for debugging purposes
    console.log(JSON.stringify(body, null, 2))
    
    // Respond to Telegram's webhook with a credit message
    return new Response('NOOB Developer', {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }

  // Default response for other types of requests
  return new Response('NOOB Developer', {
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}

function getUptime() {
  // This is a simulation. Cloudflare Workers do not provide direct server uptime.
  // We'll use the Worker instantiation time as a reference for uptime.
  const now = Date.now()
  const startTime = new Date(globalThis.__START_TIME || now)
  globalThis.__START_TIME = startTime
  const uptimeMilliseconds = now - startTime.getTime()
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000)
  const uptimeMinutes = Math.floor(uptimeSeconds / 60)
  const uptimeHours = Math.floor(uptimeMinutes / 60)
  const uptimeDays = Math.floor(uptimeHours / 24)
  
  return `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
}

async function searchSpotify(query) {
  const clientId = 'b9c2df50c0df4676bb9c8525d8dc586b'
  const clientSecret = 'd859816a46bb412eafd716d9056629bd'
  
  // Get access token
  const authResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  
  const authData = await authResponse.json()
  const accessToken = authData.access_token
  
  // Search for tracks
  const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  const searchData = await searchResponse.json()
  const tracks = searchData.tracks.items
  
  // Format results for inline query with streaming links
  return tracks.map(track => ({
    type: 'article',
    id: track.id,
    title: track.name,
    input_message_content: {
      message_text: `${track.name} by ${track.artists.map(artist => artist.name).join(', ')}\nStream on Spotify: [Listen](${track.external_urls.spotify})`
    },
    thumb_url: track.album.images[0]?.url // Use thumbnail image
  }))
}

async function answerInlineQuery(queryId, results) {
  const botToken = 'YOUR_TELEGRAM_BOT_TOKEN'
  const telegramUrl = `https://api.telegram.org/bot${botToken}/answerInlineQuery`
  
  await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: results
    })
  })
}

async function sendMessage(chatId, text) {
  const botToken = '7404279399:AAFlyzqSlcz4VkBM5Z-x4-zxzQNBf4Xydvk'
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
  
  await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  })
}
