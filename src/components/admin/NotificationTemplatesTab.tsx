import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Edit2, Plus, Save, Users, Zap, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface NotificationTemplate {
  id: string;
  template_key: string;
  title_template: string;
  body_template: string;
  description: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  referral: Users,
  milestone: Zap,
  system: Info,
};

export function NotificationTemplatesTab() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_key: "",
    title_template: "",
    body_template: "",
    description: "",
    category: "system",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (template: NotificationTemplate) => {
      const { error } = await supabase
        .from("notification_templates")
        .update({
          title_template: template.title_template,
          body_template: template.body_template,
          description: template.description,
          category: template.category,
          is_active: template.is_active,
        })
        .eq("id", template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast.success("Template updated successfully");
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error("Failed to update template");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const { error } = await supabase
        .from("notification_templates")
        .insert({
          template_key: template.template_key,
          title_template: template.title_template,
          body_template: template.body_template,
          description: template.description || null,
          category: template.category,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast.success("Template created successfully");
      setIsCreateDialogOpen(false);
      setNewTemplate({
        template_key: "",
        title_template: "",
        body_template: "",
        description: "",
        category: "system",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast.success("Template deleted");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  const toggleActive = async (template: NotificationTemplate) => {
    const { error } = await supabase
      .from("notification_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);

    if (error) {
      toast.error("Failed to update template");
    } else {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "referral":
        return "bg-purple-500/10 text-purple-500";
      case "milestone":
        return "bg-amber-500/10 text-amber-500";
      case "system":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notification Templates</h2>
          <p className="text-muted-foreground text-sm">
            Manage push notification templates. Use {"{{variable}}"} for dynamic content.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => {
          const Icon = categoryIcons[template.category] || Bell;
          
          return (
            <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getCategoryColor(template.category)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.template_key}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {template.category}
                        </Badge>
                        {!template.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => toggleActive(template)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Title:</span>
                    <p className="text-sm">{template.title_template}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Body:</span>
                    <p className="text-sm">{template.body_template}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify the notification template. Use {"{{variable}}"} for dynamic values.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingTemplate.category}
                  onValueChange={(value) =>
                    setEditingTemplate({ ...editingTemplate, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title Template</Label>
                <Input
                  value={editingTemplate.title_template}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, title_template: e.target.value })
                  }
                  placeholder="🎉 Notification Title"
                />
              </div>
              <div className="space-y-2">
                <Label>Body Template</Label>
                <Textarea
                  value={editingTemplate.body_template}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, body_template: e.target.value })
                  }
                  placeholder="Your notification message with {{variables}}"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (internal)</Label>
                <Input
                  value={editingTemplate.description || ""}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, description: e.target.value })
                  }
                  placeholder="When this notification is sent"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingTemplate && updateMutation.mutate(editingTemplate)}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new notification template. Use {"{{variable}}"} for dynamic values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Key</Label>
              <Input
                value={newTemplate.template_key}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, template_key: e.target.value })
                }
                placeholder="my_custom_notification"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(value) =>
                  setNewTemplate({ ...newTemplate, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title Template</Label>
              <Input
                value={newTemplate.title_template}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, title_template: e.target.value })
                }
                placeholder="🎉 Notification Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Body Template</Label>
              <Textarea
                value={newTemplate.body_template}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, body_template: e.target.value })
                }
                placeholder="Your notification message with {{variables}}"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (internal)</Label>
              <Input
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, description: e.target.value })
                }
                placeholder="When this notification is sent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newTemplate)}
              disabled={createMutation.isPending || !newTemplate.template_key || !newTemplate.title_template}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
