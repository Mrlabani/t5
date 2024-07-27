addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; // Replace with your actual bot token
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Handles incoming requests
async function handleRequest(request) {
  if (request.method === 'POST') {
    try {
      const update = await request.json();
      console.log('Received update:', update); // Log the incoming update for debugging

      if (!update.message || !update.message.text) {
        console.log('Invalid update structure:', update);
        return new Response('Invalid update structure', { status: 400 });
      }

      const { chat, text } = update.message;
      const chatId = chat.id;

      // Convert text to JSON format
      const jsonResponse = JSON.stringify({ text: text }, null, 2); // Pretty-print JSON

      // Send the JSON response back to the user with credit
      const responseText = `${jsonResponse}\n\nCredit: @l_abani 🍃`;
      await sendMessage(chatId, responseText);

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  } else {
    return new Response('Method Not Allowed', { status: 405 });
  }
}

// Sends a message to the specified chat
async function sendMessage(chatId, text) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json(); // Read the response from Telegram
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText} - ${responseBody.description}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
