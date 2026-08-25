// src/services/normalizer.service.ts
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export class ContractNormalizer {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  public async splitTextIntoChunks(text: string) {
    return await this.splitter.createDocuments([text]);
  }
}