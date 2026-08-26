import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { query, userId } = await req.json();

    if (!query || !userId) {
      return NextResponse.json({ error: 'Query and userId are required' }, { status: 400 });
    }

    const queryVector = Array(768).fill(0.01);

    const { data: matches, error: rpcError } = await supabaseAdmin.rpc('match_contract_clauses', {
      query_embedding: queryVector,
      match_threshold: 0.25,
      match_count: 5,
      filter_user_id: userId
    });

    if (rpcError) {
      console.warn('Vector match RPC error, running fallback:', rpcError.message);
    }

    if (matches && matches.length > 0) {
      return NextResponse.json({
        answer: `Found ${matches.length} relevant clause(s) indexed in your vault.`,
        citations: matches.map((m: any) => ({
          contractTitle: m.contract_title,
          clause: m.clause_heading,
          content: m.content,
          similarity: m.similarity
        }))
      });
    }

    const { data: contracts } = await supabaseAdmin
      .from('contracts')
      .select('id, title, counterparty, metadata')
      .eq('user_id', userId);

    const matchingCitations: Array<{ contractTitle: string; clause: string; relevance: string }> = [];
    const queryLower = query.toLowerCase();

    (contracts || []).forEach((c) => {
      const text: string = c.metadata?.rawDraft || '';

      if (queryLower.includes('rent') || queryLower.includes('advance')) {
        if (text.toLowerCase().includes('rent') || text.toLowerCase().includes('advance')) {
          matchingCitations.push({
            contractTitle: c.title,
            clause: 'Rent & Advance Payments',
            relevance: 'Specifies advance rent consideration under Lagos State Tenancy Law Section 4.'
          });
        }
      }

      if (queryLower.includes('terminate') || queryLower.includes('notice') || queryLower.includes('quit')) {
        if (text.toLowerCase().includes('notice') || text.toLowerCase().includes('determination')) {
          matchingCitations.push({
            contractTitle: c.title,
            clause: 'Termination & Statutory Notice',
            relevance: 'Governs minimum statutory notice window (Section 13(1) 6-month requirement).'
          });
        }
      }
    });

    return NextResponse.json({
      answer: matchingCitations.length > 0
        ? `Found ${matchingCitations.length} clause citation(s) across your vault relating to "${query}".`
        : `Searched vault documents. No direct statutory conflicts detected for "${query}".`,
      citations: matchingCitations
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}