# AI-Powered Healthcare Triage Bot (MERN + OpenAI)

Separate folders for server (Node/Express/MongoDB/JWT/OpenAI) and client (React + Material UI).

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API Key

## Setup

### 1) Server
```
cd server
npm install
cp .env.example .env  # On Windows: copy .env.example .env
# Edit .env with your values
npm run dev
```

Env vars (`server/.env`):
- PORT=5000
- MONGO_URI=mongodb://127.0.0.1:27017/triagebot
- JWT_SECRET=replace_with_strong_secret
- OPENAI_API_KEY=sk-...
- CLIENT_ORIGIN=http://localhost:5173

### 2) Client
```
cd client
npm install
cp .env.example .env  # On Windows: copy .env.example .env
# Edit .env if API URL differs
npm run dev
```

Env vars (`client/.env`):
- VITE_API_URL=http://localhost:5000

## Features
- Register/Login with JWT
- Protected triage chat using OpenAI
- Stores conversations in MongoDB
- React + Material UI interface

## Legal/Safety
- This app is for informational triage support only and does not provide medical advice. Always seek professional care in emergencies.
