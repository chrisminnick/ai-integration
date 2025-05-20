# Choose Your Adventure Demo

This is a Flask-based interactive "Choose Your Adventure" game powered by OpenAI's GPT-3.5-turbo model. The server acts as a game master, generating story text and choices in response to user actions. This demo was created for the Wiley book "A Developer's Guide to Integrating Generative AI into Applications" (2026) by Chris Minnick.

## In the book

This demo appears in Chapter 3, under the section Architectural Models > Hybrid Integration.

## Installation

1. **Clone the repository** and navigate to this directory:

   ```sh
   git clone <repo-url>
   cd chapter-03/choose-your-adventure
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

- Visit [http://127.0.0.1:5000/](http://127.0.0.1:5000/) after starting the server.
- The story and choices will appear on the page.
- Click a button to make a choice and continue the adventure.
- The AI will generate new story text and options after each choice.

## Notes

- Each session is tracked in memory using a unique session ID. If the server restarts, all sessions are lost.
- The AI always responds with a JSON object containing the next story text and available choices.
- You must have a valid OpenAI API key to use this application.
