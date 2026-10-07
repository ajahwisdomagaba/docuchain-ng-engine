import { NextRequest, NextResponse } from 'next/server';
import { generateContractAnalysis } from '@/lib/aiClient';

export async function POST(req: NextRequest) {
  try {
    const { question, history = [], contractText } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'A question is required.' }, { status: 400 });
    }

    const priorTurns = Array.isArray(history)
      ? history
          .slice(-8)
          .map((message: { sender?: string; text?: string }) => {
            const role = message.sender === 'user' ? 'User' : 'Assistant';
            return `${role}: ${message.text || ''}`;
          })
          .join('\n')
      : '';

    const answer = await generateContractAnalysis({
      systemPrompt: `You are DocuChain NG's contract assistant. Answer in plain English using the contract text when it is provided, and Nigerian law only to interpret it. Do not invent clause numbers or statutes. If the contract is silent, say so. Keep the answer concise.`,
      userPrompt: `${contractText ? `Contract:\n${String(contractText).slice(0, 24000)}\n\n` : ''}${priorTurns ? `Conversation so far:\n${priorTurns}\n\n` : ''}Question: ${question.trim()}`,
      temperature: 0.2,
      jsonMode: false,
      timeoutMs: 6000,
      maxTokens: 350,
    });

    return NextResponse.json({ success: true, answer });
  } catch (err: any) {
    console.error('Assistant route error:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'The assistant could not answer that question.' },
      { status: 500 }
    );
  }
}
