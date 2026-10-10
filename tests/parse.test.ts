import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseDocument } from "@/lib/parse";

describe("Phase 2: Ingestion & Document Parsing (Deterministic / 0 AI Calls)", () => {
  it("parses pasted plain text and normalizes carriage returns", async () => {
    const raw = "Line 1\r\nLine 2\rLine 3\n";
    const result = await parseDocument({ text: raw });

    expect(result.kind).toBe("text");
    expect(result.pages).toBeNull();
    expect(result.text).toBe("Line 1\nLine 2\nLine 3\n");
    expect(result.fileName).toBeNull();
  });

  it("parses a synthetic plain text file from buffer", async () => {
    const samplePath = path.resolve(import.meta.dirname, "../samples/synthetic-contract-v1.txt");
    const buffer = fs.readFileSync(samplePath);

    const result = await parseDocument({
      buffer,
      fileName: "synthetic-contract-v1.txt",
    });

    expect(result.kind).toBe("text");
    expect(result.fileName).toBe("synthetic-contract-v1.txt");
    expect(result.text).toContain("MASTER SERVICES AGREEMENT");
    expect(result.text).toContain("Nexus Logic Systems LLC");
  });

  it("parses a real DOCX fixture using Mammoth", async () => {
    const docxPath = path.resolve(import.meta.dirname, "./fixtures/sample-contract.docx");
    const buffer = fs.readFileSync(docxPath);

    const result = await parseDocument({
      buffer,
      fileName: "sample-contract.docx",
    });

    expect(result.kind).toBe("docx");
    expect(result.text).toContain("This is a synthetic master services agreement");
    expect(result.pages).toBeNull();
  });

  it("parses a real PDF fixture and computes page offsets using unpdf", async () => {
    const pdfPath = path.resolve(import.meta.dirname, "./fixtures/sample-contract.pdf");
    const buffer = fs.readFileSync(pdfPath);

    const result = await parseDocument({
      buffer,
      fileName: "sample-contract.pdf",
    });

    expect(result.kind).toBe("pdf");
    expect(result.text).toContain("MASTER SERVICES AGREEMENT");
    expect(result.pages).toBeDefined();
    expect(result.pages?.length).toBeGreaterThanOrEqual(1);
    expect(result.pages?.[0].page).toBe(1);
    expect(result.pages?.[0].start).toBe(0);
  });

  it("rejects empty text with informative error message", async () => {
    await expect(parseDocument({ text: "   \n\t  " })).rejects.toThrow(
      "Document contains no readable text."
    );
  });

  it("rejects unsupported file extensions with friendly message", async () => {
    const fakeImageBuffer = Buffer.from("fake-png-bytes");
    await expect(
      parseDocument({
        buffer: fakeImageBuffer,
        fileName: "scanned-contract.png",
      })
    ).rejects.toThrow(
      "Unsupported file type '.png'. Only PDF (.pdf), Word (.docx), and plain text (.txt) files are supported."
    );
  });

  it("rejects oversized files exceeding MAX_UPLOAD_MB", async () => {
    // Default limit is 5MB. Create a buffer of 6MB.
    const oversizeBuffer = Buffer.alloc(6 * 1024 * 1024);

    await expect(
      parseDocument({
        buffer: oversizeBuffer,
        fileName: "large-contract.pdf",
      })
    ).rejects.toThrow("exceeds maximum allowed limit of 5 MB");
  });
});
