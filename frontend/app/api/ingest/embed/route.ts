import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQorebitEmbedding } from '@/lib/aiClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { contractId, chunks } = await req.json();

    if (!contractId || !Array.isArray(chunks)) {
      return NextResponse.json({ error: 'Missing contractId or chunks' }, { status: 400 });
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embedding = await generateQorebitEmbedding(chunkText);

      await supabaseAdmin.from('contract_sections').insert({
        contract_id: contractId,
        chunk_index: i,
        content: chunkText,
        embedding: embedding,
      });
    }

    return NextResponse.json({ success: true, embeddedChunks: chunks.length });
  } catch (err: any) {
    console.error('Embedding error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}