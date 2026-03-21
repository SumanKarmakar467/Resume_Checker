// Purpose: Centralize shared UI constants and validation limits.
export const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_RESUME_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export const MESSAGES = {
  uploadRequired: 'Please upload your resume in PDF, DOCX, or TXT format.',
  uploadInvalidType: 'Only PDF, DOCX, or TXT files are supported right now.',
  uploadSizeExceeded: 'File size must be 5MB or less.',
  analyzeFailed: 'Unable to analyze resume.'
};
