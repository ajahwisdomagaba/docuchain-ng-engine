"use client";

import Link from "next/link";
import { Obligation } from "@/lib/types";
import { getContract } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, daysUntil } from "@/lib/utils";

function statusVariant(status: Obligation["status"]) {
  switch (status) {
    case "Overdue":
      return "destructive" as const;
    case "Due Soon":
      return "warning" as const;
    case "Completed":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function ObligationListView({ obligations }: { obligations: Obligation[] }) {
  const sorted = [...obligations].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Obligation</TableHead>
          <TableHead>Contract</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((ob) => {
          const contract = getContract(ob.contractId);
          const dLeft = daysUntil(ob.dueDate);
          return (
            <TableRow key={ob.id}>
              <TableCell className="font-medium text-sm">{ob.title}</TableCell>
              <TableCell className="text-sm">
                <Link href={`/contracts/${ob.contractId}`} className="hover:underline">
                  {contract?.title}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{ob.type}</TableCell>
              <TableCell className="text-sm">
                {formatDate(ob.dueDate)}
                {ob.status !== "Completed" && (
                  <span className={`ml-1.5 text-xs ${dLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    ({dLeft >= 0 ? `${dLeft}d` : `${Math.abs(dLeft)}d late`})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm">{ob.amount ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(ob.status)}>{ob.status}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
