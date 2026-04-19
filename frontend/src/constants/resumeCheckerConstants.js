// Purpose: Centralize shared UI constants and validation limits.
export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_RESUME_EXTENSIONS = [".pdf", ".docx", ".txt"];
export const SUPPORTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
export const RESUME_FILE_ACCEPT = SUPPORTED_RESUME_EXTENSIONS.join(",");

export const MESSAGES = {
  uploadRequired: "Please upload your resume in PDF, DOCX, or TXT format.",
  uploadInvalidType: "Only PDF, DOCX, or TXT files are supported right now.",
  uploadSizeExceeded: "File size must be 10MB or less.",
  analyzeFailed: "Unable to analyze resume.",
};
