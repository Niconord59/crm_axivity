"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  useServices,
  useServiceCategories,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleServiceActive,
} from "@/hooks/use-services";
import type { CatalogueService } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  Package,
  Filter,
} from "lucide-react";

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Service form initial state
const initialFormState = {
  nom: "",
  description: "",
  prixUnitaire: 0,
  unite: "forfait",
  categorie: "",
  actif: true,
};

export default function AdminCataloguePage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Data
  const { data: services = [], isLoading: servicesLoading } = useServices({
    actifOnly: false,
  });
  const { data: categories = [] } = useServiceCategories();

  // Mutations
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const toggleActive = useToggleServiceActive();

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogueService | null>(
    null
  );
  const [form, setForm] = useState(initialFormState);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] =
    useState<CatalogueService | null>(null);

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

  // Filter services
  const filteredServices = services.filter((service) => {
    if (filterCategory !== "all" && service.categorie !== filterCategory) {
      return false;
    }
    if (!showInactive && !service.actif) {
      return false;
    }
    return true;
  });

  // Open dialog for new service
  const handleNewService = () => {
    setEditingService(null);
    setForm(initialFormState);
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEditService = (service: CatalogueService) => {
    setEditingService(service);
    setForm({
      nom: service.nom,
      description: service.description || "",
      prixUnitaire: service.prixUnitaire,
      unite: service.unite,
      categorie: service.categorie || "",
      actif: service.actif,
    });
    setDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingService) {
        // Update
        await updateService.mutateAsync({
          id: editingService.id,
          nom: form.nom,
          description: form.description || undefined,
          prixUnitaire: form.prixUnitaire,
          unite: form.unite,
          categorie: form.categorie || undefined,
          actif: form.actif,
        });
        setSuccess("Service modifié avec succès");
      } else {
        // Create
        await createService.mutateAsync({
          nom: form.nom,
          description: form.description || undefined,
          prixUnitaire: form.prixUnitaire,
          unite: form.unite,
          categorie: form.categorie || undefined,
          actif: form.actif,
        });
        setSuccess("Service créé avec succès");
      }
      setDialogOpen(false);
      setEditingService(null);
      setForm(initialFormState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'opération");
    }
  };

  // Handle delete
  const handleDeleteClick = (service: CatalogueService) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService.mutateAsync(serviceToDelete.id);
      setSuccess("Service supprimé avec succès");
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  // Handle toggle active
  const handleToggleActive = async (service: CatalogueService) => {
    try {
      await toggleActive.mutateAsync({ id: service.id, actif: !service.actif });
      setSuccess(
        service.actif ? "Service désactivé" : "Service activé"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement");
    }
  };

  if (authLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Catalogue de services
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les services disponibles pour vos devis
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewService}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Modifier le service" : "Nouveau service"}
                </DialogTitle>
                <DialogDescription>
                  {editingService
                    ? "Modifiez les informations du service"
                    : "Ajoutez un nouveau service au catalogue"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du service *</Label>
                  <Input
                    id="nom"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Développement d'agent IA"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Description détaillée du service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prixUnitaire">Prix unitaire (€) *</Label>
                    <Input
                      id="prixUnitaire"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.prixUnitaire}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          prixUnitaire: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unite">Unité</Label>
                    <Select
                      value={form.unite}
                      onValueChange={(value) =>
                        setForm({ ...form, unite: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="jour">Jour</SelectItem>
                        <SelectItem value="heure">Heure</SelectItem>
                        <SelectItem value="mois">Mois</SelectItem>
                        <SelectItem value="unité">Unité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select
                    value={categories.includes(form.categorie) ? form.categorie : "__new__"}
                    onValueChange={(value) =>
                      setForm({ ...form, categorie: value === "__new__" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">+ Nouvelle catégorie...</SelectItem>
                    </SelectContent>
                  </Select>
                  {!categories.includes(form.categorie) && (
                    <Input
                      id="new-categorie"
                      value={form.categorie}
                      onChange={(e) =>
                        setForm({ ...form, categorie: e.target.value })
                      }
                      placeholder="Nom de la nouvelle catégorie"
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="actif"
                    checked={form.actif}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, actif: checked })
                    }
                  />
                  <Label htmlFor="actif">Service actif</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createService.isPending || updateService.isPending
                  }
                >
                  {createService.isPending || updateService.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : editingService ? (
                    "Modifier"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-category" className="text-sm">
                Catégorie:
              </Label>
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Afficher les inactifs
              </Label>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredServices.length} service
              {filteredServices.length > 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({services.length})</CardTitle>
          <CardDescription>
            Liste de tous les services du catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun service trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow
                    key={service.id}
                    className={!service.actif ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.nom}</div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.categorie ? (
                        <Badge variant="outline">{service.categorie}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(service.prixUnitaire)}
                    </TableCell>
                    <TableCell className="capitalize">{service.unite}</TableCell>
                    <TableCell>
                      <Switch
                        checked={service.actif}
                        onCheckedChange={() => handleToggleActive(service)}
                        disabled={toggleActive.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(service)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le service &quot;
              {serviceToDelete?.nom}&quot; ? Cette action est irréversible.
              <br />
              <br />
              <strong>Attention :</strong> Si ce service est utilisé dans des
              devis existants, il sera dissocié de ces lignes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
