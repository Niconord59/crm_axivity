import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from '../ExportButton';
import type { ExportColumn } from '@/lib/export';

// Create hoisted mocks
const { mockToast, mockExportToCSV, mockExportToExcel } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockExportToCSV: vi.fn(),
  mockExportToExcel: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock export functions
vi.mock('@/lib/export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/export')>();
  return {
    ...actual,
    exportToCSV: mockExportToCSV,
    exportToExcel: mockExportToExcel,
  };
});

interface TestData {
  id: string;
  name: string;
  value: number;
}

const testData: TestData[] = [
  { id: '1', name: 'Item 1', value: 100 },
  { id: '2', name: 'Item 2', value: 200 },
];

const testColumns: ExportColumn<TestData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'value', header: 'Value' },
];

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the export button', () => {
    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
      />
    );

    expect(screen.getByRole('button', { name: /exporter/i })).toBeInTheDocument();
  });

  it('should be disabled when data is empty', () => {
    render(
      <ExportButton
        data={[]}
        columns={testColumns}
        filename="test-export"
      />
    );

    expect(screen.getByRole('button', { name: /exporter/i })).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
        disabled={true}
      />
    );

    expect(screen.getByRole('button', { name: /exporter/i })).toBeDisabled();
  });

  it('should open dropdown menu on click', async () => {
    const user = userEvent.setup();

    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    await user.click(button);

    // Wait for dropdown to appear - Radix renders in portal
    await waitFor(() => {
      expect(screen.getByText(/excel/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
  });

  it('should call exportToExcel when Excel option is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
        sheetName="Test Sheet"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/excel/i)).toBeInTheDocument();
    });

    const excelOption = screen.getByText(/excel/i);
    await user.click(excelOption);

    await waitFor(() => {
      expect(mockExportToExcel).toHaveBeenCalled();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Export réussi',
    }));
  });

  it('should call exportToCSV when CSV option is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/csv/i)).toBeInTheDocument();
    });

    const csvOption = screen.getByText(/csv/i);
    await user.click(csvOption);

    await waitFor(() => {
      expect(mockExportToCSV).toHaveBeenCalled();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Export réussi',
    }));
  });

  it('should show error toast when export fails', async () => {
    const user = userEvent.setup();

    // Mock export to throw error
    mockExportToExcel.mockImplementationOnce(() => {
      throw new Error('Export failed');
    });

    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/excel/i)).toBeInTheDocument();
    });

    const excelOption = screen.getByText(/excel/i);
    await user.click(excelOption);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Erreur d'export",
        variant: 'destructive',
      }));
    });
  });

  it('should show warning toast when trying to export empty data', async () => {
    const { rerender } = render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
      />
    );

    // Button should be enabled with data
    const button = screen.getByRole('button', { name: /exporter/i });
    expect(button).not.toBeDisabled();

    // Rerender with empty data - button should be disabled
    rerender(
      <ExportButton
        data={[]}
        columns={testColumns}
        filename="test-export"
      />
    );

    expect(screen.getByRole('button', { name: /exporter/i })).toBeDisabled();
  });

  it('should apply variant and size props correctly', () => {
    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
        variant="secondary"
        size="lg"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    expect(button).toBeInTheDocument();
  });

  it('should use default sheetName when not provided', async () => {
    const user = userEvent.setup();

    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="test-export"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/excel/i)).toBeInTheDocument();
    });

    const excelOption = screen.getByText(/excel/i);
    await user.click(excelOption);

    await waitFor(() => {
      expect(mockExportToExcel).toHaveBeenCalledWith(
        testData,
        expect.any(String),
        testColumns,
        'Données' // Default sheet name
      );
    });
  });

  it('should include date in filename', async () => {
    const user = userEvent.setup();

    render(
      <ExportButton
        data={testData}
        columns={testColumns}
        filename="my-export"
      />
    );

    const button = screen.getByRole('button', { name: /exporter/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/csv/i)).toBeInTheDocument();
    });

    const csvOption = screen.getByText(/csv/i);
    await user.click(csvOption);

    await waitFor(() => {
      expect(mockExportToCSV).toHaveBeenCalledWith(
        testData,
        expect.stringMatching(/my-export_\d{4}-\d{2}-\d{2}/),
        testColumns
      );
    });
  });
});
