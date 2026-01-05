import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AmountSelector } from "../AmountSelector";

describe("AmountSelector", () => {
  const defaultProps = {
    value: 10000,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the amount input with formatted value", () => {
    render(<AmountSelector {...defaultProps} />);

    const input = screen.getByRole("textbox");
    // Value contains 10000 formatted (regardless of space type)
    expect(input.getAttribute("value")).toContain("10");
    expect(input.getAttribute("value")).toContain("000");
  });

  it("renders all preset buttons", () => {
    render(<AmountSelector {...defaultProps} />);

    expect(screen.getByText("5 000 €")).toBeInTheDocument();
    expect(screen.getByText("10 000 €")).toBeInTheDocument();
    expect(screen.getByText("25 000 €")).toBeInTheDocument();
    expect(screen.getByText("50 000 €")).toBeInTheDocument();
    expect(screen.getByText("100 000 €")).toBeInTheDocument();
    expect(screen.getByText("200 000 €")).toBeInTheDocument();
  });

  it("calls onChange when preset is clicked", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText("25 000 €"));
    expect(onChange).toHaveBeenCalledWith(25000);
  });

  it("highlights the active preset button", () => {
    render(<AmountSelector {...defaultProps} value={25000} />);

    const activeButton = screen.getByText("25 000 €");
    expect(activeButton).toHaveClass("bg-primary");
  });

  it("renders increment buttons", () => {
    render(<AmountSelector {...defaultProps} />);

    // Find all green increment buttons
    const buttons = screen.getAllByRole("button");
    const incrementButtons = buttons.filter(btn =>
      btn.classList.contains("text-emerald-600")
    );
    expect(incrementButtons.length).toBe(2);
  });

  it("renders decrement buttons", () => {
    render(<AmountSelector {...defaultProps} />);

    // Find all red decrement buttons
    const buttons = screen.getAllByRole("button");
    const decrementButtons = buttons.filter(btn =>
      btn.classList.contains("text-red-600")
    );
    expect(decrementButtons.length).toBe(2);
  });

  it("calls onChange with incremented value when +1k is clicked", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} value={10000} onChange={onChange} />);

    const buttons = screen.getAllByRole("button");
    const plus1kButton = buttons.find(btn =>
      btn.textContent?.includes("1k") && btn.classList.contains("text-emerald-600")
    );
    fireEvent.click(plus1kButton!);
    expect(onChange).toHaveBeenCalledWith(11000);
  });

  it("calls onChange with incremented value when +5k is clicked", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} value={10000} onChange={onChange} />);

    const buttons = screen.getAllByRole("button");
    const plus5kButton = buttons.filter(btn =>
      btn.textContent?.includes("5k") && btn.classList.contains("text-emerald-600")
    )[0];
    fireEvent.click(plus5kButton!);
    expect(onChange).toHaveBeenCalledWith(15000);
  });

  it("calls onChange with decremented value when -1k is clicked", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} value={10000} onChange={onChange} />);

    const buttons = screen.getAllByRole("button");
    const minus1kButton = buttons.find(btn =>
      btn.textContent?.includes("1k") && btn.classList.contains("text-red-600")
    );
    fireEvent.click(minus1kButton!);
    expect(onChange).toHaveBeenCalledWith(9000);
  });

  it("calls onChange with decremented value when -5k is clicked", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} value={10000} onChange={onChange} />);

    const buttons = screen.getAllByRole("button");
    const minus5kButton = buttons.filter(btn =>
      btn.textContent?.includes("5k") && btn.classList.contains("text-red-600")
    )[0];
    fireEvent.click(minus5kButton!);
    expect(onChange).toHaveBeenCalledWith(5000);
  });

  it("disables decrement buttons when value is less than amount", () => {
    render(<AmountSelector {...defaultProps} value={500} />);

    const buttons = screen.getAllByRole("button");
    const decrementButtons = buttons.filter(btn =>
      btn.classList.contains("text-red-600")
    );

    decrementButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it("does not allow value to go below 0", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} value={500} onChange={onChange} />);

    const buttons = screen.getAllByRole("button");
    const decrementButtons = buttons.filter(btn =>
      btn.classList.contains("text-red-600")
    );

    decrementButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it("calls onChange when input value changes", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "15000" } });

    expect(onChange).toHaveBeenCalledWith(15000);
  });

  it("handles non-numeric input gracefully", () => {
    const onChange = vi.fn();
    render(<AmountSelector {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("displays the euro symbol", () => {
    render(<AmountSelector {...defaultProps} />);

    expect(screen.getByText("€")).toBeInTheDocument();
  });
});
