'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadDropzoneProps {
  onAuditComplete?: (result: any) => void;
}

const DEFAULT_SAMPLE_TEXT = `THIS TENANCY AGREEMENT is made between Chief Adebayo (Landlord) and Emeka Obi (Tenant) for a 2-bedroom flat in Surulere, Lagos. The tenant agrees to pay two (2) years rent in advance at ₦1,500,000 per annum. The tenancy is yearly, commencing January 1, 2026. Either party may terminate by giving 1 month notice.`;

export function UploadDropzone({ onAuditComplete }: UploadDropzoneProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [text, setText] = useState(DEFAULT_SAMPLE_TEXT);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleAudit = async () => {
    try {
      setLoading(true);

      // Mode 1: Binary File Upload (.pdf, .docx, .txt) via FormData
      if (activeTab === 'upload' && file) {
        const formData = new FormData();
        formData.append('files', file);

        const res = await fetch('http://localhost:5000/api/review/batch-audit', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Audit batch upload failed: ${res.status}`);
        const data = await res.json();

        if (onAuditComplete) onAuditComplete(data);

        // Redirect to newly created Supabase Contract record
        const newContractId = data.results?.[0]?.dbRecord?.id;
        if (newContractId) {
          router.push(`/contracts/${newContractId}`);
        }
      } 
      // Mode 2: Raw Text Audit via JSON payload
      else if (activeTab === 'text' && text.trim()) {
        const res = await fetch('http://localhost:5000/api/review/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractText: text,
            title: 'Pasted Agreement Review',
            category: 'COMMERCIAL',
          }),
        });

        if (!res.ok) throw new Error(`Text audit failed: ${res.status}`);
        const data = await res.json();

        if (onAuditComplete) onAuditComplete(data);

        // Redirect to newly created Supabase Contract record
        const newContractId = data.dbRecord?.id;
        if (newContractId) {
          router.push(`/contracts/${newContractId}`);
        }
      }
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Tab Switcher & Jurisdiction Pill */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Raw Text
          </button>
        </div>

        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
          Nigerian Statutory Compliance Engine
        </span>
      </div>

      {/* Drag & Drop File Zone */}
      {activeTab === 'upload' ? (
        <div>
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-200">
                Click to upload or drag & drop agreement
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT up to 25MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Paste Raw Text Zone */
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste commercial agreement clauses, employment terms, or tenancy drafts here..."
          className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
        />
      )}

      {/* Action Trigger */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleAudit}
          disabled={loading || (activeTab === 'upload' ? !file : !text.trim())}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Auditing Clauses against Nigerian Law...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Execute Audit & Redlines
            </>
          )}
        </Button>
      </div>
    </div>
  );
}