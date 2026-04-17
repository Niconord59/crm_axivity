// CRM Axivity - Contact Mapper Tests (PRO-H1)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapToContact,
  mapToContactOrThrow,
  mapToContacts,
} from "../contact.mapper";

describe("mapToContact", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("maps a complete valid Supabase record", () => {
    const record = {
      id: "contact-123",
      nom: "Dupont",
      prenom: "Jean",
      email: "jean.dupont@acme.com",
      telephone: "0612345678",
      poste: "Directeur Commercial",
      linkedin: "https://linkedin.com/in/jeandupont",
      est_principal: true,
      lifecycle_stage: "Lead",
      lifecycle_stage_changed_at: "2026-04-01T10:00:00Z",
      statut_prospection: "À appeler",
      date_rappel: "2026-04-20",
      date_rdv_prevu: "2026-04-25",
      type_rdv: "Visio",
      lien_visio: "https://meet.google.com/abc",
      source_lead: "LinkedIn",
      notes_prospection: "Contact prometteur",
      client_id: "client-42",
      created_at: "2026-03-15T10:00:00Z",
    };

    const contact = mapToContact(record);

    expect(contact).toEqual({
      id: "contact-123",
      nom: "Dupont",
      prenom: "Jean",
      email: "jean.dupont@acme.com",
      telephone: "0612345678",
      poste: "Directeur Commercial",
      linkedin: "https://linkedin.com/in/jeandupont",
      estPrincipal: true,
      lifecycleStage: "Lead",
      lifecycleStageChangedAt: "2026-04-01T10:00:00Z",
      statutProspection: "À appeler",
      dateRappel: "2026-04-20",
      dateRdvPrevu: "2026-04-25",
      typeRdv: "Visio",
      lienVisio: "https://meet.google.com/abc",
      sourceLead: "LinkedIn",
      notesProspection: "Contact prometteur",
      client: ["client-42"],
      createdTime: "2026-03-15T10:00:00Z",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("tolerates null values for optional columns (maps to undefined)", () => {
    const record = {
      id: "contact-456",
      nom: "Martin",
      prenom: null,
      email: null,
      telephone: null,
      poste: null,
      linkedin: null,
      est_principal: null,
      lifecycle_stage: null,
      statut_prospection: null,
      source_lead: null,
      type_rdv: null,
      client_id: null,
      created_at: null,
    };

    const contact = mapToContact(record);

    expect(contact).not.toBeNull();
    expect(contact?.id).toBe("contact-456");
    expect(contact?.nom).toBe("Martin");
    expect(contact?.prenom).toBeUndefined();
    expect(contact?.email).toBeUndefined();
    expect(contact?.statutProspection).toBeUndefined();
    expect(contact?.client).toBeUndefined();
  });

  it("coerces nom=null into empty string instead of skipping", () => {
    // Defensive : nom is NOT NULL in DB, but we keep parity with the
    // previous cast behavior that fell back to "" for legacy test fixtures.
    const contact = mapToContact({ id: "id-1", nom: null });
    expect(contact).not.toBeNull();
    expect(contact?.nom).toBe("");
  });

  it("returns null and warns when id is missing", () => {
    const contact = mapToContact({ nom: "Dupont" });
    expect(contact).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("[mapToContact]");
  });

  it("returns null and warns when statut_prospection is out of enum", () => {
    const record = {
      id: "contact-789",
      nom: "Durand",
      statut_prospection: "InvalidStatus",
    };
    const contact = mapToContact(record);
    expect(contact).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns null when lifecycle_stage is out of enum", () => {
    const record = {
      id: "contact-abc",
      nom: "Noir",
      lifecycle_stage: "Unknown",
    };
    const contact = mapToContact(record);
    expect(contact).toBeNull();
  });

  it("returns null when source_lead is a string not in the enum", () => {
    const record = {
      id: "contact-def",
      nom: "Blanc",
      source_lead: "Pigeon Post",
    };
    const contact = mapToContact(record);
    expect(contact).toBeNull();
  });

  it("accepts empty string nom", () => {
    const contact = mapToContact({ id: "id-2", nom: "" });
    expect(contact?.nom).toBe("");
  });
});

describe("mapToContactOrThrow", () => {
  it("returns a Contact for a valid record", () => {
    const contact = mapToContactOrThrow({
      id: "contact-1",
      nom: "Dupont",
    });
    expect(contact.id).toBe("contact-1");
  });

  it("throws when the record is invalid", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mapToContactOrThrow({ nom: "Sans ID" })).toThrow(
      "Contact introuvable ou format invalide",
    );
    warnSpy.mockRestore();
  });
});

describe("mapToContacts", () => {
  it("returns all valid contacts", () => {
    const records = [
      { id: "a", nom: "Ada" },
      { id: "b", nom: "Bob" },
    ];
    const contacts = mapToContacts(records);
    expect(contacts).toHaveLength(2);
    expect(contacts.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("skips invalid records and keeps the valid ones", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const records = [
      { id: "a", nom: "Ada" },
      { id: "b", nom: "Bob", statut_prospection: "WTF" }, // drift enum
      { id: "c", nom: "Clio" },
    ];
    const contacts = mapToContacts(records);
    expect(contacts).toHaveLength(2);
    expect(contacts.map((c) => c.id)).toEqual(["a", "c"]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("returns an empty array when given an empty list", () => {
    expect(mapToContacts([])).toEqual([]);
  });
});
