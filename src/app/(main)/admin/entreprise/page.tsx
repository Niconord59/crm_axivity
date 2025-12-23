"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  useCompanySettings,
  useUpdateCompanySettings,
  useUploadCompanyAsset,
  useDeleteCompanyAsset,
  type CompanySettingsUpdate,
} from "@/hooks/use-company-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Building2,
  Save,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  FileImage,
} from "lucide-react";
import Image from "next/image";

export default function AdminEntreprisePage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: settings, isLoading: settingsLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const uploadAsset = useUploadCompanyAsset();
  const deleteAsset = useDeleteCompanyAsset();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CompanySettingsUpdate>({
    nom: "",
    forme_juridique: "",
    capital: "",
    siret: "",
    rcs: "",
    tva_intracommunautaire: "",
    adresse: "",
    code_postal: "",
    ville: "",
    pays: "France",
    telephone: "",
    email: "",
    site_web: "",
    couleur_principale: "#2563eb",
    conditions_paiement_defaut: "Paiement à 30 jours date de facture.",
    validite_devis_jours: 30,
    taux_tva_defaut: 20,
  });

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setForm({
        nom: settings.nom || "",
        forme_juridique: settings.forme_juridique || "",
        capital: settings.capital || "",
        siret: settings.siret || "",
        rcs: settings.rcs || "",
        tva_intracommunautaire: settings.tva_intracommunautaire || "",
        adresse: settings.adresse || "",
        code_postal: settings.code_postal || "",
        ville: settings.ville || "",
        pays: settings.pays || "France",
        telephone: settings.telephone || "",
        email: settings.email || "",
        site_web: settings.site_web || "",
        couleur_principale: settings.couleur_principale || "#2563eb",
        conditions_paiement_defaut:
          settings.conditions_paiement_defaut ||
          "Paiement à 30 jours date de facture.",
        validite_devis_jours: settings.validite_devis_jours || 30,
        taux_tva_defaut: settings.taux_tva_defaut || 20,
      });
    }
  }, [settings]);

  // Check admin access
  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await updateSettings.mutateAsync(form);
      setSuccess("Paramètres enregistrés avec succès");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "header_devis"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    try {
      await uploadAsset.mutateAsync({ file, type });
      setSuccess(
        type === "logo" ? "Logo importé avec succès" : "En-tête de devis importé avec succès"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import");
    }

    // Reset input
    e.target.value = "";
  };

  const handleDeleteAsset = async (type: "logo" | "header_devis") => {
    try {
      await deleteAsset.mutateAsync(type);
      setSuccess(
        type === "logo" ? "Logo supprimé" : "En-tête de devis supprimé"
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Mon entreprise
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurez les informations de votre société pour les devis et
          factures
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Identité de l&apos;entreprise</CardTitle>
            <CardDescription>
              Informations légales de votre société
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l&apos;entreprise *</Label>
                <Input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Mon Entreprise"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forme_juridique">Forme juridique</Label>
                <Input
                  id="forme_juridique"
                  value={form.forme_juridique || ""}
                  onChange={(e) =>
                    setForm({ ...form, forme_juridique: e.target.value })
                  }
                  placeholder="SAS, SARL, EURL..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={form.siret || ""}
                  onChange={(e) => setForm({ ...form, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rcs">RCS</Label>
                <Input
                  id="rcs"
                  value={form.rcs || ""}
                  onChange={(e) => setForm({ ...form, rcs: e.target.value })}
                  placeholder="RCS Paris 123 456 789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital">Capital social</Label>
                <Input
                  id="capital"
                  value={form.capital || ""}
                  onChange={(e) => setForm({ ...form, capital: e.target.value })}
                  placeholder="10 000 €"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tva_intracommunautaire">
                N° TVA Intracommunautaire
              </Label>
              <Input
                id="tva_intracommunautaire"
                value={form.tva_intracommunautaire || ""}
                onChange={(e) =>
                  setForm({ ...form, tva_intracommunautaire: e.target.value })
                }
                placeholder="FR12345678900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
            <CardDescription>Siège social de l&apos;entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={form.adresse || ""}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                placeholder="123 Avenue de l'Innovation"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code_postal">Code postal</Label>
                <Input
                  id="code_postal"
                  value={form.code_postal || ""}
                  onChange={(e) =>
                    setForm({ ...form, code_postal: e.target.value })
                  }
                  placeholder="75001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={form.ville || ""}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input
                  id="pays"
                  value={form.pays || ""}
                  onChange={(e) => setForm({ ...form, pays: e.target.value })}
                  placeholder="France"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>
              Coordonnées affichées sur les devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={form.telephone || ""}
                  onChange={(e) =>
                    setForm({ ...form, telephone: e.target.value })
                  }
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_web">Site web</Label>
                <Input
                  id="site_web"
                  type="url"
                  value={form.site_web || ""}
                  onChange={(e) => setForm({ ...form, site_web: e.target.value })}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation</CardTitle>
            <CardDescription>
              Logo et en-tête pour vos documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo de l&apos;entreprise</Label>
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings?.logo_url ? (
                    <Image
                      src={settings.logo_url}
                      alt="Logo"
                      width={128}
                      height={128}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadAsset.isPending}
                  >
                    {uploadAsset.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Importer un logo
                  </Button>
                  {settings?.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAsset("logo")}
                      disabled={deleteAsset.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format: PNG, JPG. Taille max: 5 Mo
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Header devis */}
            <div className="space-y-3">
              <Label>En-tête des devis</Label>
              <p className="text-sm text-muted-foreground">
                Cette image sera affichée en haut de tous vos devis (format
                recommandé: 800x150px)
              </p>
              <div className="flex flex-col gap-4">
                <div className="w-full max-w-2xl h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings?.header_devis_url ? (
                    <Image
                      src={settings.header_devis_url}
                      alt="En-tête devis"
                      width={800}
                      height={150}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                      <FileImage className="h-10 w-10" />
                      <span className="text-sm">Aucun en-tête configuré</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "header_devis")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => headerInputRef.current?.click()}
                    disabled={uploadAsset.isPending}
                  >
                    {uploadAsset.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Importer un en-tête
                  </Button>
                  {settings?.header_devis_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAsset("header_devis")}
                      disabled={deleteAsset.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Primary color */}
            <div className="space-y-2">
              <Label htmlFor="couleur_principale">Couleur principale</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="couleur_principale"
                  type="color"
                  value={form.couleur_principale || "#2563eb"}
                  onChange={(e) =>
                    setForm({ ...form, couleur_principale: e.target.value })
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={form.couleur_principale || "#2563eb"}
                  onChange={(e) =>
                    setForm({ ...form, couleur_principale: e.target.value })
                  }
                  placeholder="#2563eb"
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  Utilisée pour les titres et accents sur les devis
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres des devis</CardTitle>
            <CardDescription>
              Valeurs par défaut pour la génération des devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validite_devis_jours">
                  Validité des devis (jours)
                </Label>
                <Input
                  id="validite_devis_jours"
                  type="number"
                  min={1}
                  max={365}
                  value={form.validite_devis_jours || 30}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      validite_devis_jours: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux_tva_defaut">Taux de TVA par défaut (%)</Label>
                <Input
                  id="taux_tva_defaut"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.taux_tva_defaut || 20}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      taux_tva_defaut: parseFloat(e.target.value) || 20,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions_paiement_defaut">
                Conditions de paiement par défaut
              </Label>
              <Textarea
                id="conditions_paiement_defaut"
                value={form.conditions_paiement_defaut || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    conditions_paiement_defaut: e.target.value,
                  })
                }
                placeholder="Paiement à 30 jours date de facture."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
