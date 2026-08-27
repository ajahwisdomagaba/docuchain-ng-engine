import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate embedding vector for natural language search queries
 */
async function generateQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("No OPENAI_API_KEY provided in environment variables for embedding generation.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Embedding API Error (${response.status}): ${errText}`);
  }

  const result: any = await response.json();
  const embedding = result?.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error("Malformed embedding response returned from OpenAI.");
  }

  return embedding;
}

// Initialize the MCP Server Instance
export const mcpServer = new Server(
  {
    name: "docuchain-ng-vault",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 1. Define Available Tools
 */
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_contract_vault",
        description:
          "Semantically search indexed Nigerian contracts across the DocuChain vault using natural language to retrieve exact clauses, payment terms, or notice requirements.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                'Natural language legal or operational query (e.g., "Which contracts allow price increases?" or "Find early termination clauses").',
            },
            matchCount: {
              type: "number",
              description:
                "Number of relevant contract chunks to retrieve (default: 5).",
            },
            workspaceId: {
              type: "string",
              description:
                "Optional client workspace UUID to restrict search boundary.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_contract_statutory_risks",
        description:
          "Retrieve statutory risk score, flagged violations (CAMA 2020, Lagos Tenancy Law, Labour Act, NDPA), and tracked obligations for a specific contract.",
        inputSchema: {
          type: "object",
          properties: {
            contractId: {
              type: "string",
              description: "The UUID of the contract in DocuChain vault.",
            },
          },
          required: ["contractId"],
        },
      },
    ],
  };
});

/**
 * 2. Handle Tool Invocations
 */
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_contract_vault") {
      const query = String(args?.query);
      const matchCount = Number(args?.matchCount) || 5;
      const workspaceId = args?.workspaceId ? String(args?.workspaceId) : null;

      // 1. Embed query
      const queryEmbedding = await generateQueryEmbedding(query);

      // 2. Perform pgvector similarity search via Supabase RPC
      const { data: chunks, error } = await supabaseAdmin.rpc(
        "match_contract_sections",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: matchCount,
          filter_workspace_id: workspaceId,
        }
      );

      if (error) {
        throw new Error(`Database search RPC error: ${error.message}`);
      }

      const formattedResults = (chunks || []).map((c: any) => ({
        contract_id: c.contract_id,
        contract_title: c.contract_title || "Untitled Agreement",
        similarity: Math.round(c.similarity * 100) + "%",
        clause_content: c.content,
        metadata: c.metadata,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                matches_found: formattedResults.length,
                results: formattedResults,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get_contract_statutory_risks") {
      const contractId = String(args?.contractId);

      const [contractRes, obligationsRes] = await Promise.all([
        supabaseAdmin
          .from("contracts")
          .select(
            "id, title, counterparty, risk_score, risk_flags, domain_category, metadata"
          )
          .eq("id", contractId)
          .single(),
        supabaseAdmin
          .from("obligations")
          .select("id, title, description, due_date, status, obligation_type")
          .eq("contract_id", contractId),
      ]);

      if (contractRes.error) {
        throw new Error(`Contract not found: ${contractRes.error.message}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                contract: contractRes.data,
                compliance_score: 100 - (contractRes.data.risk_score || 0),
                statutory_risks: contractRes.data.risk_flags || [],
                obligations: obligationsRes.data || [],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `MCP Tool Execution Error: ${err.message}`,
        },
      ],
    };
  }
});

/**
 * Start Stdio Transport when executed
 */
export async function startMcpStdioServer() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("[DocuChain MCP] Server listening via Stdio JSON-RPC protocol.");
}

startMcpStdioServer().catch((e) => {
  console.error("[DocuChain MCP] Fatal startup error:", e);
  process.exit(1);
});