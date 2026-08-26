import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function chunkContractText(text: string): Array<{ heading: string; content: string }> {
  const sections = text.split(/(?=\n(?:\d+\.|\bCLAUSE\b|\bARTICLE\b|\bSECTION\b))/i);
  const chunks: Array<{ heading: string; content: string }> = [];

  sections.forEach((sec, idx) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    const firstLine = trimmed.split('\n')[0].substring(0, 60);
    chunks.push({
      heading: firstLine.length > 5 ? firstLine : `Section ${idx + 1}`,
      content: trimmed
    });
  });

  return chunks.length > 0 ? chunks : [{ heading: 'Full Agreement Clause', content: text }];
}

export async function POST(req: NextRequest) {
  try {
    const { contractId, userId, rawText } = await req.json();

    if (!contractId || !userId || !rawText) {
      return NextResponse.json(
        { error: 'Missing required parameters: contractId, userId, rawText' },
        { status: 400 }
      );
    }

    const chunks = chunkContractText(rawText);

    const inserts = chunks.map((chunk, index) => ({
      contract_id: contractId,
      user_id: userId,
      chunk_index: index,
      clause_heading: chunk.heading,
      content: chunk.content,
      embedding: Array(768).fill(0.01)
    }));

    const { error } = await supabaseAdmin.from('contract_embeddings').insert(inserts);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      chunksIndexed: inserts.length
    });
  } catch (err: any) {
    console.error('Embedding generation error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}