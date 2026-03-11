import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <View className="flex-1 bg-surface" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}
