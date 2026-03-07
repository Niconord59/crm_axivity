"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useScanBusinessCard } from "@/hooks/use-scan-business-card";
import { ProspectForm } from "./ProspectForm";
import type { ProspectFormData } from "@/lib/schemas/prospect";

/**
 * Mobile-only button that opens the camera to scan a business card,
 * then opens ProspectForm pre-filled with extracted data.
 * Hidden on screens >= 640px (sm breakpoint).
 */
export function BusinessCardScannerButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [scannedData, setScannedData] = useState<
    Partial<ProspectFormData> | undefined
  >(undefined);

  const scanMutation = useScanBusinessCard();

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = "";

    toast.loading("Analyse de la carte de visite...", { id: "ocr-scan" });

    try {
      const data = await scanMutation.mutateAsync(file);
      toast.success("Carte analysée avec succès", { id: "ocr-scan" });
      setScannedData(data);
      setFormOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'analyse",
        { id: "ocr-scan" }
      );
    }
  };

  return (
    <>
      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mobile-only scan button */}
      <Button
        variant="outline"
        size="sm"
        className="sm:hidden"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanMutation.isPending}
      >
        {scanMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Camera className="h-4 w-4 mr-2" />
        )}
        Scanner
      </Button>

      {/* ProspectForm in controlled mode with scanned data */}
      <ProspectForm
        defaultValues={scannedData}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setScannedData(undefined);
          }
        }}
      />
    </>
  );
}
