"use client";

import { useState } from "react";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
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
  PageHeader,
  PageLoading,
  ExportButton,
} from "@/components/shared";
import { opportuniteExportColumns } from "@/lib/export";
import { LeadImportDialog } from "@/components/opportunites";
import { OpportuniteForm } from "@/components/forms";
import { PipelineChart } from "@/components/charts";
import {
  useOpportunitesParStatut,
  useUpdateOpportuniteStatut,
} from "@/hooks/use-opportunites";
import { formatCurrency, formatDate } from "@/lib/utils";
import { type OpportunityStatus } from "@/types";

const KANBAN_COLUMNS: { status: OpportunityStatus; title: string; color: string }[] = [
  { status: "Lead", title: "Leads", color: "bg-gray-100" },
  { status: "Qualifié", title: "Qualifiés", color: "bg-blue-100" },
  { status: "Proposition", title: "Proposition", color: "bg-purple-100" },
  { status: "Négociation", title: "Négociation", color: "bg-orange-100" },
];

export default function OpportunitesPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const { data: opportunitesGroupees, isLoading } = useOpportunitesParStatut();
  const updateStatut = useUpdateOpportuniteStatut();

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

  if (isLoading) {
    return <PageLoading />;
  }

  const totalPipeline = KANBAN_COLUMNS.reduce((sum, col) => {
    const opps = opportunitesGroupees?.[col.status] || [];
    return sum + opps.reduce((s, o) => s + (o.valeurPonderee || 0), 0);
  }, 0);

  // Flatten grouped opportunities for export
  const allOpportunites = KANBAN_COLUMNS.flatMap(
    (col) => opportunitesGroupees?.[col.status] || []
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Pipeline Commercial"
        description={`Valeur pondérée totale: ${formatCurrency(totalPipeline)}`}
      >
        <div className="flex items-center gap-2">
          <ExportButton
            data={allOpportunites}
            columns={opportuniteExportColumns}
            filename="opportunites"
            sheetName="Pipeline"
          />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <OpportuniteForm />
        </div>
      </PageHeader>

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
      <DragDropContext onDragEnd={handleDragEnd}>
        <ScrollArea className="flex-1 -mx-4 px-4 lg:-mx-6 lg:px-6">
          <div className="flex gap-4 pb-4 min-w-max">
            {KANBAN_COLUMNS.map((column) => {
              const opportunities = opportunitesGroupees?.[column.status] || [];
              const columnTotal = opportunities.reduce(
                (sum, o) => sum + (o.valeurPonderee || 0),
                0
              );

              return (
                <div
                  key={column.status}
                  className="w-[300px] flex-shrink-0 flex flex-col"
                >
                  {/* Column Header */}
                  <div
                    className={`rounded-t-lg px-4 py-3 ${column.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{column.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {opportunities.length}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(columnTotal)}
                    </p>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-b-lg border border-t-0 bg-card p-2 min-h-[500px] ${
                          snapshot.isDraggingOver ? "bg-muted/50" : ""
                        }`}
                      >
                        <div className="space-y-2">
                          {opportunities.map((opp, index) => (
                            <Draggable
                              key={opp.id}
                              draggableId={opp.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <h4 className="font-medium text-sm line-clamp-2">
                                      {opp.nom}
                                    </h4>
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                          Valeur
                                        </span>
                                        <span className="font-medium">
                                          {formatCurrency(opp.valeurEstimee)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                          Probabilité
                                        </span>
                                        <span>
                                          {opp.probabilite
                                            ? `${Math.round(opp.probabilite * 100)}%`
                                            : "N/A"}
                                        </span>
                                      </div>
                                      {opp.dateClotureEstimee && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground">
                                            Clôture
                                          </span>
                                          <span className="text-xs">
                                            {formatDate(opp.dateClotureEstimee)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {opportunities.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Aucune opportunité
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

            {/* Won/Lost columns (non-draggable targets) */}
            <div className="w-[200px] flex-shrink-0">
              <div className="rounded-lg bg-green-100 px-4 py-3">
                <h3 className="font-semibold text-green-800">Gagnées</h3>
                <p className="text-sm text-green-600 mt-1">
                  {opportunitesGroupees?.["Gagné"]?.length || 0} opportunités
                </p>
              </div>
            </div>

            <div className="w-[200px] flex-shrink-0">
              <div className="rounded-lg bg-red-100 px-4 py-3">
                <h3 className="font-semibold text-red-800">Perdues</h3>
                <p className="text-sm text-red-600 mt-1">
                  {opportunitesGroupees?.["Perdu"]?.length || 0} opportunités
                </p>
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DragDropContext>

      {/* Lead Import Dialog */}
      <LeadImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
