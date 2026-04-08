import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadPinImage, getSignedImageUrl } from '../lib/storage';

export const COLOR_OPTIONS = [
  { label: 'Rojo', value: 'rojo', hex: '#e05c5c' },
  { label: 'Azul', value: 'azul', hex: '#5c8de0' },
  { label: 'Verde', value: 'verde', hex: '#5cb85c' },
  { label: 'Amarillo', value: 'amarillo', hex: '#e0c95c' },
  { label: 'Negro', value: 'negro', hex: '#1a1a1a' },
  { label: 'Blanco', value: 'blanco', hex: '#f5f5f5' },
  { label: 'Dorado', value: 'dorado', hex: '#e8c97e' },
  { label: 'Plateado', value: 'plateado', hex: '#a0a0a0' },
  { label: 'Arcoíris', value: 'arcoiris', hex: 'rainbow' },
  { label: 'Multicolor', value: 'multicolor', hex: '#9b5de5' },
  { label: 'Otro', value: 'otro', hex: '#606060' },
] as const;

interface FormState {
  description: string;
  country: string;
  city: string;
  region: string;
  acquired_year: string;
  is_commemorative: boolean;
  selectedTagIds: string[];
  localImageUri: string | null;
  existingImagePath: string | null;
  mapLocationName: string | null;
  latitude: number | null;
  longitude: number | null;
  material: string;
  color: string[];
}

interface FormErrors {
  description?: string;
  country?: string;
  city?: string;
  acquired_year?: string;
}

const INITIAL_STATE: FormState = {
  description: '',
  country: '',
  city: '',
  region: '',
  acquired_year: new Date().getFullYear().toString(),
  is_commemorative: false,
  selectedTagIds: [],
  localImageUri: null,
  existingImagePath: null,
  mapLocationName: null,
  latitude: null,
  longitude: null,
  material: '',
  color: [],
};

export function usePinForm(pinId?: string) {
  const isEdit = !!pinId;

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [pickedMimeType, setPickedMimeType] = useState('image/jpeg');
  const [pickedFileSize, setPickedFileSize] = useState<number | undefined>(undefined);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && pinId) loadPin(pinId);
  }, [pinId]);

  useEffect(() => {
    if (form.existingImagePath && !form.localImageUri) {
      getSignedImageUrl(form.existingImagePath).then(setSignedImageUrl);
    }
  }, [form.existingImagePath]);

  async function loadPin(id: string) {
    setInitialLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, item_tags(tag_id)')
      .eq('id', id)
      .single();

    if (error || !data) {
      setInitialLoading(false);
      return;
    }

    setForm({
      description: data.description ?? '',
      country: data.country ?? '',
      city: data.city ?? '',
      region: data.region ?? '',
      acquired_year: data.acquired_year?.toString() ?? '',
      is_commemorative: data.is_commemorative ?? false,
      selectedTagIds: (data.item_tags as { tag_id: string }[]).map((pt) => pt.tag_id),
      localImageUri: null,
      existingImagePath: data.image_url ?? null,
      mapLocationName: null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      material: data.material ?? '',
      color: data.color ?? [],
    });
    setInitialLoading(false);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function toggleColor(value: string) {
    setForm((prev) => ({
      ...prev,
      color: prev.color.includes(value)
        ? prev.color.filter((c) => c !== value)
        : [...prev.color, value],
    }));
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setSubmitError('La imagen no puede superar los 5MB.');
        return;
      }
      setForm((prev) => ({ ...prev, localImageUri: asset.uri }));
      setPickedMimeType(asset.mimeType ?? 'image/jpeg');
      setPickedFileSize(asset.fileSize ?? undefined);
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    const desc = form.description.trim();
    if (!desc) newErrors.description = 'La descripción es obligatoria.';
    else if (desc.length > 100) newErrors.description = 'Máximo 100 caracteres.';
    if (!form.country.trim()) newErrors.country = 'El país es obligatorio.';
    if (!form.city.trim()) newErrors.city = 'La ciudad es obligatoria.';
    if (!form.acquired_year) {
      newErrors.acquired_year = 'El año de adquisición es obligatorio.';
    } else {
      const year = parseInt(form.acquired_year, 10);
      if (
        !/^\d{4}$/.test(form.acquired_year) ||
        year < 1900 ||
        year > new Date().getFullYear()
      ) {
        newErrors.acquired_year = 'Año inválido.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError('No se pudo obtener la sesión.');
      setSubmitting(false);
      return;
    }

    let imagePath = form.existingImagePath;
    if (form.localImageUri) {
      const { path, error: uploadError } = await uploadPinImage(
        user.id,
        form.localImageUri,
        pickedMimeType,
        pickedFileSize
      );
      if (uploadError) {
        setSubmitError(uploadError);
        setSubmitting(false);
        return;
      }
      imagePath = path;
    }

    const itemData = {
      description: form.description.trim(),
      country: form.country.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
      acquired_year: form.acquired_year ? parseInt(form.acquired_year, 10) : null,
      is_commemorative: form.is_commemorative,
      image_url: imagePath,
      latitude: form.latitude,
      longitude: form.longitude,
      material: form.material.trim() || null,
      color: form.color.length > 0 ? form.color : null,
    };

    let savedItemId: string;

    if (isEdit && pinId) {
      const { error } = await supabase.from('items').update(itemData).eq('id', pinId);
      if (error) {
        setSubmitError('No se pudo guardar el elemento. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }
      savedItemId = pinId;
    } else {
      const { data: maxData } = await supabase
        .from('items')
        .select('collection_number')
        .order('collection_number', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const nextNumber = maxData?.collection_number ? maxData.collection_number + 1 : 1;

      const { data, error } = await supabase
        .from('items')
        .insert({ ...itemData, user_id: user.id, collection_number: nextNumber })
        .select('id')
        .single();

      if (error || !data) {
        setSubmitError('No se pudo guardar el elemento. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }
      savedItemId = data.id;
    }

    if (isEdit) {
      await supabase.from('item_tags').delete().eq('item_id', savedItemId);
    }

    if (form.selectedTagIds.length > 0) {
      const { error: tagError } = await supabase.from('item_tags').insert(
        form.selectedTagIds.map((tagId) => ({
          item_id: savedItemId,
          tag_id: tagId,
          user_id: user.id,
        }))
      );
      if (tagError) {
        setSubmitError('No se pudo guardar el elemento. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    router.back();
  }

  const previewImageUri = form.localImageUri ?? signedImageUrl;

  return {
    form,
    setField,
    toggleColor,
    pickImage,
    submit,
    errors,
    initialLoading,
    submitting,
    submitError,
    previewImageUri,
  };
}
