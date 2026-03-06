import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TransferLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  currentSdrId: string | null;
  sdrs: { user_id: string; full_name: string }[];
  onConfirm: (newSdrId: string) => Promise<void>;
}

export function TransferLeadDialog({ open, onOpenChange, leadName, currentSdrId, sdrs, onConfirm }: TransferLeadDialogProps) {
  const [selectedSdr, setSelectedSdr] = useState("");
  const [saving, setSaving] = useState(false);

  const availableSdrs = sdrs.filter(s => s.user_id !== currentSdrId);

  const handleConfirm = async () => {
    if (!selectedSdr) return;
    setSaving(true);
    await onConfirm(selectedSdr);
    setSaving(false);
    setSelectedSdr("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferir Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Transferir <span className="font-medium text-foreground">{leadName}</span> para outro SDR.
          </p>
          <div className="space-y-2">
            <Label>Novo SDR Responsável</Label>
            <Select value={selectedSdr} onValueChange={setSelectedSdr}>
              <SelectTrigger><SelectValue placeholder="Selecionar SDR" /></SelectTrigger>
              <SelectContent>
                {availableSdrs.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {availableSdrs.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum outro SDR disponível para transferência.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={saving || !selectedSdr}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
