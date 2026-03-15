import { supabase } from './supabase';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'pins';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function uploadPinImage(
  userId: string,
  uri: string,
  mimeType = 'image/jpeg',
  fileSize?: number
): Promise<{ path: string; error: string | null }> {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { path: '', error: 'Tipo de archivo no permitido.' };
  }
  if (fileSize && fileSize > MAX_SIZE_BYTES) {
    return { path: '', error: 'La imagen no puede superar los 5MB.' };
  }

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = `pins/${userId}/${uuidv4()}.${ext}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    return { path: '', error: 'No se pudo subir la imagen.' };
  }
  return { path, error: null };
}

export async function deleteImage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function getSignedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24); // 24h TTL
  if (error || !data) return null;
  return data.signedUrl;
}
