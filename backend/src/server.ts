import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { ContractExtractor } from './services/extractor.service';
import { TenancyRedlineService } from './services/redline.service';
import { ContractStorageService } from './services/storage.service';
import { SemanticSearchService } from './services/search.service';
import { startTelegramBot } from './bot/telegramBot';
import { scheduleNightlyAlertsJob } from './jobs/contractAlerts.job';

// Initialize BullMQ repeatable schedule
scheduleNightlyAlertsJob().catch(console.error);


const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Enable CORS for frontend clients
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

const extractor = new ContractExtractor();
const redlineService = new TenancyRedlineService();
const storageService = new ContractStorageService();
const searchService = new SemanticSearchService();

// Root & Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ service: 'DocuChain NG Backend Engine', status: 'online' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', engine: 'DocuChain NG' });
});

// Review & Auto-Save
app.post('/api/review', async (req: Request, res: Response) => {
  try {
    const { documentText } = req.body;

    if (!documentText || typeof documentText !== 'string') {
      return res.status(400).json({ error: 'documentText is required and must be a string.' });
    }

    const extraction = await extractor.extractContractData(documentText);
    const redlines = await redlineService.generateRedlines(
      documentText,
      extraction.issues,
      {
        location: extraction.data?.propertyLocationState || 'Lagos',
        isExemptArea: extraction.data?.isExemptArea || false,
        tenancyType: extraction.data?.tenancyType || 'Yearly',
      }
    );

    let savedContract = null;
    if (extraction.data) {
      savedContract = await storageService.saveAnalyzedContract(
        documentText,
        extraction.data,
        extraction.issues,
        redlines
      );
    }

    return res.status(200).json({
      success: true,
      contractId: savedContract?.id,
      extractedData: extraction.data,
      complianceIssues: extraction.issues,
      redlineReport: redlines,
    });
  } catch (error: any) {
    console.error('Review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during contract review.',
    });
  }
});

// GET all contracts
app.get('/api/contracts', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, contracts: data || [] });
  } catch (err: any) {
    console.error('Error fetching contracts:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET single contract by ID
app.get('/api/contracts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, contract: data });
  } catch (err: any) {
    console.error(`Error fetching contract ${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Search Clauses
app.get('/api/clauses', async (req: Request, res: Response) => {
  try {
    const { type, compliantOnly } = req.query;
    const isCompliant = compliantOnly !== undefined ? compliantOnly === 'true' : undefined;

    const results = await searchService.searchClausesByText(
      type as string | undefined,
      isCompliant
    );

    return res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DocuChain Engine listening on port ${PORT}`);
  startTelegramBot();
});