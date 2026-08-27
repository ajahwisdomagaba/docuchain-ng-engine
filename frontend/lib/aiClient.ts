export interface QorebitPromptInput {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  jsonMode?: boolean;
}

const QOREBIT_API_KEY = process.env.QOREBIT_API_KEY;
const QOREBIT_BASE_URL = process.env.QOREBIT_BASE_URL || 'https://api.qorebit.ai/v1';
const QOREBIT_MODEL = process.env.QOREBIT_MODEL_NAME || 'qorebit-v1';

export async function generateContractAnalysis({
  systemPrompt,
  userPrompt,
  temperature = 0.1,
  jsonMode = true,
}: QorebitPromptInput): Promise<string> {
  if (!QOREBIT_API_KEY) {
    throw new Error('QOREBIT_API_KEY is not configured in environment variables.');
  }

  const response = await fetch(`${QOREBIT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${QOREBIT_API_KEY}`,
    },
    body: JSON.stringify({
      model: QOREBIT_MODEL,
      temperature,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Qorebit AI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.response;

  if (!content) {
    throw new Error('No content returned from Qorebit AI.');
  }

  return content;
}

export async function generateQorebitEmbedding(text: string): Promise<number[]> {
  if (!QOREBIT_API_KEY) {
    throw new Error('QOREBIT_API_KEY is not configured.');
  }

  const response = await fetch(`${QOREBIT_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${QOREBIT_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Qorebit Embedding failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}