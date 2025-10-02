# 20 Questions Demo

This is a simple Flask application that implements a 20 Questions game using OpenAI's GPT-3.5-turbo model. This server was created for the Wiley book "A Developer's Guide to Integrating Generative AI into Applications" (2026) by Chris Minnick.

## In the book

This demo appears in Chapter 3, under the section Architectural Models > Backend Service Integration.

## Installation

1. **Clone the repository** and navigate to this directory:

   ```sh
   git clone <repo-url>
   cd chapter-03/20-questions
   ```

2. **Create and activate a virtual environment** (optional but recommended):

   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies**:

   ```sh
   pip install flask openai python-dotenv
   ```

4. **Set up your OpenAI API key**:
   - Create a `.env` file in this directory with the following content:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

## Running the Server

Start the Flask server with:

```sh
python server.py
```

The server will run on http://127.0.0.1:5000/ by default.

## Usage

### 1. Ask a Question

Send a POST request to `/ask` with a JSON body containing a `session_id` (any unique string for your session) and your yes/no `question`:

```json
POST /ask
Content-Type: application/json

{
  "session_id": "your-session-id",
  "question": "Is it an animal?"
}
```

**Response:**

```json
{
  "answer": "Yes. It is an animal."
}
```

### 2. Make a Guess

Send a POST request to `/guess` with a JSON body containing the same `session_id` and your `guess`:

```json
POST /guess
Content-Type: application/json

{
  "session_id": "your-session-id",
  "guess": "dog"
}
```

**Response (if correct):**

```json
{
  "result": "Congratulations, you've guessed correctly!"
}
```

**Response (if incorrect):**

```json
{
  "result": "Incorrect guess. Try again!"
}
```

## Testing the API

For easy testing of the HTTP endpoints, you can use any of the following tools:

1. **VS Code REST Client Extension**: Install the "REST Client" extension in VS Code and use the provided `sample-requests.http` file to make requests directly from the editor.

2. **HTTPie**: A user-friendly command-line HTTP client:

   ```sh
   # Install HTTPie
   pip install httpie

   # Example usage
   http POST 127.0.0.1:5000/ask session_id="my-session" question="Is it edible?"
   ```

3. **curl**: The classic command-line tool (pre-installed on most systems):

   ```sh
   curl -X POST http://127.0.0.1:5000/ask \
     -H "Content-Type: application/json" \
     -d '{"session_id": "my-session", "question": "Is it edible?"}'
   ```

4. **Postman**: A popular GUI application for API testing.

See `sample-requests.http` for ready-to-use example requests.

## Notes

- Each session is tracked in memory using the `session_id`. If the server restarts, all sessions are lost.
- The list of possible items is defined in `server.py` as `["apple", "car", "dog", "elephant"]`.
- You must have a valid OpenAI API key to use this application.
