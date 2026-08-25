import { RiskReport } from "@/components/risk/risk-report";

export default function RiskPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Risk Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Flagged clauses across your portfolio, translated into plain English with suggested next steps.
        </p>
      </div>
      <RiskReport />
    </div>
  );
}
