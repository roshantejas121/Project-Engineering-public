# AI Chatbot

A minimal but fully functional AI chatbot with a vanilla JavaScript frontend and a Node.js Express backend. The frontend keeps the conversation history in memory and sends the complete history to the backend for every request.

## What I Built

The application provides a chat display, text input, send button, Enter-key submission, loading state, and user-friendly error handling. The backend exposes `/health` for deployment checks and `/chat` for AI requests. The deployed configuration can serve the frontend and backend from one service, while the frontend also supports a separate backend URL through `window.CHAT_API_URL` when needed.

## API and Model

**API:** OpenRouter  
**Model:** `openai/gpt-4o-mini`  

**Why backend only:** The browser sends the conversation to the Express `/chat` route, and only the backend calls OpenRouter. Keeping the API key in `backend/.env` prevents anyone who opens browser DevTools or inspects the shipped JavaScript from extracting the credential and using it against the account.

**Fallback provider:** Google Gemini API. If OpenRouter credits run out, the provider can be switched by changing the request base URL to `https://generativelanguage.googleapis.com/v1beta/openai/` and changing the model name to `gemini-1.5-flash`; the request structure and frontend remain the same.

## Conversation Context

The frontend stores messages as `{ role, content }` objects. It appends each user message, sends the full `messages` array to the backend, then appends the returned assistant message. This means a follow-up such as “Can you give me an example of that?” is sent with the earlier question and can be answered in context.

## Security and Environment Variables

Create `backend/.env` locally from the committed template:

```bash
cp backend/.env.example backend/.env
```

Then add the real OpenRouter key to `backend/.env`. The key is read only through `process.env.OPENROUTER_API_KEY`; it is never placed in frontend files, committed to Git, or returned in an API response. The repository ignore rules exclude `.env` and `node_modules`.

## Running Locally

```bash
cd "Milestone 01/challenge 1.12/backend"
npm install
OPENROUTER_API_KEY=your-key-here npm start
```

Open `frontend/index.html` directly in a browser or serve the `frontend/` folder with a local static server. When opened as a `file://` page, the frontend uses `http://localhost:3000/chat`; when hosted by the backend, it uses the same origin.

## Deployment

The recommended deployment is one Render web service rooted at `Milestone 01/challenge 1.12`:

- **Build command:** `cd backend && npm install`
- **Start command:** `cd backend && npm start`
- **Environment variable:** `OPENROUTER_API_KEY` set in the hosting dashboard only
- **Health check:** `/health`

If frontend and backend are deployed separately, define `window.CHAT_API_URL` before `script.js` in `frontend/index.html`, using the deployed backend origin. Do not place an API key in that file.

## Live Deployment

**Frontend URL:** To be added after deployment  
**Backend URL:** To be added after deployment

## Pull Request

**Branch:** `feature/ai-chatbot`  
**Title:** `feat: AI chatbot — OpenRouter + context handling + deployed on Render`

## Video Submission

The walkthrough video should show the live chatbot, a context-aware follow-up, the backend use of `process.env.OPENROUTER_API_KEY`, and this README’s API/model, security, and fallback sections. The uploaded Drive file must be shared as “Anyone with the link can view.”
