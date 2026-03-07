# Architecture Rules — Pin Inventory

> Decisiones de arquitectura tomadas para este proyecto.
> Claude Code debe respetar estas decisiones en todo el código generado.

---

## Stack

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | React Native + Expo | SDK 51+ |
| Navegación | Expo Router | v3 |
| Backend | Supabase | latest |
| Lenguaje | TypeScript | strict mode |
| Estilos | React Native StyleSheet | — |
| Iconos | @expo/vector-icons | — |

---

## 1. Estructura de carpetas

```
app/                        ← pantallas (Expo Router file-based routing)
  (auth)/
    login.tsx
    signup.tsx
  (app)/
    index.tsx               ← catálogo principal
    pin/
      [id].tsx              ← detalle de pin
      new.tsx               ← añadir pin
components/
  ui/                       ← componentes genéricos reutilizables
  pins/                     ← componentes específicos de pins
lib/
  supabase.ts               ← cliente de Supabase (singleton)
  storage.ts                ← helpers de Supabase Storage
  types.ts                  ← tipos TypeScript globales
hooks/
  usePins.ts                ← data fetching de pins
  useAuth.ts                ← estado de autenticación
assets/
  images/
  fonts/
```

---

## 2. Reglas de componentes

- Un componente por fichero. El nombre del fichero = nombre del componente.
- Los componentes de `ui/` no conocen el dominio de pins — son genéricos.
- Los componentes de `pins/` pueden importar de `ui/` pero no al revés.
- Props siempre tipadas con TypeScript. Nunca usar `any`.

```typescript
// ✅ Correcto
interface PinCardProps {
  pin: Pin;
  onPress: (id: string) => void;
}

// ❌ Nunca
const PinCard = (props: any) => { ... }
```

---

## 3. Data fetching

- Todo acceso a Supabase va dentro de custom hooks en `/hooks`.
- Los componentes no llaman a Supabase directamente.
- Siempre manejar tres estados: `loading`, `error`, `data`.

```typescript
// ✅ Patrón correcto
const { pins, loading, error } = usePins();

// ❌ Nunca en un componente
const { data } = await supabase.from('pins').select('*');
```

---

## 4. Tipos globales

Los tipos del dominio viven en `lib/types.ts`:

```typescript
export interface Pin {
  id: string;
  user_id: string;
  name: string;
  notes?: string;
  image_url?: string;
  created_at: string;
}
```

Nunca redefinir estos tipos en otros ficheros. Importar siempre desde `lib/types`.

---

## 5. Supabase client

Un único cliente, instanciado una sola vez:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStore,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

---

## 6. Estilos

- Usar `StyleSheet.create()` siempre. No inline styles salvo casos triviales (flex: 1).
- Los estilos van al final del fichero, después del componente.
- No usar librerías de estilos externas (NativeWind, etc.) — mantener dependencias mínimas para un proyecto personal.

---

## 7. Decisiones tomadas (no reabrir sin razón)

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Expo sobre RN CLI | React Native CLI | Menor setup, EAS Build, acceso fácil a cámara |
| Supabase sobre Firebase | Firebase | Familiaridad previa, SQL, RLS más explícito |
| Expo Router sobre React Navigation | React Navigation | File-based routing más mantenible |
| StyleSheet sobre NativeWind | NativeWind, Tamagui | Menos dependencias, proyecto personal simple |
