/**
 * Security and sanitization utilities for ContractLens
 * Ensures that API keys, database credentials, internal stack traces,
 * and malicious input are safely handled and never leaked.
 */

const SENSITIVE_PATTERNS = [
  /postgres(ql)?:\/\/[^:]+:[^@]+@[^/]+\/[^\s]+/gi, // Postgres connection strings with passwords
  /sk-or-v1-[a-zA-Z0-9_-]+/gi, // OpenRouter API keys
  /Bearer\s+[a-zA-Z0-9_.-]+/gi, // Bearer tokens
  /AIza[0-9A-Za-z-_]{35}/gi, // Google API keys
  /ghp_[a-zA-Z0-9]{36}/gi, // GitHub tokens
];

/**
 * Strips secrets, connection strings, and credential tokens from error messages or logs.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== "string") return "An unexpected error occurred.";

  let cleaned = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[REDACTED_CREDENTIAL]");
  }

  // Remove full local file paths that reveal system username
  cleaned = cleaned.replace(/\/Users\/[a-zA-Z0-9._-]+\//g, "/workspace/");

  return cleaned;
}

/**
 * Validates file upload size against maximum limit (default 10 MB).
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateFileSize(sizeInBytes: number, maxSize = MAX_FILE_SIZE_BYTES): { valid: boolean; error?: string } {
  if (sizeInBytes > maxSize) {
    const sizeMb = (sizeInBytes / (1024 * 1024)).toFixed(1);
    const limitMb = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of ${limitMb} MB.`,
    };
  }
  return { valid: true };
}

/**
 * Sanitizes uploaded file names to prevent directory traversal or unusual characters.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return "contract";
  // Remove directory separators and path traversal
  const base = name.replace(/^.*[\\/]/, "");
  // Remove non-alphanumeric chars except dots, dashes, underscores, and spaces
  const clean = base.replace(/[^a-zA-Z0-9._\- ]/g, "_");
  return clean.slice(0, 150);
}
