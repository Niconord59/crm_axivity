"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceSelector } from "./ServiceSelector";
import type { LigneDevis, CatalogueService } from "@/types";

interface QuoteLineRowProps {
  ligne: LigneDevis;
  onUpdate: (data: Partial<LigneDevis>) => void;
  onDelete: () => void;
  isNew?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function QuoteLineRow({
  ligne,
  onUpdate,
  onDelete,
  isNew = false,
}: QuoteLineRowProps) {
  const [localQuantite, setLocalQuantite] = useState(String(ligne.quantite));
  const [localPrix, setLocalPrix] = useState(String(ligne.prixUnitaire));
  const [localRemise, setLocalRemise] = useState(String(ligne.remisePourcent));
  const [localDescription, setLocalDescription] = useState(ligne.description || "");

  // Sync local state with props
  useEffect(() => {
    setLocalQuantite(String(ligne.quantite));
    setLocalPrix(String(ligne.prixUnitaire));
    setLocalRemise(String(ligne.remisePourcent));
    setLocalDescription(ligne.description || "");
  }, [ligne.quantite, ligne.prixUnitaire, ligne.remisePourcent, ligne.description]);

  // Calculate line total
  const quantite = parseFloat(localQuantite) || 0;
  const prixUnitaire = parseFloat(localPrix) || 0;
  const remisePourcent = parseFloat(localRemise) || 0;
  const montantHT = quantite * prixUnitaire * (1 - remisePourcent / 100);

  const handleServiceSelect = (service: CatalogueService | null) => {
    if (service) {
      onUpdate({
        serviceId: service.id,
        description: service.nom,
        prixUnitaire: service.prixUnitaire,
        serviceNom: service.nom,
        serviceCategorie: service.categorie,
      });
      setLocalDescription(service.nom);
      setLocalPrix(String(service.prixUnitaire));
    } else {
      onUpdate({
        serviceId: undefined,
        serviceNom: undefined,
        serviceCategorie: undefined,
      });
    }
  };

  const handleBlur = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;

    switch (field) {
      case "quantite":
        if (numValue !== ligne.quantite) {
          onUpdate({ quantite: numValue });
        }
        break;
      case "prixUnitaire":
        if (numValue !== ligne.prixUnitaire) {
          onUpdate({ prixUnitaire: numValue });
        }
        break;
      case "remisePourcent":
        if (numValue !== ligne.remisePourcent) {
          onUpdate({ remisePourcent: Math.min(100, Math.max(0, numValue)) });
        }
        break;
      case "description":
        if (value !== ligne.description) {
          onUpdate({ description: value });
        }
        break;
    }
  };

  return (
    <tr className="group hover:bg-muted/50">
      {/* Service/Description */}
      <td className="p-2">
        <div className="space-y-2">
          <ServiceSelector
            value={ligne.serviceId}
            onSelect={handleServiceSelect}
            placeholder="Sélectionner..."
          />
          <Input
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={() => handleBlur("description", localDescription)}
            placeholder="Description..."
            className="text-sm"
          />
        </div>
      </td>

      {/* Quantité */}
      <td className="p-2 w-20">
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={localQuantite}
          onChange={(e) => setLocalQuantite(e.target.value)}
          onBlur={() => handleBlur("quantite", localQuantite)}
          className="text-center"
        />
      </td>

      {/* Prix unitaire */}
      <td className="p-2 w-28">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={localPrix}
          onChange={(e) => setLocalPrix(e.target.value)}
          onBlur={() => handleBlur("prixUnitaire", localPrix)}
          className="text-right"
        />
      </td>

      {/* Remise */}
      <td className="p-2 w-20">
        <Input
          type="number"
          min="0"
          max="100"
          step="1"
          value={localRemise}
          onChange={(e) => setLocalRemise(e.target.value)}
          onBlur={() => handleBlur("remisePourcent", localRemise)}
          className="text-center"
        />
      </td>

      {/* Total HT */}
      <td className="p-2 w-28 text-right font-medium">
        {formatCurrency(montantHT)}
      </td>

      {/* Actions */}
      <td className="p-2 w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
