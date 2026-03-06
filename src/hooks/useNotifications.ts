import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) as any;
    if (data) setNotifications(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          // Play sound based on type
          playNotificationSound(newNotif.type);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true } as any).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const countByType = (type: string) => notifications.filter(n => !n.is_read && n.type === type).length;

  return { notifications, loading, unreadCount, countByType, markAsRead, markAllAsRead, refetch: fetchNotifications };
}

function playNotificationSound(type: string) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.15;

    if (type === "sale" || type === "sale_approved") {
      // Coin sound - ascending notes
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } else if (type === "call_scheduled") {
      // Plim sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1600, audioCtx.currentTime + 0.05);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } else {
      // Default notification
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + 0.08);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.12);
    }
  } catch {
    // Audio not available
  }
}
