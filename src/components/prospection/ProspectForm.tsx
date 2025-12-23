"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  UserPlus,
  Building2,
  User,
  Users,
  Phone,
  CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Mail,
  History,
  MessageSquare,
  Loader2,
  Linkedin,
  Handshake,
  MoreHorizontal,
  Zap,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import type { Contact, ProspectStatus } from "@/types";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  prospectSchema,
  type ProspectFormData,
  prospectDefaultValues,
  PROSPECT_SOURCES,
  FIRST_CONTACT_TYPES,
  INITIAL_STATUTS,
} from "@/lib/schemas/prospect";
import { useCreateProspect, useUpdateProspectStatus } from "@/hooks/use-prospects";
import { useClients } from "@/hooks/use-clients";
import { useCreateInteraction, useInteractions } from "@/hooks/use-interactions";
import { AgendaTab } from "./agenda";
import { CompanySearch } from "./CompanySearch";
import type { CompanyInfo } from "@/hooks/use-company-search";
import { useSearchGooglePlaces } from "@/hooks/use-google-places";

// Interface pour les contacts Supabase
interface ContactRecord {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  statut_prospection?: string;
  client_id?: string;
}

interface ProspectFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// Options de résultat pour appel entrant (pas de "Pas répondu" car c'est un appel entrant)
const CALL_RESULTS = [
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
  const [searchValue, setSearchValue] = useState("");

  // État pour les données validées du formulaire (avant création)
  const [validatedFormData, setValidatedFormData] = useState<ProspectFormData | null>(null);

  // État pour le lead créé (après création)
  const [createdProspect, setCreatedProspect] = useState<{
    id: string;
    clientId: string;
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    entreprise: string;
  } | null>(null);

  // Sous-onglet actif dans l'onglet Résultat
  const [resultSubTab, setResultSubTab] = useState<"call" | "agenda">("call");

  // Mode création directe (pour leads historiques)
  const [directCreationMode, setDirectCreationMode] = useState(false);

  // États pour le formulaire de résultat d'appel
  const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
  const [dateRappel, setDateRappel] = useState<Date | undefined>(undefined);
  const [notesAppel, setNotesAppel] = useState("");
  const [creerInteraction, setCreerInteraction] = useState(true);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  // Ref pour bloquer la fermeture du Dialog immédiatement (sans attendre le re-render)
  const keepDialogOpenRef = useRef(false);

  const createProspect = useCreateProspect();
  const updateProspectStatus = useUpdateProspectStatus();
  const createInteraction = useCreateInteraction();
  const searchGooglePlaces = useSearchGooglePlaces();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  // State for Google Places enrichment loading
  const [isEnrichingData, setIsEnrichingData] = useState(false);

  const form = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: prospectDefaultValues,
  });

  // Quand les données sont validées, passer automatiquement à l'onglet Résultat
  useEffect(() => {
    if (validatedFormData) {
      setActiveTab("resultat");
    }
  }, [validatedFormData]);

  // Récupérer l'ID et le nom du client sélectionné
  const selectedClientId = form.watch("clientId");
  const selectedClientName = form.watch("entreprise");

  // Fetch contacts existants pour le client sélectionné
  const { data: existingContacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["client-contacts", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select("id, nom, prenom, email, telephone, poste, statut_prospection")
        .eq("client_id", selectedClientId)
        .order("nom", { ascending: true });

      if (error) throw error;

      return (data || []).map((record: ContactRecord) => ({
        id: record.id,
        nom: record.prenom ? `${record.prenom} ${record.nom}` : record.nom,
        email: record.email,
        telephone: record.telephone,
        role: record.poste,
        statutProspection: record.statut_prospection as ProspectStatus | undefined,
      }));
    },
    enabled: !!selectedClientId,
  });

  // Déterminer si on a des contacts existants
  const hasExistingContacts = existingContacts && existingContacts.length > 0;

  // Fetch des interactions pour le client sélectionné (uniquement si contacts existants)
  const { data: clientInteractions, isLoading: isLoadingInteractions } = useInteractions({
    clientId: hasExistingContacts ? selectedClientId : undefined,
  });

  // Handler for selecting an existing client from CRM
  const handleSelectExistingClient = (client: {
    id: string;
    nom: string;
    secteurActivite?: string;
    siteWeb?: string;
    telephone?: string;
    siret?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
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
    // Billing info
    if (client.siret) {
      form.setValue("siret", client.siret);
    }
    if (client.adresse) {
      form.setValue("adresse", client.adresse);
    }
    if (client.codePostal) {
      form.setValue("codePostal", client.codePostal);
    }
    if (client.ville) {
      form.setValue("ville", client.ville);
    }
    setSearchValue(client.nom);
  };

  // Handler for selecting a company from government API
  const handleSelectApiCompany = async (company: CompanyInfo) => {
    form.setValue("clientId", undefined); // New company, not in CRM yet
    form.setValue("entreprise", company.nom);
    // Auto-fill billing info from API
    form.setValue("siret", company.siret || "");
    form.setValue("adresse", company.adresse || "");
    form.setValue("codePostal", company.codePostal || "");
    form.setValue("ville", company.ville || "");
    form.setValue("pays", "France");
    // Activity can go to sector
    if (company.activite) {
      form.setValue("secteurActivite", company.activite);
    }
    setSearchValue(company.nom);

    // Enrich with Google Places data (telephone + website)
    setIsEnrichingData(true);
    try {
      const placesResult = await searchGooglePlaces.mutateAsync({
        query: company.nom,
        city: company.ville,
      });

      if (placesResult) {
        if (placesResult.telephone) {
          form.setValue("telephoneEntreprise", placesResult.telephone);
        }
        if (placesResult.siteWeb) {
          form.setValue("siteWeb", placesResult.siteWeb);
        }
      }
    } catch (error) {
      // Silently fail - Google Places enrichment is optional
      console.warn("Could not enrich company data with Google Places:", error);
    } finally {
      setIsEnrichingData(false);
    }
  };

  // Handler for manual company creation
  const handleCreateManualCompany = (name: string) => {
    form.setValue("clientId", undefined);
    form.setValue("entreprise", name);
    // Reset billing fields for manual entry
    form.setValue("siret", "");
    form.setValue("adresse", "");
    form.setValue("codePostal", "");
    form.setValue("ville", "");
    form.setValue("pays", "France");
    form.setValue("secteurActivite", "");
    form.setValue("siteWeb", "");
    form.setValue("telephoneEntreprise", "");
    setSearchValue(name);
  };

  // Valider les données du formulaire et passer à l'onglet Résultat
  // Le lead sera créé uniquement quand l'utilisateur choisira le résultat de l'appel
  const handleSubmit = async (data: ProspectFormData) => {
    // Stocker les données validées pour les utiliser lors de la création
    // Le useEffect se charge de passer à l'onglet "resultat" automatiquement
    setValidatedFormData(data);
  };

  // Création directe du lead (pour leads historiques ou non-appels)
  const handleDirectCreation = async (data: ProspectFormData) => {
    if (!data.statutInitial) {
      toast.error("Veuillez sélectionner un statut initial");
      return;
    }

    setIsSubmittingResult(true);
    keepDialogOpenRef.current = true;

    try {
      // Construire les notes avec le contexte
      let notesFinales = data.notesProspection || "";
      const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
      const typeContactLabel = data.typeContact || "Contact";
      if (!notesFinales) {
        notesFinales = `[${timestamp}] Lead créé - Premier contact: ${typeContactLabel}`;
      }

      const result = await createProspect.mutateAsync({
        // Entreprise
        entreprise: data.entreprise,
        clientId: data.clientId,
        secteurActivite: data.secteurActivite || undefined,
        siteWeb: data.siteWeb || undefined,
        telephoneEntreprise: data.telephoneEntreprise || undefined,
        // Facturation
        siret: data.siret || undefined,
        adresse: data.adresse || undefined,
        codePostal: data.codePostal || undefined,
        ville: data.ville || undefined,
        pays: data.pays || undefined,
        // Contact
        nom: data.nom,
        prenom: data.prenom || undefined,
        email: data.email || undefined,
        telephone: data.telephone || undefined,
        role: data.role || undefined,
        sourceLead: data.sourceLead,
        notesProspection: notesFinales,
        // Statut initial choisi
        statutProspection: data.statutInitial,
      });

      // Créer une interaction si type de contact fourni
      if (data.typeContact && result.clientId) {
        const interactionType = data.typeContact === "Appel" ? "Appel"
          : data.typeContact === "Email" ? "Email"
          : data.typeContact === "Physique" ? "Réunion"
          : "Autre";

        await createInteraction.mutateAsync({
          objet: `Premier contact - ${data.typeContact}`,
          type: interactionType,
          date: new Date().toISOString(),
          resume: data.notesProspection || `Premier contact via ${data.typeContact}`,
          contact: [result.id],
          client: [result.clientId],
        });
      }

      toast.success("Lead créé avec succès", {
        description: `${data.prenom ? data.prenom + " " : ""}${data.nom} - Statut: ${data.statutInitial}`,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error("Erreur lors de la création du lead");
      console.error(error);
      keepDialogOpenRef.current = false;
    } finally {
      setIsSubmittingResult(false);
    }
  };

  // Créer le lead pour l'accès à l'Agenda (statut "RDV planifié" par défaut)
  const createLeadForAgenda = async () => {
    if (!validatedFormData || createdProspect) return;

    setIsSubmittingResult(true);
    keepDialogOpenRef.current = true;

    try {
      const result = await createProspect.mutateAsync({
        // Entreprise
        entreprise: validatedFormData.entreprise,
        clientId: validatedFormData.clientId,
        secteurActivite: validatedFormData.secteurActivite || undefined,
        siteWeb: validatedFormData.siteWeb || undefined,
        telephoneEntreprise: validatedFormData.telephoneEntreprise || undefined,
        // Facturation
        siret: validatedFormData.siret || undefined,
        adresse: validatedFormData.adresse || undefined,
        codePostal: validatedFormData.codePostal || undefined,
        ville: validatedFormData.ville || undefined,
        pays: validatedFormData.pays || undefined,
        // Contact
        nom: validatedFormData.nom,
        prenom: validatedFormData.prenom || undefined,
        email: validatedFormData.email || undefined,
        telephone: validatedFormData.telephone || undefined,
        role: validatedFormData.role || undefined,
        sourceLead: validatedFormData.sourceLead,
        notesProspection: validatedFormData.notesProspection || undefined,
        // Statut RDV planifié par défaut pour l'agenda
        statutProspection: "RDV planifié",
      });

      // Stocker le lead créé
      setCreatedProspect({
        id: result.id,
        clientId: result.clientId!,
        nom: validatedFormData.nom,
        prenom: validatedFormData.prenom,
        email: validatedFormData.email,
        telephone: validatedFormData.telephone,
        entreprise: validatedFormData.entreprise,
      });

      // Sélectionner automatiquement "RDV planifié" comme résultat
      setSelectedResult("RDV planifié");

      toast.success("Lead créé", {
        description: "Vous pouvez maintenant planifier le RDV",
      });
    } catch (error) {
      toast.error("Erreur lors de la création du lead");
      console.error(error);
      keepDialogOpenRef.current = false;
    } finally {
      setIsSubmittingResult(false);
    }
  };

  // Gérer le changement de sous-onglet dans Résultat
  const handleResultSubTabChange = async (value: string) => {
    if (value === "agenda" && !createdProspect && validatedFormData) {
      // Créer le lead avant d'accéder à l'agenda
      await createLeadForAgenda();
    }
    setResultSubTab(value as "call" | "agenda");
  };

  // Créer ou mettre à jour le lead avec le résultat de l'appel choisi
  const handleSubmitResult = async () => {
    if (!validatedFormData || !selectedResult) return;

    setIsSubmittingResult(true);
    keepDialogOpenRef.current = true;

    try {
      // Construire les notes avec le résultat de l'appel
      let notesFinales = validatedFormData.notesProspection || "";
      if (notesAppel) {
        const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
        notesFinales = notesFinales
          ? `${notesFinales}\n\n[${timestamp}] ${notesAppel}`
          : `[${timestamp}] ${notesAppel}`;
      }

      let leadId: string;
      let clientId: string;

      if (createdProspect) {
        // Le lead existe déjà (créé via Agenda), on met à jour le statut
        leadId = createdProspect.id;
        clientId = createdProspect.clientId;

        await updateProspectStatus.mutateAsync({
          id: leadId,
          statut: selectedResult,
          dateRappel: selectedResult === "Rappeler" && dateRappel
            ? dateRappel.toISOString()
            : undefined,
          notes: notesAppel || undefined,
        });
      } else {
        // Créer le lead avec le statut choisi directement
        const result = await createProspect.mutateAsync({
          // Entreprise
          entreprise: validatedFormData.entreprise,
          clientId: validatedFormData.clientId,
          secteurActivite: validatedFormData.secteurActivite || undefined,
          siteWeb: validatedFormData.siteWeb || undefined,
          telephoneEntreprise: validatedFormData.telephoneEntreprise || undefined,
          // Facturation
          siret: validatedFormData.siret || undefined,
          adresse: validatedFormData.adresse || undefined,
          codePostal: validatedFormData.codePostal || undefined,
          ville: validatedFormData.ville || undefined,
          pays: validatedFormData.pays || undefined,
          // Contact
          nom: validatedFormData.nom,
          prenom: validatedFormData.prenom || undefined,
          email: validatedFormData.email || undefined,
          telephone: validatedFormData.telephone || undefined,
          role: validatedFormData.role || undefined,
          sourceLead: validatedFormData.sourceLead,
          notesProspection: notesFinales || undefined,
          // Statut initial basé sur le résultat de l'appel
          statutProspection: selectedResult,
          dateRappel: selectedResult === "Rappeler" && dateRappel
            ? dateRappel.toISOString()
            : undefined,
        });

        leadId = result.id;
        clientId = result.clientId!;
      }

      // Créer l'interaction si demandé
      // - Pour un nouveau lead : toujours créer l'interaction
      // - Pour un lead existant (créé via Agenda) : créer seulement si notes fournies
      const shouldCreateInteraction = creerInteraction && clientId && (
        !createdProspect || // Nouveau lead
        (createdProspect && notesAppel) // Lead existant avec notes
      );

      if (shouldCreateInteraction) {
        let interactionResume: string;

        if (selectedResult === "RDV planifié") {
          interactionResume = notesAppel || "RDV planifié - voir Google Calendar pour les détails";
        } else {
          interactionResume = notesAppel || `Appel entrant - Résultat: ${selectedResult}`;
        }

        await createInteraction.mutateAsync({
          objet: `Appel entrant - ${selectedResult}`,
          type: "Appel",
          date: new Date().toISOString(),
          resume: interactionResume,
          contact: [leadId],
          client: [clientId],
        });
      }

      toast.success(createdProspect ? "Statut mis à jour" : "Lead créé avec succès", {
        description: `${validatedFormData.prenom ? validatedFormData.prenom + " " : ""}${validatedFormData.nom} - Statut: ${selectedResult}`,
      });

      onSuccess?.();

      // Fermer et réinitialiser
      handleClose();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
      keepDialogOpenRef.current = false;
    } finally {
      setIsSubmittingResult(false);
    }
  };

  const handleClose = () => {
    // Désactiver le blocage de fermeture
    keepDialogOpenRef.current = false;

    // Fermer le dialog
    setOpen(false);

    // Réinitialiser tous les états après la fermeture
    form.reset();
    setSearchValue("");
    setActiveTab("entreprise");
    setValidatedFormData(null);
    setCreatedProspect(null);
    setResultSubTab("call");
    setSelectedResult(null);
    setDateRappel(undefined);
    setNotesAppel("");
    setCreerInteraction(true);
    setDirectCreationMode(false);
  };

  // Fermer sans créer le lead (annuler)
  const handleSkipResult = () => {
    handleClose();
  };

  // Variables conditionnelles pour l'UI
  const showDatePicker = selectedResult === "Rappeler";
  const showNotes = selectedResult && selectedResult !== "RDV planifié";
  const showInteractionCheckbox = selectedResult && selectedResult !== "RDV planifié";

  // Check if we can proceed to contact tab
  const entrepriseValid = form.watch("entreprise")?.trim().length > 0;

  // Gérer l'ouverture/fermeture du Dialog
  // Empêcher la fermeture automatique quand on est sur l'onglet Résultat
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (keepDialogOpenRef.current || validatedFormData)) {
      // On est sur l'onglet Résultat, ne pas fermer le Dialog
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau lead
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
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
            <TabsList className={cn(
              "grid w-full",
              hasExistingContacts ? "grid-cols-4" : "grid-cols-3"
            )}>
              <TabsTrigger value="entreprise" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Building2 className="h-4 w-4 hidden sm:block" />
                Entreprise
              </TabsTrigger>
              {hasExistingContacts && (
                <TabsTrigger value="historique" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <History className="h-4 w-4 hidden sm:block" />
                  Historique
                </TabsTrigger>
              )}
              <TabsTrigger
                value="contact"
                className="flex items-center gap-1.5 text-xs sm:text-sm"
                disabled={!entrepriseValid}
              >
                <User className="h-4 w-4 hidden sm:block" />
                Contact
              </TabsTrigger>
              <TabsTrigger
                value="resultat"
                className="flex items-center gap-1.5 text-xs sm:text-sm"
                disabled={!validatedFormData}
              >
                {validatedFormData ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Phone className="h-4 w-4 hidden sm:block" />
                )}
                Résultat
              </TabsTrigger>
            </TabsList>

            {/* ONGLET ENTREPRISE */}
            <TabsContent value="entreprise" className="space-y-4 mt-4">
              {/* Recherche / Création entreprise avec autocomplétion API */}
              <div className="space-y-2">
                <Label>Entreprise *</Label>
                <CompanySearch
                  value={form.watch("entreprise") || ""}
                  selectedClientId={form.watch("clientId")}
                  clients={clients?.map(c => ({
                    id: c.id,
                    nom: c.nom,
                    secteurActivite: c.secteurActivite,
                    siteWeb: c.siteWeb,
                    telephone: c.telephone,
                    siret: c.siret,
                    adresse: c.adresse,
                    codePostal: c.codePostal,
                    ville: c.ville,
                  }))}
                  isLoadingClients={isLoadingClients}
                  onSelectExisting={handleSelectExistingClient}
                  onSelectNew={handleSelectApiCompany}
                  onCreateManual={handleCreateManualCompany}
                  error={form.formState.errors.entreprise?.message}
                />
              </div>

              {/* Informations complémentaires */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Informations complémentaires (optionnel)
                  </p>
                  {isEnrichingData && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Recherche Google Maps...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secteurActivite">Secteur d&apos;activité</Label>
                    <Input
                      id="secteurActivite"
                      placeholder="Ex: Tech, Santé..."
                      {...form.register("secteurActivite")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteWeb">Site web</Label>
                    <div className="relative">
                      <Input
                        id="siteWeb"
                        placeholder="https://..."
                        {...form.register("siteWeb")}
                        className={cn(isEnrichingData && "pr-8")}
                      />
                      {isEnrichingData && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephoneEntreprise">Téléphone entreprise</Label>
                  <div className="relative">
                    <Input
                      id="telephoneEntreprise"
                      type="tel"
                      placeholder="+33 1 00 00 00 00"
                      {...form.register("telephoneEntreprise")}
                      className={cn(isEnrichingData && "pr-8")}
                    />
                    {isEnrichingData && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Informations de facturation */}
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Informations de facturation (auto-remplies si sélection depuis l&apos;annuaire)
                </p>

                <div className="space-y-2">
                  <Label htmlFor="siret">N° SIRET</Label>
                  <Input
                    id="siret"
                    placeholder="12345678901234"
                    maxLength={14}
                    {...form.register("siret")}
                  />
                  {form.watch("siret") && (
                    <p className="text-xs text-muted-foreground">
                      {form.watch("siret")?.length || 0}/14 chiffres
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    placeholder="123 rue Example"
                    {...form.register("adresse")}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codePostal">Code postal</Label>
                    <Input
                      id="codePostal"
                      placeholder="75001"
                      {...form.register("codePostal")}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      placeholder="Paris"
                      {...form.register("ville")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    placeholder="France"
                    {...form.register("pays")}
                  />
                </div>
              </div>

              {/* Contacts existants pour le client sélectionné */}
              {selectedClientId && (
                <div className="space-y-3 pt-2">
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Contacts existants
                      {existingContacts && existingContacts.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {existingContacts.length}
                        </Badge>
                      )}
                    </span>
                  </div>

                  {isLoadingContacts ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : existingContacts && existingContacts.length > 0 ? (
                    <>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {existingContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="truncate">
                                <span className="font-medium">{contact.nom}</span>
                                {contact.role && (
                                  <span className="text-muted-foreground ml-1">
                                    ({contact.role})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {contact.email && (
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              {contact.telephone && (
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              {contact.statutProspection && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    contact.statutProspection === "Qualifié" && "border-green-500 text-green-600",
                                    contact.statutProspection === "RDV planifié" && "border-purple-500 text-purple-600",
                                    contact.statutProspection === "À appeler" && "border-blue-500 text-blue-600"
                                  )}
                                >
                                  {contact.statutProspection}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Warning pour éviter les doublons */}
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                          Vérifiez que votre contact n'existe pas déjà avant de le créer.
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun contact pour cette entreprise.
                    </p>
                  )}
                </div>
              )}

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

            {/* ONGLET HISTORIQUE (conditionnel) */}
            {hasExistingContacts && (
              <TabsContent value="historique" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {/* En-tête avec infos client */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {selectedClientName}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {existingContacts?.length} contact{existingContacts && existingContacts.length > 1 ? "s" : ""} • {clientInteractions?.length || 0} interaction{clientInteractions && clientInteractions.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Liste des interactions */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Historique des interactions
                      </h5>

                      {isLoadingInteractions ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Chargement...
                        </p>
                      ) : clientInteractions && clientInteractions.length > 0 ? (
                        <div className="space-y-2">
                          {clientInteractions.map((interaction) => (
                            <div
                              key={interaction.id}
                              className="p-3 border rounded-lg space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {interaction.objet}
                                </span>
                                {interaction.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {interaction.type}
                                  </Badge>
                                )}
                              </div>
                              {interaction.date && (
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(interaction.date), "PPP 'à' HH:mm", { locale: fr })}
                                </p>
                              )}
                              {interaction.resume && (
                                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                                  {interaction.resume}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune interaction enregistrée</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-end pt-4 border-t mt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    disabled={!entrepriseValid}
                  >
                    Créer un nouveau contact
                  </Button>
                </div>
              </TabsContent>
            )}

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
                  placeholder="Contexte du contact, besoins exprimés..."
                  {...form.register("notesProspection")}
                  rows={3}
                />
              </div>

              <Separator className="my-4" />

              {/* Section création directe (leads historiques) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Création directe</span>
                  </div>
                  <Checkbox
                    id="directCreationMode"
                    checked={directCreationMode}
                    onCheckedChange={(checked) => {
                      setDirectCreationMode(checked as boolean);
                      if (!checked) {
                        form.setValue("typeContact", undefined);
                        form.setValue("statutInitial", undefined);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pour les leads historiques ou premiers contacts non téléphoniques (email, LinkedIn, physique)
                </p>

                {directCreationMode && (
                  <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    {/* Type de premier contact */}
                    <div className="space-y-2">
                      <Label className="text-sm">Type de premier contact</Label>
                      <div className="flex flex-wrap gap-2">
                        {FIRST_CONTACT_TYPES.map((type) => {
                          const isSelected = form.watch("typeContact") === type;
                          const Icon = type === "Appel" ? Phone
                            : type === "Email" ? Mail
                            : type === "LinkedIn" ? Linkedin
                            : type === "Physique" ? Handshake
                            : MoreHorizontal;
                          return (
                            <Button
                              key={type}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => form.setValue("typeContact", type)}
                              className={cn(
                                "gap-1.5",
                                isSelected && "ring-2 ring-offset-1"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {type}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Statut initial */}
                    <div className="space-y-2">
                      <Label className="text-sm">Statut initial *</Label>
                      <Select
                        value={form.watch("statutInitial") || ""}
                        onValueChange={(value) => form.setValue("statutInitial", value as ProspectFormData["statutInitial"])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {INITIAL_STATUTS.map((statut) => (
                            <SelectItem key={statut} value={statut}>
                              {statut}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 sm:justify-between">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Annuler
                </Button>
                <div className="flex gap-2">
                  {directCreationMode ? (
                    <Button
                      type="button"
                      onClick={form.handleSubmit(handleDirectCreation)}
                      disabled={isSubmittingResult || !form.watch("statutInitial")}
                    >
                      {isSubmittingResult ? "Création..." : "Créer le lead"}
                    </Button>
                  ) : (
                    <Button type="submit">
                      Suivant
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </TabsContent>

            {/* ONGLET RÉSULTAT */}
            <TabsContent value="resultat" className="mt-4">
              {validatedFormData && (
                <Tabs value={resultSubTab} onValueChange={handleResultSubTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="call">Résultat</TabsTrigger>
                    <TabsTrigger value="agenda" disabled={isSubmittingResult}>
                      {isSubmittingResult && resultSubTab !== "agenda" ? "Création..." : "Agenda"}
                    </TabsTrigger>
                  </TabsList>

                  {/* Sous-onglet Résultat */}
                  <TabsContent value="call" className="mt-4">
                    <div className="space-y-4">
                      {/* Confirmation des données validées ou lead créé */}
                      <div className={cn(
                        "p-2.5 rounded-lg flex items-center gap-2",
                        createdProspect
                          ? "bg-green-50 border border-green-200"
                          : "bg-blue-50 border border-blue-200"
                      )}>
                        <CheckCircle2 className={cn(
                          "h-4 w-4 shrink-0",
                          createdProspect ? "text-green-600" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-sm font-medium",
                          createdProspect ? "text-green-800" : "text-blue-800"
                        )}>
                          {createdProspect ? "Lead créé : " : ""}
                          {validatedFormData.prenom ? `${validatedFormData.prenom} ` : ""}{validatedFormData.nom}
                          <span className={cn(
                            "font-normal ml-1",
                            createdProspect ? "text-green-600" : "text-blue-600"
                          )}>
                            ({validatedFormData.entreprise})
                          </span>
                        </p>
                      </div>

                      {/* Layout deux colonnes */}
                      <div className="grid grid-cols-5 gap-4 min-h-[240px]">
                        {/* Colonne gauche : Options */}
                        <div className="col-span-2 space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Résultat</Label>
                          <RadioGroup
                            value={selectedResult ?? ""}
                            onValueChange={(value) => setSelectedResult(value as CallResult)}
                            className="space-y-1"
                          >
                            {CALL_RESULTS.map((result) => (
                              <label
                                key={result.value}
                                htmlFor={`result-${result.value}`}
                                className={cn(
                                  "flex items-center space-x-2 rounded-md border px-3 py-2 cursor-pointer transition-colors",
                                  selectedResult === result.value
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <RadioGroupItem value={result.value} id={`result-${result.value}`} />
                                <span className={cn(
                                  "text-sm",
                                  selectedResult === result.value && "font-medium"
                                )}>{result.label}</span>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        {/* Colonne droite : Paramètres dynamiques */}
                        <div className="col-span-3 space-y-4 border-l pl-4">
                          {!selectedResult ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                              <p>← Sélectionnez un résultat</p>
                            </div>
                          ) : (
                            <>
                              {/* Date de rappel */}
                              {showDatePicker && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Date et heure de rappel *</Label>
                                  <div className="flex gap-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "flex-1 justify-start text-left font-normal",
                                            !dateRappel && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {dateRappel
                                            ? format(dateRappel, "dd/MM/yyyy", { locale: fr })
                                            : "Date"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={dateRappel}
                                          onSelect={(date) => {
                                            if (date) {
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
                                    <div className="flex items-center">
                                      <input
                                        type="time"
                                        className="h-9 px-2 rounded-md border border-input bg-background text-sm w-[90px]"
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

                              {/* Info pour RDV planifié */}
                              {selectedResult === "RDV planifié" && !createdProspect && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <p className="text-sm text-purple-700">
                                    💡 Pour planifier le RDV, utilisez l&apos;onglet <strong>Agenda</strong> ci-dessus.
                                  </p>
                                </div>
                              )}

                              {/* Notes */}
                              {showNotes && (
                                <div className="space-y-2">
                                  <Label htmlFor="notesAppel" className="text-sm">Notes de l&apos;appel</Label>
                                  <Textarea
                                    id="notesAppel"
                                    placeholder="Résumé de la conversation..."
                                    value={notesAppel}
                                    onChange={(e) => setNotesAppel(e.target.value)}
                                    rows={3}
                                    className="text-sm"
                                  />
                                </div>
                              )}

                              {/* Checkbox interaction */}
                              {showInteractionCheckbox && !createdProspect && (
                                <div className="flex items-center space-x-2 pt-2">
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-3 border-t mt-3 sm:justify-between">
                      <Button type="button" variant="ghost" onClick={handleSkipResult}>
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitResult}
                        disabled={!selectedResult || isSubmittingResult || (selectedResult === "Rappeler" && !dateRappel)}
                      >
                        {isSubmittingResult ? "Enregistrement..." : createdProspect ? "Terminer" : "Créer le lead"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  {/* Sous-onglet Agenda */}
                  <TabsContent value="agenda" className="mt-4">
                    {createdProspect ? (
                      <div className="h-[320px]">
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
                    ) : (
                      <div className="h-[320px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Création du lead en cours...</p>
                        </div>
                      </div>
                    )}
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
