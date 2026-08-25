"use client";

import { Contract } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { FileText, ChevronRight } from "lucide-react";

interface MetadataPanelProps {
  contract: Contract;
  onClauseClick: (clauseId: string, page: number) => void;
  activeClauseId?: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

export function MetadataPanel({ contract, onClauseClick, activeClauseId }: MetadataPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <FileText className="h-3.5 w-3.5" />
          {contract.fileName} · {(contract.fileSizeKb / 1024).toFixed(1)} MB
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{contract.summary}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Counterparty" value={contract.counterparty} />
        <Field label="Jurisdiction" value={contract.jurisdiction} />
        <Field label="Effective Date" value={formatDate(contract.effectiveDate)} />
        <Field label="Expiry Date" value={formatDate(contract.expiryDate)} />
        <Field label="Contract Value" value={contract.value} />
        <Field label="Owner" value={contract.owner} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {contract.tags.map((t) => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Extracted Clauses
        </p>
        <div className="space-y-1">
          {contract.clauses.map((cl) => (
            <button
              key={cl.id}
              onClick={() => onClauseClick(cl.id, cl.page)}
              className={`w-full flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                activeClauseId === cl.id
                  ? "bg-secondary text-foreground"
                  : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">{cl.title}</span>
              <span className="flex items-center gap-1 text-xs shrink-0 ml-2">
                p.{cl.page}
                <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
