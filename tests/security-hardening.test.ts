import { describe, it, expect } from "vitest";
import {
  sanitizeErrorMessage,
  validateFileSize,
  sanitizeFileName,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/security/sanitize";

describe("Phase 8: Security & Hardening", () => {
  describe("Secret Sanitization", () => {
    it("redacts OpenRouter API keys from error messages", () => {
      const leaked = "Error communicating with provider sk-or-v1-abcdef1234567890abcdef at endpoint";
      const sanitized = sanitizeErrorMessage(leaked);
      expect(sanitized).not.toContain("sk-or-v1-abcdef1234567890abcdef");
      expect(sanitized).toContain("[REDACTED_CREDENTIAL]");
    });

    it("redacts Postgres database connection strings from error messages", () => {
      const leaked = "Connection failed to postgresql://user:super_secret_pw@db.neon.tech/contractlens";
      const sanitized = sanitizeErrorMessage(leaked);
      expect(sanitized).not.toContain("super_secret_pw");
      expect(sanitized).toContain("[REDACTED_CREDENTIAL]");
    });

    it("redacts local file paths containing user names", () => {
      const leaked = "Failed to load /Users/subiksharamesh/ContractLens/samples/contract.pdf";
      const sanitized = sanitizeErrorMessage(leaked);
      expect(sanitized).not.toContain("/Users/subiksharamesh/");
      expect(sanitized).toContain("/workspace/");
    });

    it("returns safe default on empty or undefined error messages", () => {
      expect(sanitizeErrorMessage("")).toBe("An unexpected error occurred.");
    });
  });

  describe("File Size Validation & Name Sanitization", () => {
    it("defines 10MB limit in bytes", () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    });

    it("allows files under 10 MB limit", () => {
      const valid = validateFileSize(5 * 1024 * 1024);
      expect(valid.valid).toBe(true);
      expect(valid.error).toBeUndefined();
    });

    it("rejects files exceeding 10 MB limit", () => {
      const invalid = validateFileSize(11 * 1024 * 1024);
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toContain("exceeds maximum allowed limit of 10 MB");
    });

    it("sanitizes malicious file names to prevent path traversal", () => {
      expect(sanitizeFileName("../../../etc/passwd")).toBe("passwd");
      expect(sanitizeFileName("contract<tag>alert.pdf")).toBe("contract_tag_alert.pdf");
      expect(sanitizeFileName("valid_contract_v1.pdf")).toBe("valid_contract_v1.pdf");
    });
  });
});

