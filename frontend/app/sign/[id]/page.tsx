'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  PenTool, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Building2,
  Loader2,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

// SHA-256 helper
async function computeSHA256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.id as string;

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signedRecord, setSignedRecord] = useState<any>(null);

  // Form State
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryEmail, setSignatoryEmail] = useState('');
  const [signatoryCapacity, setSignatoryCapacity] = useState('Director / Authorised Signatory');
  const [identityRef, setIdentityRef] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    async function loadContract() {
      if (!contractId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, workspace_clients(client_name)')
          .eq('id', contractId)
          .maybeSingle();

        if (error) throw error;
        setContract(data);

        // Check if existing signature exists
        const { data: sigData } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', contractId)
          .maybeSingle();

        if (sigData) setSignedRecord(sigData);
      } catch (err: any) {
        console.error('Error loading contract for signature:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadContract();
  }, [contractId]);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleExecuteSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatoryName || !signatoryEmail || !hasDrawn || !agreedToTerms) {
      alert('Please complete all signatory fields, draw your signature, and accept execution terms.');
      return;
    }

    setSigning(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas?.toDataURL('image/png') || '';

      const draftText = contract.metadata?.rawDraft || contract.raw_text || contract.title;
      const docHash = await computeSHA256(draftText);

      // Insert signature record into Supabase
      const { data: sig, error } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contract.id,
          signatory_name: signatoryName.trim(),
          signatory_email: signatoryEmail.trim(),
          signatory_capacity: signatoryCapacity,
          identity_ref: identityRef.trim() || 'NIN / RC Verified',
          signature_svg: signatureDataUrl,
          document_hash: docHash,
        })
        .select()
        .single();

      if (error) throw error;

      // Update contract status to Signed
      await supabase
        .from('contracts')
        .update({ status: 'Signed' })
        .eq('id', contract.id);

      setSignedRecord(sig);
      alert('Contract executed successfully under CAMA 2020 Section 102 provisions!');
    } catch (err: any) {
      alert(`Signature execution failed: ${err.message}`);
    } finally {
      setSigning(false);
    }
  };

  // Generate Executed PDF Certificate
  const handleExportExecutionPDF = () => {
    if (!contract || !signedRecord) return;
    const doc = new jsPDF();

    // Top Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 40, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUCHAIN.NG DIGITAL EXECUTION CERTIFICATE', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('STATUTORY ELECTRONIC SIGNATURE & AUDIT TRAIL', 14, 26);

    // Summary Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 49, 182, 45, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 49, 182, 45, 2, 2, 'S');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENT IDENTITY', 20, 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Title: ${contract.title}`, 20, 63);
    doc.text(`Counterparty: ${contract.counterparty || 'Entity'}`, 20, 69);
    doc.text(`Governing Law: Laws of the Federal Republic of Nigeria`, 20, 75);
    doc.text(`SHA-256 Checksum: ${signedRecord.document_hash?.slice(0, 32)}...`, 20, 81);

    // Signatory Details Block
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, 102, 182, 70, 2, 2, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(14, 102, 182, 70, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70);
    doc.text('VERIFIED SIGNATORY & EXECUTION ATTESTATION', 20, 112);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Signatory: ${signedRecord.signatory_name}`, 20, 122);
    doc.text(`Email: ${signedRecord.signatory_email}`, 20, 129);
    doc.text(`Capacity: ${signedRecord.signatory_capacity} (CAMA 2020 Sec 102)`, 20, 136);
    doc.text(`ID Reference: ${signedRecord.identity_ref}`, 20, 143);
    doc.text(`Timestamp: ${new Date(signedRecord.signed_at).toUTCString()}`, 20, 150);

    // Embed Captured Signature Image
    if (signedRecord.signature_svg) {
      try {
        doc.addImage(signedRecord.signature_svg, 'PNG', 130, 120, 55, 25);
      } catch (e) {
        console.warn('Could not render signature on PDF:', e);
      }
    }

    doc.save(`${(contract.title || 'Contract').replace(/\s+/g, '_')}_Executed.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Loading agreement for digital execution...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <h1 className="text-lg font-bold text-white mb-2">Contract Not Found</h1>
        <Button onClick={() => router.back()} variant="outline" size="sm" className="text-xs border-slate-700">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Digital Contract Execution</h1>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  CAMA 2020 Sec 102
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {contract.title} • Counterparty: {contract.counterparty || 'Entity'}
              </p>
            </div>
          </div>

          {signedRecord && (
            <Button
              onClick={handleExportExecutionPDF}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Execution Certificate
            </Button>
          )}
        </div>

        {/* If Already Signed */}
        {signedRecord ? (
          <Card className="bg-emerald-950/20 border-emerald-500/40">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Contract Legally Executed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Signatory Name</span>
                  <span className="font-semibold text-white">{signedRecord.signatory_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Capacity</span>
                  <span className="font-semibold text-white">{signedRecord.signatory_capacity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Signed Timestamp</span>
                  <span className="font-mono text-slate-300">{new Date(signedRecord.signed_at).toUTCString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">SHA-256 Checksum</span>
                  <span className="font-mono text-slate-300 truncate block">{signedRecord.document_hash}</span>
                </div>
              </div>

              {signedRecord.signature_svg && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 block">Captured Signature:</span>
                  <img src={signedRecord.signature_svg} alt="Signature" className="h-16 border-b border-slate-800" />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Execution Form */
          <form onSubmit={handleExecuteSignature} className="space-y-6">
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="p-6 border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-400" /> Signatory Identification &amp; Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Full Legal Name</label>
                    <Input
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="e.g. Chukwuma Obi"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Signatory Email</label>
                    <Input
                      type="email"
                      value={signatoryEmail}
                      onChange={(e) => setSignatoryEmail(e.target.value)}
                      placeholder="e.g. chukwuma@obi.ng"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Statutory Capacity (CAMA 2020 Sec 102)</label>
                    <select
                      value={signatoryCapacity}
                      onChange={(e) => setSignatoryCapacity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                    >
                      <option value="Director / Authorised Signatory">Director / Authorised Signatory</option>
                      <option value="Company Secretary">Company Secretary</option>
                      <option value="Sole Proprietor">Sole Proprietor</option>
                      <option value="Tenant / Individual">Tenant / Individual</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Identity Reference (NIN / RC Number)</label>
                    <Input
                      value={identityRef}
                      onChange={(e) => setIdentityRef(e.target.value)}
                      placeholder="e.g. NIN-12345678901 or RC-987654"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signature Pad */}
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="p-6 pb-2 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-400" /> Draw Digital Signature
                </CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={clearCanvas} className="text-xs text-slate-400 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Pad
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border border-slate-700 rounded-xl bg-slate-950 p-2 overflow-hidden flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full bg-slate-950 cursor-crosshair rounded-lg touch-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Draw your electronic signature using your mouse, trackpad, or touchscreen.
                </p>
              </CardContent>
            </Card>

            {/* Attestation & Submit */}
            <div className="space-y-4">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span>
                  I confirm that I am legally authorized to execute this agreement and acknowledge that this electronic signature is binding under the <em>Evidence Act</em> and <em>CAMA 2020</em>.
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={signing || !hasDrawn || !agreedToTerms}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 flex items-center gap-1.5"
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Execute &amp; Stamp Contract
                </Button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}