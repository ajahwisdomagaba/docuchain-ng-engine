// src/orchestrator.ts
import { ContractParser } from './services/parser.service';
import { ContractNormalizer } from './services/normalizer.service';
import { ContractExtractor } from './services/extractor.service';
import { TenancyRedlineService } from './services/redline.service';
import { supabase } from './services/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.parser = new ContractParser();
    this.normalizer = new ContractNormalizer();
    this.extractor = new ContractExtractor();
    this.redlineService = new TenancyRedlineService();
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  public async processContract(input: ProcessContractInput) {
    const { fileBuffer, fileName, mimeType, userId, organizationId } = input;

    const storagePath = `${userId}/${Date.now()}_${fileName}`;
    const { error: uploadErr } = await supabase.storage
      .from('contracts')
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    const parseResult = await this.parser.parseDocument(fileBuffer, mimeType);
    const rawText = parseResult.text;

    const extraction = await this.extractor.extractContractData(rawText);

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

    await supabase.from('contract_participants').insert({
      contract_id: contract.id,
      user_id: userId,
      role: 'tenant',
      organization_id: organizationId || null,
    });

    const chunks = await this.normalizer.splitTextIntoChunks(rawText);
    const embModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });

    for (const chunk of chunks) {
      const embRes = await embModel.embedContent(chunk.pageContent);

      await supabase.from('contract_chunks').insert({
        contract_id: contract.id,
        content: chunk.pageContent,
        metadata: chunk.metadata || {},
        embedding: embRes.embedding.values,
      });
    }

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