'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Scale, 
  Download, 
  FileText, 
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = (params?.id as string) || '';

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signerName, setSignerName] = useState('Ajah Wisdom Agaba');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerRole, setSignerRole] = useState('Director / Authorized Signatory');
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    async function loadContractAndUser() {
      // 1. Fetch current auth user details
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSignerEmail(user.email || '');
        if (user.user_metadata?.full_name) {
          setSignerName(user.user_metadata.full_name);
        }
      }

      // 2. Fetch contract details dynamically
      if (contractId) {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', contractId)
          .maybeSingle();

        if (data && !error) {
          setContract(data);
        } else {
          setContract({
            id: contractId,
            title: 'Commercial Service Agreement',
            health_score: 95,
          });
        }
      }
      setLoading(false);
    }

    loadContractAndUser();
  }, [contractId]);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#10b981';
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleExecute = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !attestationAccepted || !signerName.trim()) {
      alert('Please provide your name, draw your signature, and accept the statutory attestation.');
      return;
    }

    const signatureDataUrl = canvas.toDataURL('image/png');
    setIsSigning(true);

    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          signatureDataUrl,
          signerName,
          signerEmail: signerEmail || 'counsel@firm.ng',
          signerRole,
          attestationAccepted
        })
      });

      const data = await res.json();
      if (res.ok) {
        setExecutionResult(data);
      } else {
        alert(data.error || 'Execution failed');
      }
    } catch (err) {
      console.error('Sign execution error:', err);
      alert('Error communicating with execution server');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Preparing CAMA 2020 Digital Execution Suite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link href="/vault">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  CAMA 2020 Sec 102 Certified
                </Badge>
                <span className="text-xs text-slate-400">Tamper-Evident SHA-256</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Digital Execution &amp; Capacity Attestation
              </h1>
              <p className="text-xs text-slate-400">
                Contract ID: <span className="font-mono text-slate-300">{contractId}</span> • {contract?.title || 'Legal Document'}
              </p>
            </div>
          </div>
        </div>

        {/* Execution Certificate View */}
        {executionResult ? (
          <Card className="bg-slate-900 border-emerald-500/50 shadow-2xl p-6 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Contract Legally Executed</h2>
              <p className="text-xs text-slate-400">
                Stamped with statutory validity under Section 102 of the Companies and Allied Matters Act 2020.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-2 max-w-xl mx-auto">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-500">Certificate Ref:</span>
                <span className="text-emerald-400 font-bold">{executionResult.certificateId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-500">Signatory:</span>
                <span className="text-slate-200">{signerName} ({signerRole})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-500">Execution Timestamp:</span>
                <span className="text-slate-200">{new Date(executionResult.signedAt).toLocaleString('en-NG')}</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block">SHA-256 Digest:</span>
                <span className="text-[10px] text-slate-400 break-all">{executionResult.sha256Checksum}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 cursor-pointer">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Print Execution Proof
              </Button>
              <Button variant="outline" onClick={() => router.push('/vault')} className="border-slate-700 bg-slate-800 text-xs h-9 cursor-pointer">
                Back to Vault
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Document Context */}
            <div className="space-y-4">
              <Card className="bg-slate-900/60 border-slate-800 p-4 space-y-3">
                <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Document Summary
                </CardTitle>
                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Title</span>
                    <strong>{contract?.title || 'Contract Draft'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Compliance Health</span>
                    <span className="text-emerald-400 font-bold">{contract?.health_score || 95}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Statutory Baseline</span>
                    <span>CAMA 2020 &amp; Tenancy Law 2011</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Signing Canvas */}
            <div className="md:col-span-2 space-y-4">
              <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Signatory Full Name</label>
                    <input 
                      type="text" 
                      value={signerName} 
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white text-xs focus:ring-1 focus:ring-emerald-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Capacity / Role</label>
                    <input 
                      type="text" 
                      value={signerRole} 
                      onChange={(e) => setSignerRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white text-xs focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                </div>

                {/* Signature Drawing Canvas */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 text-xs font-semibold">Draw Digital Signature</label>
                    <button 
                      type="button" 
                      onClick={clearCanvas} 
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-slate-700 rounded-xl bg-slate-950 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-[140px] cursor-crosshair"
                    />
                  </div>
                </div>

                {/* CAMA 2020 Statutory Attestation */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={attestationAccepted}
                      onChange={(e) => setAttestationAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                    />
                    <span className="text-slate-300 leading-relaxed">
                      I hereby confirm that I possess the statutory capacity under <strong className="text-white">Section 102 of the Companies and Allied Matters Act (CAMA) 2020</strong> to execute this instrument on behalf of the principal entity.
                    </span>
                  </label>
                </div>

                <Button
                  onClick={handleExecute}
                  disabled={isSigning || !attestationAccepted || !signerName.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-10 font-bold shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Stamping Cryptographic Certificate...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4 mr-2" /> Attest Capacity &amp; Execute Instrument
                    </>
                  )}
                </Button>
              </Card>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}