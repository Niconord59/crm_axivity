// CRM Axivity - Prospect Schema Tests
import { describe, it, expect } from 'vitest';
import {
  prospectSchema,
  prospectDefaultValues,
  callResultSchema,
  callResultDefaultValues,
  PROSPECT_STATUTS,
  PROSPECT_SOURCES,
  FIRST_CONTACT_TYPES,
  INITIAL_STATUTS,
  type ProspectFormData,
  type CallResultFormData,
} from '../prospect';

describe('prospectSchema', () => {
  describe('entreprise (required)', () => {
    it('should require entreprise field', () => {
      const result = prospectSchema.safeParse({
        entreprise: '',
        nom: 'Contact',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('entreprise'))).toBe(true);
      }
    });

    it('should accept valid entreprise', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme Corp',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });

    it('should reject entreprise exceeding 200 characters', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'a'.repeat(201),
        nom: 'Contact',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('nom (required)', () => {
    it('should require nom field', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: '',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('nom'))).toBe(true);
      }
    });

    it('should accept valid nom', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email or telephone required', () => {
    it('should require at least email or telephone', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Email ou téléphone requis')).toBe(true);
      }
    });

    it('should accept with email only', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        email: 'dupont@acme.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept with telephone only', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });

    it('should accept with both email and telephone', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        email: 'dupont@acme.com',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email (optional, validated)', () => {
    it('should accept empty email', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        email: '',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid email', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        email: 'dupont@acme.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        email: 'invalid-email',
        telephone: '0612345678',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('linkedinPage (optional, URL validated)', () => {
    it('should accept empty linkedinPage', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
        linkedinPage: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid LinkedIn URL', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
        linkedinPage: 'https://linkedin.com/company/acme',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL for linkedinPage', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
        linkedinPage: 'not-a-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i =>
          i.path.includes('linkedinPage') &&
          i.message === 'Veuillez entrer une URL LinkedIn valide'
        )).toBe(true);
      }
    });
  });

  describe('sourceLead (required enum)', () => {
    it('should require sourceLead', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        telephone: '0612345678',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid sources', () => {
      PROSPECT_SOURCES.forEach(source => {
        const result = prospectSchema.safeParse({
          entreprise: 'Acme',
          nom: 'Dupont',
          sourceLead: source,
          telephone: '0612345678',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid source', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'InvalidSource',
        telephone: '0612345678',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('typeContact (optional enum)', () => {
    it('should accept valid contact types', () => {
      FIRST_CONTACT_TYPES.forEach(type => {
        const result = prospectSchema.safeParse({
          entreprise: 'Acme',
          nom: 'Dupont',
          sourceLead: 'LinkedIn',
          telephone: '0612345678',
          typeContact: type,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept undefined typeContact', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('statutInitial (optional enum)', () => {
    it('should accept valid initial statuts', () => {
      INITIAL_STATUTS.forEach(statut => {
        const result = prospectSchema.safeParse({
          entreprise: 'Acme',
          nom: 'Dupont',
          sourceLead: 'LinkedIn',
          telephone: '0612345678',
          statutInitial: statut,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('company info fields', () => {
    it('should accept valid company info', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme Corp',
        nom: 'Dupont',
        sourceLead: 'LinkedIn',
        telephone: '0612345678',
        secteurActivite: 'Technology',
        siteWeb: 'https://acme.com',
        linkedinPage: 'https://linkedin.com/company/acme',
        telephoneEntreprise: '+33 1 23 45 67 89',
        siret: '12345678901234',
        adresse: '123 Rue de Paris',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('full form validation', () => {
    it('should validate complete prospect form', () => {
      const formData: ProspectFormData = {
        entreprise: 'Acme Corp',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        secteurActivite: 'Technology',
        siteWeb: 'https://acme.com',
        linkedinPage: 'https://linkedin.com/company/acme',
        telephoneEntreprise: '+33 1 23 45 67 89',
        siret: '12345678901234',
        adresse: '123 Rue de Paris',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@acme.com',
        telephone: '0612345678',
        role: 'Directeur Commercial',
        sourceLead: 'LinkedIn',
        typeContact: 'Email',
        statutInitial: 'Qualifié',
        notesProspection: 'Contact intéressé par nos services',
      };

      const result = prospectSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal prospect form', () => {
      const result = prospectSchema.safeParse({
        entreprise: 'Acme',
        nom: 'Dupont',
        sourceLead: 'Appel entrant',
        telephone: '0612345678',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('prospectDefaultValues', () => {
  it('should have empty strings for text fields', () => {
    expect(prospectDefaultValues.entreprise).toBe('');
    expect(prospectDefaultValues.nom).toBe('');
    expect(prospectDefaultValues.prenom).toBe('');
    expect(prospectDefaultValues.email).toBe('');
    expect(prospectDefaultValues.telephone).toBe('');
    expect(prospectDefaultValues.linkedinPage).toBe('');
    expect(prospectDefaultValues.siteWeb).toBe('');
    expect(prospectDefaultValues.secteurActivite).toBe('');
  });

  it('should have France as default country', () => {
    expect(prospectDefaultValues.pays).toBe('France');
  });

  it('should have Appel entrant as default source', () => {
    expect(prospectDefaultValues.sourceLead).toBe('Appel entrant');
  });

  it('should have undefined for optional enums', () => {
    expect(prospectDefaultValues.clientId).toBeUndefined();
    expect(prospectDefaultValues.typeContact).toBeUndefined();
    expect(prospectDefaultValues.statutInitial).toBeUndefined();
  });
});

describe('callResultSchema', () => {
  describe('resultat (required)', () => {
    it('should require resultat', () => {
      const result = callResultSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid resultat values', () => {
      const validResults = [
        'Appelé - pas répondu',
        'Rappeler',
        'RDV planifié',
        'RDV effectué',
        'Reporter',
        'Qualifié',
        'Non qualifié',
        'Perdu',
      ];

      validResults.forEach(resultat => {
        const result = callResultSchema.safeParse({
          resultat,
          dateRappel: resultat === 'Rappeler' || resultat === 'Reporter' ? '2024-06-15' : undefined,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('dateRappel requirement', () => {
    it('should require dateRappel when resultat is Rappeler', () => {
      const result = callResultSchema.safeParse({
        resultat: 'Rappeler',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'La date est requise')).toBe(true);
      }
    });

    it('should require dateRappel when resultat is Reporter', () => {
      const result = callResultSchema.safeParse({
        resultat: 'Reporter',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'La date est requise')).toBe(true);
      }
    });

    it('should not require dateRappel for other results', () => {
      const result = callResultSchema.safeParse({
        resultat: 'RDV planifié',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('notes (optional)', () => {
    it('should accept empty notes', () => {
      const result = callResultSchema.safeParse({
        resultat: 'RDV planifié',
        notes: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject notes exceeding 2000 characters', () => {
      const result = callResultSchema.safeParse({
        resultat: 'RDV planifié',
        notes: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('creerInteraction (default true)', () => {
    it('should default to true', () => {
      const result = callResultSchema.safeParse({
        resultat: 'RDV planifié',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.creerInteraction).toBe(true);
      }
    });

    it('should accept explicit false', () => {
      const result = callResultSchema.safeParse({
        resultat: 'RDV planifié',
        creerInteraction: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.creerInteraction).toBe(false);
      }
    });
  });

  describe('full form validation', () => {
    it('should validate complete call result form', () => {
      const formData: CallResultFormData = {
        resultat: 'Rappeler',
        dateRappel: '2024-06-15',
        notes: 'Client occupé, rappeler la semaine prochaine',
        creerInteraction: true,
      };

      const result = callResultSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });
  });
});

describe('callResultDefaultValues', () => {
  it('should have undefined resultat', () => {
    expect(callResultDefaultValues.resultat).toBeUndefined();
  });

  it('should have empty string for dateRappel', () => {
    expect(callResultDefaultValues.dateRappel).toBe('');
  });

  it('should have empty string for notes', () => {
    expect(callResultDefaultValues.notes).toBe('');
  });

  it('should default creerInteraction to true', () => {
    expect(callResultDefaultValues.creerInteraction).toBe(true);
  });
});

describe('Constants', () => {
  it('PROSPECT_STATUTS should have all expected statuts', () => {
    expect(PROSPECT_STATUTS).toContain('À appeler');
    expect(PROSPECT_STATUTS).toContain('Appelé - pas répondu');
    expect(PROSPECT_STATUTS).toContain('Rappeler');
    expect(PROSPECT_STATUTS).toContain('RDV planifié');
    expect(PROSPECT_STATUTS).toContain('RDV effectué');
    expect(PROSPECT_STATUTS).toContain('Qualifié');
    expect(PROSPECT_STATUTS).toContain('Non qualifié');
    expect(PROSPECT_STATUTS).toContain('Perdu');
    expect(PROSPECT_STATUTS.length).toBe(8);
  });

  it('PROSPECT_SOURCES should have all expected sources', () => {
    expect(PROSPECT_SOURCES).toContain('Appel entrant');
    expect(PROSPECT_SOURCES).toContain('LinkedIn');
    expect(PROSPECT_SOURCES).toContain('Site web');
    expect(PROSPECT_SOURCES).toContain('Salon');
    expect(PROSPECT_SOURCES).toContain('Recommandation');
    expect(PROSPECT_SOURCES).toContain('Achat liste');
    expect(PROSPECT_SOURCES).toContain('Autre');
    expect(PROSPECT_SOURCES.length).toBe(7);
  });

  it('FIRST_CONTACT_TYPES should have all expected types', () => {
    expect(FIRST_CONTACT_TYPES).toContain('Appel');
    expect(FIRST_CONTACT_TYPES).toContain('Email');
    expect(FIRST_CONTACT_TYPES).toContain('LinkedIn');
    expect(FIRST_CONTACT_TYPES).toContain('Physique');
    expect(FIRST_CONTACT_TYPES).toContain('Autre');
    expect(FIRST_CONTACT_TYPES.length).toBe(5);
  });

  it('INITIAL_STATUTS should have all expected statuts', () => {
    expect(INITIAL_STATUTS).toContain('À appeler');
    expect(INITIAL_STATUTS).toContain('Rappeler');
    expect(INITIAL_STATUTS).toContain('RDV planifié');
    expect(INITIAL_STATUTS).toContain('RDV effectué');
    expect(INITIAL_STATUTS).toContain('Qualifié');
    expect(INITIAL_STATUTS.length).toBe(5);
  });
});
