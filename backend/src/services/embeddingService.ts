import { supabase } from '../lib/supabase';

const QOREBIT_API_KEY = process.env.QOREBIT_API_KEY || 'qb_live_vI39k_W01kgXXVbFLZa-9vRxAAtfOs-biA68fND2GgQ';

export function chunkContractText(text: string, maxChunkSize = 800): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  const rawParagraphs = clean.split(/\n{2,}/);
  const chunks: string[] = [];

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (trimmed.length <= maxChunkSize) {
      chunks.push(trimmed);
    } else {
      const sentences = trimmed.split(/(?<=[.?!])\s+/);
      let current = '';
      for (const s of sentences) {
        if ((current + ' ' + s).length > maxChunkSize) {
          if (current) chunks.push(current.trim());
          current = s;
        } else {
          current += ' ' + s;
        }
      }
      if (current.trim()) chunks.push(current.trim());
    }
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxChunkSize)];
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch('https://api.qorebit.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${QOREBIT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' ').slice(0, 8000),
      }),
    });

    if (!res.ok) return generateFallbackVector(text);

    const data: any = await res.json();
    return data.data?.[0]?.embedding || generateFallbackVector(text);
  } catch (err: any) {
    return generateFallbackVector(text);
  }
}

function generateFallbackVector(text: string, dimensions = 1536): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const vector = new Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    const val = Math.sin(hash + i);
    vector[i] = Math.round(val * 10000) / 10000;
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export async function indexContractEmbeddings(
  contractId: string,
  rawText: string,
  workspaceId?: string | null,
  clientId?: string | null,
  isPrecedent = false
) {
  try {
    const chunks = chunkContractText(rawText);
    const rows = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      let clauseTitle = `Clause ${i + 1}`;
      const firstLine = chunk.split('\n')[0].slice(0, 60);
      if (/^(\d+\.|\b[A-Z\s]{4,}\b)/.test(firstLine)) {
        clauseTitle = firstLine;
      }

      rows.push({
        contract_id: contractId,
        workspace_id: workspaceId || null,
        client_id: clientId || null,
        chunk_index: i,
        clause_title: clauseTitle,
        chunk_text: chunk,
        embedding,
        is_precedent: isPrecedent,
      });
    }

    if (rows.length > 0) {
      await supabase.from('contract_embeddings').insert(rows);
    }
  } catch (err: any) {
    console.warn('Vector indexing warning:', err.message);
  }
}

// Log audit helper
export async function createAuditLog(entry: {
  workspaceId?: string | null;
  clientId?: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
}) {
  try {
    await supabase.from('audit_logs').insert({
      workspace_id: entry.workspaceId || null,
      client_id: entry.clientId || null,
      actor_email: entry.actorEmail || 'system@docuchain.ng',
      actor_role: entry.actorRole || 'SYSTEM',
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      details: entry.details || {},
    });
  } catch (e: any) {
    console.warn('Failed to record audit log:', e.message);
  }
}