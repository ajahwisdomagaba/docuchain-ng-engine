import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { auditCommercialContract, getActivePlaybook } from '../services/aiReviewService';
import { supabase } from '../lib/supabase';
import { ContractParser } from '../services/parser.service';
import { generateContractObligations } from '../services/obligationGenerator';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const parser = new ContractParser();

// Multi-turn Interactive AI Contract Q&A
router.post('/qa', async (req, res) => {
  try {
    const { contractText, question, governingLaw, history = [] } = req.body;

    if (!contractText || (!question && history.length === 0)) {
      return res.status(400).json({ error: 'contractText and question/history are required.' });
    }

    const systemPrompt = `
You are DocuChain NG Contract AI Assistant, an authoritative Nigerian legal intelligence co-pilot.
Your task is to maintain a continuous, conversational legal dialogue regarding the provided contract.

APPLY THE CURRENT LAWS OF THE FEDERAL REPUBLIC OF NIGERIA:

* Constitution of the Federal Republic of Nigeria (as amended).
* Companies and Allied Matters Act (CAMA) 2020.
* Labour Act (Cap L1 LFN 2004).
* National Minimum Wage Act using the current statutory minimum wage.
* Arbitration and Mediation Act 2023.
* Nigeria Data Protection Act (NDPA) 2023.
* Evidence Act.
* Land Use Act.
* Applicable tax legislation.
* Applicable State laws where relevant (e.g. tenancy, property and landlord-tenant matters). Do not assume Lagos State law unless the contract or user specifies Lagos or another State.

INSTRUCTIONS:

1. Apply the current laws of the Federal Republic of Nigeria without mentioning knowledge cutoffs or update dates.
2. Maintain conversation context and treat follow-up questions as referring to the same contract unless the user provides another contract.
3. Base every answer primarily on the contract provided, using Nigerian law only to interpret, explain or assess its legal effect.
4. Explain the relevant contract clause in plain English before giving legal analysis.
5. Identify whether the clause is legally compliant, commercially reasonable, ambiguous, unenforceable, inconsistent with Nigerian law or presents legal risk.
6. If the contract is silent on the issue raised, clearly state that the contract does not address it and explain the default legal position under Nigerian law.
7. If answering depends on missing facts (such as governing State, employment status, corporate status, property location or governing law), clearly state the assumption before applying the law.
8. Never invent facts, contract clauses, clause numbers or statutory provisions. If the information cannot be determined from the contract, clearly say so.
9. Where appropriate, cite the relevant contract clause together with the applicable Nigerian statute and section.
10. Keep responses concise, practical, authoritative and easy for non-lawyers to understand.

Return a strictly valid JSON object matching this schema:
{
"answer": "Direct, authoritative legal explanation using current Nigerian law.",
"citation": "Exact contract clause and applicable Nigerian statute/section."
}

Return ONLY the raw JSON object. Do not include markdown formatting, code blocks, explanations or any additional text.
`;


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

// Helper to extract text from files
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

// Helper to save audit result into Supabase PostgreSQL and trigger obligations
async function saveAuditToSupabase(
  title: string, 
  rawText: string, 
  auditData: any, 
  clientId?: string | null,
  workspaceId?: string | null,
  userId?: string | null
) {
  try {
    const contractType = auditData.category || auditData.contractCategory || 'COMMERCIAL';
    const counterparty = auditData.counterparty || auditData.parties?.receivingOrVendor || auditData.parties?.disclosingOrClient || 'Counterparty Entity';
    const overallScore = typeof auditData.overallScore === 'number' ? auditData.overallScore : 70;
    const riskScore = typeof auditData.overallScore === 'number' ? Math.max(0, 100 - auditData.overallScore) : 30;
    const riskFlags = auditData.riskFlags || [];
    const status = riskFlags.length > 0 ? 'Flagged' : 'Audited';
    const keyDates = auditData.keyDates || {};

    const metadataPayload = {
      rawDraft: rawText,
      extractedText: rawText,
      rawText: rawText,
      originalFileName: title,
      batchUploaded: true,
      risk_flags: riskFlags,
      overallScore,
      riskScore,
      governingLaw: auditData.governingLaw || 'Laws of the Federal Republic of Nigeria',
      summary: auditData.executiveSummary || '',
      category: contractType,
      counterparty,
      keyDates,
      clientId: clientId || null,
      workspaceId: workspaceId || null,
      governing_statutes: [
        'CAMA 2020',
        'NDPA 2023',
        'Arbitration and Mediation Act 2023',
        'National Minimum Wage Act 2024',
        'Labour Act (Cap L1 LFN 2004)',
        'Lagos State Tenancy Law 2011',
      ],
    };

    // 1. Insert Contract Record
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .insert({
        title,
        contract_type: contractType,
        counterparty,
        status,
        risk_score: riskScore,
        client_id: clientId || null,
        workspace_id: workspaceId || null,
        user_id: userId || null,
        metadata: metadataPayload,
      })
      .select()
      .single();

    if (contractErr) {
      console.error('❌ Supabase contracts insert error:', contractErr);
      return {
        insertSuccess: false,
        error: contractErr.message,
      };
    }

    console.log('✅ Contract saved to Supabase with ID:', contract.id);

    // 2. Insert Relational Risk Flags
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

        await supabase.from('risk_flags').insert(riskRows);
      } catch (flagErr: any) {
        console.warn('⚠️ risk_flags table insert warning:', flagErr.message);
      }
    }

    // 3. Auto-Trigger Statutory Obligations & Notice Timelines
    if (contract?.id) {
      await generateContractObligations(
        contract.id,
        title,
        contractType,
        counterparty,
        keyDates,
        clientId,
        workspaceId
      );
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
    const { clientId, workspaceId } = req.query;
    let query = supabase
      .from('contracts')
      .select('*, risk_flags(*)')
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId as string);
    }
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId as string);
    }

    const { data, error } = await query;

    if (error) throw error;
    return res.status(200).json({ success: true, contracts: data });
  } catch (error: any) {
    console.error('Fetch Contracts Error:', error);
    return res.status(500).json({ error: 'Failed to fetch contracts.' });
  }
});

