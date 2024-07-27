addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const RATE_LIMIT = 5; // Number of allowed requests per minute
const RATE_LIMIT_CACHE = new Map(); // Cache to store request timestamps

async function handleRequest(request) {
  if (request.method === 'POST' || request.method === 'GET') {
    // Basic rate limiting
    if (isRateLimited(request)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        status: 'Failed',
        message: 'Join our channel @NOOBDeveloper for more updates!',
        credit: '@l_abani'
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    let prompt;

    try {
      if (request.method === 'POST') {
        const requestData = await request.json();
        prompt = requestData.prompt;
      } else if (request.method === 'GET') {
        const url = new URL(request.url);
        prompt = url.searchParams.get('ques');
      }

      if (!prompt) {
        return new Response(JSON.stringify({
          error: 'Missing prompt in request',
          status: 'Failed',
          message: 'Join our channel @NOOBDeveloper for more updates!',
          credit: '@l_abani'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Retrieve the API key from secrets
      const apiKey = OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not set');
      }

      const apiUrl = 'https://api.openai.com/v1/chat/completions'; // Ensure this is the correct endpoint

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Default model
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,         // Default max tokens
          temperature: 0.7,        // Default temperature
          top_p: 1.0,              // Default top_p
          presence_penalty: 0.0    // Default presence penalty
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const status = response.ok ? 'Success' : 'Failed';

      return new Response(JSON.stringify({
        data: data,
        status: status,
        message: 'Join our channel @NOOBDeveloper for more updates!',
        credit: '@l_abani'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error:', error); // Log error for debugging
      return new Response(JSON.stringify({
        error: error.message || 'Error processing request',
        status: 'Failed',
        message: 'Join our channel @NOOBDeveloper for more updates!',
        credit: '@l_abani'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      status: 'Failed',
      message: 'Join our channel @NOOBDeveloper for more updates!',
      credit: '@l_abani'
    }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
}

function isRateLimited(request) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'; // Use IP for rate limiting
  
  if (!RATE_LIMIT_CACHE.has(ip)) {
    RATE_LIMIT_CACHE.set(ip, []);
  }

  const timestamps = RATE_LIMIT_CACHE.get(ip);
  // Remove timestamps older than one minute
  const oneMinuteAgo = now - 60000;
  while (timestamps.length > 0 && timestamps[0] < oneMinuteAgo) {
    timestamps.shift();
  }
  
  timestamps.push(now);

  return timestamps.length > RATE_LIMIT;
}

// Script credit: @l_abani
