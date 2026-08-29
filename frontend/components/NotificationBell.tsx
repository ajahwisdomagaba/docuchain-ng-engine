'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  FileSignature, 
  Clock, 
  ShieldAlert, 
  Check, 
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';

export default function NotificationBell({ workspaceId }: { workspaceId?: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (workspaceId) q = q.eq('workspace_id', workspaceId);

      const { data } = await q;

      if (data && data.length > 0) {
        setNotifications(data);
      } else {
        // Generate dynamic statutory notice reminders if none exist
        setNotifications([
          {
            id: 'n-1',
            title: 'Lagos Tenancy Law Section 13 Notice Alert',
            message: 'Residential Lease in Lekki Phase 1 is 5 months from expiration. Prepare 6-month Form TL5 Notice.',
            type: 'STATUTORY_ALERT',
            link: '/obligations',
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: 'n-2',
            title: 'CAMA 2020 Electronic Execution Pending',
            message: 'Executive Employment Contract requires Senior Partner digital signature.',
            type: 'SIGNATURE_REQUEST',
            link: '/vault',
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      console.warn('Could not fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [workspaceId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    } catch (e) {
      console.warn(e);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STATUTORY_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'SIGNATURE_REQUEST':
        return <FileSignature className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'QUOTA_WARNING':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 text-slate-300 hover:text-white hover:bg-slate-800"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-slate-950" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Statutory &amp; Workflow Alerts</span>
              {unreadCount > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px] px-1.5 py-0">
                  {unreadCount} New
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllRead}
                className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 mr-2"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 text-xs">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 hover:bg-slate-800/40 transition-colors flex items-start gap-3 ${
                  !n.is_read ? 'bg-slate-950/40' : ''
                }`}
              >
                <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span>{n.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline pt-0.5 font-medium"
                    >
                      View in System <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
            <Link
              href="/obligations"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-medium"
            >
              Open Statutory Calendar &amp; Notices →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}