// Purpose: Shared resume file validation helpers used across upload flows.
import {
  MAX_RESUME_FILE_SIZE_BYTES,
  SUPPORTED_RESUME_EXTENSIONS,
  SUPPORTED_RESUME_MIME_TYPES,
} from "../constants/resumeCheckerConstants";

function getFileExtension(filename = "") {
  const value = String(filename || "").toLowerCase();
  const lastDot = value.lastIndexOf(".");
  if (lastDot < 0) return "";
  return value.slice(lastDot);
}

export function isSupportedResumeFileType(file) {
  if (!file) return false;
  const extension = getFileExtension(file.name);
  return (
    SUPPORTED_RESUME_MIME_TYPES.includes(file.type) ||
    SUPPORTED_RESUME_EXTENSIONS.includes(extension)
  );
}

export function isWithinResumeSizeLimit(file) {
  if (!file || !Number.isFinite(file.size)) return false;
  return file.size <= MAX_RESUME_FILE_SIZE_BYTES;
}

