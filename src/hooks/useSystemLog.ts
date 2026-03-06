import { supabase } from "@/integrations/supabase/client";

export async function logSystemEvent(params: {
  userId?: string;
  projectId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from("system_logs").insert({
      user_id: params.userId || null,
      project_id: params.projectId || null,
      action: params.action,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
    } as any);
  } catch {
    // Silent fail for logging
  }
}

export async function logAuditChange(params: {
  entityType: string;
  entityId: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
}) {
  try {
    await supabase.from("audit_logs").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      field_changed: params.fieldChanged,
      old_value: params.oldValue,
      new_value: params.newValue,
      changed_by: params.changedBy,
    } as any);
  } catch {
    // Silent fail
  }
}

export async function saveDeletedRecord(params: {
  entityType: string;
  entityId: string;
  dataSnapshot: any;
  deletedBy: string;
}) {
  try {
    await supabase.from("deleted_records").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      data_snapshot: params.dataSnapshot,
      deleted_by: params.deletedBy,
    } as any);
  } catch {
    // Silent fail
  }
}
