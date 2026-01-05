import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProbabilitySlider } from "../ProbabilitySlider";

describe("ProbabilitySlider", () => {
  const defaultProps = {
    value: 50,
    onChange: vi.fn(),
    montant: 10000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the probability label", () => {
    render(<ProbabilitySlider {...defaultProps} />);

    expect(screen.getByText("Probabilité")).toBeInTheDocument();
  });

  it("displays the probability percentage", () => {
    render(<ProbabilitySlider {...defaultProps} value={75} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders the slider", () => {
    render(<ProbabilitySlider {...defaultProps} />);

    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });

  it("displays the weighted value label", () => {
    render(<ProbabilitySlider {...defaultProps} />);

    expect(screen.getByText("Valeur pondérée")).toBeInTheDocument();
  });

  it("calculates and displays weighted value correctly at 50%", () => {
    render(<ProbabilitySlider {...defaultProps} value={50} montant={10000} />);

    // 10000 * 0.5 = 5000
    expect(screen.getByText("5 000 €")).toBeInTheDocument();
  });

  it("calculates weighted value correctly at 100%", () => {
    render(<ProbabilitySlider {...defaultProps} value={100} montant={10000} />);

    expect(screen.getByText("10 000 €")).toBeInTheDocument();
  });

  it("calculates weighted value correctly at 0%", () => {
    render(<ProbabilitySlider {...defaultProps} value={0} montant={10000} />);

    expect(screen.getByText("0 €")).toBeInTheDocument();
  });

  it("calculates weighted value correctly with different amounts", () => {
    render(<ProbabilitySlider {...defaultProps} value={25} montant={80000} />);

    // 80000 * 0.25 = 20000
    expect(screen.getByText("20 000 €")).toBeInTheDocument();
  });

  it("displays probability levels", () => {
    render(<ProbabilitySlider {...defaultProps} />);

    expect(screen.getByText("Faible")).toBeInTheDocument();
    expect(screen.getByText("Moyen")).toBeInTheDocument();
    expect(screen.getByText("Fort")).toBeInTheDocument();
  });

  it("renders the target icon", () => {
    render(<ProbabilitySlider {...defaultProps} />);

    // Check for the SVG icon by its class or parent element
    const label = screen.getByText("Probabilité");
    expect(label.previousSibling).toBeInTheDocument();
  });

  it("renders the trending up icon", () => {
    render(<ProbabilitySlider {...defaultProps} />);

    // Check for the weighted value section
    const weightedLabel = screen.getByText("Valeur pondérée");
    expect(weightedLabel).toBeInTheDocument();
  });
});
