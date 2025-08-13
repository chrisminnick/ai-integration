import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res
        .status(400)
        .json({ error: 'Message is required and must be a string' });
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      max_tokens: 150, // Limit response length for demo
      temperature: 0.7, // Add some creativity
    });

    // Return the response
    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({
      error: 'Failed to get response from AI service',
      message: 'Please check your API key and try again',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});

export default app;
