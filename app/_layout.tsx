import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

function handleAuthUrl(url: string) {
  const fragment = url.split('#')[1];
  if (!fragment) return;
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token });
  }
}

export default function RootLayout() {
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    return () => sub.remove();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
