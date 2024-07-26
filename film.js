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
      const helpMessage = `Available Commands:\n/ping - Check server status\n/help - Show this help message\n/copy [source] [destination] - Copy data from one collection to another\n/clone [database] - Clone the entire database\n/download [query] - Download data matching the query\n/store [channel_id] - Store all data to a MongoDB collection and send it to a channel\n/storage - Check MongoDB storage usage`;
      await sendMessage(chatId, helpMessage);
    } else if (text.startsWith('/copy ')) {
      const [_, source, destination] = text.split(' ');
      await copyData(source, destination);
      await sendMessage(chatId, `Data copied from ${source} to ${destination}.`);
    } else if (text.startsWith('/clone ')) {
      const [_, database] = text.split(' ');
      await cloneDatabase(database);
      await sendMessage(chatId, `Database ${database} cloned.`);
    } else if (text.startsWith('/download ')) {
      const query = text.slice(10).trim();
      const fileUrl = await downloadData(query);
      await sendMessage(chatId, `Data downloaded. You can download it from: ${fileUrl}`);
    } else if (text.startsWith('/store ')) {
      const [_, channelId] = text.split(' ');
      await storeAndSendData(channelId);
      await sendMessage(chatId, `All data stored in MongoDB and sent to channel ${channelId}.`);
    } else if (text.startsWith('/storage')) {
      const storageInfo = await getStorageUsage();
      await sendMessage(chatId, `MongoDB Storage Usage:\n${storageInfo}`);
    } else {
      await sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
    }
  }
}

async function handleInlineQuery(inlineQuery) {
  const inlineQueryId = inlineQuery.id;
  const query = inlineQuery.query;
  const results = await suggestFiles(query);
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

async function copyData(sourceCollection, destinationCollection) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('mrnoobx');
    const source = db.collection(sourceCollection);
    const destination = db.collection(destinationCollection);
    const data = await source.find().toArray();
    await destination.insertMany(data);
  } catch (error) {
    console.error('Error copying data:', error);
  } finally {
    await client.close();
  }
}

async function cloneDatabase(databaseName) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(databaseName);
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const source = db.collection(collection.name);
      const destination = client.db('cloned_' + databaseName).collection(collection.name);
      const data = await source.find().toArray();
      await destination.insertMany(data);
    }
  } catch (error) {
    console.error('Error cloning database:', error);
  } finally {
    await client.close();
  }
}

async function downloadData(query) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const fs = require('fs');
  const path = require('path');
  const fileName = `data_${Date.now()}.json`;
  const filePath = path.join('/tmp', fileName);

  try {
    await client.connect();
    const db = client.db('mrnoobx');
    const data = await db.collection('Files').find({ data: new RegExp(query, 'i') }).toArray();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error downloading data:', error);
  } finally {
    await client.close();
  }

  // Upload the file to a public URL or a cloud storage service if needed
  // For demonstration, we are returning a local path
  return `https://example.com/path/to/${fileName}`;
}

async function storeAndSendData(channelId) {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const botToken = '7390073945:AAG1yvZolpshS-v9-7NodCVAg8B7shtmWf8';
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await client.connect();
    const db = client.db('mrnoobx');
    const collections = await db.listCollections().toArray();
    let messageText = 'Data from MongoDB:\n\n';

    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const data = await coll.find().toArray();
      messageText += `*Collection:* ${collection.name}\n`;
      messageText += `*Data:* ${JSON.stringify(data, null, 2)}\n\n`;
    }

    // Send data to the specified channel
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Error storing and sending data:', error);
  } finally {
    await client.close();
  }
}

async function getStorageUsage() {
  const uri = 'mongodb+srv://mrnoobx:DAZCdTczVWyECi04@cluster0.sedgwxy.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('mrnoobx');
    const collections = await db.listCollections().toArray();
    
    let storageInfo = 'MongoDB Storage Usage:\n\n';
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const stats = await coll.stats();
      storageInfo += `*Collection:* ${collection.name}\n`;
      storageInfo += `*Size:* ${stats.size} bytes\n`;
      storageInfo += `*Storage Size:* ${stats.storageSize} bytes\n`;
      storageInfo += `*Total Index Size:* ${stats.totalIndexSize} bytes\n`;
      storageInfo += `*Index Size:* ${stats.indexSize} bytes\n\n`;
    }
    return storageInfo;
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return 'Error retrieving storage usage.';
  } finally {
    await client.close();
  }
}

function getRandomFile() {
  const files = [
    { id: '1', title: 'Sample File 1', url: 'https://example.com/file1' },
    { id: '2', title: 'Sample File 2', url: 'https://example.com/file2' },
  ];

  const randomIndex = Math.floor(Math.random() * files.length);
  return files[randomIndex];
}

async function suggestFiles(query) {
  const files = [
    { id: '1', title: 'Sample File 1', description: 'This is a sample file 1', url: 'https://example.com/file1' },
    { id: '2', title: 'Sample File 2', description: 'This is a sample file 2', url: 'https://example.com/file2' },
  ];

  const filteredFiles = files.filter(file => file.title.toLowerCase().includes(query.toLowerCase()) || file.description.toLowerCase().includes(query.toLowerCase()));

  return filteredFiles.map(file => ({
    type: 'article',
    id: file.id,
    title: file.title,
    description: file.description,
    input_message_content: { message_text: file.url },
    reply_markup: {
      inline_keyboard: [[{ text: 'Download File', url: file.url }]]
    }
  }));
}

async function answerInlineQuery(inlineQueryId, results) {
  const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
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
  const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
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
