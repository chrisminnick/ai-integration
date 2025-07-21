#!/usr/bin/env node

import inquirer from 'inquirer';

// System prompt template
const SYSTEM_MESSAGE = `
You are a helpful cooking assistant. Given a short list of ingredients, respond with a clear and friendly recipe that uses all of them. Format your response as:
Title
Ingredients:
- item 1
- item 2
Instructions:
Step-by-step recipe text.
`;

const INGREDIENTS = ['Chicken', 'Rice', 'Broccoli', 'Garlic', 'Lemon'];

async function main() {
  console.log('\nAI Recipe Generator');
  console.log('Select exactly 3 ingredients:\n');

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'ingredients',
      message: 'Choose your ingredients:',
      choices: INGREDIENTS,
      validate: function (answer) {
        if (answer.length !== 3) {
          return 'Please select exactly 3 ingredients.';
        }
        return true;
      },
    },
  ]);

  const selected = answers.ingredients;

  const userPrompt = `Create a recipe using the following ingredients: ${selected.join(
    ', '
  )}.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Set your API key in the environment
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_MESSAGE },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log('\nYour Recipe:\n');
    console.log(data.choices?.[0]?.message?.content || 'No recipe returned.');
  } catch (error) {
    console.error('Error generating recipe:', error.message);
  }
}

main();
