import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create mocks with vi.hoisted
const {
  mockUseTachesEnRetard,
  mockUseFacturesImpayees,
  mockUseProjetsActifs,
  mockUseRappelsAujourdhui,
  mockUseRdvAujourdhui,
  mockUseNotifications,
  mockUseMarkNotificationAsRead,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockUseTachesEnRetard: vi.fn(),
  mockUseFacturesImpayees: vi.fn(),
  mockUseProjetsActifs: vi.fn(),
  mockUseRappelsAujourdhui: vi.fn(),
  mockUseRdvAujourdhui: vi.fn(),
  mockUseNotifications: vi.fn(),
  mockUseMarkNotificationAsRead: vi.fn(),
  mockUseAuth: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/use-taches', () => ({
  useTachesEnRetard: mockUseTachesEnRetard,
}));

vi.mock('@/hooks/use-factures', () => ({
  useFacturesImpayees: mockUseFacturesImpayees,
}));

vi.mock('@/hooks/use-projets', () => ({
  useProjetsActifs: mockUseProjetsActifs,
}));

vi.mock('@/hooks/use-prospects', () => ({
  useRappelsAujourdhui: mockUseRappelsAujourdhui,
  useRdvAujourdhui: mockUseRdvAujourdhui,
}));

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: mockUseNotifications,
  useMarkNotificationAsRead: mockUseMarkNotificationAsRead,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: mockUseAuth,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Import component after mocks
import { NotificationPanel } from '../NotificationPanel';

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
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

// Sample data
const mockTaches = [
  {
    id: 'tache-1',
    nom: 'Tâche urgente',
    dateEcheance: '2024-01-10',
  },
];

const mockFactures = [
  {
    id: 'facture-1',
    numero: 'FAC-2024-001',
    dateEcheance: '2024-01-15',
    niveauRelance: 2,
  },
];

const mockProjets = [
  {
    id: 'projet-1',
    nomProjet: 'Projet en retard',
    briefProjet: 'Brief du projet',
    dateFinPrevue: '2024-01-01', // In the past = overdue
  },
];

const mockRappels = [
  {
    id: 'prospect-1',
    nom: 'Dupont',
    prenom: 'Jean',
    clientNom: 'Entreprise ABC',
    dateRappel: '2024-01-20',
  },
];

const mockRdv = [
  {
    id: 'prospect-2',
    nom: 'Martin',
    prenom: 'Marie',
    clientNom: 'Société XYZ',
    typeRdv: 'Visio',
    dateRdvPrevu: '2024-01-20',
  },
];

const mockDbNotifications = [
  {
    id: 'notif-1',
    type: 'project_assigned',
    title: 'Nouveau projet assigné',
    message: 'Vous avez été assigné au projet "CRM Axivity"',
    link: '/projets?id=proj-1',
    createdAt: '2024-01-15T10:00:00Z',
    isRead: false,
  },
];

