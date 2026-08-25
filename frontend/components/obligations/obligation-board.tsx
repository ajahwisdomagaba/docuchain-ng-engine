"use client";

import { Obligation } from "@/lib/types";
import { getContract } from "@/lib/mock-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, daysUntil } from "@/lib/utils";
import Link from "next/link";
import { CalendarClock, Banknote, BellRing, RefreshCcw, ShieldCheck } from "lucide-react";

const COLUMNS: { key: Obligation["status"]; label: string }[] = [
  { key: "Overdue", label: "Overdue" },
  { key: "Due Soon", label: "Due Soon" },
  { key: "Upcoming", label: "Upcoming" },
  { key: "Completed", label: "Completed" },
];

const TYPE_ICON: Record<Obligation["type"], React.ElementType> = {
  Payment: Banknote,
  Expiry: CalendarClock,
  Notice: BellRing,
  Renewal: RefreshCcw,
  Compliance: ShieldCheck,
};

function ObligationCard({ ob }: { ob: Obligation }) {
  const contract = getContract(ob.contractId);
  const Icon = TYPE_ICON[ob.type];
  const dLeft = daysUntil(ob.dueDate);

  return (
    <Link href={`/contracts/${ob.contractId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1 text-[11px]">
              <Icon className="h-3 w-3" />
              {ob.type}
            </Badge>
            {ob.amount && <span className="text-xs font-medium">{ob.amount}</span>}
          </div>
          <p className="text-sm font-medium leading-snug">{ob.title}</p>
          <p className="text-xs text-muted-foreground truncate">{contract?.counterparty}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">{formatDate(ob.dueDate)}</span>
            {ob.status !== "Completed" && (
              <span className={`text-xs ${dLeft < 0 ? "text-destructive" : dLeft < 14 ? "text-warning-foreground" : "text-muted-foreground"}`}>
                {dLeft >= 0 ? `${dLeft}d` : `${Math.abs(dLeft)}d late`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ObligationBoard({ obligations }: { obligations: Obligation[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = obligations.filter((o) => o.status === col.key);
        return (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {items.map((ob) => (
                <ObligationCard key={ob.id} ob={ob} />
              ))}
              {items.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Nothing here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
