import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadPinImage, getSignedImageUrl } from '../lib/storage';

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
      .from('pins')
      .select('*, pin_tags(tag_id)')
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
      selectedTagIds: (data.pin_tags as { tag_id: string }[]).map((pt) => pt.tag_id),
      localImageUri: null,
      existingImagePath: data.image_url ?? null,
    });
    setInitialLoading(false);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((id) => id !== tagId)
        : [...prev.selectedTagIds, tagId],
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

    const pinData = {
      description: form.description.trim(),
      country: form.country.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
      acquired_year: form.acquired_year ? parseInt(form.acquired_year, 10) : null,
      is_commemorative: form.is_commemorative,
      image_url: imagePath,
    };

    let savedPinId: string;

    if (isEdit && pinId) {
      const { error } = await supabase.from('pins').update(pinData).eq('id', pinId);
      if (error) {
        setSubmitError('No se pudo guardar el pin. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }
      savedPinId = pinId;
    } else {
      const { data: maxData } = await supabase
        .from('pins')
        .select('collection_number')
        .order('collection_number', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const nextNumber = maxData?.collection_number ? maxData.collection_number + 1 : 1;

      const { data, error } = await supabase
        .from('pins')
        .insert({ ...pinData, user_id: user.id, collection_number: nextNumber })
        .select('id')
        .single();

      if (error || !data) {
        setSubmitError('No se pudo guardar el pin. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }
      savedPinId = data.id;
    }

    if (isEdit) {
      await supabase.from('pin_tags').delete().eq('pin_id', savedPinId);
    }

    if (form.selectedTagIds.length > 0) {
      const { error: tagError } = await supabase.from('pin_tags').insert(
        form.selectedTagIds.map((tagId) => ({
          pin_id: savedPinId,
          tag_id: tagId,
          user_id: user.id,
        }))
      );
      if (tagError) {
        setSubmitError('No se pudo guardar el pin. Inténtalo de nuevo.');
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
    pickImage,
    submit,
    errors,
    initialLoading,
    submitting,
    submitError,
    previewImageUri,
  };
}
