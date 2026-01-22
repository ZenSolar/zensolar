import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  GitCompare,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VersionRecord {
  id: string;
  version: number;
  version_name: string | null;
  is_active: boolean;
  answers: Record<string, string | string[] | number>;
  created_at: string;
  updated_at: string;
}

interface FrameworkQuestion {
  id: string;
  dimension: string;
  question: string;
  type: string;
  options?: { value: string; label: string }[];
}

interface VersionHistoryPanelProps {
  versions: VersionRecord[];
  currentAnswers: Record<string, string | string[] | number>;
  questions: FrameworkQuestion[];
  onLoadVersion: (version: VersionRecord) => void;
  onDeleteVersion: (versionId: string) => void;
  onSetActive: (versionId: string) => void;
  onRenameVersion: (versionId: string, newName: string) => void;
  isLoading?: boolean;
}

export function VersionHistoryPanel({
  versions,
  currentAnswers,
  questions,
  onLoadVersion,
  onDeleteVersion,
  onSetActive,
  onRenameVersion,
  isLoading,
}: VersionHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string | null, string | null]>([null, null]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const getAnswerDisplay = (questionId: string, answer: string | string[] | number | undefined) => {
    if (answer === undefined) return <span className="text-muted-foreground italic">Not answered</span>;
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return String(answer);
    
    if (Array.isArray(answer)) {
      const labels = answer.map(a => question.options?.find(o => o.value === a)?.label || a);
      return labels.join(", ");
    }
    
    if (typeof answer === "number") {
      return `$${answer}`;
    }
    
    return question.options?.find(o => o.value === answer)?.label || answer;
  };

  const toggleCompare = (versionId: string) => {
    setCompareVersions(prev => {
      if (prev[0] === versionId) return [prev[1], null];
      if (prev[1] === versionId) return [prev[0], null];
      if (prev[0] === null) return [versionId, prev[1]];
      if (prev[1] === null) return [prev[0], versionId];
      return [versionId, null];
    });
  };

  const getComparisonData = () => {
    if (!compareVersions[0] || !compareVersions[1]) return null;
    
    const v1 = versions.find(v => v.id === compareVersions[0]);
    const v2 = versions.find(v => v.id === compareVersions[1]);
    
    if (!v1 || !v2) return null;
    
    const differences: {
      questionId: string;
      question: string;
      dimension: string;
      v1Answer: string | string[] | number | undefined;
      v2Answer: string | string[] | number | undefined;
    }[] = [];
    
    questions.forEach(q => {
      const a1 = v1.answers[q.id];
      const a2 = v2.answers[q.id];
      
      const isDifferent = JSON.stringify(a1) !== JSON.stringify(a2);
      if (isDifferent) {
        differences.push({
          questionId: q.id,
          question: q.question,
          dimension: q.dimension,
          v1Answer: a1,
          v2Answer: a2,
        });
      }
    });
    
    return { v1, v2, differences };
  };

  const startRename = (version: VersionRecord) => {
    setEditingName(version.id);
    setTempName(version.version_name || `Version ${version.version}`);
  };

  const saveRename = (versionId: string) => {
    onRenameVersion(versionId, tempName);
    setEditingName(null);
    setTempName("");
  };

  const comparison = getComparisonData();

  return (
    <Card className="border-dashed">
      <CardHeader 
        className="cursor-pointer py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Version History</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {versions.length} version{versions.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 space-y-4">
              {/* Compare Button */}
              {compareVersions[0] && compareVersions[1] && (
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setShowCompareDialog(true)}
                >
                  <GitCompare className="h-4 w-4" />
                  Compare Selected Versions
                </Button>
              )}
              
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved versions yet. Save your first analysis to start tracking history.
                </p>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          version.is_active 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50",
                          compareVersions.includes(version.id) && "ring-2 ring-primary/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingName === version.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={tempName}
                                  onChange={(e) => setTempName(e.target.value)}
                                  className="h-7 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveRename(version.id);
                                    if (e.key === "Escape") setEditingName(null);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => saveRename(version.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditingName(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                className="font-medium text-sm hover:underline text-left"
                                onClick={() => startRename(version)}
                              >
                                {version.version_name || `Version ${version.version}`}
                              </button>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {Object.keys(version.answers).length} answers
                              </span>
                              {version.is_active && (
                                <Badge variant="default" className="text-[10px] py-0 h-4">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {/* Compare toggle */}
                            <Button
                              size="icon"
                              variant={compareVersions.includes(version.id) ? "default" : "ghost"}
                              className="h-7 w-7"
                              onClick={() => toggleCompare(version.id)}
                              title="Select for comparison"
                            >
                              <GitCompare className="h-3 w-3" />
                            </Button>
                            
                            {/* Set active */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => onSetActive(version.id)}
                              disabled={version.is_active}
                              title={version.is_active ? "Currently active" : "Set as active"}
                            >
                              {version.is_active ? (
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              ) : (
                                <StarOff className="h-3 w-3" />
                              )}
                            </Button>
                            
                            {/* Load */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => onLoadVersion(version)}
                            >
                              Load
                            </Button>
                            
                            {/* Delete */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDeleteVersion(version.id)}
                              disabled={versions.length === 1}
                              title={versions.length === 1 ? "Can't delete the only version" : "Delete version"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Comparison Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Version Comparison
            </DialogTitle>
            {comparison && (
              <DialogDescription>
                Comparing "{comparison.v1.version_name || `Version ${comparison.v1.version}`}" with "
                {comparison.v2.version_name || `Version ${comparison.v2.version}`}"
              </DialogDescription>
            )}
          </DialogHeader>
          
          {comparison && (
            <ScrollArea className="max-h-[60vh]">
              {comparison.differences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                  <p>These versions are identical!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {comparison.differences.length} difference{comparison.differences.length !== 1 ? "s" : ""}
                  </p>
                  
                  {comparison.differences.map((diff, i) => (
                    <Card key={diff.questionId} className="overflow-hidden">
                      <CardHeader className="py-3 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{diff.dimension}</Badge>
                          <span className="text-sm font-medium">{diff.question}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {comparison.v1.version_name || `Version ${comparison.v1.version}`}
                            </p>
                            <p className="text-sm p-2 rounded bg-red-500/10 border border-red-500/20">
                              {getAnswerDisplay(diff.questionId, diff.v1Answer)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {comparison.v2.version_name || `Version ${comparison.v2.version}`}
                            </p>
                            <p className="text-sm p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                              {getAnswerDisplay(diff.questionId, diff.v2Answer)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
