import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { auditCommercialContract } from '../services/aiReviewService';
import { supabase } from '../lib/supabase';
import { ContractParser } from '../services/parser.service';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const parser = new ContractParser();

// Multi-turn Interactive AI Contract Q&A with Memory & Robust Fallback
router.post('/qa', async (req, res) => {
  try {
    const { contractText, question, governingLaw, history = [] } = req.body;

    if (!contractText || (!question && history.length === 0)) {
      return res.status(400).json({ error: 'contractText and question/history are required.' });
    }

const systemPrompt = `
You are DocuChain NG Contract AI Assistant, an authoritative Nigerian legal intelligence co-pilot.
Your task is to maintain a continuous, conversational legal dialogue regarding the provided contract.

APPLY THE LAWS OF THE FEDERAL REPUBLIC OF NIGERIA:
- Constitution of the Federal Republic of Nigeria (as amended).
- Companies and Allied Matters Act (CAMA) 2020 (including Section 102 execution rules).
- Labour Act (Cap L1 LFN 2004) & National Minimum Wage Act (statutory baseline: NGN 70,000/month; salaries below this baseline violate federal statutory thresholds).
- Arbitration and Mediation Act 2023 (repealed and replaced the ACA 1988 / Cap A18 LFN 2004).
- Nigeria Data Protection Act (NDPA) 2023 (principles of lawful processing, consent, and cross-border transfer requirements).
- Evidence Act, Land Use Act, and applicable tax legislation (e.g., Withholding Tax & FIRS regulations).
- Applicable State enactments (e.g., Lagos State Tenancy Law 2011 Section 4 restricting advance rent to 1 year for yearly tenants, Section 13 notice requirements). Do not assume Lagos State law unless the contract or user indicates Lagos or another specific State.

INSTRUCTIONS:
1. Apply current Nigerian statutory standards decisively without mentioning knowledge cutoffs or training dates.
2. Maintain conversation context and treat follow-up questions as referring to the active contract.
3. Plain English First: Explain clause implications plainly before presenting statutory analysis.
4. Detect Legal Risks: Flag clauses that are illegal, unenforceable, ambiguous, unfair, or inconsistent with Nigerian statutes.
5. Distinguish Mandates: Clearly separate mandatory statutory requirements from contractual terms and best practice recommendations.
6. Identify Missing Terms: Highlight critical statutory or commercial clauses absent from the draft.
7. Silent Issues: If the document is silent on an issue, note that it is unaddressed and provide the Nigerian default statutory position.
8. State Assumptions: If applicable law turns on missing facts (State jurisdiction, worker vs contractor status, corporate capacity), state the assumption briefly.
9. Factual Accuracy: Never fabricate clauses or statutory sections.
10. Return a strictly valid JSON object matching this schema:
{
  "answer": "Direct, plain-English and authoritative legal assessment under Nigerian law",
  "citation": "Exact contract clause and applicable Nigerian statute/section"
}
Return ONLY the raw JSON object without markdown formatting, code blocks, or extra text.
`;

// Map conversation history
    const formattedHistory = history.map((msg: { sender: 'ai' | 'user'; text: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    const conversationPayload = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `[CONTRACT CONTEXT]\nGoverning Law: ${governingLaw || 'Laws of the Federal Republic of Nigeria'}\n\nDocument Text:\n${contractText.slice(0, 32000)}`,
      },
      ...formattedHistory,
      { role: 'user', content: question },
    ];

    const response = await fetch('https://api.qorebit.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.QOREBIT_API_KEY || 'qb_live_vI39k_W01kgXXVbFLZa-9vRxAAtfOs-biA68fND2GgQ'}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationPayload,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qorebit AI failed (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    let content: string = data.choices?.[0]?.message?.content || '{}';

    // Robust JSON extract
    content = content.trim();
    if (content.includes('{') && content.includes('}')) {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      content = content.substring(start, end + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        answer: content.replace(/```json|```/g, '').trim(),
        citation: '',
      };
    }

    return res.status(200).json({
      success: true,
      answer: parsed.answer || 'How else can I assist with this contract audit?',
      citation: parsed.citation || '',
    });
  } catch (error: any) {
    console.error('Contract Q&A Route Error:', error.message || error);
    return res.status(500).json({
      error: 'Failed to answer contract question.',
      fallbackAnswer: 'An error occurred while analyzing the contract. Please try again.',
    });
  }
});

// Helper to extract text from files (uses ContractParser with OCR fallback)
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    const parseResult = await parser.parseDocument(file.buffer, 'application/pdf');
    return parseResult.text;
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
    const contractType = auditData.category || auditData.contractCategory || 'COMMERCIAL';
    const counterparty = auditData.counterparty || 'Counterparty Entity';
    const overallScore = typeof auditData.overallScore === 'number' ? auditData.overallScore : 70;
    const riskScore = typeof auditData.overallScore === 'number' ? Math.max(0, 100 - auditData.overallScore) : 30;
    const riskFlags = auditData.riskFlags || [];
    const status = riskFlags.length > 0 ? 'Flagged' : 'Audited';

    const metadataPayload = {
      rawDraft: rawText,
      extractedText: rawText,
      originalFileName: title,
      batchUploaded: true,
      risk_flags: riskFlags,
      overallScore,
      riskScore,
      governingLaw: auditData.governingLaw || 'Laws of the Federal Republic of Nigeria',
      summary: auditData.executiveSummary || '',
      category: contractType,
      counterparty,
      governing_statutes: [
        'CAMA 2020',
        'NDPA 2023',
        'Arbitration and Mediation Act 2023',
        'National Minimum Wage Act 2024',
        'Labour Act (Cap L1 LFN 2004)',
        'Lagos State Tenancy Law 2011',
      ],
    };

    // Primary Contract Insert (Strictly mapped to verified contracts schema)
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .insert({
        title,
        contract_type: contractType,
        counterparty,
        status,
        risk_score: riskScore,
        metadata: metadataPayload,
      })
      .select()
      .single();

    if (contractErr) {
      console.error('❌ Supabase contracts insert error:', contractErr);
      return {
        insertSuccess: false,
        error: contractErr.message,
        code: contractErr.code,
        details: contractErr.details,
        hint: contractErr.hint,
      };
    }

    console.log('✅ Contract saved to Supabase with ID:', contract.id);

    // Relational risk flags insert
    if (contract?.id && riskFlags.length > 0) {
      try {
        const riskRows = riskFlags.map((risk: any) => ({
          contract_id: contract.id,
          clause_title: risk.clauseTitle || 'Statutory Deviation',
          badge_label: risk.badgeLabel || risk.legalBasis || 'Statute Violation',
          risk_level: risk.riskLevel || 'HIGH',
          original_text: risk.originalText || '',
          recommended_redline: risk.recommendedRedline || '',
          legal_basis: risk.legalBasis || 'Nigerian Statutory Framework',
          plain_english_explanation: risk.plainEnglishExplanation || risk.issue || '',
        }));

        const { error: flagErr } = await supabase.from('risk_flags').insert(riskRows);
        if (flagErr) {
          console.warn('⚠️ risk_flags table insert warning:', flagErr.message);
        }
      } catch (flagErr: any) {
        console.warn('⚠️ risk_flags table insert error:', flagErr.message);
      }
    }

    return contract;
  } catch (err: any) {
    console.error('❌ Failed to persist audit in Supabase:', err.message || err);
    return { insertSuccess: false, error: err.message || String(err) };
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
    const savedContract = await saveAuditToSupabase(title || 'Audited Agreement', contractText, auditResult);

    return res.status(200).json({
      success: true,
      data: auditResult,
      dbRecord: savedContract,
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
        if (!text || text.trim().length === 0) {
          return { filename: file.originalname, success: false, error: 'Empty file text.' };
        }

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