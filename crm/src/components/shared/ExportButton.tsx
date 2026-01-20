"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/lib/hooks/use-toast";
import {
  exportToCSV,
  exportToExcel,
  type ExportColumn,
} from "@/lib/export";

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ExportColumn<any>[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButton({
  data,
  columns,
  filename,
  sheetName = "Données",
  disabled = false,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "csv" | "excel") => {
    if (data.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a aucune donnée à exporter.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}_${dateStr}`;

      if (format === "csv") {
        exportToCSV(data, fullFilename, columns);
      } else {
        await exportToExcel(data, fullFilename, columns, sheetName);
      }

      toast({
        title: "Export réussi",
        description: `${data.length} enregistrement(s) exporté(s) en ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting || data.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
