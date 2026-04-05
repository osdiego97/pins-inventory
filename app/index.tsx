import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!session) return;

    async function checkOnboarding() {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('user_id')
          .eq('user_id', session!.user.id)
          .maybeSingle();
        setNeedsOnboarding(!data);
      } catch (_) {
        setNeedsOnboarding(false);
      } finally {
        setOnboardingChecked(true);
      }
    }

    checkOnboarding();
  }, [session]);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0f0f0f' }} />;
  if (!session) return <Redirect href="/(auth)/login" />;

  if (!onboardingChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#e8c97e" />
      </View>
    );
  }

  if (needsOnboarding) return <Redirect href="/(app)/onboarding" />;
  return <Redirect href="/(app)" />;
}
