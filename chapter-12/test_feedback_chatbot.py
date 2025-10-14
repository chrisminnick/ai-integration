# test_feedback_chatbot.py
import pytest
from fastapi.testclient import TestClient
from feedback_chatbot import app, conversation_history, feedback_log

client = TestClient(app)

def test_chat_endpoint_returns_reply(monkeypatch):
    """Verify that /chat returns a reply and message_id."""

    # Mock OpenAI client call to avoid real API requests
    class DummyResponse:
        choices = [type("obj", (), {"message": type("msg", (), {"content": "Hello, world!"})})]
    monkeypatch.setattr("feedback_chatbot.client.chat.completions.create", lambda **kwargs: DummyResponse())

    payload = {"user_id": "u1", "message": "Hi there"}
    response = client.post("/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert isinstance(data["message_id"], int)
    assert conversation_history, "Conversation history should contain entries"

def test_feedback_endpoint_records_feedback():
    """Verify that feedback is logged and affects conversation state."""
    # Send feedback for message_id 0
    payload = {"user_id": "u1", "message_id": 0, "rating": -1, "comment": "Unhelpful"}
    response = client.post("/feedback", json=payload)

    assert response.status_code == 200
    assert any(f["user_id"] == "u1" for f in feedback_log)
    assert any("Previous response was rated poorly" in m["content"] for m in conversation_history)
