# Security Rules — Pin Inventory

> Estas reglas se aplican en TODO el código generado para este proyecto.
> No son opcionales ni negociables. Revisarlas antes de generar cualquier feature.

---

## 1. Autenticación

- Toda la app está protegida por Supabase Auth. No existe ninguna pantalla funcional accesible sin sesión activa (excepto login/signup).
- Nunca almacenar tokens de sesión manualmente — usar el cliente de Supabase, que los gestiona automáticamente con SecureStore en Expo.
- No usar AsyncStorage para datos sensibles. Usar `expo-secure-store` para cualquier dato que requiera persistencia segura.

```typescript
// ✅ Correcto
import * as SecureStore from 'expo-secure-store';

// ❌ Nunca para datos sensibles
import AsyncStorage from '@react-native-async-storage/async-storage';
```

---

## 2. Base de datos (Row Level Security)

- Todas las tablas en Supabase tienen RLS activado. Sin excepciones.
- El patrón base para cualquier tabla del usuario:

```sql
-- El usuario solo ve sus propios datos
CREATE POLICY "Users can only access own data"
ON [table_name]
FOR ALL
USING (auth.uid() = user_id);
```

- Nunca hacer queries sin filtrar por `user_id` del usuario autenticado.
- Nunca exponer datos de otros usuarios, aunque sean colecciones "públicas" en el futuro — eso se diseña explícitamente cuando llegue.

---

## 3. Storage de imágenes (Supabase Storage)

- Los buckets de imágenes son privados por defecto.
- Las imágenes se organizan por `user_id`: `pins/{user_id}/{filename}`
- Validar antes de cualquier upload:
  - Tipo de archivo: solo `image/jpeg`, `image/png`, `image/webp`
  - Tamaño máximo: 5MB
  - Nunca usar el nombre de archivo original del dispositivo — generar un UUID

```typescript
// ✅ Correcto
const filename = `${uuid.v4()}.jpg`;
const path = `pins/${user.id}/${filename}`;

// ❌ Nunca
const path = `pins/${originalFile.name}`;
```

---

## 4. Variables de entorno

- Las claves de Supabase van en `.env` y en `app.config.js` via `extra`.
- Nunca hardcodear claves en el código.
- El archivo `.env` está en `.gitignore`.
- Solo usar la `anon key` en el cliente — nunca la `service_role key` en el frontend.

```typescript
// ✅ Correcto
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

---

## 5. Inputs y validación

- Todo input del usuario se valida antes de enviarse a Supabase.
- Usar longitudes máximas en todos los campos de texto.
- Los nombres de pins tienen máximo 100 caracteres. Las notas, 500.
- Nunca confiar en validaciones solo del lado cliente — las constraints también van en la DB.

---

## 6. Logs y errores

- Los mensajes de error mostrados al usuario son genéricos. No exponer detalles de DB, rutas, o estructura interna.
- Los `console.log` con datos de usuario se eliminan antes de cualquier build de producción.

```typescript
// ✅ Para el usuario
"No se pudo guardar el pin. Inténtalo de nuevo."

// ❌ Nunca mostrar al usuario
error.message // puede contener detalles internos de Supabase
```
