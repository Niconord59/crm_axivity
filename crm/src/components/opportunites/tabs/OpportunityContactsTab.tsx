"use client";

import { useState } from "react";
import {
  UserPlus,
  Trash2,
  Star,
  StarOff,
  Loader2,
  Users,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LifecycleStageBadge } from "@/components/shared/LifecycleStageBadge";
import {
  useOpportuniteContacts,
  useAddContactToOpportunite,
  useRemoveContactFromOpportunite,
  useSetPrimaryContact,
  type OpportuniteContactWithDetails,
} from "@/hooks/use-opportunite-contacts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ContactRole, LifecycleStage } from "@/types";
import { CONTACT_ROLES, CONTACT_ROLE_LABELS } from "@/types/constants";

interface OpportunityContactsTabProps {
  opportuniteId: string;
  clientId?: string;
}

// Contact search result type
interface ContactSearchResult {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  lifecycleStage?: LifecycleStage;
}

export function OpportunityContactsTab({
  opportuniteId,
  clientId,
}: OpportunityContactsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<ContactRole>("Participant");
  const [contactToRemove, setContactToRemove] = useState<OpportuniteContactWithDetails | null>(null);

  // Fetch existing contacts for this opportunity
  const { data: opportuniteContacts, isLoading, error } = useOpportuniteContacts(opportuniteId);

  // Mutations
  const addContact = useAddContactToOpportunite();
  const removeContact = useRemoveContactFromOpportunite();
  const setPrimary = useSetPrimaryContact();

  // Search contacts (from same client or all contacts)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["contacts-search", searchQuery, clientId],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("id, nom, prenom, email, telephone, poste, lifecycle_stage")
        .order("nom");

      // Filter by client if specified
      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      // Search filter
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(
          `nom.ilike.${searchTerm},prenom.ilike.${searchTerm},email.ilike.${searchTerm}`
        );
      }

      query = query.limit(20);

      const { data, error } = await query;
      if (error) throw error;

      // Filter out contacts already linked to this opportunity
      const existingIds = new Set(
        (opportuniteContacts || []).map((oc) => oc.contactId)
      );

      return (data || [])
        .filter((c) => !existingIds.has(c.id))
        .map((c) => ({
          id: c.id,
          nom: c.nom,
          prenom: c.prenom,
          email: c.email,
          telephone: c.telephone,
          poste: c.poste,
          lifecycleStage: c.lifecycle_stage as LifecycleStage | undefined,
        }));
    },
    enabled: isAddDialogOpen,
  });

  const handleAddContact = async () => {
    if (!selectedContact) return;

    try {
      await addContact.mutateAsync({
        opportuniteId,
        contactId: selectedContact.id,
        role: selectedRole,
        isPrimary: (opportuniteContacts?.length || 0) === 0, // First contact is primary
      });

      toast.success("Contact ajouté à l'opportunité");
      setIsAddDialogOpen(false);
      setSelectedContact(null);
      setSelectedRole("Participant");
      setSearchQuery("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'ajout";
      toast.error(message);
    }
  };

  const handleRemoveContact = async () => {
    if (!contactToRemove) return;

    try {
      await removeContact.mutateAsync({
        id: contactToRemove.id,
        opportuniteId,
        contactId: contactToRemove.contactId,
      });

      toast.success("Contact retiré de l'opportunité");
      setContactToRemove(null);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSetPrimary = async (oc: OpportuniteContactWithDetails) => {
    try {
      await setPrimary.mutateAsync({
        opportuniteId,
        contactId: oc.contactId,
        pivotId: oc.id,
      });

      toast.success("Contact défini comme principal");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getFullName = (contact: { nom: string; prenom?: string }) => {
    return contact.prenom ? `${contact.prenom} ${contact.nom}` : contact.nom;
  };

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">
            Contacts ({opportuniteContacts?.length || 0})
          </span>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un contact</DialogTitle>
              <DialogDescription>
                Recherchez et sélectionnez un contact à associer à cette opportunité.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Contact Search */}
              <Command className="border rounded-md">
                <CommandInput
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      "Aucun contact trouvé"
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchResults?.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={`${contact.nom} ${contact.prenom || ""}`}
                        onSelect={() => setSelectedContact(contact)}
                        className={cn(
                          "cursor-pointer",
                          selectedContact?.id === contact.id && "bg-accent"
                        )}
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {getFullName(contact)}
                            </span>
                            {contact.lifecycleStage && (
                              <LifecycleStageBadge
                                stage={contact.lifecycleStage}
                                size="sm"
                                showTooltip={false}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {contact.poste && <span>{contact.poste}</span>}
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {/* Selected Contact Preview */}
              {selectedContact && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    Contact sélectionné : {getFullName(selectedContact)}
                  </p>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rôle dans l'opportunité</label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as ContactRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {CONTACT_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setSelectedContact(null);
                  setSearchQuery("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddContact}
                disabled={!selectedContact || addContact.isPending}
              >
                {addContact.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Contacts List */}
      {error ? (
        <div className="text-center py-8 text-destructive">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-70" />
          <p className="font-medium">Erreur de chargement</p>
          <p className="text-xs mt-1 text-muted-foreground">
            Impossible de charger les contacts. Veuillez réessayer.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !opportuniteContacts?.length ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Aucun contact associé</p>
          <p className="text-xs mt-1">
            Ajoutez des contacts pour suivre les parties prenantes
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {opportuniteContacts.map((oc) => (
              <div
                key={oc.id}
                className={cn(
                  "p-3 rounded-lg border bg-card",
                  oc.isPrimary && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {oc.contact
                          ? getFullName(oc.contact)
                          : "Contact inconnu"}
                      </span>
                      {oc.isPrimary && (
                        <Badge
                          variant="default"
                          className="text-[10px] px-1.5 py-0 h-5 bg-primary"
                        >
                          Principal
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {CONTACT_ROLE_LABELS[oc.role]}
                      </Badge>
                      {oc.contact?.lifecycleStage && (
                        <LifecycleStageBadge
                          stage={oc.contact.lifecycleStage}
                          size="sm"
                          showLabel={false}
                        />
                      )}
                    </div>

                    {oc.contact && (
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {oc.contact.poste && <span>{oc.contact.poste}</span>}
                        {oc.contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">
                              {oc.contact.email}
                            </span>
                          </span>
                        )}
                        {oc.contact.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {oc.contact.telephone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!oc.isPrimary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleSetPrimary(oc)}
                        disabled={setPrimary.isPending}
                        title="Définir comme principal"
                      >
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {oc.isPrimary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled
                        title="Contact principal"
                      >
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setContactToRemove(oc)}
                      title="Retirer de l'opportunité"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!contactToRemove}
        onOpenChange={(open) => !open && setContactToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              {contactToRemove?.contact && (
                <>
                  Voulez-vous retirer{" "}
                  <strong>{getFullName(contactToRemove.contact)}</strong> de
                  cette opportunité ?
                  <br />
                  <br />
                  Le contact ne sera pas supprimé, seulement dissocié de cette
                  opportunité.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveContact}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removeContact.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
