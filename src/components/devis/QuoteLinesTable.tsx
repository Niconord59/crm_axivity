"use client";

import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuoteLineRow } from "./QuoteLineRow";
import type { LigneDevis } from "@/types";

interface QuoteLinesTableProps {
  lignes: LigneDevis[];
  onUpdateLine: (id: string, data: Partial<LigneDevis>) => void;
  onDeleteLine: (id: string) => void;
  onAddLine: () => void;
  isLoading?: boolean;
}

export function QuoteLinesTable({
  lignes,
  onUpdateLine,
  onDeleteLine,
  onAddLine,
  isLoading = false,
}: QuoteLinesTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Service / Description</TableHead>
              <TableHead className="w-20 text-center">Qté</TableHead>
              <TableHead className="w-28 text-right">Prix unit.</TableHead>
              <TableHead className="w-20 text-center">Rem. %</TableHead>
              <TableHead className="w-28 text-right">Total HT</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.length === 0 ? (
              <TableRow>
                <td colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>Aucune ligne de devis</p>
                    <p className="text-sm">
                      Cliquez sur le bouton ci-dessous pour ajouter une ligne
                    </p>
                  </div>
                </td>
              </TableRow>
            ) : (
              lignes.map((ligne) => (
                <QuoteLineRow
                  key={ligne.id}
                  ligne={ligne}
                  onUpdate={(data) => onUpdateLine(ligne.id, data)}
                  onDelete={() => onDeleteLine(ligne.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button
        variant="outline"
        onClick={onAddLine}
        disabled={isLoading}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une ligne
      </Button>
    </div>
  );
}
