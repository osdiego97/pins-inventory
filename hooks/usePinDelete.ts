import { useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { deleteImage } from '../lib/storage';

export function usePinDelete(onSuccess: () => void) {
  const confirmDelete = useCallback(
    (pinId: string) => {
      Alert.alert(
        'Eliminar elemento',
        '¿Seguro que quieres eliminar este elemento? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(pinId) },
        ]
      );
    },
    [onSuccess]
  );

  async function handleDelete(pinId: string) {
    const { data: item } = await supabase
      .from('items')
      .select('image_url, collection_number')
      .eq('id', pinId)
      .single();

    await supabase.from('item_tags').delete().eq('item_id', pinId);
    const { error } = await supabase.from('items').delete().eq('id', pinId);

    if (error) {
      Alert.alert('Error', 'No se pudo eliminar el elemento. Inténtalo de nuevo.');
      return;
    }

    if (item?.image_url) {
      await deleteImage(item.image_url);
    }

    if (item?.collection_number != null) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('decrement_collection_numbers_after', {
          p_deleted_number: item.collection_number,
          p_user_id: user.id,
        });
      }
    }

    onSuccess();
  }

  return { confirmDelete };
}
