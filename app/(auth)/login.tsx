import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

type Step = 'email' | 'sent';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');

  async function handleSendLink() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo enviar el enlace. Inténtalo de nuevo.');
      return;
    }

    setStep('sent');
  }

  if (step === 'sent') {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <Text className="text-4xl mb-4">📬</Text>
        <Text className="text-text-primary text-xl font-semibold mb-2">Revisa tu email</Text>
        <Text className="text-text-secondary text-base text-center mb-8">
          Te hemos enviado un enlace mágico a {email.trim().toLowerCase()}
        </Text>
        <TouchableOpacity onPress={() => setStep('email')}>
          <Text className="text-accent text-sm">Usar otro email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-text-primary text-3xl font-bold mb-2">Pins</Text>
        <Text className="text-text-secondary text-base mb-12">Tu colección, siempre contigo</Text>

        <View className="w-full mb-4">
          <Text className="text-text-secondary text-sm mb-2">Email</Text>
          <TextInput
            className="bg-surface-card text-text-primary rounded-xl px-4 py-3 text-base w-full"
            placeholder="tu@email.com"
            placeholderTextColor="#606060"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSendLink}
            returnKeyType="send"
          />
        </View>

        <TouchableOpacity
          className={`w-full rounded-xl py-4 items-center ${loading ? 'bg-accent-muted' : 'bg-accent'}`}
          onPress={handleSendLink}
          disabled={loading || !email.trim()}
        >
          <Text className="text-surface font-semibold text-base">
            {loading ? 'Enviando...' : 'Enviar enlace mágico'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
