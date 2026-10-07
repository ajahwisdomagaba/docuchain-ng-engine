import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateQorebitEmbedding } from '@/lib/aiClient';

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

    const queryVec = await generateQorebitEmbedding(query.trim());

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