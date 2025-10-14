# feedback_chatbot.py
from fastapi import FastAPI, Request
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory history of user messages and feedback
conversation_history = []
feedback_log = []

class ChatMessage(BaseModel):
    user_id: str
    message: str

class Feedback(BaseModel):
    user_id: str
    message_id: int
    rating: int            # +1 = good, -1 = bad
    comment: str | None = None

@app.post("/chat")
async def chat(msg: ChatMessage):
    """Handle an incoming chat message and generate a response."""
    system_prompt = "You are a helpful and neutral assistant."
    user_context = [m for m in conversation_history if m["user_id"] == msg.user_id]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            *user_context,
            {"role": "user", "content": msg.message},
        ],
        temperature=0.7,
    )

    reply = response.choices[0].message.content
    message_record = {
        "user_id": msg.user_id,
        "role": "assistant",
        "content": reply,
        "feedback_score": 0,
    }
    conversation_history.append(message_record)
    return {"reply": reply, "message_id": len(conversation_history) - 1}

@app.post("/feedback")
async def feedback(fb: Feedback):
    """Receive user feedback and adjust future prompts accordingly."""
    feedback_log.append(fb.dict())

    # Simple reinforcement: if negative feedback, add a system note
    if fb.rating < 0:
        note = {
            "role": "system",
            "content": (
                f"Previous response was rated poorly. "
                f"Be clearer and more balanced in tone for this user."
            ),
        }
        conversation_history.append(note)

    return {"status": "feedback recorded"}

