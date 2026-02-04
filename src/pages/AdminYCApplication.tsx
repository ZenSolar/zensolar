import { ExportButtons } from "@/components/admin/ExportButtons";
import { EditableYCCard } from "@/components/admin/EditableYCCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, FileText, Rocket, Users, Lightbulb, PieChart, HelpCircle, Shield, Heart, Loader2 } from "lucide-react";
import { useYCContent, type YCSection, type YCQuestion } from "@/hooks/useYCContent";

// Helper to get section icon
const getSectionIcon = (sectionKey: string) => {
  switch (sectionKey) {
    case "founders": return <Users className="h-5 w-5 text-primary" />;
    case "company": return <FileText className="h-5 w-5 text-primary" />;
    case "progress": return <Rocket className="h-5 w-5 text-primary" />;
    case "idea": return <Lightbulb className="h-5 w-5 text-primary" />;
    case "equity": return <PieChart className="h-5 w-5 text-primary" />;
    case "curious": return <HelpCircle className="h-5 w-5 text-primary" />;
    default: return <FileText className="h-5 w-5 text-primary" />;
  }
};

// YC Application data structured for export
const getYCDataFromSections = (sections: YCSection[]) => {
  const data: Array<{ section: string; question: string; answer: string }> = [];
  sections.forEach((section) => {
    Object.values(section.content).forEach((q: YCQuestion) => {
      data.push({
        section: section.section_title,
        question: q.question,
        answer: q.answer,
      });
    });
  });
  return data;
};

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

