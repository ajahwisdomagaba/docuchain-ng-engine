'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Building2, 
  Trash2, 
  Lock, 
  Check, 
  X, 
  Loader2,
  Scale,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function ResellerTeamPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ASSOCIATE');
  const [canSign, setCanSign] = useState(false);
  const [canManageClients, setCanManageClients] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: wsData } = await supabase.from('workspaces').select('*').limit(1);
        if (wsData && wsData.length > 0) {
          setWorkspaces(wsData);
          setSelectedWorkspaceId(wsData[0].id);

          const { data: memberData } = await supabase
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', wsData[0].id)
            .order('created_at', { ascending: false });

          setMembers(memberData || []);
        }
      } catch (err: any) {
        console.error('Failed to load team data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !selectedWorkspaceId) return;

    setInviting(true);
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: selectedWorkspaceId,
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          can_sign: role === 'SENIOR_PARTNER' || role === 'FIRM_ADMIN' ? true : canSign,
          can_audit: true,
          can_manage_clients: role === 'FIRM_ADMIN' ? true : canManageClients,
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (error) throw error;
      setMembers([data, ...members]);
      setFullName('');
      setEmail('');
      setShowInviteModal(false);
      alert(`Team member ${fullName} added successfully.`);
    } catch (err: any) {
      alert(`Failed to add team member: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Remove this member from the law firm workspace?')) return;
    try {
      const { error } = await supabase.from('workspace_members').delete().eq('id', id);
      if (error) throw error;
      setMembers(members.filter(m => m.id !== id));
    } catch (err: any) {
      alert(`Failed to remove member: ${err.message}`);
    }
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'FIRM_ADMIN':
        return <Badge className="bg-rose-500/20 text-rose-400 text-[10px]">Firm Administrator</Badge>;
      case 'SENIOR_PARTNER':
        return <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">Senior Partner</Badge>;
      case 'ASSOCIATE':
        return <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Associate Counsel</Badge>;
      case 'PARALEGAL':
        return <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">Paralegal / Auditor</Badge>;
      default:
        return <Badge className="bg-slate-800 text-slate-300 text-[10px]">{roleName}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/reseller/clients">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-bold tracking-tight text-white">Law Firm Team &amp; RBAC Matrix</h1>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">Role Governance</Badge>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Manage law firm partners, associates, and paralegals with CAMA 2020 signing permissions.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Team Member
          </Button>
        </div>

        {/* Roles & Permissions Reference Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-rose-400">Firm Administrator</span>
            <p className="text-slate-400 text-[11px]">Full platform access, custom white-label branding, billing &amp; token allocation.</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">Senior Partner</span>
            <p className="text-slate-400 text-[11px]">Authorized for CAMA Sec 102 digital signature execution and final redline approvals.</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">Associate Counsel</span>
            <p className="text-slate-400 text-[11px]">Contract auditing, redline editing, client vault management, and precedent querying.</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-blue-400">Paralegal / Auditor</span>
            <p className="text-slate-400 text-[11px]">Contract ingestion, document text extraction, and statutory compliance reviewing.</p>
          </div>
        </div>

        {/* Members Table */}
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Workspace Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs">Loading team directory...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No team members registered</p>
                <p>Click &ldquo;Add Team Member&rdquo; above to invite your first colleague.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Name &amp; Email</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Can Audit</th>
                    <th className="py-3.5 px-4 font-semibold">E-Sign Execution</th>
                    <th className="py-3.5 px-4 font-semibold">Client Admin</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">
                        <div className="font-semibold text-slate-100">{m.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                      </td>
                      <td className="py-4 px-4">{getRoleBadge(m.role)}</td>
                      <td className="py-4 px-4">
                        <span className="text-emerald-400 font-semibold">✓ Allowed</span>
                      </td>
                      <td className="py-4 px-4">
                        {m.can_sign ? (
                          <span className="text-emerald-400 font-semibold">✓ CAMA 102 Signer</span>
                        ) : (
                          <span className="text-slate-500">✕ Disabled</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {m.can_manage_clients ? (
                          <span className="text-emerald-400 font-semibold">✓ Allowed</span>
                        ) : (
                          <span className="text-slate-500">✕ Restricted</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(m.id)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md shadow-2xl">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Add Team Member
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteModal(false)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Full Legal Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Barr. Folake Adeleke"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. folake@adelowolegal.ng"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ASSOCIATE">Associate Counsel</option>
                  <option value="SENIOR_PARTNER">Senior Partner (Auto Signatory)</option>
                  <option value="PARALEGAL">Paralegal / Compliance Auditor</option>
                  <option value="FIRM_ADMIN">Firm Administrator</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'SENIOR_PARTNER' || role === 'FIRM_ADMIN' ? true : canSign}
                    disabled={role === 'SENIOR_PARTNER' || role === 'FIRM_ADMIN'}
                    onChange={(e) => setCanSign(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                  />
                  <span className="text-slate-300">Grant CAMA 2020 E-Signature Authority</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'FIRM_ADMIN' ? true : canManageClients}
                    disabled={role === 'FIRM_ADMIN'}
                    onChange={(e) => setCanManageClients(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                  />
                  <span className="text-slate-300">Grant Client Vault Provisioning Rights</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="text-xs text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={inviting || !fullName.trim() || !email.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}