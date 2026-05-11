# Lab 8 — Production AI Chat App (Solution)

A capstone chat app: React (Vite) frontend + Flask streaming backend. Demonstrates conversation memory, streaming responses, error handling, and a switchable system prompt.

## Layout

```
solutions/lab8/
├── backend/    # Flask app (port 5000)
└── frontend/   # Vite + React app (port 5173)
```

## Setup

### Backend

```bash
cd solutions/lab8/backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

python app.py
# or:  ./start.sh
```

The backend listens on `http://localhost:5050`. Override with `PORT=...` or `MODEL=...` env vars.

> The default is **5050**, not 5000 — macOS uses port 5000 for AirPlay Receiver and grabbing it conflicts with the system service.

### Frontend (new terminal)

```bash
cd solutions/lab8/frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## What you get

- **Conversation memory** — the frontend keeps the full message array and sends it on every request, so the model remembers context like "my name is Alex" across turns.
- **Streaming responses** — backend uses `client.chat.completions.create(stream=True)` and yields token deltas as `text/plain`; frontend reads the body with `getReader()` and updates state incrementally.
- **Error handling** — any failure (network, bad key, server crash) renders as a red-bordered assistant message and the UI stays responsive.
- **System-prompt picker** — three personas (default, mentor, support). Changing persona resets the conversation so the new system prompt isn't competing with stale context.

## Endpoints

| Method | Path     | Purpose |
| ------ | -------- | ------- |
| GET    | `/health`| Liveness check; returns `{status, model}`. |
| POST   | `/chat`  | Body `{messages: [...]}`. Streams `text/plain`. |

## Environment overrides

| Variable          | Default            | What it does |
| ----------------- | ------------------ | ------------ |
| `OPENAI_API_KEY`  | (required)         | Your OpenAI key |
| `MODEL`           | `gpt-4o-mini`      | OpenAI chat model |
| `PORT`            | `5050`             | Backend port |
| `VITE_BACKEND_URL`| `http://localhost:5050` | Frontend points at this base URL |

## What was fixed/aligned vs. the lab handout

- The handout pointed the React frontend at `http://localhost:5050/chat` but the chapter-08 starter Flask app runs on port 3000 with the path `/api/chat`. The solution unifies on the handout's spec (port 5000, `/chat`) so the snippets in the markdown work as-written.
- `app.py` calls `load_dotenv()` **before** importing the OpenAI SDK, so the client always sees `OPENAI_API_KEY` (same class of bug as the Lab 7 issue).
- Streaming response uses `text/plain` rather than SSE so the frontend snippet from the handout (`reader.read()` + `decoder.decode()`) works without extra parsing.
- Error path renders inline in the chat instead of silently logging.
- Persona switcher (handout Extension C) is wired in by default — three system prompts you can toggle from the UI; switching clears history.

## Testing the streaming endpoint without the frontend

```bash
curl -N -X POST http://localhost:5050/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Count from 1 to 5 with brief commentary."}]}'
```

You should see tokens appear progressively (the `-N` flag disables curl's buffering).
