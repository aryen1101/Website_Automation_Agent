# Website Automation Agent

An autonomous browser automation agent (inspired by [Browser Use](https://github.com/browser-use/browser-use)).
Give it a **target URL** and a **goal** in plain English — it drives a real
Chromium browser, reads the interactive elements on each page, and decides which
actions to take (click, type, scroll, submit) until the goal is complete.

It ships with two ways to use it:

- A **React web UI** that streams the agent's screenshots and actions live.
- A **CLI** for one-off runs from the terminal.

---

## How it works

The agent runs a perception → reasoning → action loop:

1. **Perceive** — take a screenshot and extract every visible interactive
   element (inputs, buttons, links) with its label and click coordinates.
2. **Reason** — send the goal + element list to an LLM (via OpenRouter), which
   replies with one or more tool calls.
3. **Act** — execute the chosen browser tools and feed the result back.
4. Repeat until the model calls `task_complete` or `MAX_STEPS` is reached.

Progress is emitted as a stream of events (`log`, `observation`, `action`,
`result`, `done`, `finished`), which the server relays to the UI over
Server-Sent Events (SSE).

### Browser tools the agent can call

| Tool | Description |
| --- | --- |
| `navigate_to_url` | Open a URL |
| `click_on_screen` | Click at `(x, y)` coordinates |
| `double_click` | Double-click (e.g. to select text before overwriting) |
| `send_keys` | Type text into the focused field |
| `scroll` | Scroll the page to reveal more elements |
| `take_screenshot` | Re-capture the current view |
| `task_complete` | Signal the goal is finished, with a summary |

---

## Tech stack

- **Backend:** Node.js, Express 5, Playwright (Chromium), OpenAI SDK pointed at OpenRouter
- **Frontend:** React 18 + Vite
- **Streaming:** Server-Sent Events (SSE)

---

## Project structure

```
Website_Automation_Agent/
├── backend/
│   ├── src/
│   │   ├── server.js              Express server: API, SSE, serves the built UI
│   │   ├── index.js               CLI entry point
│   │   ├── config.js              Env-driven configuration
│   │   ├── logger.js              Colored console logger
│   │   ├── agent/
│   │   │   ├── agents.js          The perceive → reason → act loop
│   │   │   ├── llm.js             OpenRouter client
│   │   │   └── toolDefinitions.js Tool schemas sent to the LLM
│   │   └── browser/
│   │       ├── browserController.js  Playwright wrapper (click, type, scroll…)
│   │       └── domExtractor.js       Extracts interactive elements from the DOM
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                Layout + state
    │   ├── useAgentRun.js         Hook: config fetch + SSE run management
    │   ├── components/            StatusPill, Controls, LiveView, Timeline, ResultBanner
    │   └── index.css              Dark theme styling
    ├── vite.config.js            Dev server + /api proxy to the backend
    └── package.json
```

---

## Prerequisites

- Node.js 18+
- An [OpenRouter API key](https://openrouter.ai/keys)

---

## Setup

### 1. Backend

```bash
cd backend
npm install            # also runs `playwright install chromium`
cp .env.example .env   # then edit .env and add your OpenRouter API key
```

### 2. Frontend

```bash
cd frontend
npm install
npm run build          # outputs ./dist, which the backend serves
```

---

## Running

### Production mode (single server)

The backend serves the built React app from the same origin:

```bash
cd backend
npm start
```

Open **http://localhost:4000**.

### Development mode (hot reload)

Run the backend and the Vite dev server in two terminals:

```bash
# terminal 1
cd backend && npm start

# terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` requests to the backend on
port 4000. After changing frontend code, rebuild (`npm run build`) for the
production-served version (port 4000) to pick up the changes.

### CLI mode

Run a single goal without the UI:

```bash
cd backend
npm run agent -- "<goal>" "<url>"
```

Examples:

```bash
# Fill a form and submit it
npm run agent -- "Fill the text input with 'Browser Agent' and the textarea with 'Testing the automation agent', then click Submit" "https://www.selenium.dev/selenium/web/web-form.html"

# Fill every field on a form with sensible sample values
npm run agent -- "Find all the input fields and fill each one with appropriate sample data, then submit the form" "https://example.com/contact"

# Perform a search
npm run agent -- "Type 'browser automation' into the search box and submit" "https://example.com/search"
```

The first argument is the **goal** (plain English) and the second is the
**target URL**. If you omit both, the defaults from `config.js` are used.

---

## Configuration

Set in `backend/.env` (see `.env.example`):

| Variable | Description | Default |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | **Required.** Your OpenRouter API key | — |
| `OPENROUTER_MODEL` | Model identifier | `google/gemini-2.5-flash` |
| `PORT` | Backend port | `4000` |
| `HEADLESS` | Run Chromium headless (`true`/`false`) | `false` |
| `SLOW_MO` | Delay between Playwright actions (ms) | `400` |
| `MAX_STEPS` | Max agent steps before stopping | `15` |

---

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/config` | Returns model, headless flag, max steps, and default URL/goal |
| `GET` | `/api/run?url=&goal=` | Runs the agent, streaming progress as Server-Sent Events |

Only one run is processed at a time; requests made while a run is in progress
are rejected.
