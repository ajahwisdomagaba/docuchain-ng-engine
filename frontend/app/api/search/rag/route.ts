import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContractAnalysis, generateQorebitEmbedding } from '@/lib/aiClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { query, userId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // 1. Generate Query Vector Embedding via Qorebit
    const queryEmbedding = await generateQorebitEmbedding(query);

    // 2. Perform pgvector similarity search in Supabase
    const { data: matchedChunks, error: matchError } = await supabaseAdmin.rpc(
      'match_contract_sections',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_user_id: userId,
      }
    );

    if (matchError) {
      console.warn('pgvector search notice:', matchError.message);
    }

    const contextText = (matchedChunks || [])
      .map((c: any) => `[Document: ${c.title || 'Contract'}]\n${c.content}`)
      .join('\n\n---\n\n');

    // 3. Synthesize Answer using Qorebit AI
    const synthesisSystemPrompt = `
You are DocuChain.NG's Vault Legal Intelligence Assistant.
Answer the user's query strictly using the provided contract excerpts and Nigerian Law (CAMA 2020, Lagos Tenancy Law 2011, Labour Act, NDPA 2023).
Always cite specific contract clauses and statutory sections.
`;

    const answer = await generateContractAnalysis({
      systemPrompt: synthesisSystemPrompt,
      userPrompt: `Context:\n${contextText || 'No relevant chunks found.'}\n\nQuestion: ${query}`,
      temperature: 0.1,
      jsonMode: false,
    });

    return NextResponse.json({
      success: true,
      answer,
      citations: matchedChunks || [],
    });
  } catch (err: any) {
    console.error('Semantic search error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}