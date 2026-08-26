import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { auditCommercialContract } from '../services/aiReviewService';
import { supabase } from '../lib/supabase';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Helper to extract text from files
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  } else if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else {
    return file.buffer.toString('utf-8');
  }
}

// Helper to save audit result into Supabase PostgreSQL
async function saveAuditToSupabase(title: string, rawText: string, auditData: any) {
  try {
    const category = auditData.contractCategory || 'TENANCY';
    const counterparty = auditData.parties?.disclosingOrClient || 'Counterparty Entity';
    const overallScore = auditData.overallScore || 65;
    const riskFlagsCount = auditData.riskFlags?.length || 0;
    const status = riskFlagsCount > 0 ? 'Flagged' : 'Audited';

    // 1. Insert Contract Record
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .insert({
        title,
        category,
        counterparty,
        governing_law: auditData.governingLaw || 'Laws of the Federal Republic of Nigeria',
        overall_score: overallScore,
        status,
        raw_text: rawText,
      })
      .select()
      .single();

    if (contractErr) throw contractErr;

    // 2. Insert Risk Flags / Statutory Deviations
    if (auditData.riskFlags && auditData.riskFlags.length > 0) {
      const riskRows = auditData.riskFlags.map((risk: any) => ({
        contract_id: contract.id,
        clause_title: risk.clauseTitle,
        badge_label: risk.legalBasis || 'Statutory Non-Compliance',
        risk_level: risk.riskLevel || 'HIGH',
        original_text: risk.originalText,
        recommended_redline: risk.recommendedRedline,
        legal_basis: risk.legalBasis,
        plain_english_explanation: risk.plainEnglishExplanation,
      }));

      await supabase.from('risk_flags').insert(riskRows);
    }

    // 3. Auto-calculate and Insert Statutory Obligation (e.g., 6-month notice for Tenancy)
    if (category === 'TENANCY') {
      const defaultDueDate = new Date();
      defaultDueDate.setMonth(defaultDueDate.getMonth() + 6); // 6 months statutory countdown

      await supabase.from('obligations').insert({
        contract_id: contract.id,
        contract_title: title,
        category,
        counterparty,
        obligation_type: 'Statutory Notice to Quit',
        due_date: defaultDueDate.toISOString().split('T')[0],
        statutory_rule: 'Section 13 Lagos State Tenancy Law 2011 (6-Month Notice)',
        status: 'Upcoming',
      });
    }

    return contract;
  } catch (err) {
    console.error('Failed to persist audit in Supabase:', err);
    return null;
  }
}

// Fetch all contracts from Supabase
router.get('/contracts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, risk_flags(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, contracts: data });
  } catch (error: any) {
    console.error('Fetch Contracts Error:', error);
    return res.status(500).json({ error: 'Failed to fetch contracts.' });
  }
});

// Single Manual Contract Audit + Persistence
router.post('/audit', async (req, res) => {
  try {
    const { contractText, category, title } = req.body;
    if (!contractText) {
      return res.status(400).json({ error: 'Contract text is required for auditing.' });
    }

    const auditResult = await auditCommercialContract(contractText, category);
    
    // Save to database
    const savedContract = await saveAuditToSupabase(title || 'Audited Agreement', contractText, auditResult);

    return res.status(200).json({ 
      success: true, 
      data: auditResult,
      dbRecord: savedContract 
    });
  } catch (error: any) {
    console.error('Commercial Audit Error:', error);
    return res.status(500).json({ error: 'Failed to complete contract audit.' });
  }
});

// Batch Upload + Persistence
router.post('/batch-audit', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const auditPromises = files.map(async (file) => {
      try {
        const text = await extractTextFromFile(file);
        if (!text || text.trim().length === 0) return { filename: file.originalname, success: false };

        const auditData = await auditCommercialContract(text);
        const title = file.originalname.replace(/\.[^/.]+$/, '');
        const dbRecord = await saveAuditToSupabase(title, text, auditData);

        return { filename: file.originalname, success: true, data: auditData, dbRecord };
      } catch (err: any) {
        return { filename: file.originalname, success: false, error: err.message };
      }
    });

    const results = await Promise.all(auditPromises);
    return res.status(200).json({ success: true, count: results.length, results });
  } catch (error: any) {
    console.error('Batch Audit Error:', error);
    return res.status(500).json({ error: 'Failed to process batch files.' });
  }
});

// Delete Contract from Supabase
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;

    return res.status(200).json({ success: true, message: `Contract ${id} deleted successfully.` });
  } catch (error: any) {
    console.error('Delete Contract Error:', error);
    return res.status(500).json({ error: 'Failed to delete contract from database.' });
  }
});

export default router;