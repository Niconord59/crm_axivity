"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Target,
  FileText,
  TrendingUp,
  Trophy,
  XCircle,
  Briefcase,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import {
  PageHeader,
  PageLoading,
  ExportButton,
} from "@/components/shared";
import { opportuniteExportColumns } from "@/lib/export";
import { PipelineChart } from "@/components/charts";
import { OpportunityCard, OpportunityMiniSheet } from "@/components/opportunites";
import { QuoteEditorSheet } from "@/components/devis";
import {
  useOpportunitesParStatut,
  useUpdateOpportuniteStatut,
} from "@/hooks/use-opportunites";
import { usePipelineRealtime } from "@/hooks/use-realtime";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { type OpportunityStatus } from "@/types";

const KANBAN_COLUMNS: {
  status: OpportunityStatus;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    status: "Qualifié",
    title: "Qualifiés",
    description: "Le besoin client est confirmé et le budget est identifié. Prêt pour une proposition commerciale.",
    icon: Target,
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    status: "Proposition",
    title: "Proposition",
    description: "Un devis ou une offre commerciale a été envoyé au client. En attente de retour.",
    icon: FileText,
    gradient: "from-violet-500/10 to-violet-500/5",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    status: "Négociation",
    title: "Négociation",
    description: "Discussion en cours sur les termes, le prix ou le périmètre. Phase finale avant signature.",
    icon: TrendingUp,
    gradient: "from-orange-500/10 to-orange-500/5",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

export default function OpportunitesPage() {
  const [showChart, setShowChart] = useState(false);
  const [quoteOpportunityId, setQuoteOpportunityId] = useState<string | null>(null);
  const [miniSheetOpportunityId, setMiniSheetOpportunityId] = useState<string | null>(null);
  const { data: opportunitesGroupees, isLoading } = useOpportunitesParStatut();
  const updateStatut = useUpdateOpportuniteStatut();

  // S'abonner aux changements Realtime pour rafraîchir automatiquement
  usePipelineRealtime();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as OpportunityStatus;
    const destStatus = result.destination.droppableId as OpportunityStatus;

    if (sourceStatus === destStatus) return;

    const opportuniteId = result.draggableId;

    updateStatut.mutate({
      id: opportuniteId,
      statut: destStatus,
    });
  };

  const handleStatusChange = (id: string, status: OpportunityStatus) => {
    updateStatut.mutate({ id, statut: status });
  };

  const handleOpenQuote = (id: string) => {
    setQuoteOpportunityId(id);
  };

  const handleOpenMiniSheet = (id: string) => {
    setMiniSheetOpportunityId(id);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  // Calculate totals
  const totalPipeline = KANBAN_COLUMNS.reduce((sum, col) => {
    const opps = opportunitesGroupees?.[col.status] || [];
    return sum + opps.reduce((s, o) => s + (o.valeurPonderee || 0), 0);
  }, 0);

  const totalCount = KANBAN_COLUMNS.reduce((sum, col) => {
    return sum + (opportunitesGroupees?.[col.status]?.length || 0);
  }, 0);

  const wonCount = opportunitesGroupees?.["Gagné"]?.length || 0;
  const wonValue = opportunitesGroupees?.["Gagné"]?.reduce(
    (sum, o) => sum + (o.valeurEstimee || 0),
    0
  ) || 0;

  const lostCount = opportunitesGroupees?.["Perdu"]?.length || 0;

  // Flatten grouped opportunities for export
  const allOpportunites = KANBAN_COLUMNS.flatMap(
    (col) => opportunitesGroupees?.[col.status] || []
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Pipeline Commercial"
        description="Gérez vos opportunités et suivez votre pipeline"
      >
        <ExportButton
          data={allOpportunites}
          columns={opportuniteExportColumns}
          filename="opportunites"
          sheetName="Pipeline"
        />
      </PageHeader>

      {/* KPIs Cards */}
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground font-medium cursor-help flex items-center gap-1">
                        Pipeline actif
                        <HelpCircle className="h-3 w-3" />
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      <p>Nombre d'opportunités en cours (hors Gagnées et Perdues)</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground font-medium cursor-help flex items-center gap-1">
                        Valeur pondérée
                        <HelpCircle className="h-3 w-3" />
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>Somme des (Valeur × Probabilité) de toutes les opportunités actives. C'est la prévision réaliste de chiffre d'affaires.</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xl font-bold">{formatCurrency(totalPipeline)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground font-medium cursor-help flex items-center gap-1">
                        Gagnées
                        <HelpCircle className="h-3 w-3" />
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p>Affaires conclues avec succès. Le client a signé !</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xl font-bold">{wonCount} <span className="text-sm font-normal text-muted-foreground">({formatCurrency(wonValue)})</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground font-medium cursor-help flex items-center gap-1">
                        Perdues
                        <HelpCircle className="h-3 w-3" />
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      <p>Affaires non conclues : concurrent choisi, budget annulé, projet reporté...</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xl font-bold">{lostCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      {/* Toggle Chart Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowChart(!showChart)}
          className="text-muted-foreground"
        >
          {showChart ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Masquer les statistiques
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Afficher les statistiques
            </>
          )}
        </Button>
      </div>

      {/* Pipeline Chart (Collapsible) */}
      {showChart && (
        <div className="grid gap-4 md:grid-cols-2">
          <PipelineChart showLegend={false} />
        </div>
      )}

      {/* Kanban Board */}
      <TooltipProvider delayDuration={300}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map((column) => {
              const opportunities = opportunitesGroupees?.[column.status] || [];
              const columnTotal = opportunities.reduce(
                (sum, o) => sum + (o.valeurPonderee || 0),
                0
              );
              const Icon = column.icon;

              return (
                <div
                  key={column.status}
                  className="flex flex-col min-w-0"
                >
                  {/* Column Header */}
                  <div
                    className={cn(
                      "rounded-t-xl px-4 py-4 bg-gradient-to-br border border-b-0",
                      column.gradient
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", column.iconBg)}>
                        <Icon className={cn("h-5 w-5", column.iconColor)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="font-semibold flex items-center gap-1.5 cursor-help">
                                {column.title}
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
                              <p>{column.description}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-sm font-medium bg-background/80 px-2 py-0.5 rounded-full">
                            {opportunities.length}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatCurrency(columnTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 rounded-b-xl border border-t-0 bg-muted/30 p-3 min-h-[450px] transition-colors",
                          snapshot.isDraggingOver && "bg-muted/60 border-dashed"
                        )}
                      >
                        <div className="space-y-3">
                          {opportunities.map((opp, index) => (
                            <Draggable
                              key={opp.id}
                              draggableId={opp.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <OpportunityCard
                                    opportunity={opp}
                                    onStatusChange={handleStatusChange}
                                    onOpenQuote={handleOpenQuote}
                                    onOpenMiniSheet={handleOpenMiniSheet}
                                    isDragging={snapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {opportunities.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-3", column.iconBg, "opacity-50")}>
                                <Icon className={cn("h-6 w-6", column.iconColor, "opacity-50")} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Aucune opportunité
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Glissez une carte ici
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

            {/* Won column */}
            <div className="flex flex-col min-w-0">
              {/* Column Header */}
              <div className="rounded-t-xl px-4 py-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-b-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-semibold text-emerald-800 flex items-center gap-1.5 cursor-help">
                            Gagnées
                            <HelpCircle className="h-3.5 w-3.5 text-emerald-600/60" />
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px]">
                          <p>Affaires conclues avec succès. Pour marquer une opportunité comme gagnée : survolez la carte, cliquez sur ⋮, puis "Marquer Gagné".</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {wonCount}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-600 mt-0.5">
                      {formatCurrency(wonValue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards Area - Simplified read-only cards */}
              <div className="flex-1 rounded-b-xl border border-t-0 bg-emerald-50/30 p-3 min-h-[450px]">
                <div className="space-y-3">
                  {(opportunitesGroupees?.["Gagné"] || []).map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      simplified
                    />
                  ))}
                  {wonCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3 opacity-50">
                        <Trophy className="h-6 w-6 text-emerald-600 opacity-50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Aucune opportunité gagnée
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lost column */}
            <div className="flex flex-col min-w-0 hidden xl:flex">
              {/* Column Header */}
              <div className="rounded-t-xl px-4 py-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-b-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-semibold text-red-800 flex items-center gap-1.5 cursor-help">
                            Perdues
                            <HelpCircle className="h-3.5 w-3.5 text-red-600/60" />
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px]">
                          <p>Affaires non conclues. Pour marquer une opportunité comme perdue : survolez la carte, cliquez sur ⋮, puis "Marquer Perdu".</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {lostCount}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-0.5">
                      Clôturées sans succès
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards Area - Simplified read-only cards */}
              <div className="flex-1 rounded-b-xl border border-t-0 bg-red-50/30 p-3 min-h-[450px]">
                <div className="space-y-3">
                  {(opportunitesGroupees?.["Perdu"] || []).map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      simplified
                    />
                  ))}
                  {lostCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3 opacity-50">
                        <XCircle className="h-6 w-6 text-red-600 opacity-50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Aucune opportunité perdue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </DragDropContext>
      </TooltipProvider>

      {/* Quote Editor Sheet */}
      {quoteOpportunityId && (
        <QuoteEditorSheet
          opportuniteId={quoteOpportunityId}
          isOpen={!!quoteOpportunityId}
          onClose={() => setQuoteOpportunityId(null)}
        />
      )}

      {/* Mini Sheet for quick opportunity editing */}
      {miniSheetOpportunityId && (
        <OpportunityMiniSheet
          opportuniteId={miniSheetOpportunityId}
          isOpen={!!miniSheetOpportunityId}
          onClose={() => setMiniSheetOpportunityId(null)}
          onOpenQuoteEditor={() => {
            setMiniSheetOpportunityId(null);
            setQuoteOpportunityId(miniSheetOpportunityId);
          }}
        />
      )}
    </div>
  );
}
