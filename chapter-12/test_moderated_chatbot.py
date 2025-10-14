# test_moderated_chatbot.py
import pytest
from fastapi.testclient import TestClient
from moderated_chatbot import app

client = TestClient(app)

def test_safe_message_passes_moderation(monkeypatch):
    """Ensure a normal message passes moderation and returns a reply."""

    # Mock moderation API to always return not flagged
    class DummyModeration:
        results = [type("obj", (), {"flagged": False})]
    monkeypatch.setattr("moderated_chatbot.client.moderations.create", lambda **kwargs: DummyModeration())

    # Mock chat completion to return a fixed reply
    class DummyChat:
        choices = [type("obj", (), {"message": type("msg", (), {"content": "Hello back!"})})]
    monkeypatch.setattr("moderated_chatbot.client.chat.completions.create", lambda **kwargs: DummyChat())

    payload = {"user_id": "u1", "message": "Hello there!"}
    response = client.post("/chat", json=payload)

    assert response.status_code == 200
    assert "reply" in response.json()
    assert response.json()["reply"] == "Hello back!"

def test_flagged_message_is_blocked(monkeypatch):
    """Ensure flagged input raises HTTP 400."""

    class DummyModeration:
        results = [type("obj", (), {"flagged": True})]
    monkeypatch.setattr("moderated_chatbot.client.moderations.create", lambda **kwargs: DummyModeration())

    payload = {"user_id": "u1", "message": "malicious content"}
    response = client.post("/chat", json=payload)

    assert response.status_code == 400
    assert "flagged" in response.text.lower()
