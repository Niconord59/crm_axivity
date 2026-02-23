"use client";

import { Mail, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailComposer } from "@/components/emails/EmailComposer";
import { EmailTemplateList } from "@/components/emails/EmailTemplateList";

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
        <p className="text-muted-foreground">
          Envoyez des emails personnalisés à vos contacts avec des templates.
        </p>
      </div>

      <Tabs defaultValue="envoyer">
        <TabsList>
          <TabsTrigger value="envoyer" className="gap-2">
            <Mail className="h-4 w-4" />
            Envoyer
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="envoyer" className="mt-6">
          <EmailComposer />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <EmailTemplateList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
