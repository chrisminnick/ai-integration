# moderated_chatbot.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatMessage(BaseModel):
    user_id: str
    message: str

@app.post("/chat")
async def chat(msg: ChatMessage):
    """
    Chat endpoint with moderation checks.
    - Step 1: Check the user's message before sending it to the model.
    - Step 2: If safe, generate the response.
    - Step 3: Check the model's reply before returning it to the user.
    """

    # --- Step 1: Pre-moderation of the user message ---
    moderation = client.moderations.create(
        model="omni-moderation-latest",
        input=msg.message
    )
    result = moderation.results[0]

    if result.flagged:
        raise HTTPException(
            status_code=400,
            detail="Your message was flagged by moderation and cannot be processed."
        )

    # --- Step 2: Generate a response using GPT-4o Mini ---
    chat_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful and respectful assistant."},
            {"role": "user", "content": msg.message}
        ],
        temperature=0.7,
        max_tokens=200
    )

    reply = chat_response.choices[0].message.content

    # --- Step 3: Post-moderation of the model output ---
    moderation_out = client.moderations.create(
        model="omni-moderation-latest",
        input=reply
    )
    result_out = moderation_out.results[0]

    if result_out.flagged:
        # Optionally log and replace the message with a safe fallback
        reply = "I'm sorry, but I can’t provide that kind of information."

    return {"reply": reply}
