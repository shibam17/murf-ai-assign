By \= Shibam Dhar

# From Inbox to Audio: Building a Chrome Extension That Summarizes Your Gmail Using Claude AI and Murf.ai

---

## **🎮 The Problem: Why This Extension Matters**

Imagine this: you're commuting, tired of reading, but still want to catch up on work. What if your emails could be summarized and spoken to you like a podcast?

That’s the idea behind this project—a Chrome extension that grabs your current Gmail email, summarizes it using **Claude AI**, converts it to speech with **Murf.ai**, and lets you play or download the result—all in a click.

Let me walk you through how I built it, what I learned, and how you can build one too.

This guide explains how it works, step by step, with explanations that make the technical bits easy to understand.

---

##  **Use Case: Who Can Benefit?**

* **Professionals** who want to digest emails on the go

* **People with visual impairments or reading difficulties**

* **Busy developers and executives** with overflowing inboxes

* **Students or researchers** managing newsletters and updates

This is more than just a cool AI demo. It’s a productivity tool with accessibility benefits and a lot of room for growth.

---

##  **Prerequisites**

Before you get started, make sure you have:

* A basic understanding of HTML, JavaScript, and Python

* Chrome browser installed

* API credentials for Claude (Anthropic) and Murf.ai

* Python 3.9+ installed

* Familiarity with Flask (Python web framework)

* A Gmail account for testing

---

## **📁 Project Structure: How It’s Organized**

The project is divided into two main parts:

```
extension-assign/
├── extension/
│   ├── manifest.json        # Chrome extension configuration
│   ├── background.js        # Handles API requests and responses
│   ├── content.js           # Pulls email content from Gmail
│   └── popup/
│       ├── popup.html       # Frontend UI
│       └── popup.js         # Controls interaction logic
├── server/
│   └── server.py            # Flask app to summarize and generate audio
```

* The `extension` folder holds all the Chrome-specific files.

* The `server` folder runs a small Python server that talks to Claude and Murf APIs.

---

**What We'll Build and How**

Before we dive into the code, here’s a quick rundown of what we’ll create and how:

We’re going to build a **Chrome Extension** that works seamlessly with Gmail. When you open an email and click the extension, it will:

1. **Grab the email content** directly from your Gmail page

2. **Send it to a local Python backend** which:
   * Summarizes it using **Claude AI**
   * Converts the summary into audio using **Murf.ai**
3. **Send back a playable audio link**, so you can listen to the email right away

This is split between two layers:

* The **frontend**, built with HTML \+ JS in the Chrome extension
* The **backend**, powered by Python (Flask) that talks to the AI services

Let’s now walk through how it all works.

## **⚡ Step-by-Step Implementation**

### **1\. Configure the Chrome Extension**

We begin with the `manifest.json` file. This defines what the extension can do:

```json
{
  "manifest_version": 3,
  "name": "Gmail Audio Summarizer",
  "version": "1.0",
  "permissions": ["activeTab", "scripting"],
  "background": {
   "service_worker": "background.js"
  },
  "action": {
   "default_popup": "popup/popup.html"
  },
  "content_scripts": [
   {
    "matches": ["https://mail.google.com/*"],
    "js": ["content.js"]
   }
  ]
}
```


**Explanation**:

* We configure the Chrome extension (via `manifest.json`) to allow script execution on Gmail pages, enabling us to access and extract content directly from the interface.
* The extension displays a small UI (`popup.html`) when you click on its icon in the toolbar. This is where the user can initiate the summarization.
* When the user clicks the summarize button, the extension uses a background script (`background.js`) to communicate between the popup and a local Python server. This script sends the email content to the backend, receives the audio URL in return, and passes it back to the popup so it can be played.

---

### **2\. Extract Email Content from Gmail**

In `content.js`, we locate and grab the email body:

```javascript
const getEmailContent = () => {
  const emailNode = document.querySelector('.ii.gt');
  return emailNode?.innerText || "No content found";
};
```

**Explanation**:

* This uses `querySelector` to find Gmail's email content.
* Gmail changes its layout often, so selectors like `.ii.gt` must be tested.
* If no content is found, it returns a default fallback.

---

### **3\. Send Data to the Python Server**

In `background.js`, we send the email content to the backend:

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
   fetch("http://localhost:5000/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: request.text })
   })
    .then(res => res.json())
    .then(data => sendResponse({ audioUrl: data.audio_url }))
    .catch(err => console.error(err));

   return true;
  }
});
```

**Explanation**:

* When the user clicks the summarize button in the extension popup, a message is sent to the background script. This script acts as a middleman:
* First, it listens for incoming messages from the popup interface. Specifically, it's watching for a message with the action `summarize`.
* Once received, it takes the email content from that message and makes a `POST` request to our locally running Python server (`http://localhost:5000/summarize`). The email text is passed in the body as JSON.
* The server processes the request—summarizing the text and generating the audio—and responds with a JSON object containing an `audio_url`.
* The background script captures this URL and sends it back to the popup using `sendResponse`, so the UI can play the audio back to the user.

This communication is asynchronous, so `return true;` is necessary to keep the response channel open while the fetch request completes.

---

Here’s a deeper and clearer explanation for the backend logic section you asked about, especially focusing on the Murf API and summarization with Claude:

---

### **Working of Summarization and Audio Generation** 

The core backend logic resides in this route in `server.py`:

