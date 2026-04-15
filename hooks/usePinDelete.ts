import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { deleteImage } from '../lib/storage';

export function usePinDelete(onSuccess: () => void) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = useCallback((pinId: string) => {
    setPendingDeleteId(pinId);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const executeDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);

    const { data: item } = await supabase
      .from('items')
      .select('image_url, collection_number')
      .eq('id', pendingDeleteId)
      .single();

    await supabase.from('item_tags').delete().eq('item_id', pendingDeleteId);
    const { error } = await supabase.from('items').delete().eq('id', pendingDeleteId);

    if (error) {
      setIsDeleting(false);
      setPendingDeleteId(null);
      Alert.alert('Error', 'No se pudo eliminar el elemento. Inténtalo de nuevo.');
      return;
    }

    if (item?.image_url) {
      await deleteImage(item.image_url);
    }

    if (item?.collection_number != null) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('decrement_collection_numbers_after', {
          p_deleted_number: item.collection_number,
          p_user_id: user.id,
        });
      }
    }

    setIsDeleting(false);
    setPendingDeleteId(null);
    onSuccess();
  }, [pendingDeleteId, onSuccess]);

  return { pendingDeleteId, isDeleting, requestDelete, cancelDelete, executeDelete };
}
