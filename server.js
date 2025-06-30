const express = require('express');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([req.file.buffer]), req.file.originalname);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData
    });

    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    const data = await response.json();
    res.json({ text: data.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: req.body.messages
      })
    });

    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to chat' });
  }
});

app.post('/api/speak', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: req.body.text
      })
    });

    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
