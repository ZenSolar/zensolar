import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { YCQuestion } from "@/hooks/useYCContent";

interface YCChoiceQuestionProps {
  question: string;
  answer: string;
  choice: "yes" | "no";
  status?: YCQuestion["status"];
  isEditable: boolean;
  isSaving?: boolean;
  onChoiceChange?: (newChoice: "yes" | "no") => void;
}

export function YCChoiceQuestion({
  question,
  answer,
  choice,
  status,
  isEditable,
  isSaving,
  onChoiceChange,
}: YCChoiceQuestionProps) {
  const options = ["Yes", "No"] as const;

  return (
    <Card className="print:shadow-none group relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex-1">{question}</span>
          {status === "ready" && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        {/* Yes/No radio display */}
        <div className="flex gap-6">
          {options.map((option) => {
            const isSelected = choice === option.toLowerCase();
            return (
              <button
                key={option}
                type="button"
                disabled={!isEditable || isSaving}
                onClick={() => isEditable && onChoiceChange?.(option.toLowerCase() as "yes" | "no")}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isEditable && "cursor-pointer hover:text-primary",
                  !isEditable && "cursor-default"
                )}
              >
                {isSelected ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(isSelected && "font-medium")}>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Supporting detail text */}
        {answer && (
          <div className="whitespace-pre-wrap text-muted-foreground border-l-2 border-muted pl-3">
            {answer.split("\n\n").map((paragraph, i) => (
              <p key={i} className={i > 0 ? "mt-2" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
