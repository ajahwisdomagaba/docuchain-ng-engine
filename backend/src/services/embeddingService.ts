import { supabase } from '../lib/supabase';

function requireQorebitKey(): string {
  const key = process.env.QOREBIT_API_KEY;
  if (!key) {
    throw new Error('QOREBIT_API_KEY is not configured.');
  }
  return key;
}

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
  const res = await fetch('https://api.qorebit.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireQorebitKey()}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' ').slice(0, 8000),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding request failed (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const embedding = data.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Embedding response did not include a vector.');
  }
  return embedding;
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