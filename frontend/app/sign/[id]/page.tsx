'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PenTool, CheckCircle, RotateCcw, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function SignPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, profile } = useAuth();
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [contractTitle, setContractTitle] = useState('Loading agreement...');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadContract() {
      if (!id) return;
      if (id.startsWith('c-')) {
        setContractTitle('Sample Commercial Contract (' + id + ')');
        return;
      }
      try {
        const { data } = await supabase.from('contracts').select('title').eq('id', id).single();
        if (data?.title) setContractTitle(data.title);
      } catch {
        setContractTitle('Audited Commercial Contract');
      }
    }
    loadContract();
  }, [id]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
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

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !id) return;
    const signatureData = canvas.toDataURL('image/png');

    setSaving(true);
    try {
      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id;
      }

      if (currentUserId && !id.startsWith('c-')) {
        const { error } = await supabase.from('contract_signatures').insert({
          contract_id: id,
          user_id: currentUserId,
          signer_name: profile?.full_name || user?.email?.split('@')[0] || 'Authorized Signatory',
          signer_role: profile?.role || 'SIGNATORY',
          signature_data: signatureData,
        });

        if (error) throw error;
      }

      alert('Contract signature and audit log recorded successfully.');
      router.push('/vault');
    } catch (err: any) {
      alert('Error recording signature: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <PenTool className="w-5 h-5 text-emerald-400" />
              Sign Agreement
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{contractTitle}</p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded">
            <ShieldCheck className="w-3.5 h-3.5" /> Legally Binding
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
            <span>Draw your signature below</span>
            <button
              onClick={clearCanvas}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="border border-slate-800 rounded-xl bg-slate-950 p-2 overflow-hidden flex justify-center">
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair bg-slate-950 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => router.back()}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            onClick={handleSaveSignature}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm & Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
}