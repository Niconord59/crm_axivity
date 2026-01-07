import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
    },
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock the hooks
vi.mock('@/hooks/use-prospects', () => ({
  useUpdateContact: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-clients', () => ({
  useClients: () => ({
    data: [
      { id: 'client-1', nom: 'Acme Corp' },
      { id: 'client-2', nom: 'Beta Inc' },
    ],
    isLoading: false,
  }),
}));

// Import after mocking
import { ContactForm } from '../ContactForm';

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Sample contact for testing
const mockContact = {
  id: 'contact-123',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  telephone: '06 12 34 56 78',
  poste: 'Directeur Commercial',
  linkedin: 'https://linkedin.com/in/jean-dupont',
  estPrincipal: true,
  client: ['client-1'],
  statutProspection: 'Qualifié' as const,
  dateRappel: '2024-06-15',
  typeRdv: 'Visio' as const,
  lienVisio: 'https://meet.google.com/xxx',
  sourceLead: 'LinkedIn' as const,
  notesProspection: 'Contact intéressé',
};

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render default trigger button', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} />
      </Wrapper>
    );

    // The default trigger is a button with Edit icon
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render custom trigger when provided', () => {
    const Wrapper = createWrapper();
    const customTrigger = <button data-testid="custom-trigger">Modifier</button>;

    render(
      <Wrapper>
        <ContactForm contact={mockContact} trigger={customTrigger} />
      </Wrapper>
    );

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
  });

  it('should support controlled open state', () => {
    const Wrapper = createWrapper();
    const onOpenChange = vi.fn();

    render(
      <Wrapper>
        <ContactForm
          contact={mockContact}
          open={true}
          onOpenChange={onOpenChange}
        />
      </Wrapper>
    );

    // Dialog should be open (we can check for dialog title in the h2)
    const dialogTitle = screen.getByRole('heading', { name: 'Modifier le contact' });
    expect(dialogTitle).toBeInTheDocument();
  });

  it('should show form fields when dialog is open', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} open={true} />
      </Wrapper>
    );

    // Check for form labels - should have personal info fields only (not prospection)
    expect(screen.getByText('Nom *')).toBeInTheDocument();
    expect(screen.getByText('Prénom')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Téléphone')).toBeInTheDocument();
    expect(screen.getByText('Poste')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Client associé')).toBeInTheDocument();
    expect(screen.getByText('Contact principal')).toBeInTheDocument();
  });

  it('should NOT show prospection fields', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} open={true} />
      </Wrapper>
    );

    // Verify prospection fields are NOT present
    expect(screen.queryByText('Informations de prospection')).not.toBeInTheDocument();
    expect(screen.queryByText('Statut prospection')).not.toBeInTheDocument();
    expect(screen.queryByText('Source du lead')).not.toBeInTheDocument();
    expect(screen.queryByText('Date de rappel')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes de prospection')).not.toBeInTheDocument();
  });

  it('should pre-fill form with contact data', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} open={true} />
      </Wrapper>
    );

    // Check that input fields are pre-filled
    const nomInput = screen.getByPlaceholderText('Dupont') as HTMLInputElement;
    expect(nomInput.value).toBe('Dupont');

    const prenomInput = screen.getByPlaceholderText('Jean') as HTMLInputElement;
    expect(prenomInput.value).toBe('Jean');
  });

  it('should have submit button with correct label', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} open={true} />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument();
  });

  it('should show dialog description', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} open={true} />
      </Wrapper>
    );

    expect(screen.getByText('Modifiez les informations du contact')).toBeInTheDocument();
  });

  it('should render section header for personal info', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <ContactForm contact={mockContact} open={true} />
      </Wrapper>
    );

    expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
  });
});
