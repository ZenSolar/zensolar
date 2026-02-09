import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface YCSection {
  id: string;
  section_key: string;
  section_title: string;
  content: Record<string, YCQuestion>;
  display_order: number;
}

export interface YCQuestion {
  question: string;
  answer: string;
  status?: "ready" | "draft" | "to-record";
  badge_color?: string;
  choice?: "yes" | "no";
}

export function useYCContent() {
  const [sections, setSections] = useState<YCSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc("is_admin", { _user_id: user.id });
        if (error) throw error;
        setIsAdmin(data === true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("yc_application_content")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Type assertion since we know the structure
      setSections((data || []) as unknown as YCSection[]);
    } catch (error) {
      console.error("Error fetching YC content:", error);
      toast({
        title: "Error loading content",
        description: "Failed to load YC application content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateQuestion = useCallback(
    async (sectionKey: string, questionKey: string, newAnswer: string) => {
      if (!isAdmin) return;

      setIsSaving(true);
      try {
        // Find the section
        const section = sections.find((s) => s.section_key === sectionKey);
        if (!section) throw new Error("Section not found");

        // Update the content
        const updatedContent = {
          ...section.content,
          [questionKey]: {
            ...section.content[questionKey],
            answer: newAnswer,
          },
        };

        const { error } = await supabase
          .from("yc_application_content")
          .update({ content: updatedContent as unknown as Json })
          .eq("section_key", sectionKey);

        if (error) throw error;

        // Update local state
        setSections((prev) =>
          prev.map((s) =>
            s.section_key === sectionKey
              ? { ...s, content: updatedContent }
              : s
          )
        );

        toast({
          title: "Saved",
          description: "Content updated successfully",
        });
      } catch (error) {
        console.error("Error saving content:", error);
        toast({
          title: "Error saving",
          description: "Failed to save changes",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [sections, isAdmin, toast]
  );

  const updateQuestionStatus = useCallback(
    async (sectionKey: string, questionKey: string, newStatus: YCQuestion["status"]) => {
      if (!isAdmin) return;

      setIsSaving(true);
      try {
        const section = sections.find((s) => s.section_key === sectionKey);
        if (!section) throw new Error("Section not found");

        const updatedContent = {
          ...section.content,
          [questionKey]: {
            ...section.content[questionKey],
            status: newStatus,
          },
        };

        const { error } = await supabase
          .from("yc_application_content")
          .update({ content: updatedContent as unknown as Json })
          .eq("section_key", sectionKey);

        if (error) throw error;

        setSections((prev) =>
          prev.map((s) =>
            s.section_key === sectionKey
              ? { ...s, content: updatedContent }
              : s
          )
        );
      } catch (error) {
        console.error("Error updating status:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [sections, isAdmin]
  );

  const updateQuestionChoice = useCallback(
    async (sectionKey: string, questionKey: string, newChoice: "yes" | "no") => {
      if (!isAdmin) return;

      setIsSaving(true);
      try {
        const section = sections.find((s) => s.section_key === sectionKey);
        if (!section) throw new Error("Section not found");

        const updatedContent = {
          ...section.content,
          [questionKey]: {
            ...section.content[questionKey],
            choice: newChoice,
          },
        };

        const { error } = await supabase
          .from("yc_application_content")
          .update({ content: updatedContent as unknown as Json })
          .eq("section_key", sectionKey);

        if (error) throw error;

        setSections((prev) =>
          prev.map((s) =>
            s.section_key === sectionKey
              ? { ...s, content: updatedContent }
              : s
          )
        );
      } catch (error) {
        console.error("Error updating choice:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [sections, isAdmin]
  );

  const addQuestion = useCallback(
    async (sectionKey: string, questionKey: string, question: YCQuestion) => {
      if (!isAdmin) return;

      setIsSaving(true);
      try {
        const section = sections.find((s) => s.section_key === sectionKey);
        if (!section) throw new Error("Section not found");

        const updatedContent = {
          ...section.content,
          [questionKey]: question,
        };

        const { error } = await supabase
          .from("yc_application_content")
          .update({ content: updatedContent as unknown as Json })
          .eq("section_key", sectionKey);

        if (error) throw error;

        setSections((prev) =>
          prev.map((s) =>
            s.section_key === sectionKey
              ? { ...s, content: updatedContent }
              : s
          )
        );

        toast({
          title: "Added",
          description: "New question added successfully",
        });
      } catch (error) {
        console.error("Error adding question:", error);
        toast({
          title: "Error",
          description: "Failed to add question",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [sections, isAdmin, toast]
  );

  const deleteQuestion = useCallback(
    async (sectionKey: string, questionKey: string) => {
      if (!isAdmin) return;

      setIsSaving(true);
      try {
        const section = sections.find((s) => s.section_key === sectionKey);
        if (!section) throw new Error("Section not found");

        const { [questionKey]: removed, ...updatedContent } = section.content;

        const { error } = await supabase
          .from("yc_application_content")
          .update({ content: updatedContent as unknown as Json })
          .eq("section_key", sectionKey);

        if (error) throw error;

        setSections((prev) =>
          prev.map((s) =>
            s.section_key === sectionKey
              ? { ...s, content: updatedContent }
              : s
          )
        );

        toast({
          title: "Deleted",
          description: "Question removed successfully",
        });
      } catch (error) {
        console.error("Error deleting question:", error);
        toast({
          title: "Error",
          description: "Failed to delete question",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [sections, isAdmin, toast]
  );

  return {
    sections,
    isLoading,
    isSaving,
    isAdmin,
    isAuthenticated,
    updateQuestion,
    updateQuestionStatus,
    updateQuestionChoice,
    addQuestion,
    deleteQuestion,
    refetch: fetchContent,
  };
}
