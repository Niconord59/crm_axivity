import { describe, it, expect } from 'vitest';
import {
  contactSchema,
  contactDefaultValues,
  contactToFormData,
  ContactFormData,
} from '../contact';

describe('contactSchema', () => {
  describe('nom (required)', () => {
    it('should require nom field', () => {
      const result = contactSchema.safeParse({ nom: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le nom est requis');
      }
    });

    it('should accept valid nom', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont' });
      expect(result.success).toBe(true);
    });

    it('should reject nom exceeding 100 characters', () => {
      const result = contactSchema.safeParse({ nom: 'a'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le nom ne peut pas dépasser 100 caractères');
      }
    });
  });

  describe('prenom (optional)', () => {
    it('should accept empty prenom', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', prenom: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid prenom', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', prenom: 'Jean' });
      expect(result.success).toBe(true);
    });

    it('should reject prenom exceeding 100 characters', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', prenom: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('email (optional, validated)', () => {
    it('should accept empty email', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', email: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid email', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', email: 'jean.dupont@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', email: 'invalid-email' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Veuillez entrer une adresse email valide');
      }
    });
  });

  describe('telephone (optional)', () => {
    it('should accept empty telephone', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', telephone: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid telephone', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', telephone: '06 12 34 56 78' });
      expect(result.success).toBe(true);
    });

    it('should reject telephone exceeding 20 characters', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', telephone: '0'.repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe('poste (optional)', () => {
    it('should accept empty poste', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', poste: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid poste', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', poste: 'Directeur Commercial' });
      expect(result.success).toBe(true);
    });
  });

  describe('linkedin (optional, URL validated)', () => {
    it('should accept empty linkedin', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', linkedin: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid linkedin URL', () => {
      const result = contactSchema.safeParse({
        nom: 'Dupont',
        linkedin: 'https://linkedin.com/in/jean-dupont'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid linkedin URL', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', linkedin: 'not-a-url' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Veuillez entrer une URL LinkedIn valide');
      }
    });
  });

  describe('estPrincipal (optional boolean)', () => {
    it('should accept true', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', estPrincipal: true });
      expect(result.success).toBe(true);
    });

    it('should accept false', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', estPrincipal: false });
      expect(result.success).toBe(true);
    });
  });

  describe('clientId (optional UUID)', () => {
    it('should accept empty clientId', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', clientId: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid UUID', () => {
      const result = contactSchema.safeParse({
        nom: 'Dupont',
        clientId: '123e4567-e89b-12d3-a456-426614174000'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', clientId: 'invalid-uuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('statutProspection (optional enum)', () => {
    it('should accept valid statut', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', statutProspection: 'À appeler' });
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont' });
      expect(result.success).toBe(true);
    });
  });

  describe('dateRappel (optional date string)', () => {
    it('should accept empty dateRappel', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', dateRappel: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid date format', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', dateRappel: '2024-06-15' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', dateRappel: '15/06/2024' });
      expect(result.success).toBe(false);
    });
  });

  describe('lienVisio (optional URL)', () => {
    it('should accept empty lienVisio', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', lienVisio: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid URL', () => {
      const result = contactSchema.safeParse({
        nom: 'Dupont',
        lienVisio: 'https://meet.google.com/abc-def-ghi'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', lienVisio: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });

  describe('notesProspection (optional text)', () => {
    it('should accept empty notes', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', notesProspection: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid notes', () => {
      const result = contactSchema.safeParse({
        nom: 'Dupont',
        notesProspection: 'Premier contact par téléphone'
      });
      expect(result.success).toBe(true);
    });

    it('should reject notes exceeding 5000 characters', () => {
      const result = contactSchema.safeParse({ nom: 'Dupont', notesProspection: 'a'.repeat(5001) });
      expect(result.success).toBe(false);
    });
  });

  describe('full form validation', () => {
    it('should validate complete form data', () => {
      const formData: ContactFormData = {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        telephone: '06 12 34 56 78',
        poste: 'Directeur Commercial',
        linkedin: 'https://linkedin.com/in/jean-dupont',
        estPrincipal: true,
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        statutProspection: 'Qualifié',
        dateRappel: '2024-06-15',
        dateRdvPrevu: '2024-06-20',
        typeRdv: 'Visio',
        lienVisio: 'https://meet.google.com/abc-def-ghi',
        sourceLead: 'LinkedIn',
        notesProspection: 'Contact intéressé par nos services',
      };

      const result = contactSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal form data', () => {
      const result = contactSchema.safeParse({ nom: 'Test' });
      expect(result.success).toBe(true);
    });
  });
});

describe('contactDefaultValues', () => {
  it('should have empty strings for text fields', () => {
    expect(contactDefaultValues.nom).toBe('');
    expect(contactDefaultValues.prenom).toBe('');
    expect(contactDefaultValues.email).toBe('');
    expect(contactDefaultValues.telephone).toBe('');
    expect(contactDefaultValues.poste).toBe('');
    expect(contactDefaultValues.linkedin).toBe('');
  });

  it('should have false for estPrincipal', () => {
    expect(contactDefaultValues.estPrincipal).toBe(false);
  });

  it('should have undefined for enum fields', () => {
    expect(contactDefaultValues.statutProspection).toBeUndefined();
    expect(contactDefaultValues.typeRdv).toBeUndefined();
    expect(contactDefaultValues.sourceLead).toBeUndefined();
  });
});

describe('contactToFormData', () => {
  it('should map complete contact to form data', () => {
    const contact = {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean@example.com',
      telephone: '0612345678',
      poste: 'CEO',
      linkedin: 'https://linkedin.com/in/jean',
      estPrincipal: true,
      client: ['client-uuid-123'],
      statutProspection: 'Qualifié',
      dateRappel: '2024-06-15',
      dateRdvPrevu: '2024-06-20',
      typeRdv: 'Visio',
      lienVisio: 'https://meet.google.com/xxx',
      sourceLead: 'LinkedIn',
      notesProspection: 'Notes importantes',
    };

    const formData = contactToFormData(contact);

    expect(formData.nom).toBe('Dupont');
    expect(formData.prenom).toBe('Jean');
    expect(formData.email).toBe('jean@example.com');
    expect(formData.telephone).toBe('0612345678');
    expect(formData.poste).toBe('CEO');
    expect(formData.linkedin).toBe('https://linkedin.com/in/jean');
    expect(formData.estPrincipal).toBe(true);
    expect(formData.clientId).toBe('client-uuid-123');
    expect(formData.statutProspection).toBe('Qualifié');
    expect(formData.dateRappel).toBe('2024-06-15');
    expect(formData.dateRdvPrevu).toBe('2024-06-20');
    expect(formData.typeRdv).toBe('Visio');
    expect(formData.lienVisio).toBe('https://meet.google.com/xxx');
    expect(formData.sourceLead).toBe('LinkedIn');
    expect(formData.notesProspection).toBe('Notes importantes');
  });

  it('should handle minimal contact with defaults', () => {
    const contact = {
      nom: 'Test',
    };

    const formData = contactToFormData(contact);

    expect(formData.nom).toBe('Test');
    expect(formData.prenom).toBe('');
    expect(formData.email).toBe('');
    expect(formData.telephone).toBe('');
    expect(formData.poste).toBe('');
    expect(formData.linkedin).toBe('');
    expect(formData.estPrincipal).toBe(false);
    expect(formData.clientId).toBe('');
  });

  it('should handle empty client array', () => {
    const contact = {
      nom: 'Test',
      client: [],
    };

    const formData = contactToFormData(contact);
    expect(formData.clientId).toBe('');
  });

  it('should handle undefined optional fields', () => {
    const contact = {
      nom: 'Test',
      prenom: undefined,
      email: undefined,
    };

    const formData = contactToFormData(contact);
    expect(formData.prenom).toBe('');
    expect(formData.email).toBe('');
  });
});