```python
@app.route('/summarize', methods=\['POST'\])

def summarize():
    text \= request.json.get('text', '')
    if len(text) \< 50:
        return jsonify({"error": "Text too short to summarize"}), 400
    summary \= summarize\_with\_claude(text)
    audio\_url \= generate\_audio\_with\_murf(summary)
    return jsonify({"audio\_url": audio\_url})
```

#### **Lets have a Step-by-Step Breakdown**

1. **Receiving the Request**:  
    This route is hit when the Chrome extension sends a POST request containing the email content. The server expects a JSON payload with a field named `text`.

2. **Validation**:  
    The backend checks if the incoming `text` is longer than 50 characters. This is a simple way to ensure meaningful content is being processed, preventing unnecessary API usage and billing.

3. **Summarization via Claude**:

   * The email text is passed into the `summarize_with_claude` function.

   * Claude processes the email with a prompt asking it to “Summarize this email in a few sentences.”

   * The API response is parsed to extract the actual summary, which is concise and readable.

4. **Audio Generation with Murf**:

   * The summary is passed into `generate_audio_with_murf`.
   * This function sends a request to Murf.ai’s speech synthesis API to generate a spoken version of the summary.
   * The returned `audio_url` points to an `.mp3` file stored on Murf’s cloud, ready to be played back.


**Returning the Audio URL**: The backend returns a JSON response like this:
 ```{ "audio\_url": "https://murf.ai/audio-file.mp3" }```
---

**Inside of `summarize_with_claude()`**

```python
def summarize\_with\_claude(text):
    prompt \= f"Summarize this email in a few sentences: {text}"
    
    headers \= {
        "Authorization": f"Bearer {CLAUDE\_API\_KEY}",
        "Content-Type": "application/json"
    }
    body \= {
        "prompt": prompt,
        "max\_tokens": 300,
        "model": "claude-3-opus-20240229"
    }
    response \= requests.post("https://api.anthropic.com/v1/complete", json=body, headers=headers)
    return response.json().get("completion")
```

**What it does**:

* Crafts a friendly, helpful prompt for Claude.

* Sends a POST request to Claude’s endpoint with headers and body content including your model choice and token limit.

* Parses the response to extract just the generated summary text.

---

### **Inside of `generate_audio_with_murf()`**

```python
def generate\_audio\_with\_murf(summary):

    payload \= {

        "text": summary,

        "voice": "en-US-Wavenet-D",

        "format": "mp3"

    }

    headers \= {

        "Authorization": f"Bearer {MURF\_API\_KEY}",

        "Content-Type": "application/json"

    }

    response \= requests.post("https://api.murf.ai/v1/speech", json=payload, headers=headers)

    if response.status\_code \== 200:

        return response.json().get("audio\_url")

    else:

        raise Exception("Murf API failed: " \+ response.text)
```

**What it does**:

* Constructs a JSON payload with:

  * The text to be spoken (`summary`)

  * A specific voice model (in this case `en-US-Wavenet-D`, a clear male voice)

  * Desired output format (`mp3`)

* Sends the request to Murf’s API with your API key in the `Authorization` header.

* On success, extracts and returns the URL of the generated audio file.

* On failure, throws an error that includes Murf’s response message—this is key for debugging API issues like rate limits, malformed requests, or auth errors.

---

## **🔧 Error Handling and Pitfalls**

| Problem | Solution |
| ----- | ----- |
| Gmail content missing | Inspect Gmail’s DOM and adjust selector (`.ii.gt`) as needed |
| API fails | Use `try/except` blocks, return meaningful errors, and log tracebacks |
| Audio doesn’t play | Check `Content-Type` in Flask, ensure URL returns proper audio format |
| Extension popup freezes | Add `return true;` in listeners to allow async response handling |
| CORS error | Use `flask-cors` to enable CORS in Flask backend |

**Developer Tip**: Test with short, long, and formatted emails to ensure robust extraction. For CORS (Cross-Origin Resource Sharing) issues—when your Chrome extension can’t communicate with `localhost:5000`—you need to explicitly allow cross-origin requests in your Flask server. Add the following to `server.py`:

---

## **Future Scope and Scalability**

This is just a first step. Here’s how this project can grow:

* **Gmail API Integration**: Instead of scraping Gmail’s HTML, we can use the official Gmail API. This is more reliable, stable, and secure—ideal for production environments.

* **Audio Library**: Users could build a personal audio archive of email summaries, categorized by sender, label, or topic.

* **Customization Options**: Let users decide how long the summary should be or even adjust the tone (e.g., formal, casual, bullet-points).

* **Batch Mode Processing**: Imagine selecting multiple emails and summarizing them all in one go—a powerful feature for busy professionals.

* **Mobile App Extension**: Reimagine this as a mobile-first app using React Native or Flutter, allowing users to catch up on email while commuting.

These enhancements can turn the extension into a full-fledged product or a SaaS tool with real-world use cases across productivity, accessibility, and education sectors.

---

## **Useful Links**

* [Claude by Anthropic](https://www.anthropic.com/)

* [Murf.ai](https://www.murf.ai/)

* [Chrome Extensions Guide](https://developer.chrome.com/docs/extensions/)

* [Flask Documentation](https://flask.palletsprojects.com/)

* [Using fetch in JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## **🚀 Final Thoughts**

This project started with a personal pain point and grew into a practical AI-powered productivity tool. Beyond the tech stack, it’s a demonstration of what’s possible when you combine the right APIs with a bit of creativity.

If you’re passionate about building tools that simplify life and enhance accessibility, this is a great starting point.

So the next time your inbox fills up—just click your extension, plug in your headphones, and let AI do the reading for you.

---

