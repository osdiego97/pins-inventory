import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!session) return;

    async function checkOnboarding() {
      const { data } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', session!.user.id)
        .maybeSingle();
      setNeedsOnboarding(!data);
      setOnboardingChecked(true);
    }

    checkOnboarding();
  }, [session]);

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!onboardingChecked) return null;
  if (needsOnboarding) return <Redirect href="/(app)/onboarding" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
