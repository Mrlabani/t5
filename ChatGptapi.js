addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI API key
const OPENAI_API_KEY = '';

async function handleRequest(request) {
  try {
    if (request.method === 'POST' || request.method === 'GET') {
      let prompt;

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
          credit: '@l_abani'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.7,
          top_p: 1.0,
          presence_penalty: 0.0
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(`OpenAI API request failed with status ${apiResponse.status}: ${errorData.error.message}`);
      }

      const data = await apiResponse.json();
      return new Response(JSON.stringify({
        data: data,
        status: 'Success',
        credit: '@l_abani'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        status: 'Failed',
        credit: '@l_abani'
      }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Error:', error); // Log error for debugging
    return new Response(JSON.stringify({
      error: error.message || 'Error processing request',
      status: 'Failed',
      credit: '@l_abani'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Script credit: @l_abani
