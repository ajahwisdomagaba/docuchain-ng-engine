"use client";

import Link from "next/link";
import { Contract } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, daysUntil } from "@/lib/utils";
import { FileText, ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";

function statusVariant(status?: Contract["status"]) {
  switch (status) {
    case "Active":
      return "success" as const;
    case "Expiring":
      return "warning" as const;
    case "Terminated":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function cnDays(d: number) {
  if (d < 0) return "text-xs text-rose-600 font-medium";
  if (d < 45) return "text-xs text-amber-600 font-medium";
  return "text-xs text-slate-500";
}

export function ContractTable({ contracts = [] }: { contracts?: Contract[] }) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 border border-slate-200 bg-white rounded-xl">
        <FileText className="h-8 w-8 mb-2 text-slate-400" />
        <p className="text-sm font-medium">No contracts match these filters.</p>
        <p className="text-xs text-slate-400 mt-1">Audit an agreement above to ingest your first contract.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow>
            <TableHead className="text-slate-700 font-bold text-xs">Contract</TableHead>
            <TableHead className="text-slate-700 font-bold text-xs">Counterparty</TableHead>
            <TableHead className="text-slate-700 font-bold text-xs">Status</TableHead>
            <TableHead className="text-slate-700 font-bold text-xs">Risk Audit</TableHead>
            <TableHead className="text-slate-700 font-bold text-xs">Jurisdiction</TableHead>
            <TableHead className="text-slate-700 font-bold text-xs">Value</TableHead>
            <TableHead className="text-slate-700 font-bold text-xs">Expiry / Timeline</TableHead>
            <TableHead className="text-right text-slate-700 font-bold text-xs">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {contracts.map((c) => {
            const raw = c as Record<string, any>;
            const expiryDate = c.expiryDate || raw.expiry_date || new Date().toISOString();
            const dLeft = daysUntil(expiryDate);
            const isHighRisk = (raw.riskScore && raw.riskScore > 60) || raw.overall_risk === "High";
            const jurisdiction = raw.jurisdiction || raw.property_location || "Lagos, NG";
            const fileName = raw.fileName || raw.file_name || "agreement.pdf";
            const value = raw.value || (raw.rent_amount ? `₦${Number(raw.rent_amount).toLocaleString()}` : "₦0");

            return (
              <TableRow key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <TableCell className="max-w-[240px]">
                  <Link href={`/contracts/${c.id}`} className="block group">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 truncate">
                      {c.title || "Tenancy Agreement"}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{fileName}</div>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-slate-700 font-medium">
                  {c.counterparty || (Array.isArray(raw.parties) ? raw.parties.map((p: any) => p.name).join(" vs ") : "—")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(c.status)}>{c.status || "Active"}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isHighRisk
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {isHighRisk ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {isHighRisk ? "High Risk" : "Low Risk"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{jurisdiction}</TableCell>
                <TableCell className="text-sm font-semibold text-slate-900">{value}</TableCell>
                <TableCell className="text-sm">
                  <div className="text-slate-700">{formatDate(expiryDate)}</div>
                  {c.status !== "Terminated" && (
                    <div className={cnDays(dLeft)}>
                      {dLeft >= 0 ? `${dLeft}d left` : `${Math.abs(dLeft)}d overdue`}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/contracts/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}