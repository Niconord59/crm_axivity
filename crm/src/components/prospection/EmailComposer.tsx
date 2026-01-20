"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  User,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSendEmail, generateFollowUpEmail } from "@/hooks/use-email";
import { toast } from "sonner";

interface EmailSentData {
  messageId: string;
  to: string;
  subject: string;
  body: string;
}

interface EmailComposerProps {
  prospectEmail: string;
  prospectPrenom?: string;
  prospectNom: string;
  entreprise?: string;
  leftVoicemail?: boolean;
  onEmailSent?: (data: EmailSentData) => void;
  onCancel?: () => void;
  className?: string;
}

export function EmailComposer({
  prospectEmail,
  prospectPrenom,
  prospectNom,
  entreprise,
  leftVoicemail = false,
  onEmailSent,
  onCancel,
  className,
}: EmailComposerProps) {
  const { mutate: sendEmail, isPending, isSuccess, isError, error } = useSendEmail();

  // Generate initial email template
  const initialEmail = generateFollowUpEmail({
    prospectPrenom,
    prospectNom,
    entreprise,
    leftVoicemail,
  });

  const [to, setTo] = useState(prospectEmail);
  const [subject, setSubject] = useState(initialEmail.subject);
  const [body, setBody] = useState(initialEmail.body);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Update template when leftVoicemail changes
  useEffect(() => {
    const newEmail = generateFollowUpEmail({
      prospectPrenom,
      prospectNom,
      entreprise,
      leftVoicemail,
    });
    setBody(newEmail.body);
  }, [leftVoicemail, prospectPrenom, prospectNom, entreprise]);

  const handleSend = () => {
    if (!to || !subject || !body) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    sendEmail(
      { to, subject, body },
      {
        onSuccess: (data) => {
          toast.success("Email envoyé avec succès", {
            description: `À: ${to}`,
          });
          if (data.messageId && onEmailSent) {
            onEmailSent({
              messageId: data.messageId,
              to,
              subject,
              body,
            });
          }
        },
        onError: (err) => {
          toast.error("Erreur lors de l'envoi", {
            description: err.message,
          });
        },
      }
    );
  };

  const prospectFullName = prospectPrenom
    ? `${prospectPrenom} ${prospectNom}`
    : prospectNom;

  if (isSuccess) {
    return (
      <div className={cn("rounded-lg border bg-green-50 border-green-200 p-6", className)}>
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-800">Email envoyé !</h4>
            <p className="text-sm text-green-600 mt-1">
              Votre email a été envoyé à {prospectFullName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Email de suivi</span>
          <Badge variant="secondary" className="text-xs">
            Brouillon
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreviewDialog(true)}
            className="h-8 px-2"
          >
            <Eye className="h-4 w-4 mr-1" />
            Aperçu
          </Button>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Email Form */}
      <div className="p-4 space-y-4">
        {/* To Field */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <Label className="text-sm text-muted-foreground w-8">À :</Label>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-3 py-1">
              <User className="h-3 w-3 text-primary" />
              <span className="text-sm font-medium">{prospectFullName}</span>
            </div>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm"
              placeholder="email@exemple.com"
            />
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <Label className="text-sm text-muted-foreground w-8">Objet :</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm font-medium"
            placeholder="Objet de l'email"
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 px-0 text-sm leading-relaxed"
            placeholder="Contenu de l'email..."
          />
        </div>

        {/* Error Message */}
        {isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{(error as Error)?.message || "Une erreur est survenue"}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AtSign className="h-3 w-3" />
            Envoyé depuis votre compte connecté
          </p>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={isPending || !to || !subject || !body}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu de l&apos;email
            </DialogTitle>
            <DialogDescription>
              Voici comment votre email apparaîtra au destinataire
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              {/* Email Header Preview */}
              <div className="pb-4 border-b space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">À :</span>
                  <span className="font-medium">{to}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Objet :</span>
                  <span className="font-medium">{subject}</span>
                </div>
              </div>
              {/* Email Body Preview */}
              <div className="pt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {body}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                onClick={() => {
                  setShowPreviewDialog(false);
                  handleSend();
                }}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer maintenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
