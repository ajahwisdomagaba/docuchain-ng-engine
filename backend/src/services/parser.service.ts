// src/services/parser.service.ts
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export interface ParseResult {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export class ContractParser {
  public async parseDocument(fileBuffer: Buffer, mimeType: string): Promise<ParseResult> {
    if (mimeType === 'application/pdf') {
      try {
        const parsedPdf = await pdfParse(fileBuffer);
        if (parsedPdf.text && parsedPdf.text.trim().length > 50) {
          return {
            text: parsedPdf.text,
            pageCount: parsedPdf.numpages,
            metadata: parsedPdf.info,
          };
        }
      } catch (err) {
        console.warn('PDF text parse failed, falling back to OCR...', err);
      }
    }

    // Fallback OCR for scanned PDFs or images
    const worker = await createWorker('eng');
    const ret = await worker.recognize(fileBuffer);
    await worker.terminate();

    return {
      text: ret.data.text,
      metadata: { confidence: ret.data.confidence },
    };
  }
}