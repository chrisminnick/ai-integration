from flask import Flask, request, jsonify, send_from_directory
import openai, uuid, json
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
app = Flask(__name__)
games = {}

# Tell the AI its role and require JSON output
SYSTEM_PROMPT = (
    "You are a game master for a medieval fantasy adventure. "
    "When the user chooses an action, respond with valid JSON: "
    '{"text":"<story>", "choices":["...","...","..."]}'
)

@app.route('/start', methods=['POST'])
def start():
    session_id = str(uuid.uuid4())
    # Seed the conversation
    messages = [
      {"role":"system",   "content":SYSTEM_PROMPT},
      {"role":"assistant","content":json.dumps({
         "text":    "You awaken in a dark tavern. A hooded figure nods at you.",
         "choices": ["Explore the forest","Talk to the hooded figure","Order a drink"]
      })}
    ]
    games[session_id] = messages
    payload = json.loads(messages[-1]["content"])
    return jsonify(session_id=session_id, **payload)

@app.route('/choose', methods=['POST'])
def choose():
    data = request.json
    msgs = games[data["session_id"]]
    msgs.append({"role":"user","content": data["choice"]})
    resp = openai.chat.completions.create(
      model="gpt-3.5-turbo",
      messages=msgs,
      temperature=0.7
    )
    content = resp.choices[0].message.content
    msgs.append({"role":"assistant","content":content})
    return jsonify(json.loads(content))

@app.route('/', methods=['GET'])
def serve_index():
    return send_from_directory(os.path.dirname(__file__), 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
