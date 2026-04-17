<!-- This is a Resume Analyzer  &  also This website can create new Resume -->
# ATS Resume Checker (MERN)

AI-powered ATS Resume Checker built with **React + Express + MongoDB + Gemini**.

## Architecture

```text
+--------------------+        HTTP (REST)         +-------------------------+
| React (Vite)       |  <---------------------->  | Node.js + Express API   |
| frontend/React     |                            | backend/server.js       |
+--------------------+                            +-----------+-------------+
                                                              |
                                               Mongoose       |
                                                              v
                                                    +-------------------+
                                                    | MongoDB Atlas     |
                                                    | resume analyses   |
                                                    +-------------------+
                                                              |
                                                              | SDK call
                                                              v
                                                    +-------------------+
                                                    | Google Gemini API |
                                                    +-------------------+
```

## Backend Structure

```text
backend/
├── server.js
├── package.json
├── .env
├── config/
│   └── db.js
├── models/
│   └── ResumeAnalysis.js
├── routes/
│   └── resume.routes.js
├── controllers/
│   └── resume.controller.js
├── services/
│   └── resume.service.js
└── middleware/
    ├── upload.middleware.js
    └── error.middleware.js
```

## Features

- Upload resume in **PDF / DOCX / TXT** (up to 10MB)
- ATS analysis against optional job description
- Keyword match and missing-keyword detection
- ATS score + feedback + suggestions
- ATS-optimized resume generation
- Resume analysis history with server-side limit support
- Automatic in-memory fallback when MongoDB is unavailable

## API Endpoints

Base URL: `http://localhost:5000/api/resume`

- `POST /analyze`
  - `multipart/form-data`
  - fields:
    - `file` (required)
    - `jobDescription` (optional)
- `POST /generate-ats`
  - JSON body:
    ```json
    {
      "resumeText": "...",
      "jobDescription": "..."
    }
    ```
- `GET /history`
  - query params:
    - `limit` (optional, `1-100`, default `25`)
    - `includeText` (optional, `1/true/yes` to include extracted resume text)
- `GET /health`
  - returns service status, uptime, storage mode, and MongoDB connection state

## Mongoose Schema

```js
const ResumeAnalysisSchema = new mongoose.Schema({
  filename: String,
  resumeText: String,
  jobDescription: String,
  atsScore: Number,
  matchedKeywords: [String],
  missingKeywords: [String],
  feedback: String,
  suggestions: [String],
  optimizedResume: String,
  createdAt: { type: Date, default: Date.now }
});
```

## Environment Variables

### Backend (`backend/.env`)

```bash
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

### Frontend (`frontend/React/.env`)

```bash
VITE_API_URL=http://localhost:5000
VITE_ADMIN_EMAIL=
VITE_API_TIMEOUT_MS=20000
```

`VITE_ADMIN_EMAIL` is optional and only used to show/hide the admin dashboard link.
`VITE_API_TIMEOUT_MS` is optional and controls frontend API timeout in milliseconds.
If `VITE_ADMIN_EMAIL` is not set, the first registered account becomes the local owner/admin by default.

## Run Locally

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend/React
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Quick Checks

### Backend health

```bash
curl http://localhost:5000/health
```

### History (latest 10, without full resume text)

```bash
curl "http://localhost:5000/api/resume/history?limit=10"
```

## Frontend Routes

- `/upload` -> upload resume + analyze
- `/result` -> ATS score, keywords, suggestions, optimized resume download
- `/history` -> past analysis records from MongoDB
- `/admin` -> admin dashboard (owner/admin only)

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MongoDB Atlas + Mongoose
- File Parsing: `pdf-parse`, `mammoth`, `multer`
- AI: `@google/generative-ai` (Gemini)
