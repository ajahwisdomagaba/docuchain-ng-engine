import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const QOREBIT_API_KEY = process.env.QOREBIT_API_KEY || 'qb_live_vI39k_W01kgXXVbFLZa-9vRxAAtfOs-biA68fND2GgQ';

async function getQueryEmbedding(query: string): Promise<number[]> {
  try {
    const res = await fetch('https://api.qorebit.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${QOREBIT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query.slice(0, 2000),
      }),
    });

    if (!res.ok) throw new Error('Embedding API failed');
    const data: any = await res.json();
    return data.data?.[0]?.embedding;
  } catch {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = (hash << 5) - hash + query.charCodeAt(i);
      hash |= 0;
    }
    const vec = new Array(1536);
    for (let i = 0; i < 1536; i++) vec[i] = Math.sin(hash + i);
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      workspaceId, 
      clientId, 
      includeFirmPrecedents = false,
      matchThreshold = 0.25, 
      matchCount = 10 
    } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const queryVec = await getQueryEmbedding(query.trim());

    const { data: results, error } = await supabase.rpc('match_contract_clauses', {
      query_embedding: queryVec,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_workspace_id: workspaceId || null,
      filter_client_id: clientId || null,
      include_firm_precedents: includeFirmPrecedents
    });

    if (error) throw error;

    const contractIds = Array.from(new Set((results || []).map((r: any) => r.contract_id)));
    let contractMap: Record<string, any> = {};

    if (contractIds.length > 0) {
      const { data: contractDocs } = await supabase
        .from('contracts')
        .select('id, title, contract_type, counterparty, risk_score')
        .in('id', contractIds);

      (contractDocs || []).forEach((c) => {
        contractMap[c.id] = c;
      });
    }

    const enrichedResults = (results || []).map((r: any) => ({
      ...r,
      contract: contractMap[r.contract_id] || { title: 'Contract Document' },
    }));

    return NextResponse.json({ success: true, results: enrichedResults });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}