import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Upload, Download, Check, AlertTriangle, ChevronRight, ChevronLeft, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// ---------- constants ----------

type SystemField = { key: string; label: string; required?: boolean };

const SYSTEM_FIELDS: SystemField[] = [
  { key: "code", label: "Código", required: true },
  { key: "title", label: "Título", required: true },
  { key: "property_type", label: "Tipo de Imóvel", required: true },
  { key: "transaction_type", label: "Tipo de Transação" },
  { key: "price", label: "Preço" },
  { key: "rental_price", label: "Aluguel" },
  { key: "bedrooms", label: "Quartos" },
  { key: "bathrooms", label: "Banheiros" },
  { key: "parking_spots", label: "Vagas" },
  { key: "area_total", label: "Área Total" },
  { key: "area_built", label: "Área Construída" },
  { key: "condominium", label: "Condomínio" },
  { key: "address", label: "Endereço" },
  { key: "city", label: "Cidade" },
  { key: "neighborhood", label: "Bairro" },
  { key: "description", label: "Descrição" },
  { key: "status", label: "Status" },
];

const REQUIRED_KEYS = SYSTEM_FIELDS.filter((f) => f.required).map((f) => f.key);

const ALIAS_MAP: Record<string, string> = {
  codigo: "code", cod: "code", ref: "code",
  titulo: "title", nome: "title", name: "title",
  tipo: "property_type", type: "property_type", tipoimovel: "property_type",
  transacao: "transaction_type", tipotransacao: "transaction_type",
  preco: "price", valor: "price", valimovel: "price",
  aluguel: "rental_price", valoraluguel: "rental_price",
  quartos: "bedrooms", dormitorios: "bedrooms", rooms: "bedrooms",
  banheiros: "bathrooms", suites: "bathrooms",
  vagas: "parking_spots", garagem: "parking_spots",
  areatotal: "area_total", area: "area_total",
  areaconstruida: "area_built", areautil: "area_built",
  condominio: "condominium", cond: "condominium",
  endereco: "address",
  cidade: "city",
  bairro: "neighborhood",
  descricao: "description",
  situacao: "status",
};

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const STEPS = ["Upload", "Leitura", "Mapeamento", "Validação", "Importação"];

// ---------- component ----------

const DataImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ ok: number; errors: number; time: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const abortRef = useRef(false);

  // ----- helpers -----

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  const autoMap = (cols: string[]) => {
    const m: Record<string, string> = {};
    cols.forEach((col) => {
      const n = normalize(col);
      // exact match
      const exact = SYSTEM_FIELDS.find((f) => f.key === n);
      if (exact) { m[col] = exact.key; return; }
      // alias match
      if (ALIAS_MAP[n]) { m[col] = ALIAS_MAP[n]; return; }
      // partial
      const partial = SYSTEM_FIELDS.find((f) => n.includes(f.key) || f.key.includes(n));
      if (partial) { m[col] = partial.key; return; }
      m[col] = "__ignore__";
    });
    return m;
  };

  const mappedRows = rows.map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(mapping).forEach(([fileCol, sysField]) => {
      if (sysField !== "__ignore__") mapped[sysField] = row[fileCol] ?? "";
    });
    return mapped;
  });

  const validRows = mappedRows.filter((r) => REQUIRED_KEYS.every((k) => r[k]?.trim()));
  const invalidRows = mappedRows.filter((r) => !REQUIRED_KEYS.every((k) => r[k]?.trim()));

  // ----- step 0: upload -----

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) {
      setFile(accepted[0]);
      setStep(1);
      parseFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/xml": [".xml"], "application/xml": [".xml"] },
    maxFiles: 1,
  });

  const parseFile = (f: File) => {
    if (f.name.endsWith(".xml")) {
      const reader = new FileReader();
      reader.onprogress = (e) => { if (e.total) setParseProgress(Math.round((e.loaded / e.total) * 100)); };
      reader.onload = (e) => {
        const doc = new DOMParser().parseFromString(e.target?.result as string, "text/xml");
        const items = doc.querySelectorAll("Imovel, imovel, property, item, row");
        const parsed: Record<string, string>[] = [];
        const colSet = new Set<string>();
        items.forEach((item) => {
          const obj: Record<string, string> = {};
          Array.from(item.children).forEach((c) => { obj[c.tagName] = c.textContent ?? ""; colSet.add(c.tagName); });
          parsed.push(obj);
        });
        const cols = Array.from(colSet);
        setFileColumns(cols);
        setRows(parsed);
        setMapping(autoMap(cols));
        setParseProgress(100);
        setTimeout(() => setStep(2), 600);
      };
      reader.readAsText(f);
    } else {
      let progress = 0;
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        chunk: (results, parser) => {
          progress += results.data.length;
          setParseProgress(Math.min(95, Math.round((progress / (progress + 100)) * 100)));
          setRows((prev) => [...prev, ...(results.data as Record<string, string>[])]);
        },
        complete: (results) => {
          const cols = results.meta?.fields ?? Object.keys(rows[0] ?? {});
          setFileColumns(cols);
          setMapping(autoMap(cols));
          setParseProgress(100);
          setTimeout(() => setStep(2), 600);
        },
        error: () => toast({ title: "Erro ao ler arquivo", variant: "destructive" }),
      });
    }
  };

  const downloadTemplate = () => {
    const header = SYSTEM_FIELDS.map((f) => f.key).join(",");
    const blob = new Blob([header + "\n"], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "template_imoveis.csv";
    a.click();
  };

  const downloadErrors = () => {
    if (!invalidRows.length) return;
    const keys = SYSTEM_FIELDS.map((f) => f.key);
    const csv = [keys.join(","), ...invalidRows.map((r) => keys.map((k) => `"${(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "erros_importacao.csv";
    a.click();
  };

  // ----- step 4: import -----

  const doImport = async () => {
    setImporting(true);
    abortRef.current = false;
    const startTime = Date.now();
    let ok = 0;
    let errors = 0;
    const BATCH = 50;

    for (let i = 0; i < validRows.length; i += BATCH) {
      if (abortRef.current) break;
      const batch = validRows.slice(i, i + BATCH).map((r) => ({
        code: r.code,
        title: r.title,
        property_type: r.property_type || "casa",
        transaction_type: r.transaction_type || "venda",
        price: r.price ? Number(r.price.replace(/[^\d.,]/g, "").replace(",", ".")) : null,
        rental_price: r.rental_price ? Number(r.rental_price.replace(/[^\d.,]/g, "").replace(",", ".")) : null,
        bedrooms: r.bedrooms ? parseInt(r.bedrooms) : null,
        bathrooms: r.bathrooms ? parseInt(r.bathrooms) : null,
        parking_spots: r.parking_spots ? parseInt(r.parking_spots) : null,
        area_total: r.area_total ? Number(r.area_total.replace(/[^\d.,]/g, "").replace(",", ".")) : null,
        area_built: r.area_built ? Number(r.area_built.replace(/[^\d.,]/g, "").replace(",", ".")) : null,
        condominium: r.condominium || null,
        address: r.address || null,
        city: r.city || "Barueri",
        neighborhood: r.neighborhood || "Alphaville",
        description: r.description || null,
        status: r.status || "ativo",
      }));

      const { error } = await supabase.from("properties").upsert(batch, { onConflict: "code" });
      if (error) {
        errors += batch.length;
      } else {
        ok += batch.length;
      }
      setImportProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    const time = Math.round((Date.now() - startTime) / 1000);
    setImportResult({ ok, errors, time });
    setImporting(false);

    // audit log
    await supabase.from("system_audit_logs").insert({
      user_id: user?.id,
      user_name: user?.email ?? "Admin",
      action: "importou",
      object_type: "imovel",
      object_label: `Importação em massa (${file?.name})`,
      metadata: { total: validRows.length, ok, errors, time, file_name: file?.name },
    });

    toast({ title: `Importação concluída: ${ok} imóveis inseridos` });
  };

  // ---------- render ----------

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold tracking-tight text-foreground">
            Importação em Massa
          </h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Envie um arquivo CSV ou XML para importar imóveis ao sistema.
          </p>
        </div>
        <Avatar className="h-8 w-8 border border-border/50">
          <AvatarFallback className="bg-[#2A070C]/5 text-[#2A070C] text-xs font-[Inter]">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-[Inter] font-medium border transition-colors ${
                  i <= step
                    ? "bg-[#2A070C] text-white border-[#2A070C]"
                    : "bg-white text-muted-foreground border-border/50"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-[10px] font-[Inter] text-muted-foreground whitespace-nowrap">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 md:w-16 h-px mx-1 mb-4 ${i < step ? "bg-[#2A070C]" : "bg-border/50"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="bg-white border-border/50 shadow-none rounded-sm p-8">
        {/* Step 0 — Upload */}
        {step === 0 && (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border border-dashed rounded-sm p-16 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? "border-[#2A070C] bg-[#2A070C]/[0.02]" : "border-border/50 bg-white"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="font-[Inter] text-sm text-muted-foreground">
                {isDragActive ? "Solte o arquivo aqui..." : "Arraste um arquivo CSV ou XML, ou clique para selecionar"}
              </p>
              <p className="font-[Inter] text-[11px] text-muted-foreground/50 mt-1">Formatos aceitos: .csv, .xml</p>
            </div>
            <Button variant="outline" size="sm" className="font-[Inter] text-xs" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Baixar CSV Exemplo
            </Button>
          </div>
        )}

        {/* Step 1 — Parse */}
        {step === 1 && (
          <div className="space-y-6 text-center py-8">
            <FileSpreadsheet className="h-12 w-12 text-[#2A070C]/30 mx-auto" />
            <div className="max-w-xs mx-auto space-y-3">
              <p className="font-[Inter] text-sm text-muted-foreground">Lendo {file?.name}...</p>
              <Progress value={parseProgress} className="h-2" />
              <p className="font-[Inter] text-xs text-muted-foreground/60">
                {rows.length > 0 ? `${rows.length} linhas encontradas` : "Processando..."}
              </p>
            </div>
          </div>
        )}

        {/* Step 2 — Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-[Inter] text-sm text-muted-foreground">
                Associe as colunas do arquivo aos campos do sistema.
              </p>
              <Badge variant="outline" className="font-[Inter] text-[10px]">{rows.length} linhas</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-[Inter] text-xs">Coluna do Arquivo</TableHead>
                  <TableHead className="font-[Inter] text-xs">Campo do Sistema</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fileColumns.map((col) => (
                  <TableRow key={col}>
                    <TableCell className="font-mono text-sm">{col}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping[col] ?? "__ignore__"}
                        onValueChange={(v) => setMapping((prev) => ({ ...prev, [col]: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs font-[Inter] w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__ignore__">Ignorar</SelectItem>
                          {SYSTEM_FIELDS.map((f) => (
                            <SelectItem key={f.key} value={f.key}>
                              {f.label} {f.required ? "*" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Step 3 — Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-50 text-emerald-700 font-[Inter] text-[10px]">
                  {validRows.length} válidas
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge className="bg-red-50 text-red-600 font-[Inter] text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {invalidRows.length} com erros
                  </Badge>
                )}
              </div>
              {invalidRows.length > 0 && (
                <Button variant="outline" size="sm" className="font-[Inter] text-xs" onClick={downloadErrors}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Baixar erros
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {SYSTEM_FIELDS.filter((f) => Object.values(mapping).includes(f.key)).map((f) => (
                      <TableHead key={f.key} className="font-[Inter] text-[10px] whitespace-nowrap">
                        {f.label} {f.required ? "*" : ""}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRows.slice(0, 10).map((row, i) => {
                    const isValid = REQUIRED_KEYS.every((k) => row[k]?.trim());
                    return (
                      <TableRow key={i}>
                        {SYSTEM_FIELDS.filter((f) => Object.values(mapping).includes(f.key)).map((f) => (
                          <TableCell
                            key={f.key}
                            className={`font-[Inter] text-xs ${
                              f.required && !row[f.key]?.trim() ? "bg-red-50 text-red-600" : ""
                            } ${["code", "price", "area_total", "area_built"].includes(f.key) ? "font-mono" : ""}`}
                          >
                            {row[f.key] || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {mappedRows.length > 10 && (
              <p className="font-[Inter] text-[10px] text-muted-foreground/50 text-center">
                Mostrando 10 de {mappedRows.length} linhas
              </p>
            )}
          </div>
        )}

        {/* Step 4 — Import */}
        {step === 4 && (
          <div className="space-y-6 text-center py-8">
            {!importResult ? (
              <>
                {!importing ? (
                  <>
                    <Upload className="h-12 w-12 text-[#2A070C]/30 mx-auto" />
                    <p className="font-[Inter] text-sm text-muted-foreground">
                      Pronto para importar <span className="font-semibold text-foreground">{validRows.length}</span> imóveis.
                    </p>
                    <Button onClick={doImport} className="bg-[#2A070C] hover:bg-[#2A070C]/90 font-[Inter] text-xs">
                      Iniciar Importação
                    </Button>
                  </>
                ) : (
                  <div className="max-w-xs mx-auto space-y-3">
                    <Loader2 className="h-8 w-8 text-[#2A070C] animate-spin mx-auto" />
                    <Progress value={importProgress} className="h-2" />
                    <p className="font-[Inter] text-xs text-muted-foreground">
                      {Math.round((importProgress / 100) * validRows.length)} de {validRows.length} inseridos...
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <Check className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="font-[Raleway] text-lg font-semibold text-foreground">Importação Concluída</h3>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="font-[Raleway] text-2xl font-bold text-foreground">{importResult.ok}</p>
                    <p className="font-[Inter] text-[10px] text-muted-foreground">Importados</p>
                  </div>
                  <div className="text-center">
                    <p className="font-[Raleway] text-2xl font-bold text-red-500">{importResult.errors}</p>
                    <p className="font-[Inter] text-[10px] text-muted-foreground">Erros</p>
                  </div>
                  <div className="text-center">
                    <p className="font-[Raleway] text-2xl font-bold text-muted-foreground">{importResult.time}s</p>
                    <p className="font-[Inter] text-[10px] text-muted-foreground">Tempo</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="font-[Inter] text-xs"
                  onClick={() => {
                    setStep(0); setFile(null); setRows([]); setFileColumns([]);
                    setMapping({}); setImportProgress(0); setImportResult(null);
                  }}
                >
                  Nova Importação
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      {step >= 2 && step <= 3 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="font-[Inter] text-xs" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Button
            size="sm"
            className="bg-[#2A070C] hover:bg-[#2A070C]/90 font-[Inter] text-xs"
            onClick={() => setStep(step + 1)}
            disabled={step === 3 && validRows.length === 0}
          >
            {step === 3 ? "Confirmar e Enviar" : "Próximo"} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataImport;
