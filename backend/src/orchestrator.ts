// src/orchestrator.ts
import { ContractParser } from './services/parser.service';
import { ContractNormalizer } from './services/normalizer.service';
import { ContractExtractor } from './services/extractor.service';
import { TenancyRedlineService } from './services/redline.service';
import { supabase } from './services/supabase';
import OpenAI from 'openai';

export interface ProcessContractInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
  organizationId?: string;
}

export class ContractOrchestrator {
  private parser: ContractParser;
  private normalizer: ContractNormalizer;
  private extractor: ContractExtractor;
  private redlineService: TenancyRedlineService;
  private qorebit: OpenAI;
  private embeddingModel: string;

  constructor() {
    this.parser = new ContractParser();
    this.normalizer = new ContractNormalizer();
    this.extractor = new ContractExtractor();
    this.redlineService = new TenancyRedlineService();
    
    // Initialize Qorebit AI Client via OpenAI SDK
    this.qorebit = new OpenAI({
      apiKey: process.env.QOREBIT_API_KEY,
      baseURL: process.env.QOREBIT_BASE_URL || 'https://api.qorebit.ai/v1',
    });
    this.embeddingModel = process.env.QOREBIT_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  public async processContract(input: ProcessContractInput) {
    const { fileBuffer, fileName, mimeType, userId, organizationId } = input;

    // 1. Upload raw file to Supabase Storage
    const storagePath = `${userId}/${Date.now()}_${fileName}`;
    const { error: uploadErr } = await supabase.storage
      .from('contracts')
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    // 2. Parse document text
    const parseResult = await this.parser.parseDocument(fileBuffer, mimeType);
    const rawText = parseResult.text;

    // 3. Extract contract data and statutory compliance issues
    const extraction = await this.extractor.extractContractData(rawText);

    // 4. Save contract record to Supabase
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .insert({
        organization_id: organizationId || null,
        file_name: fileName,
        file_path: storagePath,
        file_type: mimeType,
        status: extraction.issues.length ? 'requires_review' : 'compliant',
        effective_date: extraction.data?.effectiveDate || null,
        expiry_date: extraction.data?.expiryDate || null,
        notice_period_days: extraction.data?.noticePeriodDays || 180,
        extracted_data: extraction.data || {},
      })
      .select()
      .single();

    if (contractErr) throw new Error(`Database insert error: ${contractErr.message}`);

    // 5. Link participant
    await supabase.from('contract_participants').insert({
      contract_id: contract.id,
      user_id: userId,
      role: 'tenant',
      organization_id: organizationId || null,
    });

    // 6. Split chunks and generate embeddings using Qorebit AI
    const chunks = await this.normalizer.splitTextIntoChunks(rawText);

    for (const chunk of chunks) {
      const embeddingResponse = await this.qorebit.embeddings.create({
        model: this.embeddingModel,
        input: chunk.pageContent.replace(/\n/g, ' '),
      });

      const embeddingValues = embeddingResponse.data[0]?.embedding;

      if (embeddingValues) {
        await supabase.from('contract_chunks').insert({
          contract_id: contract.id,
          content: chunk.pageContent,
          metadata: chunk.metadata || {},
          embedding: embeddingValues,
        });
      }
    }

    // 7. Generate redlines and compliance report
    const redlineReport = await this.redlineService.generateRedlines(
      rawText,
      extraction.issues,
      {
        location: extraction.data?.propertyLocationState || 'Lagos',
        isExemptArea: extraction.data?.isExemptArea || false,
        tenancyType: extraction.data?.tenancyType || 'Yearly',
      }
    );

    return {
      contractId: contract.id,
      extractedData: extraction.data,
      complianceIssues: extraction.issues,
      redlines: redlineReport,
    };
  }
}