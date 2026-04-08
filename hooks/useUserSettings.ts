import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserSettings } from '../lib/types';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = useCallback(async function () {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setSettings(data as UserSettings | null);
    setLoading(false);
  }, []);

  const saveSettings = useCallback(async (updates: Partial<Omit<UserSettings, 'user_id'>>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'No session' };

    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      ...updates,
    });

    if (!error) {
      setSettings((prev) =>
        prev ? { ...prev, ...updates } : ({ user_id: user.id, ...updates } as UserSettings)
      );
    }

    return { error: error?.message ?? null };
  }, []);

  return { settings, loading, refetch: fetchSettings, saveSettings };
}
