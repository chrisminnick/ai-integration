from flask import Flask, request, jsonify
import random
import os
import openai
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Database for 20 Questions game
items = ["apple", "car", "dog", "elephant"]
# In-memory store for games by session
games = {}

@app.route("/ask", methods=["POST"])
def ask_question():
    data = request.json
    session_id = data.get("session_id")
    question = data.get("question")

    # Initialize game if not started
    if session_id not in games:
        selected_item = random.choice(items)
        games[session_id] = {"selected_item": selected_item, "history": []}

    game = games[session_id]

    # Build messages with system prompt including the selected item
    system_prompt = (
        f"You are playing 20 Questions. The selected item is '{game['selected_item']}'. "
        "Answer each yes/no question with 'Yes' or 'No' and optionally provide a brief hint."
    )
    messages = [{"role": "system", "content": system_prompt}]

    # Include conversation history
    messages.extend(game["history"])
    messages.append({"role": "user", "content": question})

    # Call OpenAI
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0,
    )
    answer = response.choices[0].message.content.strip()

    # Update history
    game["history"].append({"role": "user", "content": question})
    game["history"].append({"role": "assistant", "content": answer})

    return jsonify({"answer": answer})

@app.route("/guess", methods=["POST"])
def make_guess():
    data = request.json
    session_id = data.get("session_id")
    guess = data.get("guess", "").lower()

    if session_id not in games:
        return jsonify({"error": "Session not found. Ask a question to start the game."}), 400

    game = games[session_id]
    if guess == game["selected_item"]:
        result = "Congratulations, you've guessed correctly!"
        # Reset game state
        new_item = random.choice(items)
        games[session_id] = {"selected_item": new_item, "history": []}
    else:
        result = "Incorrect guess. Try again!"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(debug=True)