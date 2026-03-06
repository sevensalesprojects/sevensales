import { useState, useEffect } from "react";
import { DBLead } from "@/hooks/useLeads";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: DBLead;
  sdrs: { user_id: string; full_name: string }[];
  onSave: (leadId: string, updates: Record<string, any>) => Promise<boolean>;
}

const sourceOptions = [
  "Instagram Orgânico", "Tráfego Pago", "YouTube", "WhatsApp", "Indicação",
  "Facebook Ads", "Compra Hotmart", "Forms Bio", "Forms Lista de Espera", "Forms YouTube", "Outro",
];

export function EditLeadDialog({ open, onOpenChange, lead, sdrs, onSave }: EditLeadDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", instagram: "", source: "", sdr_id: "",
  });

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        instagram: lead.instagram || "",
        source: lead.source || "",
        sdr_id: lead.sdr_id || "",
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const updates: Record<string, any> = {};
    if (form.name !== lead.name) updates.name = form.name;
    if (form.phone !== (lead.phone || "")) updates.phone = form.phone || null;
    if (form.email !== (lead.email || "")) updates.email = form.email || null;
    if (form.instagram !== (lead.instagram || "")) updates.instagram = form.instagram || null;
    if (form.source !== (lead.source || "")) updates.source = form.source || null;
    if (form.sdr_id !== (lead.sdr_id || "")) updates.sdr_id = form.sdr_id || null;

    if (Object.keys(updates).length > 0) {
      // Update fields one at a time to use existing hook
      for (const [field, value] of Object.entries(updates)) {
        await onSave(lead.id, { [field]: value });
      }
    }

    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {sdrs.length > 0 && (
            <div className="space-y-2">
              <Label>SDR Responsável</Label>
              <Select value={form.sdr_id} onValueChange={(v) => setForm({ ...form, sdr_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar SDR" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {sdrs.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