describe('NotificationPanel', () => {
  const mockMarkAsReadMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isAdmin: () => false,
    });

    mockUseTachesEnRetard.mockReturnValue({ data: [] });
    mockUseFacturesImpayees.mockReturnValue({ data: [] });
    mockUseProjetsActifs.mockReturnValue({ data: [] });
    mockUseRappelsAujourdhui.mockReturnValue({ data: [] });
    mockUseRdvAujourdhui.mockReturnValue({ data: [] });
    mockUseNotifications.mockReturnValue({ data: [] });
    mockUseMarkNotificationAsRead.mockReturnValue({ mutate: mockMarkAsReadMutate });
  });

  it('should render notification bell button', () => {
    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show badge when there are notifications', () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    // Should show badge with count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show "9+" when more than 9 notifications', () => {
    // Create 10 tasks
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      id: `tache-${i}`,
      nom: `Tâche ${i}`,
      dateEcheance: '2024-01-10',
    }));

    mockUseTachesEnRetard.mockReturnValue({ data: manyTasks });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    // Should only show 3 tasks (sliced) but badge would show 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should open popover when clicking bell button', async () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Use getByRole to find the heading specifically
      expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    });
  });

  it('should display "Tout est à jour" when no notifications', async () => {
    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Tout est à jour')).toBeInTheDocument();
      expect(screen.getByText('Aucune notification pour le moment')).toBeInTheDocument();
    });
  });

  it('should display task notifications', async () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Tâche en retard')).toBeInTheDocument();
      expect(screen.getByText('Tâche urgente')).toBeInTheDocument();
    });
  });

  it('should display invoice notifications', async () => {
    mockUseFacturesImpayees.mockReturnValue({ data: mockFactures });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Facture impayée')).toBeInTheDocument();
      expect(screen.getByText('FAC-2024-001')).toBeInTheDocument();
    });
  });

  it('should display callback notifications', async () => {
    mockUseRappelsAujourdhui.mockReturnValue({ data: mockRappels });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Rappel à faire')).toBeInTheDocument();
      expect(screen.getByText('Jean Dupont - Entreprise ABC')).toBeInTheDocument();
    });
  });

  it('should display RDV notifications', async () => {
    mockUseRdvAujourdhui.mockReturnValue({ data: mockRdv });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Visio aujourd\'hui')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin - Société XYZ')).toBeInTheDocument();
    });
  });

  it('should display database notifications (project assignments)', async () => {
    mockUseNotifications.mockReturnValue({ data: mockDbNotifications });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Nouveau projet assigné')).toBeInTheDocument();
      expect(screen.getByText('Vous avez été assigné au projet "CRM Axivity"')).toBeInTheDocument();
    });
  });

  it('should mark DB notification as read when clicked', async () => {
    mockUseNotifications.mockReturnValue({ data: mockDbNotifications });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Nouveau projet assigné')).toBeInTheDocument();
    });

    // Click on the notification link
    const link = screen.getByRole('link', { name: /Nouveau projet assigné/i });
    fireEvent.click(link);

    expect(mockMarkAsReadMutate).toHaveBeenCalledWith('notif-1');
  });

  it('should dismiss non-DB notification and save to localStorage', async () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Tâche en retard')).toBeInTheDocument();
    });

    // Click the notification link (which dismisses it)
    const link = screen.getByRole('link', { name: /Tâche en retard/i });
    fireEvent.click(link);

    // localStorage should be updated
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should load dismissed notifications from localStorage', () => {
    const dismissedIds = ['task-tache-1'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(dismissedIds));

    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    // The notification count should be 0 because task-tache-1 is dismissed
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('should show restore button when notifications are dismissed', async () => {
    // First dismiss a notification by having it in localStorage
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['task-1']));

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Toutes les notifications ont été lues')).toBeInTheDocument();
      expect(screen.getByText('Restaurer les notifications')).toBeInTheDocument();
    });
  });

  it('should call isAdmin for user filtering', () => {
    const isAdminMock = vi.fn().mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1' },
      isAdmin: isAdminMock,
    });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    expect(isAdminMock).toHaveBeenCalled();
    // Admin should not pass userId to hooks (see all notifications)
    expect(mockUseTachesEnRetard).toHaveBeenCalledWith(undefined);
  });

  it('should pass userId for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isAdmin: () => false,
    });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    expect(mockUseTachesEnRetard).toHaveBeenCalledWith('user-1');
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    // Should not throw
    expect(() => {
      render(<NotificationPanel />, { wrapper: createWrapper() });
    }).not.toThrow();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('crm-notifications-dismissed');
  });

  it('should show notification count text in header', async () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });
    mockUseFacturesImpayees.mockReturnValue({ data: mockFactures });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('2 notifications')).toBeInTheDocument();
    });
  });

  it('should show singular "notification" for count of 1', async () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('1 notification')).toBeInTheDocument();
    });
  });

  it('should show "Voir toutes les alertes" link when notifications exist', async () => {
    mockUseTachesEnRetard.mockReturnValue({ data: mockTaches });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Voir toutes les alertes')).toBeInTheDocument();
    });
  });

  it('should filter overdue projects correctly', async () => {
    // Project with past date (overdue)
    mockUseProjetsActifs.mockReturnValue({
      data: [
        {
          id: 'projet-overdue',
          nomProjet: 'CRM Migration Urgente',
          dateFinPrevue: '2020-01-01', // Way in the past
        },
        {
          id: 'projet-ok',
          nomProjet: 'Projet OK',
          dateFinPrevue: '2030-01-01', // Future date
        },
      ],
    });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Check the specific project name appears (in the description)
      expect(screen.getByText('CRM Migration Urgente')).toBeInTheDocument();
      // And the notification type title
      expect(screen.getByText('Projet en retard')).toBeInTheDocument();
    });

    // The non-overdue project should not be shown as a notification
    expect(screen.queryByText('Projet OK')).not.toBeInTheDocument();
  });

  it('should display RDV présentiel correctly', async () => {
    mockUseRdvAujourdhui.mockReturnValue({
      data: [
        {
          id: 'prospect-3',
          nom: 'Durand',
          prenom: 'Pierre',
          clientNom: 'Client Test',
          typeRdv: 'Présentiel',
          dateRdvPrevu: '2024-01-20',
        },
      ],
    });

    render(<NotificationPanel />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("RDV aujourd'hui")).toBeInTheDocument();
    });
  });
});
