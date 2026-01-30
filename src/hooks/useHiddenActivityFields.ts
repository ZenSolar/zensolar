import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Valid field types that can be hidden
export type HideableField = 'solar' | 'ev_miles' | 'battery' | 'charging' | 'supercharger' | 'home_charger';

export function useHiddenActivityFields() {
  const [hiddenFields, setHiddenFields] = useState<HideableField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch hidden fields from profile on mount
  useEffect(() => {
    const fetchHiddenFields = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('hidden_activity_fields')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching hidden fields:', error);
        }

        if (profile?.hidden_activity_fields) {
          setHiddenFields(profile.hidden_activity_fields as HideableField[]);
        }
      } catch (error) {
        console.error('Failed to fetch hidden fields:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHiddenFields();
  }, []);

  // Hide a field
  const hideField = useCallback(async (field: HideableField) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newHiddenFields = [...hiddenFields, field];
      
      const { error } = await supabase
        .from('profiles')
        .update({ hidden_activity_fields: newHiddenFields })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error hiding field:', error);
        toast.error('Failed to hide field');
        return false;
      }

      setHiddenFields(newHiddenFields);
      toast.success('Field hidden. Tap "Show hidden" to restore.');
      return true;
    } catch (error) {
      console.error('Failed to hide field:', error);
      toast.error('Failed to hide field');
      return false;
    }
  }, [hiddenFields]);

  // Show/restore a field
  const showField = useCallback(async (field: HideableField) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newHiddenFields = hiddenFields.filter(f => f !== field);
      
      const { error } = await supabase
        .from('profiles')
        .update({ hidden_activity_fields: newHiddenFields })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error showing field:', error);
        toast.error('Failed to restore field');
        return false;
      }

      setHiddenFields(newHiddenFields);
      toast.success('Field restored');
      return true;
    } catch (error) {
      console.error('Failed to restore field:', error);
      toast.error('Failed to restore field');
      return false;
    }
  }, [hiddenFields]);

  // Show all hidden fields
  const showAllFields = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ hidden_activity_fields: [] })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error showing all fields:', error);
        toast.error('Failed to restore fields');
        return false;
      }

      setHiddenFields([]);
      toast.success('All fields restored');
      return true;
    } catch (error) {
      console.error('Failed to restore all fields:', error);
      toast.error('Failed to restore fields');
      return false;
    }
  }, []);

  // Check if a field is hidden
  const isFieldHidden = useCallback((field: HideableField) => {
    return hiddenFields.includes(field);
  }, [hiddenFields]);

  return {
    hiddenFields,
    isLoading,
    hideField,
    showField,
    showAllFields,
    isFieldHidden,
    hasHiddenFields: hiddenFields.length > 0,
  };
}