// Render Quick Reference section
function QuickReferenceSection({ section, isAdmin, isSaving, onUpdate }: { 
  section: YCSection; 
  isAdmin: boolean;
  isSaving: boolean;
  onUpdate: (questionKey: string, newAnswer: string) => void;
}) {
  const content = section.content;
  
  return (
    <Card className="print:shadow-none print:border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Quick Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
        {Object.entries(content).map(([key, q]) => (
          <div key={key} className="group relative">
            <span className="font-medium">{q.question}:</span>{" "}
            {isAdmin ? (
              <span 
                className="cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
                onClick={() => {
                  const newValue = prompt(`Edit ${q.question}:`, q.answer);
                  if (newValue !== null && newValue !== q.answer) {
                    onUpdate(key, newValue);
                  }
                }}
              >
                {q.answer}
              </span>
            ) : (
              <span>{q.answer}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Render IP Protection section
function IPProtectionSection({ section, isAdmin, isSaving, onUpdate }: { 
  section: YCSection; 
  isAdmin: boolean;
  isSaving: boolean;
  onUpdate: (questionKey: string, newAnswer: string) => void;
}) {
  const content = section.content;
  
  const getBadgeStyle = (key: string) => {
    switch (key) {
      case "patent": return "border-green-500 text-green-600";
      case "trademark": return "border-amber-500 text-amber-600";
      case "trade_secret": return "border-blue-500 text-blue-600";
      default: return "";
    }
  };

  const getBadgeLabel = (key: string) => {
    switch (key) {
      case "patent": return "Patent";
      case "trademark": return "Trademark";
      case "trade_secret": return "Trade Secret";
      default: return key;
    }
  };
  
  return (
    <Card className="print:shadow-none border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Intellectual Property Protection
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="grid md:grid-cols-2 gap-3">
          {Object.entries(content).map(([key, q]) => (
            <div key={key} className="flex items-center gap-2 group">
              <Badge variant="outline" className={getBadgeStyle(key)}>
                {getBadgeLabel(key)}
              </Badge>
              {isAdmin ? (
                <span 
                  className="cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
                  onClick={() => {
                    const newValue = prompt(`Edit ${q.question}:`, q.answer);
                    if (newValue !== null && newValue !== q.answer) {
                      onUpdate(key, newValue);
                    }
                  }}
                >
                  {key === "trademark" ? <strong>Mint-on-Proof™</strong> : null}
                  {key === "trademark" ? " — " : ""}{q.answer.replace("Mint-on-Proof™ — ", "")}
                </span>
              ) : (
                <span>
                  {key === "trademark" ? <strong>Mint-on-Proof™</strong> : null}
                  {key === "trademark" ? " — " : ""}{q.answer.replace("Mint-on-Proof™ — ", "")}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Render a generic section with editable cards
function GenericSection({ section, isAdmin, isSaving, onUpdate, onStatusChange }: { 
  section: YCSection; 
  isAdmin: boolean;
  isSaving: boolean;
  onUpdate: (questionKey: string, newAnswer: string) => void;
  onStatusChange: (questionKey: string, newStatus: YCQuestion["status"]) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {getSectionIcon(section.section_key)}
        {section.section_title}
      </h2>

      {Object.entries(section.content).map(([key, q]) => (
        <EditableYCCard
          key={key}
          question={q.question}
          answer={q.answer}
          status={q.status}
          isEditable={isAdmin}
          isSaving={isSaving}
          onSave={(newAnswer) => onUpdate(key, newAnswer)}
          onStatusChange={(newStatus) => onStatusChange(key, newStatus)}
        />
      ))}
    </section>
  );
}

export default function AdminYCApplication() {
  const { 
    sections, 
    isLoading, 
    isSaving, 
    isAdmin, 
    updateQuestion, 
    updateQuestionStatus 
  } = useYCContent();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Find specific sections
  const quickRefSection = sections.find(s => s.section_key === "quick_reference");
  const ipSection = sections.find(s => s.section_key === "ip_protection");
  const otherSections = sections.filter(s => 
    s.section_key !== "quick_reference" && 
    s.section_key !== "ip_protection" &&
    s.section_key !== "batch_preference"
  );
  const batchSection = sections.find(s => s.section_key === "batch_preference");

  return (
    <div className="container max-w-4xl py-8 space-y-8 print:py-4 print:space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">YC Application</h1>
          <p className="text-muted-foreground">
            Spring 2026 — Complete Q&A Reference
            {isAdmin && (
              <span className="ml-2 text-xs text-primary">(Click to edit)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
          <ExportButtons 
            pageTitle="ZenSolar YC Application" 
            getData={() => getYCDataFromSections(sections)}
            getFileName={() => `zensolar-yc-application-${new Date().toISOString().split('T')[0]}`}
          />
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ZenSolar — YC Application (Spring 2026)</h1>
        <p className="text-sm text-muted-foreground">https://beta.zen.solar</p>
      </div>

      {/* Quick Reference Card */}
      {quickRefSection && (
        <QuickReferenceSection 
          section={quickRefSection}
          isAdmin={isAdmin}
          isSaving={isSaving}
          onUpdate={(key, value) => updateQuestion("quick_reference", key, value)}
        />
      )}

      {/* IP Protection Summary */}
      {ipSection && (
        <IPProtectionSection 
          section={ipSection}
          isAdmin={isAdmin}
          isSaving={isSaving}
          onUpdate={(key, value) => updateQuestion("ip_protection", key, value)}
        />
      )}

      <Separator />

      {/* Other Sections */}
      {otherSections.map((section, index) => (
        <div key={section.section_key}>
          <GenericSection
            section={section}
            isAdmin={isAdmin}
            isSaving={isSaving}
            onUpdate={(key, value) => updateQuestion(section.section_key, key, value)}
            onStatusChange={(key, status) => updateQuestionStatus(section.section_key, key, status)}
          />
          {index < otherSections.length - 1 && <Separator className="mt-8" />}
        </div>
      ))}

      <Separator />

      {/* Batch Preference */}
      {batchSection && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Batch Preference</h2>
          <Card className="print:shadow-none">
            <CardContent className="pt-6 text-sm">
              <p 
                className={isAdmin ? "cursor-pointer hover:bg-muted/50 rounded p-2 -m-2" : ""}
                onClick={() => {
                  if (isAdmin) {
                    const batchQ = batchSection.content["batch"];
                    if (batchQ) {
                      const newValue = prompt("Edit Batch Preference:", batchQ.answer);
                      if (newValue !== null && newValue !== batchQ.answer) {
                        updateQuestion("batch_preference", "batch", newValue);
                      }
                    }
                  }
                }}
              >
                <strong>{batchSection.content["batch"]?.answer || "Spring 2026"}</strong>
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
        ZenSolar — YC Application (Spring 2026) — Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
