import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const QOREBIT_API_KEY = process.env.QOREBIT_API_KEY || 'qb_live_vI39k_W01kgXXVbFLZa-9vRxAAtfOs-biA68fND2GgQ';

export async function POST(req: NextRequest) {
  try {
    const { jsonrpc, id, method, params } = await req.json();

    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request: jsonrpc must be 2.0' } },
        { status: 400 }
      );
    }

    // 1. Tool Listing
    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'search_contract_vault',
              description: 'Semantic vector search across DocuChain vault for exact contract clauses.',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  matchCount: { type: 'number' }
                },
                required: ['query'],
              },
            },
          ],
        },
      });
    }

    // 2. Tool Execution
    if (method === 'tools/call') {
      const { name, arguments: args } = params;

      if (name === 'search_contract_vault') {
        const embRes = await fetch('https://api.qorebit.ai/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QOREBIT_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: args.query,
          }),
        });

        const embData = await embRes.json();
        const embedding = embData.data[0].embedding;

        const { data: chunks } = await supabaseAdmin.rpc('match_contract_sections', {
          query_embedding: embedding,
          match_threshold: 0.45,
          match_count: args.matchCount || 4,
        });

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(chunks || [], null, 2),
              },
            ],
          },
        });
      }
    }

    return NextResponse.json(
      { jsonrpc: '2.0', id, error: { code: -32601, message: `Method '${method}' not found` } },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } },
      { status: 500 }
    );
  }
}