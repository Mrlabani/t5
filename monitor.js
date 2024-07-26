addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Define constants
  const TELEGRAM_TOKEN = '7345359907:AAFr7gmeUSgms6gtERtIEW__X9O3BRwI0oM';
  const UPTIME_ROBOT_API_KEY = 'u2609359-a151f43eb2a64609ef37cb4d';
  const UPTIME_ROBOT_API_URL = 'https://api.uptimerobot.com/v2/';

  // Handle incoming Telegram updates
  if (request.method === 'POST' && url.pathname === '/webhook') {
    const update = await request.json();

    if (update.message) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      if (messageText.startsWith('/get_monitors')) {
        return await getMonitors(chatId);
      } else if (messageText.startsWith('/new_monitor')) {
        const params = messageText.split(' ');
        if (params.length < 4) {
          return await sendMessage(chatId, 'Usage: /new_monitor <friendly_name> <url> <type>');
        }
        return await newMonitor(chatId, params[1], params[2], params[3]);
      } else if (messageText.startsWith('/delete_monitor')) {
        const params = messageText.split(' ');
        if (params.length < 2) {
          return await sendMessage(chatId, 'Usage: /delete_monitor <monitor_id>');
        }
        return await deleteMonitor(chatId, params[1]);
      } else if (messageText.startsWith('/help')) {
        return await sendHelp(chatId);
      } else {
        return await sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
      }
    }
  }

  return new Response('Not found', { status: 404 });
}

async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
  return response.ok;
}

async function sendHelp(chatId) {
  const helpMessage = `
Available commands:
/get_monitors - Get the status of all monitors
/new_monitor <friendly_name> <url> <type> - Create a new monitor
/delete_monitor <monitor_id> - Delete a monitor
/help - Show this help message
`;
  return await sendMessage(chatId, helpMessage);
}

async function getMonitors(chatId) {
  const response = await fetch(UPTIME_ROBOT_API_URL + 'getMonitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `api_key=${UPTIME_ROBOT_API_KEY}&format=json`
  });
  
  const data = await response.json();
  
  if (data.monitors && data.monitors.length > 0) {
    let statusMessage = 'Uptime Robot Monitors:\n';
    data.monitors.forEach(monitor => {
      statusMessage += `Name: ${monitor.friendly_name}, URL: ${monitor.url}, Status: ${monitor.status}\n`;
    });
    return await sendMessage(chatId, statusMessage);
  } else {
    return await sendMessage(chatId, 'No monitors found.');
  }
}

async function newMonitor(chatId, friendly_name, url, type) {
  const response = await fetch(UPTIME_ROBOT_API_URL + 'newMonitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `api_key=${UPTIME_ROBOT_API_KEY}&format=json&type=${type}&url=${url}&friendly_name=${friendly_name}`
  });

  const data = await response.json();

  if (data.stat === 'ok') {
    return await sendMessage(chatId, `Monitor created successfully: ${friendly_name}`);
  } else {
    return await sendMessage(chatId, `Failed to create monitor: ${data.error.message}`);
  }
}

async function deleteMonitor(chatId, id) {
  const response = await fetch(UPTIME_ROBOT_API_URL + 'deleteMonitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `api_key=${UPTIME_ROBOT_API_KEY}&format=json&id=${id}`
  });

  const data = await response.json();

  if (data.stat === 'ok') {
    return await sendMessage(chatId, `Monitor deleted successfully: ${id}`);
  } else {
    return await sendMessage(chatId, `Failed to delete monitor: ${data.error.message}`);
  }
}
