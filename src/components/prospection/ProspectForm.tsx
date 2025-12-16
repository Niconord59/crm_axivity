"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  UserPlus,
  Building2,
  User,
  Check,
  ChevronsUpDown,
  PlusCircle,
  Phone,
  CalendarIcon,
  Clock,
  CheckCircle2,
} from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useCreateProspect, useUpdateProspectStatus, type Prospect } from "@/hooks/use-prospects";
import { useClients } from "@/hooks/use-clients";
import { useCreateInteraction } from "@/hooks/use-interactions";
import { AgendaTab } from "./agenda";

interface ProspectFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// Options de résultat pour appel entrant
const CALL_RESULTS = [
  { value: "Appelé - pas répondu", label: "Pas répondu", description: "Le contact n'a pas décroché" },
  { value: "Rappeler", label: "Rappeler", description: "Planifier un rappel" },
  { value: "RDV planifié", label: "RDV planifié", description: "Un rendez-vous a été programmé" },
  { value: "Qualifié", label: "Qualifié", description: "Le lead est qualifié" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas" },
  { value: "Perdu", label: "Perdu", description: "Le lead n'est plus intéressé" },
] as const;

type CallResult = typeof CALL_RESULTS[number]["value"];

export function ProspectForm({ trigger, onSuccess }: ProspectFormProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("entreprise");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // État pour le prospect créé (permet d'accéder à l'onglet Résultat)
  const [createdProspect, setCreatedProspect] = useState<{
    id: string;
    clientId: string;
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    entreprise: string;
  } | null>(null);

  // États pour le formulaire de résultat d'appel
  const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
  const [dateRappel, setDateRappel] = useState<Date | undefined>(undefined);
  const [notesAppel, setNotesAppel] = useState("");
  const [creerInteraction, setCreerInteraction] = useState(true);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  const createProspect = useCreateProspect();
  const updateStatus = useUpdateProspectStatus();
  const createInteraction = useCreateInteraction();
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

  const handleSelectClient = (client: {
    id: string;
    nom: string;
    secteurActivite?: string;
    siteWeb?: string;
    telephone?: string;
  }) => {
    form.setValue("clientId", client.id);
    form.setValue("entreprise", client.nom);
    // Pré-remplir les champs entreprise avec les données existantes
    if (client.secteurActivite) {
      form.setValue("secteurActivite", client.secteurActivite);
    }
    if (client.siteWeb) {
      form.setValue("siteWeb", client.siteWeb);
    }
    if (client.telephone) {
      form.setValue("telephoneEntreprise", client.telephone);
    }
    setSearchValue(client.nom);
    setComboboxOpen(false);
  };

  const handleCreateNewClient = () => {
    form.setValue("clientId", undefined);
    form.setValue("entreprise", searchValue);
    // Réinitialiser les champs entreprise pour une nouvelle entreprise
    form.setValue("secteurActivite", "");
    form.setValue("siteWeb", "");
    form.setValue("telephoneEntreprise", "");
    setComboboxOpen(false);
  };

  const handleSubmit = async (data: ProspectFormData) => {
    try {
      const result = await createProspect.mutateAsync({
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

      // Stocker les infos du prospect créé pour l'onglet Résultat
      setCreatedProspect({
        id: result.id,
        clientId: data.clientId || result.client?.[0] || "",
        nom: data.nom,
        prenom: data.prenom || undefined,
        email: data.email || undefined,
        telephone: data.telephone || undefined,
        entreprise: data.entreprise,
      });

      // Passer à l'onglet Résultat
      setActiveTab("resultat");

      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors de la création du lead");
      console.error(error);
    }
  };

  // Soumettre le résultat de l'appel
  const handleSubmitResult = async () => {
    if (!createdProspect || !selectedResult) return;

    setIsSubmittingResult(true);
    try {
      // 1. Mettre à jour le statut du prospect
      await updateStatus.mutateAsync({
        id: createdProspect.id,
        statut: selectedResult,
        dateRappel: selectedResult === "Rappeler" && dateRappel
          ? dateRappel.toISOString()
          : undefined,
        notes: notesAppel
          ? `[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${notesAppel}`
          : undefined,
      });

      // 2. Créer l'interaction si demandé
      if (creerInteraction && createdProspect.clientId) {
        const now = format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
        let interactionResume: string;

        if (selectedResult === "Appelé - pas répondu") {
          interactionResume = `Appel entrant le ${now} - pas de réponse`;
        } else if (selectedResult === "RDV planifié") {
          interactionResume = "RDV planifié - voir Google Calendar pour les détails";
        } else {
          interactionResume = notesAppel || `Appel entrant - Résultat: ${selectedResult}`;
        }

        await createInteraction.mutateAsync({
          objet: `Appel entrant - ${selectedResult}`,
          type: "Appel",
          date: new Date().toISOString(),
          resume: interactionResume,
          contact: [createdProspect.id],
          client: [createdProspect.clientId],
        });
      }

      toast.success("Résultat enregistré", {
        description: `Statut: ${selectedResult}`,
      });

      // Fermer et réinitialiser
      handleClose();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du résultat");
      console.error(error);
    } finally {
      setIsSubmittingResult(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSearchValue("");
    setActiveTab("entreprise");
    // Réinitialiser les états du résultat d'appel
    setCreatedProspect(null);
    setSelectedResult(null);
    setDateRappel(undefined);
    setNotesAppel("");
    setCreerInteraction(true);
    setOpen(false);
  };

  // Fermer sans enregistrer le résultat (skip)
  const handleSkipResult = () => {
    toast.info("Lead créé", {
      description: "Le résultat de l'appel n'a pas été enregistré",
    });
    handleClose();
  };

  // Variables conditionnelles pour l'UI
  const showDatePicker = selectedResult === "Rappeler";
  const showNotes = selectedResult && selectedResult !== "RDV planifié";
  const showInteractionCheckbox = selectedResult && selectedResult !== "RDV planifié";

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

      <DialogContent
        className="sm:max-w-[550px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
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
            <TabsList className="grid w-full grid-cols-3">
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
              <TabsTrigger
                value="resultat"
                className="flex items-center gap-2"
                disabled={!createdProspect}
              >
                {createdProspect ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Résultat
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
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createProspect.isPending}>
                  {createProspect.isPending ? "Création..." : "Créer le lead"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ONGLET RÉSULTAT */}
            <TabsContent value="resultat" className="mt-4">
              {createdProspect && (
                <Tabs defaultValue="call" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="call">Résultat</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                  </TabsList>

                  {/* Sous-onglet Résultat */}
                  <TabsContent value="call" className="mt-4">
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-6">
                        {/* Confirmation du lead créé */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                          <div>
                            <p className="font-medium text-green-800">
                              Lead créé : {createdProspect.prenom ? `${createdProspect.prenom} ` : ""}{createdProspect.nom}
                            </p>
                            <p className="text-sm text-green-600">{createdProspect.entreprise}</p>
                          </div>
                        </div>

                        {/* Sélection du résultat */}
                        <div className="space-y-3">
                          <Label>Résultat de l&apos;appel</Label>
                          <RadioGroup
                            value={selectedResult ?? ""}
                            onValueChange={(value) => setSelectedResult(value as CallResult)}
                            className="space-y-2"
                          >
                            {CALL_RESULTS.map((result) => (
                              <label
                                key={result.value}
                                htmlFor={`result-${result.value}`}
                                className={cn(
                                  "flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                  selectedResult === result.value
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <RadioGroupItem value={result.value} id={`result-${result.value}`} className="mt-0.5" />
                                <div className="flex-1">
                                  <span className="font-medium">{result.label}</span>
                                  <p className="text-sm text-muted-foreground">{result.description}</p>
                                </div>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        {/* Date de rappel */}
                        {showDatePicker && (
                          <div className="space-y-2">
                            <Label>Date et heure de rappel *</Label>
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "flex-1 justify-start text-left font-normal",
                                      !dateRappel && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRappel
                                      ? format(dateRappel, "PPP", { locale: fr })
                                      : "Sélectionner une date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={dateRappel}
                                    onSelect={(date) => {
                                      if (date) {
                                        // Préserver l'heure existante ou défaut 9h
                                        if (dateRappel) {
                                          date.setHours(dateRappel.getHours(), dateRappel.getMinutes(), 0, 0);
                                        } else {
                                          date.setHours(9, 0, 0, 0);
                                        }
                                      }
                                      setDateRappel(date);
                                    }}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>

                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <input
                                  type="time"
                                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                                  value={dateRappel ? format(dateRappel, "HH:mm") : "09:00"}
                                  onChange={(e) => {
                                    if (dateRappel) {
                                      const newDate = new Date(dateRappel);
                                      const [hours, minutes] = e.target.value.split(":").map(Number);
                                      newDate.setHours(hours, minutes, 0, 0);
                                      setDateRappel(newDate);
                                    }
                                  }}
                                  disabled={!dateRappel}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {showNotes && (
                          <div className="space-y-2">
                            <Label htmlFor="notesAppel">Notes de l&apos;appel</Label>
                            <Textarea
                              id="notesAppel"
                              placeholder="Résumé de la conversation..."
                              value={notesAppel}
                              onChange={(e) => setNotesAppel(e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {/* Checkbox interaction */}
                        {showInteractionCheckbox && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="creerInteractionResult"
                              checked={creerInteraction}
                              onCheckedChange={(checked) => setCreerInteraction(checked as boolean)}
                            />
                            <Label htmlFor="creerInteractionResult" className="text-sm cursor-pointer">
                              Créer une interaction dans le CRM
                            </Label>
                          </div>
                        )}

                        {/* Info pour RDV planifié */}
                        {selectedResult === "RDV planifié" && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                              💡 Pour planifier le RDV, utilisez l&apos;onglet <strong>Agenda</strong> ci-dessus.
                              Les détails seront automatiquement enregistrés dans Google Calendar.
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    <DialogFooter className="pt-4 border-t mt-4">
                      <Button type="button" variant="ghost" onClick={handleSkipResult}>
                        Passer
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitResult}
                        disabled={!selectedResult || isSubmittingResult || (selectedResult === "Rappeler" && !dateRappel)}
                      >
                        {isSubmittingResult ? "Enregistrement..." : "Enregistrer le résultat"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  {/* Sous-onglet Agenda */}
                  <TabsContent value="agenda" className="mt-4">
                    <div className="h-[400px]">
                      <AgendaTab
                        prospect={{
                          id: createdProspect.id,
                          prenom: createdProspect.prenom,
                          nom: createdProspect.nom,
                          email: createdProspect.email,
                          telephone: createdProspect.telephone,
                          entreprise: createdProspect.entreprise,
                          clientId: createdProspect.clientId,
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
