# Code Context Companion

Code Context Companion is a small, focused product for a problem I personally experienced while working through engineering challenges: after changing a component or backend route, I could explain **what** I changed but struggled to explain **why** I made the change and what a reviewer should verify. That made self-review and learning-journal write-ups slower than they needed to be. This tool accepts a code diff or snippet plus one sentence of context and turns it into a concise engineering explanation, rationale, risk level, and review checklist.

## Live deployment

The repository is configured for a static frontend and a Node/Express backend. The verified public demo URLs for this submission are:

| Service | URL | Purpose |
| --- | --- | --- |
| Frontend | `https://4324-ijdd71uvq8xu8zzb2c3h5-8f3c84e8.sg1.manus.computer/` | Browser interface for entering a code change |
| Backend health check | `https://4323-ijdd71uvq8xu8zzb2c3h5-8f3c84e8.sg1.manus.computer/health` | Confirms the API service is running |
| Backend analysis endpoint | `https://4323-ijdd71uvq8xu8zzb2c3h5-8f3c84e8.sg1.manus.computer/api/analyze` | Receives input and calls the server-side AI provider |

These are temporary public sandbox URLs for the assignment demonstration. For a durable deployment, use the included Render and GitHub Pages manifests with the same environment variables.

## AI integration

The product uses **OpenRouter** with the exact model name **`openai/gpt-4o-mini`**. I chose this model because it is inexpensive for short structured explanations and is capable of returning a predictable JSON response when the prompt is explicit.

The API key is read from `process.env.OPENROUTER_API_KEY` in the backend only. The provider request lives in `backend/src/services/aiService.js`, inside `callCodeContextAI()`. The prompt is intentionally isolated in `backend/src/utils/promptBuilder.js`, inside `buildPrompt()`. The browser never contains an API key, an OpenRouter URL, or provider-specific headers; it calls only the product's own `/api/analyze` route through `frontend/src/api/client.js`.

The backend also applies a 15-second timeout, validates the input length before spending tokens, logs provider usage, returns public-safe errors, and limits each client identifier to 20 analyses per hour. At the projected cost below, the limit caps the AI spend for one client at approximately `20 × $0.000330 = $0.0066` per hour.

## What the AI transforms

The user provides a code change, diff, or snippet and may add a short explanation of the intended goal. The backend asks the model to return exactly five fields: a one-sentence summary, the engineering rationale, three review checks, a plain-English explanation suitable for speaking aloud, and a low/medium/high risk label. If the AI feature were removed, the product would lose its central value; the interface is intentionally built around this transformation rather than adding unrelated task-management features.

## What I intentionally excluded

I intentionally excluded user accounts, saved history, team collaboration, automatic GitHub access, and an in-browser code editor. Accounts and persistence would add a database and authentication flow without improving the first-use problem: getting one clear explanation quickly. Automatic GitHub access was excluded because it would require OAuth scopes and repository permissions that are unnecessary for a paste-based MVP. A full editor was excluded because a plain textarea is enough to demonstrate the core workflow and keeps the product usable with any language or hosting provider.

## Monthly cost calculation

The calculation below uses the assignment rates for `openai/gpt-4o-mini` and a deliberately conservative short-request estimate.

| Calculation step | Arithmetic | Result |
| --- | --- | --- |
| Input rate | 600 input tokens ÷ 1,000,000 × `$0.15` | `$0.000090` |
| Output rate | 400 output tokens ÷ 1,000,000 × `$0.60` | `$0.000240` |
| Cost per call | `$0.000090 + $0.000240` | **`$0.000330`** |
| Expected monthly calls | 300 calls | 300 |
| Monthly AI total | `300 × $0.000330` | **`$0.099`**, approximately **`$0.10/month`** |

This estimate covers model usage only. The product is designed to run on free-tier hosting for the assignment, so hosting cost is assumed to be `$0` at the expected demonstration volume. Actual spend depends on the provider's current pricing and the number of tokens in each real request.

## Local setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add OPENROUTER_API_KEY to .env
npm start
```

The backend runs on `http://localhost:3000`. Verify it with:

```bash
curl http://localhost:3000/health
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:3000 in .env.local
npm run dev
```

Open the Vite URL, paste a code change, add context if useful, and select **Analyze this change**. The interface includes an example, loading state, validation errors, rate-limit handling, and an AI result state.

## Deployment configuration

The backend is ready for a Render Web Service with root directory `Milestone 09/Ship Your AI Feature End-to-End/backend`, build command `npm install`, and start command `npm start`. Set `OPENROUTER_API_KEY`, `FRONTEND_URLS`, and `PORT` in the service environment. The frontend is ready for a static deployment with root directory `Milestone 09/Ship Your AI Feature End-to-End/frontend`, build command `npm install && npm run build`, publish directory `dist`, and `VITE_API_BASE_URL` set to the deployed backend URL.

## Engineering decisions I can explain

The most important design decision is keeping the provider call in one backend service. This protects the secret, gives the product one place to validate and limit paid requests, and lets the frontend remain a simple client of our own API. I also kept the prompt in its own module so the controller handles HTTP concerns while the AI instruction can evolve independently. The response is structured JSON because the frontend needs stable fields for the summary, rationale, checklist, explanation, and risk badge.
