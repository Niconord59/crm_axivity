import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InteractionTimeline } from "../InteractionTimeline";
import type { Interaction } from "@/types";

describe("InteractionTimeline", () => {
  const mockInteractions: Interaction[] = [
    {
      id: "1",
      objet: "Appel de découverte",
      type: "Appel",
      date: "2025-12-20T14:30:00.000Z",
      resume: "Discussion sur les besoins du projet",
      contact: ["contact-1"],
      client: ["client-1"],
    },
    {
      id: "2",
      objet: "Envoi de documentation",
      type: "Email",
      date: "2025-12-21T10:00:00.000Z",
      resume: "Envoi de la présentation commerciale",
      prochaineTache: "Relancer dans 3 jours",
      contact: ["contact-1"],
      client: ["client-1"],
    },
    {
      id: "3",
      objet: "Réunion de présentation",
      type: "Réunion",
      date: "2025-12-22T09:00:00.000Z",
      resume: "Présentation de la solution",
      contact: ["contact-1"],
      client: ["client-1"],
    },
    {
      id: "4",
      objet: "Note interne",
      type: "Note",
      date: "2025-12-23T16:00:00.000Z",
      resume: "Client très intéressé",
      contact: ["contact-1"],
      client: ["client-1"],
    },
  ];

  it("renders loading state", () => {
    render(<InteractionTimeline interactions={undefined} isLoading={true} />);

    // Check for loading spinner by its animation class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders empty state when no interactions", () => {
    render(<InteractionTimeline interactions={[]} isLoading={false} />);

    expect(screen.getByText("Aucune interaction")).toBeInTheDocument();
    expect(screen.getByText("Les appels et emails seront enregistrés ici")).toBeInTheDocument();
  });

  it("renders empty state when interactions is undefined", () => {
    render(<InteractionTimeline interactions={undefined} isLoading={false} />);

    expect(screen.getByText("Aucune interaction")).toBeInTheDocument();
  });

  it("renders interaction count", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    expect(screen.getByText("4 interactions")).toBeInTheDocument();
  });

  it("renders singular interaction count", () => {
    render(<InteractionTimeline interactions={[mockInteractions[0]]} isLoading={false} />);

    expect(screen.getByText("1 interaction")).toBeInTheDocument();
  });

  it("renders the historique badge", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    expect(screen.getByText("Historique")).toBeInTheDocument();
  });

  it("renders interaction objects", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    expect(screen.getByText("Appel de découverte")).toBeInTheDocument();
    expect(screen.getByText("Envoi de documentation")).toBeInTheDocument();
    expect(screen.getByText("Réunion de présentation")).toBeInTheDocument();
    expect(screen.getByText("Note interne")).toBeInTheDocument();
  });

  it("renders interaction types as badges", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    expect(screen.getByText("Appel")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Réunion")).toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
  });

  it("renders interaction summaries", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    expect(screen.getByText("Discussion sur les besoins du projet")).toBeInTheDocument();
    expect(screen.getByText("Envoi de la présentation commerciale")).toBeInTheDocument();
    expect(screen.getByText("Présentation de la solution")).toBeInTheDocument();
    expect(screen.getByText("Client très intéressé")).toBeInTheDocument();
  });

  it("renders prochaine tache when present", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    expect(screen.getByText("Relancer dans 3 jours")).toBeInTheDocument();
  });

  it("applies correct styling for email interactions", () => {
    render(<InteractionTimeline interactions={[mockInteractions[1]]} isLoading={false} />);

    const container = screen.getByText("Envoi de documentation").closest(".rounded-xl");
    expect(container).toHaveClass("bg-blue-50/50");
    expect(container).toHaveClass("border-blue-200");
  });

  it("applies correct styling for note interactions", () => {
    render(<InteractionTimeline interactions={[mockInteractions[3]]} isLoading={false} />);

    const container = screen.getByText("Note interne").closest(".rounded-xl");
    expect(container).toHaveClass("bg-amber-50/50");
    expect(container).toHaveClass("border-amber-200");
  });

  it("renders the timeline line", () => {
    render(<InteractionTimeline interactions={mockInteractions} isLoading={false} />);

    const timelineLine = document.querySelector(".absolute.left-4.top-0.bottom-0.w-px.bg-border");
    expect(timelineLine).toBeInTheDocument();
  });
});
