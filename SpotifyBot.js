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

    // Check if the update contains an inline query
    if (body.inline_query) {
      const queryId = body.inline_query.id
      const query = body.inline_query.query

      const results = await searchSpotify(query)
      await answerInlineQuery(queryId, results)
    }

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
  const botToken = '7404279399:AAFlyzqSlcz4VkBM5Z-x4-zxzQNBf4Xydvk'
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
