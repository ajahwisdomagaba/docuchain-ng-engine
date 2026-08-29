import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  workspaceId?: string | null;
  clientId?: string | null;
  userId?: string | null;
  actorEmail?: string;
  action: 'CONTRACT_INGESTED' | 'AUDIT_REVIEWED' | 'PDF_EXPORTED' | 'CLIENT_PROVISIONED' | 'PLAYBOOK_UPDATED' | 'USER_INVITED';
  resourceType: 'CONTRACT' | 'CLIENT' | 'PLAYBOOK' | 'WORKSPACE' | 'USER';
  resourceId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      workspace_id: entry.workspaceId || null,
      client_id: entry.clientId || null,
      user_id: entry.userId || null,
      actor_email: entry.actorEmail || 'system@docuchain.ng',
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId || null,
      ip_address: entry.ipAddress || null,
      details: entry.details || {},
    });

    if (error) {
      console.warn('Audit logger warning:', error.message);
    }
  } catch (err: any) {
    console.error('Audit logger failure:', err.message);
  }
}