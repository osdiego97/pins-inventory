import { createContext, useContext, ReactNode } from 'react';
import { useUserSettings } from '../hooks/useUserSettings';
import { UserSettings } from '../lib/types';

interface UserSettingsContextValue {
  settings: UserSettings | null;
  loading: boolean;
  saveSettings: (updates: Partial<Omit<UserSettings, 'user_id'>>) => Promise<{ error: string | null }>;
  refetch: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const value = useUserSettings();
  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettingsContext() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettingsContext must be used within UserSettingsProvider');
  return ctx;
}
