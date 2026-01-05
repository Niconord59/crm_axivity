import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatRelativeDate,
  isOverdue,
  daysDiff,
} from '../utils';

describe('cn (className merge)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });
});

describe('formatCurrency', () => {
  it('should format number as EUR currency', () => {
    const result = formatCurrency(1000);
    // French format: "1 000 €" (with non-breaking space)
    expect(result).toContain('1');
    expect(result).toContain('000');
    expect(result).toContain('€');
  });

  it('should format large numbers correctly', () => {
    const result = formatCurrency(1234567);
    expect(result).toContain('€');
  });

  it('should return N/A for undefined', () => {
    expect(formatCurrency(undefined)).toBe('N/A');
  });

  it('should return N/A for null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('should handle negative numbers', () => {
    const result = formatCurrency(-1000);
    expect(result).toContain('1');
    expect(result).toContain('000');
    expect(result).toContain('€');
  });
});

describe('formatPercentage', () => {
  it('should format decimal as percentage', () => {
    const result = formatPercentage(0.75);
    // French format may have non-breaking space
    expect(result).toMatch(/75\s*%/);
  });

  it('should format 100%', () => {
    const result = formatPercentage(1);
    expect(result).toMatch(/100\s*%/);
  });

  it('should format 0%', () => {
    const result = formatPercentage(0);
    expect(result).toMatch(/0\s*%/);
  });

  it('should return N/A for undefined', () => {
    expect(formatPercentage(undefined)).toBe('N/A');
  });

  it('should return N/A for null', () => {
    expect(formatPercentage(null)).toBe('N/A');
  });
});

describe('formatDate', () => {
  it('should format date in French locale', () => {
    const result = formatDate('2024-06-15');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should return N/A for empty string', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('should return N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should return N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('should handle ISO date strings', () => {
    const result = formatDate('2024-01-01T10:00:00Z');
    expect(result).toContain('2024');
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Aujourd\'hui" for today', () => {
    expect(formatRelativeDate('2024-06-15')).toBe("Aujourd'hui");
  });

  it('should return "Hier" for yesterday', () => {
    expect(formatRelativeDate('2024-06-14')).toBe('Hier');
  });

  it('should return "Il y a X jours" for less than a week', () => {
    expect(formatRelativeDate('2024-06-12')).toBe('Il y a 3 jours');
  });

  it('should return "Il y a X semaines" for less than a month', () => {
    expect(formatRelativeDate('2024-06-01')).toBe('Il y a 2 semaines');
  });

  it('should return "Il y a X mois" for less than a year', () => {
    expect(formatRelativeDate('2024-03-15')).toBe('Il y a 3 mois');
  });

  it('should return "Il y a X ans" for more than a year', () => {
    expect(formatRelativeDate('2022-06-15')).toBe('Il y a 2 ans');
  });

  it('should return N/A for empty string', () => {
    expect(formatRelativeDate('')).toBe('N/A');
  });

  it('should return N/A for undefined', () => {
    expect(formatRelativeDate(undefined)).toBe('N/A');
  });

  it('should return N/A for null', () => {
    expect(formatRelativeDate(null)).toBe('N/A');
  });
});

describe('isOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for past dates', () => {
    expect(isOverdue('2024-06-01')).toBe(true);
    expect(isOverdue('2024-01-01')).toBe(true);
  });

  it('should return false for future dates', () => {
    expect(isOverdue('2024-06-20')).toBe(false);
    expect(isOverdue('2025-01-01')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isOverdue('')).toBe(false);
  });
});

describe('daysDiff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return positive number for future dates', () => {
    const result = daysDiff('2024-06-20');
    expect(result).toBeGreaterThan(0);
  });

  it('should return negative number for past dates', () => {
    const result = daysDiff('2024-06-10');
    expect(result).toBeLessThan(0);
  });

  it('should return 0 or close to 0 for today', () => {
    const result = daysDiff('2024-06-15T12:00:00Z');
    expect(Math.abs(result)).toBeLessThanOrEqual(1);
  });

  it('should return 0 for undefined', () => {
    expect(daysDiff(undefined)).toBe(0);
  });

  it('should return 0 for null', () => {
    expect(daysDiff(null)).toBe(0);
  });

  it('should return 0 for empty string', () => {
    expect(daysDiff('')).toBe(0);
  });
});
