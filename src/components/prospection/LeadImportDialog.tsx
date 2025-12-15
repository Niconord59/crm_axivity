"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useImportLeads, type ColumnMapping } from "@/hooks/use-import-leads";

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// CRM fields for mapping
const CRM_FIELDS = [
  { value: "entreprise", label: "Entreprise *", required: true },
  { value: "nom", label: "Nom *", required: true },
  { value: "email", label: "Email *", required: true },
  { value: "prenom", label: "Prénom", required: false },
  { value: "telephone", label: "Téléphone", required: false },
  { value: "source", label: "Source", required: false },
  { value: "notes", label: "Notes", required: false },
  { value: "_ignore", label: "-- Ignorer --", required: false },
] as const;

export function LeadImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: LeadImportDialogProps) {
  const {
    step,
    columns,
    preview,
    duplicates,
    isImporting,
    progress,
    summary,
    totalLeads,
    parseFile,
    setMapping,
    importLeads,
    goBack,
    reset,
  } = useImportLeads();

  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Handle file drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        toast.error("Format non supporté", {
          description: "Veuillez utiliser un fichier CSV",
        });
        return;
      }

      try {
        await parseFile(file);
      } catch (error) {
        toast.error("Erreur lors du parsing", {
          description: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    },
    [parseFile]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        await parseFile(file);
      } catch (error) {
        toast.error("Erreur lors du parsing", {
          description: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    },
    [parseFile]
  );

  // Handle mapping change
  const handleMappingChange = (csvColumn: string, crmField: string) => {
    setColumnMappings((prev) => {
      const newMappings = { ...prev };

      // If this CRM field was already assigned, remove it
      for (const key in newMappings) {
        if (newMappings[key] === crmField && crmField !== "_ignore") {
          delete newMappings[key];
        }
      }

      if (crmField === "_ignore") {
        delete newMappings[csvColumn];
      } else {
        newMappings[csvColumn] = crmField;
      }

      return newMappings;
    });
  };

  // Validate mapping
  const isMappingValid = () => {
    const mappedFields = new Set(Object.values(columnMappings));
    return (
      mappedFields.has("entreprise") &&
      mappedFields.has("nom") &&
      mappedFields.has("email")
    );
  };

  // Convert to ColumnMapping format
  const getColumnMapping = (): ColumnMapping => {
    const mapping: ColumnMapping = {
      entreprise: "",
      nom: "",
      email: "",
    };

    for (const [csvColumn, crmField] of Object.entries(columnMappings)) {
      if (crmField === "entreprise") mapping.entreprise = csvColumn;
      else if (crmField === "nom") mapping.nom = csvColumn;
      else if (crmField === "email") mapping.email = csvColumn;
      else if (crmField === "prenom") mapping.prenom = csvColumn;
      else if (crmField === "telephone") mapping.telephone = csvColumn;
      else if (crmField === "source") mapping.source = csvColumn;
      else if (crmField === "notes") mapping.notes = csvColumn;
    }

    return mapping;
  };

  // Handle next step
  const handleNext = async () => {
    if (step === 2) {
      if (!isMappingValid()) {
        toast.error("Mapping incomplet", {
          description: "Veuillez mapper les champs obligatoires (Entreprise, Nom, Email)",
        });
        return;
      }

      try {
        await setMapping(getColumnMapping());
      } catch (error) {
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }
  };

  // Handle import
  const handleImport = async () => {
    try {
      const result = await importLeads();
      toast.success("Import terminé", {
        description: `${result.created} créés, ${result.updated} mis à jour, ${result.errors} erreurs`,
      });
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors de l'import", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  };

  // Handle close
  const handleClose = () => {
    reset();
    setColumnMappings({});
    onOpenChange(false);
  };

  // Get assigned CRM field for a CSV column
  const getMappedField = (csvColumn: string) => {
    return columnMappings[csvColumn] || "_ignore";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer des leads
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Sélectionnez un fichier CSV contenant vos leads"}
            {step === 2 && "Associez les colonnes du fichier aux champs du CRM"}
            {step === 3 && "Vérifiez l'aperçu et lancez l'import"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-1 mx-2",
                    step > s ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Glissez votre fichier ici
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou cliquez pour sélectionner
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-input" className="cursor-pointer">
                Sélectionner un fichier CSV
              </label>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Formats acceptés: CSV (UTF-8)
            </p>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {columns.length} colonnes détectées. Associez chaque colonne au champ correspondant.
            </p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {columns.map((column) => (
                <div key={column} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{column}</Label>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="w-[200px]">
                    <Select
                      value={getMappedField(column)}
                      onValueChange={(value) => handleMappingChange(column, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm">
                <span className="font-medium">Champs obligatoires:</span>{" "}
                <Badge variant={columnMappings && Object.values(columnMappings).includes("entreprise") ? "default" : "outline"}>
                  Entreprise
                </Badge>{" "}
                <Badge variant={columnMappings && Object.values(columnMappings).includes("nom") ? "default" : "outline"}>
                  Nom
                </Badge>{" "}
                <Badge variant={columnMappings && Object.values(columnMappings).includes("email") ? "default" : "outline"}>
                  Email
                </Badge>
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Preview and Import */}
        {step === 3 && !summary && (
          <div className="space-y-4">
            {/* Info */}
            <div className="flex items-center justify-between text-sm">
              <span>{totalLeads} leads à importer</span>
              {duplicates.length > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  {duplicates.length} emails en doublon (seront mis à jour)
                </span>
              )}
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((lead, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{lead.entreprise}</TableCell>
                      <TableCell>
                        {lead.prenom ? `${lead.prenom} ${lead.nom}` : lead.nom}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                      <TableCell>{lead.telephone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.sourceLead}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalLeads > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                ... et {totalLeads - 5} autres leads
              </p>
            )}

            {/* Progress during import */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Import en cours... {progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Import Summary */}
        {step === 3 && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{summary.created}</p>
                <p className="text-sm text-green-700">Créés</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{summary.updated}</p>
                <p className="text-sm text-blue-700">Mis à jour</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
                <p className="text-sm text-red-700">Erreurs</p>
              </div>
            </div>

            {summary.errors > 0 && (
              <div className="border rounded-lg p-4 bg-red-50">
                <p className="font-medium text-red-800 mb-2">Détail des erreurs:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {summary.results
                    .filter((r) => !r.success)
                    .slice(0, 5)
                    .map((r, i) => (
                      <li key={i}>
                        {r.lead.email}: {r.message}
                      </li>
                    ))}
                  {summary.errors > 5 && (
                    <li>... et {summary.errors - 5} autres erreurs</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && !summary && (
            <Button type="button" variant="outline" onClick={goBack} disabled={isImporting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          )}

          {step === 2 && (
            <Button onClick={handleNext} disabled={!isMappingValid()}>
              Aperçu
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {step === 3 && !summary && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  Importer {totalLeads} leads
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}

          {summary && (
            <Button onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
