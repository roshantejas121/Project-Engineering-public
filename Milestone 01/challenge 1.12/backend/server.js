const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/chat', async (req, res) => {
  const { messages } = req.body || {};
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  const hasValidMessages = messages.every(
    (message) =>
      message &&
      ['system', 'user', 'assistant'].includes(message.role) &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0,
  );

  if (!hasValidMessages) {
    return res.status(400).json({
      error: 'Each message must include a valid role and non-empty string content',
    });
  }

  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY is not configured on the backend',
    });
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const providerMessage = data?.error?.message || 'OpenRouter request failed';
      return res.status(502).json({ error: providerMessage });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || reply.trim().length === 0) {
      return res.status(502).json({ error: 'OpenRouter returned an empty response' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('OpenRouter request failed:', error.message);
    return res.status(502).json({ error: 'Unable to reach the AI provider' });
  }
});

// Serve the frontend from the same service for a simple deployed demo.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
