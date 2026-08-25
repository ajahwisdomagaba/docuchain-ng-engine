"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractStatus, Jurisdiction } from "@/lib/types";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: ContractStatus | "All";
  onStatusChange: (v: ContractStatus | "All") => void;
  jurisdiction: Jurisdiction | "All";
  onJurisdictionChange: (v: Jurisdiction | "All") => void;
  jurisdictions: Jurisdiction[];
}

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  jurisdiction,
  onJurisdictionChange,
  jurisdictions,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by counterparty or title..."
          className="pl-8"
        />
      </div>

      <Select value={status} onValueChange={(v) => onStatusChange(v as ContractStatus | "All")}>
        <SelectTrigger className="sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All statuses</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Expiring">Expiring</SelectItem>
          <SelectItem value="Terminated">Terminated</SelectItem>
          <SelectItem value="Draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      <Select value={jurisdiction} onValueChange={(v) => onJurisdictionChange(v as Jurisdiction | "All")}>
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder="Jurisdiction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All jurisdictions</SelectItem>
          {jurisdictions.map((j) => (
            <SelectItem key={j} value={j}>
              {j}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
