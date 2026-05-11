import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function answer(question) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `You are a helpful product assistant for our store. Answer: ${question}`,
      },
    ],
    temperature: 0.2,
  });
  console.log(response.choices[0].message.content);
}

const question = process.argv.slice(2).join(" ");
if (!question) {
  console.error('Usage: node no_rag.js "<your question>"');
  process.exit(1);
}
answer(question).catch((err) => {
  console.error(err);
  process.exit(1);
});
