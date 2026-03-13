# ATS Resume Checker

Resume checker website with:
- React frontend (`UploadResume.jsx`, `Result.jsx`)
- Spring Boot backend (`Controller`, `Service`, `ResumeParser`)

## Project Structure

```text
ats-resume-checker
|
|-- frontend
|   |-- React
|       |-- UploadResume.jsx
|       |-- Result.jsx
|
|-- backend
|   |-- Spring Boot
|       |-- src/main/java/com/resumechecker/controller/ResumeController.java
|       |-- src/main/java/com/resumechecker/service/ResumeAnalysisService.java
|       |-- src/main/java/com/resumechecker/service/ResumeParser.java
|
|-- README.md
```

## API (Spring Boot)

Base URL: `http://localhost:8080/api/resume`

### `POST /analyze`
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (PDF/DOCX/TXT)
  - `jobDescription` (optional text)

### `POST /generate-ats`
- Content-Type: `application/json`
- Body:

```json
{
  "resumeText": "....",
  "jobDescription": "...."
}
```

## Run Backend (Spring Boot)

```bash
cd "backend/Spring Boot"
mvn spring-boot:run
```

## Run Frontend (React)

```bash
cd "frontend/React"
npm install
npm run dev
```

Open: `http://localhost:5173`

## Notes

- Existing `backend/Node` is still present in the repo but not required for the Spring Boot flow.
- Frontend calls `/api/resume/analyze` and `/api/resume/generate-ats` which are implemented in the Spring Boot backend.
