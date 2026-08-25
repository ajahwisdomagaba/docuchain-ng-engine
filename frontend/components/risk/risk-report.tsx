"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { riskFlags } from "@/lib/mock-data";
import { getContract } from "@/lib/mock-data";
import { RiskSeverity } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, AlertCircle, Info, ArrowUpRight } from "lucide-react";

const SEVERITY_META: Record<RiskSeverity, { color: string; icon: React.ElementType; ring: string }> = {
  High: { color: "text-destructive", icon: AlertTriangle, ring: "bg-destructive/10" },
  Medium: { color: "text-warning-foreground", icon: AlertCircle, ring: "bg-warning/15" },
  Low: { color: "text-muted-foreground", icon: Info, ring: "bg-secondary" },
};

function SeverityBar() {
  const counts = useMemo(() => {
    return {
      High: riskFlags.filter((r) => r.severity === "High").length,
      Medium: riskFlags.filter((r) => r.severity === "Medium").length,
      Low: riskFlags.filter((r) => r.severity === "Low").length,
    };
  }, []);
  const total = riskFlags.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div className="bg-destructive" style={{ width: `${(counts.High / total) * 100}%` }} />
          <div className="bg-warning" style={{ width: `${(counts.Medium / total) * 100}%` }} />
          <div className="bg-muted-foreground/40" style={{ width: `${(counts.Low / total) * 100}%` }} />
        </div>
        <div className="flex items-center gap-5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" /> High ({counts.High})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" /> Medium ({counts.Medium})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Low ({counts.Low})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskReport() {
  const [filter, setFilter] = useState<RiskSeverity | "All">("All");
  const filtered = filter === "All" ? riskFlags : riskFlags.filter((r) => r.severity === filter);

  return (
    <div className="space-y-6">
      <SeverityBar />

      <div className="flex items-center gap-2">
        {(["All", "High", "Medium", "Low"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-secondary/60"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const contract = getContract(r.contractId);
          const meta = SEVERITY_META[r.severity];
          const Icon = meta.icon;
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${meta.ring}`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{r.title}</p>
                        <Badge
                          variant={r.severity === "High" ? "destructive" : r.severity === "Medium" ? "warning" : "secondary"}
                        >
                          {r.severity}
                        </Badge>
                        <Badge variant="outline">{r.category}</Badge>
                      </div>
                      {contract && (
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 mt-0.5"
                        >
                          {contract.title} · {contract.counterparty}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Original Clause Text
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground italic bg-secondary/50 rounded-md p-2.5">
                      "{r.originalText}"
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Plain-English Translation
                    </p>
                    <p className="text-sm leading-relaxed">{r.plainEnglish}</p>
                  </div>
                </div>

                <div className="rounded-md bg-secondary/40 p-2.5">
                  <p className="text-xs">
                    <span className="font-semibold">Recommendation: </span>
                    {r.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
