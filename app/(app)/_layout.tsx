import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { UserSettingsProvider } from '../../contexts/UserSettingsContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <UserSettingsProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </UserSettingsProvider>
  );
}
