addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const url = new URL(request.url);

    if (request.method === 'POST') {
      const body = await request.json();
      console.log('Request body:', JSON.stringify(body, null, 2));

      if (body.message) {
        await handleTelegramMessage(body.message);
      } else if (body.inline_query) {
        await handleInlineQuery(body.inline_query);
      }

      return new Response('NOOB Developer', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response('NOOB Developer', {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response('Error handling request', { status: 500 });
  }
}

async function handleTelegramMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;

  if (text) {
    if (text.startsWith('/ping')) {
      const uptime = getUptime();
      const serverStatus = `🏓 Pong!\nServer Status:\n- Uptime: ${uptime}\n- Current Time: ${new Date().toISOString()}`;
      await sendMessage(chatId, serverStatus);
    } else if (text.startsWith('/help')) {
      const helpMessage = `Available Commands:\n/ping - Check server status and if the bot is alive\n/help - Show this help message\n/add [data] - Add data to MongoDB\n/get [query] - Get data from MongoDB\n/delete [query] - Delete data from MongoDB`;
      await sendMessage(chatId, helpMessage);
    } else if (text.startsWith('/add ')) {
      const data = text.slice(5).trim();
      await addDataToMongoDB(data);
      await sendMessage(chatId, 'Data added to MongoDB.');
    } else if (text.startsWith('/get ')) {
      const query = text.slice(5).trim();
      const result = await getDataFromMongoDB(query);
      await sendMessage(chatId, `Data retrieved: ${JSON.stringify(result)}`);
    } else if (text.startsWith('/delete ')) {
      const query = text.slice(8).trim();
      await deleteDataFromMongoDB(query);
      await sendMessage(chatId, 'Data deleted from MongoDB.');
    } else {
      await sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
    }
  }
}

async function handleInlineQuery(inlineQuery) {
  const inlineQueryId = inlineQuery.id;
  const query = inlineQuery.query;
  const results = await searchFiles(query);
  await answerInlineQuery(inlineQueryId, results);
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

async function addDataToMongoDB(data) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const collection = client.db('mrnoobx').collection('Files');
    await collection.insertOne({ data });
  } finally {
    await client.close();
  }
}

async function getDataFromMongoDB(query) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const collection = client.db('mrnoobx').collection('Files');
    const result = await collection.find({ data: new RegExp(query, 'i') }).toArray();
    return result;
  } finally {
    await client.close();
  }
}

async function deleteDataFromMongoDB(query) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const collection = client.db('mrnoobx').collection('Files');
    await collection.deleteOne({ data: new RegExp(query, 'i') });
  } finally {
    await client.close();
  }
}

async function searchFiles(query) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const collection = client.db('mrnoobx').collection('Files');
    const results = await collection.find({ data: new RegExp(query, 'i') }).toArray();
    return results.map((result, index) => ({
      type: 'article',
      id: String(index),
      title: result.data,
      input_message_content: { message_text: result.data }
    }));
  } finally {
    await client.close();
  }
}

async function answerInlineQuery(inlineQueryId, results) {
  const botToken = '7404279399:AAGYlx-e66Yf_wMu-3uxeUC7SALuEnu84y4';
  const telegramUrl = `https://api.telegram.org/bot${botToken}/answerInlineQuery`;

  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: inlineQueryId,
      results: results
    })
  });
}

async function sendMessage(chatId, text) {
  const botToken = '7404279399:AAGYlx-e66Yf_wMu-3uxeUC7SALuEnu84y4';
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}
