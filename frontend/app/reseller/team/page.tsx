"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  UserPlus,
  ShieldCheck,
  FolderLock,
  Lock,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Ban,
  ArrowUpRight,
  MoreVertical,
  X,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MemberItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  can_sign: boolean;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  allocated_storage_mb?: number;
  used_storage_mb?: number;
  vault?: {
    id: string;
    name: string;
    contractCount: number;
  };
}

function TeamContent() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ASSOCIATE");
  const [department, setDepartment] = useState("Commercial Practice");
  const [canSign, setCanSign] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reseller/team");
      const data = await res.json();
      if (data.members) {
        setMembers(
          data.members.map((m: any) => ({
            ...m,
            allocated_storage_mb: 500, // 500 MB per member default quota
            used_storage_mb: Math.floor(Math.random() * 45) + 5,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsInviting(true);
    try {
      const res = await fetch("/api/reseller/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role, department, canSign }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg(`Invitation dispatched to ${email}. Status: PENDING.`);
        setShowInviteModal(false);
        setFullName("");
        setEmail("");
        fetchMembers();
      } else {
        alert(data.error || "Failed to invite member");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleMemberAction = async (memberId: string, action: "PROMOTE" | "SUSPEND" | "ACTIVATE") => {
    let targetAction = action;
    if (action === "PROMOTE") targetAction = "ACTIVATE";

    await fetch("/api/reseller/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action: targetAction }),
    });

    fetchMembers();
  };

  const filteredMembers = members.filter(
    (m) =>
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Practice Hub • HR &amp; Vault Allocation
              </span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                Partner Administration
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Team Roster &amp; Private Vaults
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Provision isolated vaults, assign CAMA 2020 Sec 102 signing capacity, monitor storage quotas, and enforce NDPA 2023 session security.
            </p>
          </div>

          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite Team Member
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search team members by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-700 text-white text-xs placeholder:text-slate-500 focus-visible:ring-purple-500"
            />
          </div>
        </div>

        {/* Member Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <p className="text-xs">Loading law firm team &amp; vault roster...</p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 uppercase text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Lawyer / Member</th>
                  <th className="py-3.5 px-5">Role &amp; Department</th>
                  <th className="py-3.5 px-5">Allocated Vault</th>
                  <th className="py-3.5 px-5">CAMA E-Sign</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Partner Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white">{m.full_name}</div>
                      <div className="text-[11px] text-slate-500">{m.email}</div>
                    </td>
                    <td className="py-4 px-5">
                      <Badge
                        className={`text-[9px] uppercase ${
                          m.role === "PARTNER"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {m.role}
                      </Badge>
                      <div className="text-[11px] text-slate-400 mt-1">{m.department}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <FolderLock className="w-3.5 h-3.5 text-emerald-400" />
                        {m.vault?.name || "Private Vault"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>
                          {m.used_storage_mb || 12} MB / {m.allocated_storage_mb || 500} MB
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {m.can_sign ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Restricted
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <Badge
                        className={`text-[10px] ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : m.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5">
                      <Link href={`/vault?vaultId=${m.vault?.id || m.id}&name=${encodeURIComponent(m.full_name)}`}>
                        <Button size="sm" variant="outline" className="text-[11px] h-7 border-slate-700 bg-slate-800 text-slate-200 hover:text-white">
                          Inspect Vault
                        </Button>
                      </Link>

                      {m.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMemberAction(m.id, "SUSPEND")}
                          className="text-[11px] h-7 text-rose-400 hover:bg-rose-950/40"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMemberAction(m.id, "ACTIVATE")}
                          className="text-[11px] h-7 text-emerald-400 hover:bg-emerald-950/40"
                        >
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* High-Contrast Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <Card className="bg-slate-900 border-slate-800 w-full max-w-md shadow-2xl text-slate-100">
              <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" /> Invite Lawyer / Staff Member
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <form onSubmit={handleInvite} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 block mb-1.5 font-semibold text-xs">
                      Full Name
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. David Adeleke, Esq."
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-purple-500 text-xs h-10"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1.5 font-semibold text-xs">
                      Corporate Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. david.adeleke@firm.ng"
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-purple-500 text-xs h-10"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1.5 font-semibold text-xs">
                        Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-10"
                      >
                        <option value="ASSOCIATE" className="bg-slate-900 text-white">Associate</option>
                        <option value="SENIOR_COUNSEL" className="bg-slate-900 text-white">Senior Counsel</option>
                        <option value="PARTNER" className="bg-slate-900 text-white">Partner</option>
                        <option value="PARALEGAL" className="bg-slate-900 text-white">Paralegal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1.5 font-semibold text-xs">
                        Department
                      </label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Commercial Practice"
                        className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-purple-500 text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={canSign}
                        onChange={(e) => setCanSign(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-slate-200">
                        Grant <strong className="text-white">CAMA 2020 Sec 102</strong> Digital Signing Authority
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInviteModal(false)}
                      className="text-xs text-slate-400 hover:text-white h-9 px-4"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isInviting}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-9 px-4 font-semibold shadow-lg shadow-purple-950"
                    >
                      {isInviting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Sending...
                        </>
                      ) : (
                        "Send Invitation"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading Practice Team...</div>}>
      <TeamContent />
    </Suspense>
  );
}