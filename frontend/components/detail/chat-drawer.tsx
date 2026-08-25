"use client";

import { useState } from "react";
import { Sparkles, Send, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Contract, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatDrawerProps {
  contract: Contract;
  onCitationClick: (clauseId: string, page: number) => void;
}

const SUGGESTED = [
  "What termination rights do we have?",
  "Is there a liability cap?",
  "When does this auto-renew?",
];

function answerFor(question: string, contract: Contract): { text: string; clauseIds: string[] } {
  const q = question.toLowerCase();
  const find = (title: string) => contract.clauses.find((c) => c.title.toLowerCase().includes(title));

  if (q.includes("terminat")) {
    const cl = find("termination");
    return {
      text: cl
        ? `Either party can terminate for convenience with written notice per "${cl.title}" (page ${cl.page}). Check the notice-period length before acting on this.`
        : `I couldn't find an explicit termination-for-convenience clause in this contract — it may only permit termination for cause.`,
      clauseIds: cl ? [cl.id] : [],
    };
  }
  if (q.includes("liab") || q.includes("cap")) {
    const cl = find("liability");
    return {
      text: cl
        ? `Liability is capped per "${cl.title}" (page ${cl.page}), generally referencing fees paid over a trailing period. Watch for any carve-outs elsewhere that make specific claim types uncapped.`
        : `No liability-cap clause was found in the extracted set for this contract.`,
      clauseIds: cl ? [cl.id] : [],
    };
  }
  if (q.includes("renew")) {
    const cl = find("renewal") || find("renew");
    return {
      text: cl
        ? `This contract auto-renews under "${cl.title}" (page ${cl.page}) unless a non-renewal notice is sent before the deadline — that date is tracked in the Obligation Tracker.`
        : `I don't see an auto-renewal clause; this contract appears to expire on its stated end date.`,
      clauseIds: cl ? [cl.id] : [],
    };
  }
  if (q.includes("payment") || q.includes("pay")) {
    const cl = find("payment");
    return {
      text: cl
        ? `Payment terms are set out in "${cl.title}" (page ${cl.page}).`
        : `No dedicated payment-terms clause was extracted for this contract.`,
      clauseIds: cl ? [cl.id] : [],
    };
  }
  return {
    text: `Based on the extracted clauses in ${contract.title}, I don't have a confident answer to that yet — try asking about termination, liability, renewal, or payment terms, or open the full clause list on the right.`,
    clauseIds: [],
  };
}

export function ChatDrawer({ contract, onCitationClick }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content: `Ask me anything about ${contract.title} — I'll cite the exact clause behind each answer.`,
    },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const { text: answer, clauseIds } = answerFor(text, contract);
    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: answer,
      citedClauseIds: clauseIds,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 h-11 border-b shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Contract Q&A</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-1.5", m.role === "user" && "items-end")}>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[90%] leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
              >
                {m.content}
              </div>
              {m.citedClauseIds && m.citedClauseIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.citedClauseIds.map((cid) => {
                    const clause = contract.clauses.find((c) => c.id === cid);
                    if (!clause) return null;
                    return (
                      <button
                        key={cid}
                        onClick={() => onCitationClick(cid, clause.page)}
                        className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <FileSearch className="h-3 w-3" />
                        {clause.title} · p.{clause.page}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-3 space-y-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a clause, deadline, or risk..."
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
