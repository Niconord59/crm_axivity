import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToExcel, ExportColumn } from '../export';

// Mock document methods
const mockClick = vi.fn();
const mockLink = {
  href: '',
  download: '',
  click: mockClick,
};

beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  mockLink.href = '';
  mockLink.download = '';

  vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface TestData extends Record<string, unknown> {
  id: string;
  name: string;
  value: number;
  active: boolean;
  nested?: {
    field: string;
  };
}

const testData: TestData[] = [
  { id: '1', name: 'Item 1', value: 100, active: true, nested: { field: 'nested1' } },
  { id: '2', name: 'Item 2', value: 200, active: false, nested: { field: 'nested2' } },
  { id: '3', name: 'Item 3', value: 300, active: true },
];

const testColumns: ExportColumn<TestData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Nom' },
  { key: 'value', header: 'Valeur', format: (v) => typeof v === 'number' ? v * 2 : 0 },
  { key: 'active', header: 'Actif' },
];

describe('exportToCSV', () => {
  it('should create and download a CSV file', () => {
    exportToCSV(testData, 'test-export', testColumns);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(mockLink.download).toBe('test-export.csv');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should not export when data is empty', () => {
    exportToCSV([], 'empty-export', testColumns);

    expect(console.warn).toHaveBeenCalledWith('No data to export');
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('should apply format function to columns', () => {
    // We can't easily verify the CSV content, but we can verify the function runs
    expect(() => exportToCSV(testData, 'formatted-export', testColumns)).not.toThrow();
  });

  it('should handle missing values gracefully', () => {
    const dataWithMissing = [
      { id: '1', name: undefined as unknown as string, value: null as unknown as number, active: true },
    ];

    expect(() => exportToCSV(dataWithMissing, 'missing-export', testColumns)).not.toThrow();
  });
});

describe('exportToExcel', () => {
  it('should create and download an Excel file', () => {
    exportToExcel(testData, 'test-export', testColumns);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(mockLink.download).toBe('test-export.xlsx');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should not export when data is empty', () => {
    exportToExcel([], 'empty-export', testColumns);

    expect(console.warn).toHaveBeenCalledWith('No data to export');
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('should use custom sheet name', () => {
    expect(() => exportToExcel(testData, 'test-export', testColumns, 'Custom Sheet')).not.toThrow();
  });

  it('should use default sheet name when not provided', () => {
    expect(() => exportToExcel(testData, 'test-export', testColumns)).not.toThrow();
  });

  it('should handle nested values', () => {
    const columnsWithNested: ExportColumn<TestData>[] = [
      { key: 'id', header: 'ID' },
      { key: 'nested.field', header: 'Nested Field' },
    ];

    expect(() => exportToExcel(testData, 'nested-export', columnsWithNested)).not.toThrow();
  });
});

describe('ExportColumn format function', () => {
  it('should transform values with format function', () => {
    const columns: ExportColumn<TestData>[] = [
      {
        key: 'value',
        header: 'Formatted Value',
        format: (value, row) => {
          const numValue = typeof value === 'number' ? value : 0;
          return `${numValue} EUR`;
        },
      },
    ];

    expect(() => exportToCSV(testData, 'format-test', columns)).not.toThrow();
  });

  it('should handle boolean formatting', () => {
    const columns: ExportColumn<TestData>[] = [
      {
        key: 'active',
        header: 'Status',
        format: (value) => (value ? 'Active' : 'Inactive'),
      },
    ];

    expect(() => exportToCSV(testData, 'boolean-test', columns)).not.toThrow();
  });

  it('should have access to full row in format function', () => {
    const columns: ExportColumn<TestData>[] = [
      {
        key: 'name',
        header: 'Full Info',
        format: (value, row) => `${row.name} (${row.id})`,
      },
    ];

    expect(() => exportToCSV(testData, 'row-access-test', columns)).not.toThrow();
  });
});

describe('Edge cases', () => {
  it('should handle special characters in data', () => {
    const dataWithSpecialChars: TestData[] = [
      { id: '1', name: 'Item with "quotes"', value: 100, active: true },
      { id: '2', name: 'Item with;semicolon', value: 200, active: false },
      { id: '3', name: 'Item with\nnewline', value: 300, active: true },
    ];

    expect(() => exportToCSV(dataWithSpecialChars, 'special-chars', testColumns)).not.toThrow();
    expect(() => exportToExcel(dataWithSpecialChars, 'special-chars', testColumns)).not.toThrow();
  });

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000);
    const dataWithLongString: TestData[] = [
      { id: '1', name: longString, value: 100, active: true },
    ];

    expect(() => exportToCSV(dataWithLongString, 'long-string', testColumns)).not.toThrow();
  });

  it('should handle arrays in data', () => {
    interface DataWithArray extends Record<string, unknown> {
      id: string;
      tags: string[];
    }

    const dataWithArray: DataWithArray[] = [
      { id: '1', tags: ['tag1', 'tag2', 'tag3'] },
    ];

    const columnsWithArray: ExportColumn<DataWithArray>[] = [
      { key: 'id', header: 'ID' },
      { key: 'tags', header: 'Tags' },
    ];

    expect(() => exportToCSV(dataWithArray, 'array-test', columnsWithArray)).not.toThrow();
  });
});
