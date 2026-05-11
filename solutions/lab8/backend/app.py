"""Flask backend for the Lab 8 chat app.

Endpoints:
    POST /chat   — accepts {"messages": [...]} and streams the model's reply as text/plain.
    GET  /health — simple liveness check used by tests.

CORS is opened to the Vite dev origin (http://localhost:5173) by default.
"""

import os

from dotenv import load_dotenv

# Load .env before importing the OpenAI SDK (and before constructing the client).
load_dotenv()

from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS
from openai import OpenAI

MODEL = os.getenv("MODEL", "gpt-4o-mini")
PORT = int(os.getenv("PORT", "5050"))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError(
        "OPENAI_API_KEY is not set — copy .env.example to .env and add your key."
    )

client = OpenAI(api_key=api_key)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL})


@app.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json(silent=True) or {}
    messages = payload.get("messages")
    if not isinstance(messages, list) or not messages:
        return (
            jsonify({"error": "Request body must contain a non-empty 'messages' array."}),
            400,
        )

    def generate():
        try:
            stream = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                stream=True,
            )
            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:  # surface API errors to the client
            yield f"\n\n[ERROR] {exc}"

    return Response(stream_with_context(generate()), mimetype="text/plain")


if __name__ == "__main__":
    print(f"Chat server running on http://localhost:{PORT}  (model: {MODEL})")
    app.run(host="0.0.0.0", port=PORT, debug=True)
