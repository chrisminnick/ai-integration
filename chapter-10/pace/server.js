const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// In-memory storage for prompt templates (in production, use a database)
let promptTemplates = [
  {
    id: 1,
    name: 'Explain Code',
    description: 'Explains what the selected code does',
    template:
      'Please explain what this code does in simple terms:\n\n{{selection}}',
  },
  {
    id: 2,
    name: 'Add Comments',
    description: 'Adds helpful comments to the code',
    template:
      'Add clear, helpful comments to this code. Return only the commented code:\n\n{{selection}}',
  },
  {
    id: 3,
    name: 'Optimize Code',
    description: 'Suggests optimizations for the selected code',
    template:
      'Analyze this code and suggest optimizations or improvements:\n\n{{selection}}',
  },
  {
    id: 4,
    name: 'Fix Bugs',
    description: 'Identifies and fixes potential bugs',
    template:
      'Review this code for potential bugs and provide a fixed version:\n\n{{selection}}',
  },
];

let nextTemplateId = 5;

// API Routes

// Get all prompt templates
app.get('/api/templates', (req, res) => {
  res.json(promptTemplates);
});

// Add a new prompt template
app.post('/api/templates', (req, res) => {
  const { name, description, template } = req.body;

  if (!name || !template) {
    return res.status(400).json({ error: 'Name and template are required' });
  }

  const newTemplate = {
    id: nextTemplateId++,
    name,
    description: description || '',
    template,
  };

  promptTemplates.push(newTemplate);
  res.status(201).json(newTemplate);
});

// Delete a prompt template
app.delete('/api/templates/:id', (req, res) => {
  const templateId = parseInt(req.params.id);
  const index = promptTemplates.findIndex((t) => t.id === templateId);

  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  promptTemplates.splice(index, 1);
  res.status(204).send();
});

// Process AI completion
app.post('/api/complete', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const completion = await processAICompletion(prompt);
    res.json({ completion });
  } catch (error) {
    console.error('AI completion error:', error);
    res.status(500).json({
      error: 'Failed to process AI completion',
      details: error.message,
    });
  }
});

// AI completion function
async function processAICompletion(prompt) {
  const { OpenAI } = require('openai');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`PACE server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
