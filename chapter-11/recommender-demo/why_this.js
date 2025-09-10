import fs from 'fs';
import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const USERS = JSON.parse(fs.readFileSync('users.json', 'utf8'));
const ITEM_INDEX = JSON.parse(fs.readFileSync('item_index.json', 'utf8'));

function historyFor(userId) {
  return (USERS.find((u) => u.id === userId)?.interactions || []).map(
    (e) => e.itemId
  );
}
function itemById(id) {
  return ITEM_INDEX.find((x) => x.id === id);
}

export async function whyThis({ userId, itemId }) {
  const histIds = historyFor(userId).slice(-3);
  const histTitles = histIds.map((id) => itemById(id)?.title).filter(Boolean);
  const candidateTitle = itemById(itemId)?.title;

  const sys = {
    role: 'system',
    content: 'You are a concise product copywriter.',
  };
  const usr = {
    role: 'user',
    content: `Write one short sentence (<= 20 words) explaining 
              why the user might like "${candidateTitle}".
              Ground it in their recent items: ${histTitles.join(', ')}.
              Do not invent facts.`,
  };

  const r = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [sys, usr],
    temperature: 0.3,
    max_tokens: 60,
  });

  return r.choices[0].message.content.trim();
}

// Quick demo
(async () => {
  const s = await whyThis({ userId: 'u_alyssa', itemId: 'db1' });
  console.log('Why this (u_alyssa -> db1):', s);
})();