// Single Manual Contract Audit with Dynamic Playbook Injection
router.post('/audit', async (req, res) => {
  try {
    const { contractText, category, title, clientId, workspaceId, userId } = req.body;
    if (!contractText) {
      return res.status(400).json({ error: 'Contract text is required for auditing.' });
    }

    // 1. Retrieve law firm's active playbook rules
    const playbook = await getActivePlaybook(category || 'COMMERCIAL', clientId, workspaceId);
    if (playbook) {
      console.log(`📋 Enforcing AI Playbook: "${playbook.playbookName}" for category "${category}"`);
    }

    // 2. Audit with dynamic playbook rules injected into prompt
    const auditResult = await auditCommercialContract(contractText, category, playbook);

    // 3. Save to Supabase and generate obligations
    const savedContract = await saveAuditToSupabase(
      title || 'Audited Agreement', 
      contractText, 
      auditResult, 
      clientId, 
      workspaceId, 
      userId
    );

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

// Batch Upload with Dynamic Playbook Injection
router.post('/batch-audit', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const clientId = req.body.clientId || null;
    const workspaceId = req.body.workspaceId || null;
    const userId = req.body.userId || null;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    // Retrieve active playbook
    const playbook = await getActivePlaybook('COMMERCIAL', clientId, workspaceId);

    const auditPromises = files.map(async (file) => {
      try {
        const text = await extractTextFromFile(file);
        if (!text || text.trim().length === 0) {
          return { filename: file.originalname, success: false, error: 'Empty file text.' };
        }

        const auditData = await auditCommercialContract(text, 'COMMERCIAL', playbook);
        const title = file.originalname.replace(/\.[^/.]+$/, '');
        const dbRecord = await saveAuditToSupabase(title, text, auditData, clientId, workspaceId, userId);

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