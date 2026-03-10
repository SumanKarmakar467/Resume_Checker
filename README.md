# ATS Resume Checker (MERN)

This project now includes a MERN implementation for ATS resume analysis:
1. User uploads resume in PDF format.
2. Node/Express extracts PDF text.
3. ATS score is calculated section-wise.
4. Low-score portions are highlighted.
5. Suggestions are generated.
6. ATS-friendly resume draft is generated.

## Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- Axios

### Backend (MERN)
- Node.js
- Express.js
- MongoDB (optional persistence)
- Mongoose
- Multer + pdf-parse

## Project Structure

- `frontend/React` -> React frontend app
- `backend/Node` -> Node + Express ATS API
- `backend/Spring Boot` -> Older Java version (optional, not required for MERN run)

## API Endpoints

Base URL: `http://localhost:8080/api/resume`

### `POST /analyze`
Form-data:
- `file` (PDF)
- `jobDescription` (text)

Returns:
- `overallScore`
- `sections[]` (score/status/issues/suggestions)
- `missingKeywords[]`
- `suggestions[]`
- `extractedText`

### `POST /generate-ats`
JSON:
```json
{
  "resumeText": "...",
  "jobDescription": "..."
}
```

Returns:
```json
{
  "generatedResume": "..."
}
```

## Run MERN Backend

```bash
cd "backend/Node"
copy .env.example .env
npm install
npm run dev
```

If you want MongoDB persistence, set `MONGODB_URI` in `.env`.
If `MONGODB_URI` is empty, backend still runs without database storage.

## Run Frontend

```bash
cd "frontend/React"
copy .env.example .env
npm install
npm run dev
```

Open: `http://localhost:5173`

## Important

- Do not open `127.0.0.1:5500/index.html` with Live Server.
- Use Vite URL: `http://localhost:5173`.
- Current upload support is PDF only.
