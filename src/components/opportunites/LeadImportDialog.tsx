"use client";

import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import { useQueryClient } from "@tanstack/react-query";
import { OPPORTUNITY_STATUSES, type OpportunityStatus } from "@/types";

// Airtable field definitions for opportunities
const AIRTABLE_FIELDS = [
  { key: "nom", label: "Nom de l'opportunité", required: true },
  { key: "valeurEstimee", label: "Valeur estimée (€)", required: false },
  { key: "probabilite", label: "Probabilité (%)", required: false },
  { key: "dateClotureEstimee", label: "Date de clôture estimée", required: false },
  { key: "source", label: "Source", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

type FieldKey = (typeof AIRTABLE_FIELDS)[number]["key"];

interface ColumnMapping {
  [fileColumn: string]: FieldKey | null;
}

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "complete";

export function LeadImportDialog({ open, onOpenChange }: LeadImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [defaultStatus, setDefaultStatus] = useState<OpportunityStatus>("Lead");
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("upload");
      setFile(null);
      setParsedData(null);
      setColumnMapping({});
      setDefaultStatus("Lead");
      setImportProgress(0);
      setImportedCount(0);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  // Parse file content
  const parseFile = useCallback(async (file: File): Promise<ParsedData> => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv") {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data as Record<string, string>[];
            resolve({ headers, rows });
          },
          error: (error) => reject(error),
        });
      });
    } else if (extension === "xlsx" || extension === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
        header: 1,
        raw: false,
      });

      if (jsonData.length < 2) {
        throw new Error("Le fichier doit contenir au moins une ligne de données");
      }

      const headers = Object.values(jsonData[0] || {}).map(String);
      const rows = jsonData.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = String((row as Record<number, unknown>)[index] || "");
        });
        return obj;
      });

      return { headers, rows };
    }

    throw new Error("Format de fichier non supporté. Utilisez CSV ou XLSX.");
  }, []);

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);

      // Auto-detect column mappings
      const autoMapping: ColumnMapping = {};
      data.headers.forEach((header) => {
        const lowerHeader = header.toLowerCase().trim();

        // Try to match headers to fields
        if (lowerHeader.includes("nom") || lowerHeader.includes("name") || lowerHeader.includes("opportunit")) {
          autoMapping[header] = "nom";
        } else if (lowerHeader.includes("valeur") || lowerHeader.includes("montant") || lowerHeader.includes("value") || lowerHeader.includes("amount")) {
          autoMapping[header] = "valeurEstimee";
        } else if (lowerHeader.includes("proba") || lowerHeader.includes("chance")) {
          autoMapping[header] = "probabilite";
        } else if (lowerHeader.includes("date") || lowerHeader.includes("cloture") || lowerHeader.includes("close")) {
          autoMapping[header] = "dateClotureEstimee";
        } else if (lowerHeader.includes("source") || lowerHeader.includes("origine")) {
          autoMapping[header] = "source";
        } else if (lowerHeader.includes("note") || lowerHeader.includes("comment") || lowerHeader.includes("description")) {
          autoMapping[header] = "notes";
        }
      });

      setColumnMapping(autoMapping);
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la lecture du fichier");
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split(".").pop()?.toLowerCase();
      if (ext === "csv" || ext === "xlsx" || ext === "xls") {
        handleFileSelect(droppedFile);
      } else {
        setError("Format non supporté. Utilisez CSV ou XLSX.");
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Update mapping for a column
  const updateMapping = (fileColumn: string, fieldKey: FieldKey | null) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fileColumn]: fieldKey,
    }));
  };

  // Check if mapping is valid (nom is required)
  const isMappingValid = useMemo(() => {
    return Object.values(columnMapping).includes("nom");
  }, [columnMapping]);

  // Preview data based on current mapping
  const previewData = useMemo(() => {
    if (!parsedData) return [];

    return parsedData.rows.slice(0, 5).map((row) => {
      const mapped: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([fileCol, fieldKey]) => {
        if (fieldKey && row[fileCol]) {
          mapped[fieldKey] = row[fileCol];
        }
      });
      return mapped;
    });
  }, [parsedData, columnMapping]);

  // Import leads to Airtable
  const handleImport = async () => {
    if (!parsedData) return;

    setStep("importing");
    setImportProgress(0);
    setImportedCount(0);
    setError(null);

    try {
      // Transform data for Airtable
      const records = parsedData.rows
        .filter((row) => {
          // Must have a name
          const nomCol = Object.entries(columnMapping).find(([, v]) => v === "nom")?.[0];
          return nomCol && row[nomCol]?.trim();
        })
        .map((row) => {
          const fields: Record<string, unknown> = {
            Statut: defaultStatus,
          };

          Object.entries(columnMapping).forEach(([fileCol, fieldKey]) => {
            if (!fieldKey || !row[fileCol]) return;

            const value = row[fileCol].trim();
            if (!value) return;

            switch (fieldKey) {
              case "nom":
                fields["Nom de l'Opportunité"] = value;
                break;
              case "valeurEstimee":
                const numVal = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
                if (!isNaN(numVal)) {
                  fields["Valeur Estimée"] = numVal;
                }
                break;
              case "probabilite":
                let probVal = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
                // Convert percentage to decimal if needed
                if (probVal > 1) {
                  probVal = probVal / 100;
                }
                if (!isNaN(probVal) && probVal >= 0 && probVal <= 1) {
                  fields["Probabilité"] = probVal;
                }
                break;
              case "dateClotureEstimee":
                // Try to parse various date formats
                const dateMatch = value.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
                if (dateMatch) {
                  const [, a, b, c] = dateMatch;
                  // Determine format (DD/MM/YYYY or YYYY-MM-DD)
                  let year: string, month: string, day: string;
                  if (a.length === 4) {
                    [year, month, day] = [a, b, c];
                  } else if (c.length === 4) {
                    [day, month, year] = [a, b, c];
                  } else {
                    [day, month, year] = [a, b, `20${c}`];
                  }
                  fields["Date de Clôture Estimée"] = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                }
                break;
              case "source":
                fields["Source"] = value;
                break;
              case "notes":
                fields["Notes"] = value;
                break;
            }
          });

          return { fields };
        });

      if (records.length === 0) {
        throw new Error("Aucun enregistrement valide à importer");
      }

      // Import in batches with progress
      const BATCH_SIZE = 10;
      let created = 0;

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        await airtable.createRecords(AIRTABLE_TABLES.OPPORTUNITES, batch);
        created += batch.length;
        setImportedCount(created);
        setImportProgress(Math.round((created / records.length) * 100));

        // Small delay for UI update
        await new Promise((r) => setTimeout(r, 100));
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["opportunites"] });

      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import");
      setStep("preview");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importer des Leads</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Déposez votre fichier CSV ou Excel pour commencer"}
            {step === "mapping" && "Associez les colonnes de votre fichier aux champs Airtable"}
            {step === "preview" && "Vérifiez les données avant l'import"}
            {step === "importing" && "Import en cours..."}
            {step === "complete" && "Import terminé avec succès !"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["upload", "mapping", "preview", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step === s || (step === "importing" && s === "preview")
                    ? "bg-primary text-primary-foreground"
                    : ["mapping", "preview", "importing", "complete"].indexOf(step) >
                      ["upload", "mapping", "preview", "complete"].indexOf(s)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step === "complete" && s === "complete" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    ["mapping", "preview", "importing", "complete"].indexOf(step) > i
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          {/* Upload step */}
          {step === "upload" && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou cliquez pour sélectionner
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Formats supportés : CSV, XLSX, XLS</span>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Mapping step */}
          {step === "mapping" && parsedData && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* File info */}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedData.rows.length} lignes détectées
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setStep("upload");
                      setFile(null);
                      setParsedData(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Default status selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Statut par défaut pour les nouveaux leads
                  </label>
                  <Select
                    value={defaultStatus}
                    onValueChange={(v) => setDefaultStatus(v as OpportunityStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Column mappings */}
                <div className="space-y-3">
                  <h4 className="font-medium">Mapping des colonnes</h4>
                  <p className="text-sm text-muted-foreground">
                    Associez chaque colonne de votre fichier au champ correspondant.
                    Le champ "Nom de l'opportunité" est obligatoire.
                  </p>

                  <div className="space-y-2">
                    {parsedData.headers.map((header) => (
                      <div
                        key={header}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{header}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Ex: {parsedData.rows[0]?.[header] || "-"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select
                          value={columnMapping[header] || "ignore"}
                          onValueChange={(v) =>
                            updateMapping(header, v === "ignore" ? null : (v as FieldKey))
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Ignorer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">
                              <span className="text-muted-foreground">Ignorer</span>
                            </SelectItem>
                            {AIRTABLE_FIELDS.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                                {field.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Preview step */}
          {step === "preview" && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Aperçu des {Math.min(5, previewData.length)} premières lignes
                    sur {parsedData?.rows.length} total
                  </p>
                  <Badge variant="outline">Statut: {defaultStatus}</Badge>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {AIRTABLE_FIELDS.filter((f) =>
                          Object.values(columnMapping).includes(f.key)
                        ).map((field) => (
                          <th
                            key={field.key}
                            className="px-3 py-2 text-left font-medium"
                          >
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {AIRTABLE_FIELDS.filter((f) =>
                            Object.values(columnMapping).includes(f.key)
                          ).map((field) => (
                            <td key={field.key} className="px-3 py-2 truncate max-w-[200px]">
                              {row[field.key] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-sm text-muted-foreground">
                  {parsedData?.rows.filter((row) => {
                    const nomCol = Object.entries(columnMapping).find(
                      ([, v]) => v === "nom"
                    )?.[0];
                    return nomCol && row[nomCol]?.trim();
                  }).length || 0}{" "}
                  enregistrements valides seront importés
                </p>
              </div>
            </ScrollArea>
          )}

          {/* Importing step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Import en cours...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importedCount} / {parsedData?.rows.length || 0} leads importés
                </p>
              </div>
              <Progress value={importProgress} className="w-64" />
            </div>
          )}

          {/* Complete step */}
          {step === "complete" && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="p-4 rounded-full bg-green-100">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Import terminé !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importedCount} leads ont été importés avec succès
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {step === "mapping" && (
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}
            {step === "preview" && (
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}
          </div>
          <div>
            {step === "mapping" && (
              <Button
                onClick={() => setStep("preview")}
                disabled={!isMappingValid}
              >
                Aperçu
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === "preview" && (
              <Button onClick={handleImport}>
                Importer {parsedData?.rows.length || 0} leads
              </Button>
            )}
            {step === "complete" && (
              <Button onClick={() => handleOpenChange(false)}>Fermer</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
