"use client";

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Contract } from "@/lib/types";
import { useState } from "react";

interface PdfViewerProps {
  contract: Contract;
  activePage: number;
  onPageChange: (page: number) => void;
}

export function PdfViewer({ contract, activePage, onPageChange }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const maxPage = Math.max(...contract.clauses.map((c) => c.page), 12);

  return (
    <div className="flex h-full flex-col bg-secondary/40">
      <div className="flex items-center justify-between border-b bg-background px-3 h-11 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onPageChange(Math.max(1, activePage - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-16 text-center">
            Page {activePage} / {maxPage}
          </span>
          <Button variant="ghost" size="icon" onClick={() => onPageChange(Math.min(maxPage, activePage + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(60, z - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(160, z + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6 flex justify-center">
        <div
          className="pdf-page-shadow bg-white shrink-0 rounded-sm p-10 text-sm leading-relaxed"
          style={{ width: `${(600 * zoom) / 100}px`, minHeight: `${(780 * zoom) / 100}px` }}
        >
          <div className="text-center mb-8 space-y-1">
            <p className="font-semibold text-base">{contract.title}</p>
            <p className="text-xs text-muted-foreground">{contract.fileName} — Page {activePage}</p>
          </div>
          {contract.clauses
            .filter((cl) => cl.page === activePage)
            .map((cl) => (
              <div key={cl.id} id={`clause-${cl.id}`} className="mb-5 scroll-mt-20">
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {cl.title}
                </p>
                <p className="rounded bg-warning/10 px-2 py-1.5 text-[13px] leading-relaxed">
                  {cl.excerpt}
                </p>
              </div>
            ))}
          {contract.clauses.filter((cl) => cl.page === activePage).length === 0 && (
            <p className="text-muted-foreground text-xs italic">
              (No extracted clause anchors on this page — rendered document text would appear here.)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
