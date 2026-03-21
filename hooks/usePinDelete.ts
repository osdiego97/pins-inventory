import { useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { deleteImage } from '../lib/storage';

export function usePinDelete(onSuccess: () => void) {
  const confirmDelete = useCallback(
    (pinId: string) => {
      Alert.alert(
        'Eliminar pin',
        '¿Seguro que quieres eliminar este pin? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(pinId) },
        ]
      );
    },
    [onSuccess]
  );

  async function handleDelete(pinId: string) {
    const { data: pin } = await supabase
      .from('pins')
      .select('image_url, collection_number')
      .eq('id', pinId)
      .single();

    await supabase.from('pin_tags').delete().eq('pin_id', pinId);
    const { error } = await supabase.from('pins').delete().eq('id', pinId);

    if (error) {
      Alert.alert('Error', 'No se pudo eliminar el pin. Inténtalo de nuevo.');
      return;
    }

    if (pin?.image_url) {
      await deleteImage(pin.image_url);
    }

    if (pin?.collection_number != null) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('decrement_collection_numbers_after', {
          p_deleted_number: pin.collection_number,
          p_user_id: user.id,
        });
      }
    }

    onSuccess();
  }

  return { confirmDelete };
}
