from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
import tempfile
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app with CORS support
app = Flask(__name__)
CORS(app, supports_credentials=True)

# API Keys (stored in .env file)
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY') 
MURF_API_KEY = os.getenv('MURF_API_KEY')

@cross_origin()
@app.route("/summarize", methods=["POST"])
def summarize():
    """
    Endpoint to summarize email content using GROQ API.
    Expects JSON with 'body' field containing email text.
    Returns JSON with 'summary' field.
    """
    data = request.json
    body = data['body']
    
    # Configure GROQ API request
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{
            "role": "user",
            "content": f"Summarize the following email:\n\n{body}"
        }]
    }

    # Make API call to GROQ
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions", 
        headers=headers, 
        json=payload
    )
    
    # Extract summary from response
    summary = response.json().get("choices", [{}])[0].get("message", {}).get("content", "No summary generated.")
    print(f"Generated summary: {summary}")
    
    return jsonify({"summary": summary})

@app.route("/tts", methods=["POST"])
def tts():
    """
    Endpoint to convert text to speech using Murf.ai API.
    Expects JSON with 'text' field.
    Returns MP3 audio file.
    """
    data = request.json
    summary_text = data.get("text", "")

    if not summary_text:
        return jsonify({"error": "No text provided"}), 400

    # Configure Murf API request
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': MURF_API_KEY,
    }
    
    payload = {
        "voice": {
            "name": "en-US-terrell",
            "engine": "neural"
        },
        "encodedText": summary_text,
        "format": "mp3",
        "options": {
            "speed": 1.0,
            "pitch": 1.0,
            "pause": 0
        }
    }
    
    # Make API call to Murf
    response = requests.post("https://api.murf.ai/v1/speech/generate", headers=headers, json=payload)

    if response.status_code == 200:
        # Save and return audio file
        audio_data = response.content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            f.write(audio_data)
            f.flush()
            return send_file(f.name, mimetype="audio/mpeg")
    else:
        return jsonify({
            "error": "Failed to generate TTS",
            "details": response.text
        }), response.status_code

if __name__ == "__main__":
    app.run(debug=True)