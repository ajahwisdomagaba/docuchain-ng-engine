"use client";

import { useMemo, useState } from "react";
import { obligations } from "@/lib/mock-data";
import { ObligationBoard } from "@/components/obligations/obligation-board";
import { ObligationListView } from "@/components/obligations/obligation-list-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, List } from "lucide-react";

export default function ObligationsPage() {
  const [view, setView] = useState("kanban");

  const stats = useMemo(
    () => ({
      overdue: obligations.filter((o) => o.status === "Overdue").length,
      dueSoon: obligations.filter((o) => o.status === "Due Soon").length,
      upcoming: obligations.filter((o) => o.status === "Upcoming").length,
    }),
    []
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Obligation Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.overdue} overdue · {stats.dueSoon} due soon · {stats.upcoming} upcoming — auto-extracted from contract clauses
          </p>
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" /> List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "kanban" ? (
        <ObligationBoard obligations={obligations} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ObligationListView obligations={obligations} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
