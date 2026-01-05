import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../empty-state';
import { Users, FolderOpen } from 'lucide-react';

describe('EmptyState', () => {
  it('should render with required props', () => {
    render(<EmptyState title="No data available" />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render with description', () => {
    render(
      <EmptyState
        title="No data"
        description="There is no data to display at the moment."
      />
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('There is no data to display at the moment.')).toBeInTheDocument();
  });

  it('should render with custom icon', () => {
    const { container } = render(
      <EmptyState
        title="No users"
        icon={Users}
      />
    );

    // The icon should be rendered (svg element inside the component)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with action button', () => {
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="No items"
        action={{
          label: 'Add item',
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render children instead of action when provided', () => {
    render(
      <EmptyState title="Custom content">
        <div data-testid="custom-child">Custom form here</div>
      </EmptyState>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText('Custom form here')).toBeInTheDocument();
  });

  it('should prioritize children over action', () => {
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="Test"
        action={{
          label: 'Should not appear',
          onClick: handleClick,
        }}
      >
        <div data-testid="child-content">Child wins</div>
      </EmptyState>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /should not appear/i })).not.toBeInTheDocument();
  });

  it('should render without action or children', () => {
    render(<EmptyState title="Just a title" />);

    expect(screen.getByText('Just a title')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<EmptyState title="Test" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('should render action button without onClick handler', () => {
    render(
      <EmptyState
        title="Test"
        action={{
          label: 'Click me',
        }}
      />
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    // Should not throw when clicked
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});
