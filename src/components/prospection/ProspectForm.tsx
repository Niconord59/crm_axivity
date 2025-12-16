"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserPlus, Building2, User, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  prospectSchema,
  type ProspectFormData,
  prospectDefaultValues,
  PROSPECT_SOURCES,
} from "@/lib/schemas/prospect";
import { useCreateProspect } from "@/hooks/use-prospects";
import { useClients } from "@/hooks/use-clients";

interface ProspectFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ProspectForm({ trigger, onSuccess }: ProspectFormProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("entreprise");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const createProspect = useCreateProspect();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  const form = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: prospectDefaultValues,
  });

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clients || !searchValue) return clients || [];
    const search = searchValue.toLowerCase();
    return clients.filter((client) =>
      client.nom.toLowerCase().includes(search)
    );
  }, [clients, searchValue]);

  // Check if search matches an existing client exactly
  const exactMatch = useMemo(() => {
    if (!clients || !searchValue) return null;
    return clients.find(
      (client) => client.nom.toLowerCase() === searchValue.toLowerCase()
    );
  }, [clients, searchValue]);

  const handleSelectClient = (client: { id: string; nom: string }) => {
    form.setValue("clientId", client.id);
    form.setValue("entreprise", client.nom);
    setSearchValue(client.nom);
    setComboboxOpen(false);
  };

  const handleCreateNewClient = () => {
    form.setValue("clientId", undefined);
    form.setValue("entreprise", searchValue);
    setComboboxOpen(false);
  };

  const handleSubmit = async (data: ProspectFormData) => {
    try {
      await createProspect.mutateAsync({
        // Entreprise
        entreprise: data.entreprise,
        clientId: data.clientId,
        secteurActivite: data.secteurActivite || undefined,
        siteWeb: data.siteWeb || undefined,
        telephoneEntreprise: data.telephoneEntreprise || undefined,
        // Contact
        nom: data.nom,
        prenom: data.prenom || undefined,
        email: data.email || undefined,
        telephone: data.telephone || undefined,
        role: data.role || undefined,
        sourceLead: data.sourceLead,
        notesProspection: data.notesProspection || undefined,
      });

      toast.success("Lead créé avec succès", {
        description: `${data.prenom ? data.prenom + " " : ""}${data.nom} - ${data.entreprise}`,
      });

      form.reset();
      setSearchValue("");
      setActiveTab("entreprise");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors de la création du lead");
      console.error(error);
    }
  };

  const handleClose = () => {
    form.reset();
    setSearchValue("");
    setActiveTab("entreprise");
    setOpen(false);
  };

  // Check if we can proceed to contact tab
  const entrepriseValid = form.watch("entreprise")?.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau lead
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nouveau lead
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau lead rapidement. Seuls le nom de l'entreprise, le nom du contact et un moyen de contact sont requis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entreprise" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Entreprise
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="flex items-center gap-2"
                disabled={!entrepriseValid}
              >
                <User className="h-4 w-4" />
                Contact
              </TabsTrigger>
            </TabsList>

            {/* ONGLET ENTREPRISE */}
            <TabsContent value="entreprise" className="space-y-4 mt-4">
              {/* Recherche / Création entreprise */}
              <div className="space-y-2">
                <Label>Entreprise *</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      {form.watch("entreprise") || "Rechercher ou créer une entreprise..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Rechercher une entreprise..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        {isLoadingClients ? (
                          <CommandEmpty>Chargement...</CommandEmpty>
                        ) : (
                          <>
                            {filteredClients.length === 0 && !searchValue && (
                              <CommandEmpty>Aucune entreprise trouvée</CommandEmpty>
                            )}

                            {filteredClients.length > 0 && (
                              <CommandGroup heading="Entreprises existantes">
                                {filteredClients.slice(0, 10).map((client) => (
                                  <CommandItem
                                    key={client.id}
                                    value={client.nom}
                                    onSelect={() => handleSelectClient(client)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        form.watch("clientId") === client.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {client.nom}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}

                            {searchValue && !exactMatch && (
                              <>
                                {filteredClients.length > 0 && <CommandSeparator />}
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={handleCreateNewClient}
                                    className="text-primary"
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Créer "{searchValue}"
                                  </CommandItem>
                                </CommandGroup>
                              </>
                            )}
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.entreprise && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.entreprise.message}
                  </p>
                )}
              </div>

              {/* Informations complémentaires */}
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Informations complémentaires (optionnel)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secteurActivite">Secteur d'activité</Label>
                    <Input
                      id="secteurActivite"
                      placeholder="Ex: Tech, Santé..."
                      {...form.register("secteurActivite")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteWeb">Site web</Label>
                    <Input
                      id="siteWeb"
                      placeholder="https://..."
                      {...form.register("siteWeb")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephoneEntreprise">Téléphone entreprise</Label>
                  <Input
                    id="telephoneEntreprise"
                    type="tel"
                    placeholder="+33 1 00 00 00 00"
                    {...form.register("telephoneEntreprise")}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  disabled={!entrepriseValid}
                >
                  Suivant
                </Button>
              </div>
            </TabsContent>

            {/* ONGLET CONTACT */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              {/* Nom du contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    placeholder="Prénom"
                    {...form.register("prenom")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    placeholder="Nom"
                    {...form.register("nom")}
                  />
                  {form.formState.errors.nom && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nom.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email & Téléphone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+33 6 00 00 00 00"
                    {...form.register("telephone")}
                  />
                  {form.formState.errors.telephone && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.telephone.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Au moins un moyen de contact requis (email ou téléphone)
              </p>

              {/* Rôle & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Poste</Label>
                  <Input
                    id="role"
                    placeholder="Directeur, CEO..."
                    {...form.register("role")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceLead">Source *</Label>
                  <Select
                    value={form.watch("sourceLead")}
                    onValueChange={(value) => form.setValue("sourceLead", value as ProspectFormData["sourceLead"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROSPECT_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.sourceLead && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.sourceLead.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notesProspection">Notes</Label>
                <Textarea
                  id="notesProspection"
                  placeholder="Contexte de l'appel, besoins exprimés..."
                  {...form.register("notesProspection")}
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("entreprise")}>
                  Retour
                </Button>
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createProspect.isPending}>
                  {createProspect.isPending ? "Création..." : "Créer le lead"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
