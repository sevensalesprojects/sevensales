import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface ParsedLead {
  name: string;
  phone: string;
  country: string;
  group_number: string | null;
  group_link: string | null;
  sale_status: string;
  source: string | null;
  scheduling_date: string | null;
  consultation_done: boolean;
  reference_month: string | null;
  call_recording_link: string | null;
  closer_name: string | null;
  observations: string | null;
  scheduling_summary: string | null;
}

const COUNTRY_CODES: Record<string, string> = {
  "brasil": "55", "eua": "1", "usa": "1", "eau": "1", "portugal": "351",
  "porutgal": "351", "potugal": "351", "irlanda": "353", "inglaterra": "44",
  "reino unido": "44", "japão": "81", "japao": "81", "frança": "33",
  "franca": "33", "itália": "39", "italia": "39", "espanha": "34",
  "espaha": "34", "alemanha": "49", "angola": "244", "australia": "61",
  "austrália": "61",
};

function cleanDigits(s: string): string {
  return s.replace(/[^\d]/g, "");
}

function formatPhone(raw: string, country: string): string {
  if (!raw || !raw.trim()) return "";

  const countryLower = country.toLowerCase().trim();
  const countryCode = COUNTRY_CODES[countryLower] || "";

  // Already has + prefix — just clean up spaces
  if (raw.trim().startsWith("+")) {
    return raw.trim();
  }

  const digits = cleanDigits(raw);
  if (!digits) return raw.trim();

  // Check if digits already start with the country code
  if (countryCode === "55" && digits.startsWith("55") && digits.length >= 12) {
    // Brazilian number with country code
    const rest = digits.slice(2);
    const area = rest.slice(0, 2);
    const number = rest.slice(2);
    if (number.length === 9) {
      return `+55 (${area}) ${number.slice(0, 5)}-${number.slice(5)}`;
    }
    if (number.length === 8) {
      return `+55 (${area}) ${number.slice(0, 4)}-${number.slice(4)}`;
    }
    return `+55 (${area}) ${number}`;
  }

  if (countryCode === "55") {
    // Brazilian number without country code
    if (digits.length >= 10) {
      const area = digits.slice(0, 2);
      const number = digits.slice(2);
      if (number.length === 9) {
        return `+55 (${area}) ${number.slice(0, 5)}-${number.slice(5)}`;
      }
      if (number.length === 8) {
        return `+55 (${area}) ${number.slice(0, 4)}-${number.slice(4)}`;
      }
      return `+55 (${area}) ${number}`;
    }
    return `+55 ${digits}`;
  }

  if (countryCode === "1") {
    // US number
    const d = digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;
    if (d.length === 10) {
      return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }
    return `+1 ${d}`;
  }

  if (countryCode === "351" && digits.startsWith("351")) {
    const rest = digits.slice(3);
    return `+351 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  if (countryCode === "351") {
    return `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  if (countryCode === "353") {
    const d = digits.startsWith("353") ? digits.slice(3) : digits;
    return `+353 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  }

  if (countryCode === "44") {
    const d = digits.startsWith("44") ? digits.slice(2) : digits;
    return `+44 ${d.slice(0, 4)} ${d.slice(4)}`;
  }

  if (countryCode === "81") {
    const d = digits.startsWith("81") ? digits.slice(2) : digits;
    return `+81 ${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
  }

  if (countryCode === "33") {
    const d = digits.startsWith("33") ? digits.slice(2) : digits;
    return `+33 ${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  if (countryCode) {
    const d = digits.startsWith(countryCode) ? digits.slice(countryCode.length) : digits;
    return `+${countryCode} ${d}`;
  }

  return raw.trim();
}

function parseSchedulingDate(raw: string, refMonth: string): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (!lower || lower === "reagendar" || lower.includes("no-show") || lower.includes("no - show")) {
    return null;
  }

  // Determine year from reference month
  const monthLower = (refMonth || "").toLowerCase().trim();
  let year = 2026;
  if (monthLower === "novembro" || monthLower === "dezembro") year = 2025;

  // Parse patterns like "9h - 13/11", "14:30h - 14/11", "20h- 14/11", "22h / 17/11", "10:30 - 18/11"
  // Extract time and date parts
  const cleaned = lower.replace(/h/g, "").replace(/\s+/g, " ").trim();
  
  // Try to find time and day/month
  const match = cleaned.match(/(\d{1,2}(?::?\d{2})?)\s*[-\/]\s*(\d{1,2})\s*[\/\-]\s*(\d{1,2})/);
  if (!match) return null;

  const timePart = match[1];
  const day = parseInt(match[2], 10);
  const month = parseInt(match[3], 10);

  let hours = 0;
  let minutes = 0;

  if (timePart.includes(":")) {
    const [h, m] = timePart.split(":");
    hours = parseInt(h, 10);
    minutes = parseInt(m, 10);
  } else {
    hours = parseInt(timePart, 10);
  }

  if (isNaN(day) || isNaN(month) || isNaN(hours)) return null;

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00-03:00`;
  
  // Validate the date
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  
  return dateStr;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        row.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    row.push(current);
    return row;
  });
}

export function ImportLeadsDialog({ open, onOpenChange, onComplete }: ImportLeadsDialogProps) {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [sdrId, setSdrId] = useState<string>("__none__");
  const [sdrs, setSdrs] = useState<{ user_id: string; full_name: string }[]>([]);
  const [closers, setClosers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });

  // Load SDRs and closers on open
  useState(() => {
    const load = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["sdr", "closer"]);
      if (!roles) return;
      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (!profiles) return;
      const sdrIds = roles.filter(r => r.role === "sdr").map(r => r.user_id);
      const closerIds = roles.filter(r => r.role === "closer").map(r => r.user_id);
      setSdrs(profiles.filter(p => sdrIds.includes(p.user_id)));
      setClosers(profiles.filter(p => closerIds.includes(p.user_id)));
    };
    load();
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);

      // Skip header row and empty rows
      const dataRows = rows.slice(1).filter(r => r.length >= 2 && r[1]?.trim());

      const leads: ParsedLead[] = dataRows.map(r => {
        const phone = (r[0] || "").trim();
        const name = (r[1] || "").trim();
        const country = (r[2] || "").trim();
        const groupNumber = (r[3] || "").trim() || null;
        const groupLink = (r[4] || "").trim() || null;
        const soldRaw = (r[5] || "").trim().toUpperCase();
        const source = (r[6] || "").trim() || null;
        const schedulingRaw = (r[7] || "").trim();
        const consultationRaw = (r[8] || "").trim().toUpperCase();
        const refMonth = (r[9] || "").trim() || null;
        const callLink = (r[10] || "").trim() || null;
        const closerName = (r[11] || "").trim() || null;
        const observations = (r[12] || "").trim() || null;
        const schedulingSummary = (r[13] || "").trim() || null;

        return {
          name,
          phone: formatPhone(phone, country),
          country: country || "",
          group_number: groupNumber === "sem grupo" ? null : groupNumber,
          group_link: groupLink === "sem grupo" ? null : (groupLink && groupLink.startsWith("http") ? groupLink : null),
          sale_status: soldRaw === "TRUE" ? "sold" : "pending",
          source,
          scheduling_date: parseSchedulingDate(schedulingRaw, refMonth || ""),
          consultation_done: consultationRaw === "TRUE",
          reference_month: refMonth,
          call_recording_link: callLink && callLink.length > 3 ? callLink : null,
          closer_name: closerName,
          observations,
          scheduling_summary: schedulingSummary,
        };
      });

      setParsedLeads(leads);
      setStep("preview");
    };
    reader.readAsText(f, "utf-8");
  };

  const handleImport = async () => {
    if (!currentProject || !user) return;
    setImporting(true);

    let success = 0;
    let errors = 0;

    // Map closer names to IDs
    const closerMap: Record<string, string> = {};
    closers.forEach(c => {
      closerMap[c.full_name.toLowerCase()] = c.user_id;
    });

    const selectedSdr = sdrId === "__none__" ? null : sdrId;

    // Insert in batches of 20
    const batchSize = 20;
    for (let i = 0; i < parsedLeads.length; i += batchSize) {
      const batch = parsedLeads.slice(i, i + batchSize);

      const insertData = batch.map(lead => {
        const closerId = lead.closer_name
          ? closerMap[lead.closer_name.toLowerCase()] || null
          : null;

        return {
          name: lead.name,
          phone: lead.phone || null,
          country: lead.country || null,
          group_number: lead.group_number,
          group_link: lead.group_link,
          sale_status: lead.sale_status,
          source: lead.source,
          scheduling_date: lead.scheduling_date,
          consultation_done: lead.consultation_done,
          reference_month: lead.reference_month,
          call_recording_link: lead.call_recording_link,
          closer_id: closerId,
          observations: lead.observations,
          scheduling_summary: lead.scheduling_summary,
          sdr_id: selectedSdr,
          project_id: currentProject.id,
          channel: "whatsapp" as const,
        };
      });

      const { data, error } = await supabase.from("leads").insert(insertData as any).select("id");

      if (error) {
        console.error("Import batch error:", error);
        errors += batch.length;
      } else {
        success += data?.length || 0;
      }
    }

    setImportResult({ success, errors });
    setStep("done");
    setImporting(false);
    onComplete();
  };

  const handleClose = () => {
    setFile(null);
    setParsedLeads([]);
    setStep("upload");
    setSdrId("__none__");
    setImportResult({ success: 0, errors: 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Leads via CSV
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-3">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium text-foreground">Arraste um arquivo CSV ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">Formato esperado: mesma estrutura da planilha SDR</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Colunas esperadas (na ordem):</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Numero do Cliente</li>
                <li>Nome do Cliente</li>
                <li>País</li>
                <li>Número do Grupo</li>
                <li>Link do Grupo</li>
                <li>Vendeu/Não vendeu (TRUE/FALSE)</li>
                <li>Origem</li>
                <li>Agendamento</li>
                <li>Realizou a Consultoria (TRUE/FALSE)</li>
                <li>Corresponde ao mês</li>
                <li>Link da Call Realizada</li>
                <li>Consultor</li>
                <li>Observações</li>
                <li>Resumo do agendamento</li>
              </ol>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-medium">
                {parsedLeads.length} leads encontrados
              </div>
              {file && (
                <span className="text-xs text-muted-foreground truncate">{file.name}</span>
              )}
            </div>

            {sdrs.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">SDR responsável (aplicar a todos)</Label>
                <Select value={sdrId} onValueChange={setSdrId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecionar SDR" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {sdrs.map(s => (
                      <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 overflow-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border sticky top-0">
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">País</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Origem</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Vendeu</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Mês</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 50).map((lead, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-1.5 font-medium">{lead.name}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{lead.phone}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{lead.country}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{lead.source || "—"}</td>
                      <td className="px-2 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${lead.sale_status === "sold" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {lead.sale_status === "sold" ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">{lead.reference_month || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 50 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                  ... e mais {parsedLeads.length - 50} leads
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleImport} disabled={importing || parsedLeads.length === 0}>
                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {parsedLeads.length} leads
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-6 text-center">
            {importResult.errors === 0 ? (
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
            )}
            <div>
              <p className="text-lg font-semibold text-foreground">
                {importResult.success} leads importados
              </p>
              {importResult.errors > 0 && (
                <p className="text-sm text-destructive mt-1">{importResult.errors} erros encontrados</p>
              )}
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
