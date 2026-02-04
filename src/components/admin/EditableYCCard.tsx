import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, Pencil, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { YCQuestion } from "@/hooks/useYCContent";

interface EditableYCCardProps {
  question: string;
  answer: string;
  status?: YCQuestion["status"];
  isEditable: boolean;
  isSaving?: boolean;
  onSave: (newAnswer: string) => void;
  onStatusChange?: (newStatus: YCQuestion["status"]) => void;
  className?: string;
  children?: React.ReactNode;
}

export function EditableYCCard({
  question,
  answer,
  status = "ready",
  isEditable,
  isSaving,
  onSave,
  onStatusChange,
  className,
  children,
}: EditableYCCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(answer);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // Update editValue when answer prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(answer);
    }
  }, [answer, isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== answer) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(answer);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="secondary" className="ml-auto">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case "to-record":
        return (
          <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            To Record
          </Badge>
        );
      default:
        return null;
    }
  };

  const cardClassName = cn(
    "print:shadow-none group relative",
    status === "draft" && "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20",
    status === "to-record" && "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20",
    className
  );

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex-1">{question}</span>
          {getStatusBadge()}
          {isEditable && !isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] text-sm"
              placeholder="Enter your answer..."
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {onStatusChange && (
                  <select
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value as YCQuestion["status"])}
                    className="text-xs px-2 py-1 rounded border bg-background"
                  >
                    <option value="ready">Ready</option>
                    <option value="draft">Draft</option>
                    <option value="to-record">To Record</option>
                  </select>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : children ? (
          children
        ) : (
          <div 
            className="whitespace-pre-wrap cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors"
            onClick={() => isEditable && setIsEditing(true)}
          >
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
