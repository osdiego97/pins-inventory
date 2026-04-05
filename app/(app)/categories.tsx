import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTags } from '../../hooks/useTags';
import { Tag } from '../../lib/types';
import TagIcon from '../../components/ui/TagIcon';

const L1_ICONS = [
  'star-outline', 'heart-outline', 'flag-outline', 'football-outline',
  'musical-notes-outline', 'camera-outline', 'car-outline', 'leaf-outline',
  'planet-outline', 'paw-outline', 'trophy-outline', 'book-outline',
  'diamond-outline', 'cube-outline', 'shirt-outline', 'hammer-outline',
] as const;

type CreateModalState =
  | { type: null }
  | { type: 'l1' }
  | { type: 'l2'; parentId: string | null };

type RenameModalState =
  | { type: null }
  | { type: 'tag'; tag: Tag };

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { tagGroups, standaloneTags, loading, refetch } = useTags();
  const [createModal, setCreateModal] = useState<CreateModalState>({ type: null });
  const [renameModal, setRenameModal] = useState<RenameModalState>({ type: null });
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('star-outline');
  const [saving, setSaving] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useFocusEffect(useCallback(() => { refetch(); }, []));

  async function handleCreateTag() {
    const name = newName.trim();
    if (!name) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const isShared = createModal.type === 'l2' && createModal.parentId === null;
    const payload: { name: string; parent_id: string | null; user_id: string; is_shared: boolean } = {
      name,
      parent_id: createModal.type === 'l2' ? createModal.parentId : null,
      user_id: user.id,
      is_shared: isShared,
    };

    const { error } = await supabase.from('tags').insert(payload);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.code === '23505' ? 'Ya existe una categoría con ese nombre.' : 'No se pudo crear la categoría.');
      return;
    }

    setNewName('');
    setCreateModal({ type: null });
    refetch();
  }

  async function handleRename() {
    if (renameModal.type !== 'tag') return;
    const name = renameValue.trim();
    if (!name) return;

    setSaving(true);
    const { error } = await supabase
      .from('tags')
      .update({ name })
      .eq('id', renameModal.tag.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', 'No se pudo renombrar la categoría.');
      return;
    }

    setRenameModal({ type: null });
    setRenameValue('');
    refetch();
  }

  async function handleDelete(tag: Tag) {
    // Count items using this tag
    const { count } = await supabase
      .from('item_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tag.id);

    const countLabel = count && count > 0
      ? `${count} elemento${count !== 1 ? 's' : ''} usa esta categoría. Las asociaciones se eliminarán.`
      : 'Esta categoría no está siendo usada actualmente.';

    Alert.alert(
      `Eliminar "${tag.name}"`,
      countLabel + '\n\nLos elementos no se eliminarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.rpc('delete_tag_with_associations', {
              p_tag_id: tag.id,
              p_user_id: user.id,
            });
            refetch();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#e8c97e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#f5f5f5" />
        </TouchableOpacity>
        <Text className="text-text-primary text-lg font-semibold flex-1">Categorías</Text>
        <TouchableOpacity
          onPress={() => { setNewName(''); setCreateModal({ type: 'l1' }); }}
          className="flex-row items-center bg-accent rounded-xl px-3 py-2" style={{ gap: 6 }}
        >
          <Ionicons name="add" size={16} color="#0f0f0f" />
          <Text className="text-surface text-sm font-semibold">Nueva Categoría</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
      >
        {tagGroups.length === 0 && standaloneTags.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <Ionicons name="pricetags-outline" size={40} color="#606060" />
            <Text className="text-text-secondary text-base mt-4 text-center">
              Aún no tienes categorías.{'\n'}Crea una L1 para empezar.
            </Text>
          </View>
        ) : null}

        {/* L1 groups */}
        {tagGroups.map((group) => (
          <View key={group.category.id} className="mb-4">
            {/* L1 row */}
            <View className="bg-surface-card rounded-2xl overflow-hidden">
              <View className="px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                  <TagIcon tagName={group.category.name} size={16} color="#a0a0a0" />
                  <Text className="text-text-primary text-base font-semibold">{group.category.name}</Text>
                  <Text className="text-text-muted text-xs">{group.subcategories.length} subcats</Text>
                </View>
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <TouchableOpacity onPress={() => { setRenameValue(group.category.name); setRenameModal({ type: 'tag', tag: group.category }); }}>
                    <Ionicons name="pencil-outline" size={16} color="#a0a0a0" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(group.category)}>
                    <Ionicons name="trash-outline" size={16} color="#e05c5c" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* L2 subcategories */}
              {group.subcategories.map((sub, idx) => (
                <View key={sub.id}>
                  <View className="h-px bg-surface-elevated" />
                  <View className="px-4 py-3 flex-row items-center justify-between" style={{ paddingLeft: 32 }}>
                    <Text className="text-text-secondary text-sm flex-1">{sub.name}</Text>
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <TouchableOpacity onPress={() => { setRenameValue(sub.name); setRenameModal({ type: 'tag', tag: sub }); }}>
                        <Ionicons name="pencil-outline" size={14} color="#a0a0a0" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(sub)}>
                        <Ionicons name="trash-outline" size={14} color="#e05c5c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {/* Add L2 */}
              <View className="h-px bg-surface-elevated" />
              <TouchableOpacity
                onPress={() => { setNewName(''); setCreateModal({ type: 'l2', parentId: group.category.id }); }}
                className="px-4 py-3 flex-row items-center" style={{ paddingLeft: 32, gap: 6 }}
              >
                <Ionicons name="add-circle-outline" size={14} color="#606060" />
                <Text className="text-text-muted text-sm">Añadir subcategoría</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Standalone L2 tags */}
        {standaloneTags.length > 0 && (
          <View className="mb-4">
            <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
              Subcategorías compartidas
            </Text>
            <View className="bg-surface-card rounded-2xl overflow-hidden">
              {standaloneTags.map((tag, idx) => (
                <View key={tag.id}>
                  {idx > 0 && <View className="h-px bg-surface-elevated" />}
                  <View className="px-4 py-3 flex-row items-center justify-between">
                    <Text className="text-text-secondary text-sm flex-1">{tag.name}</Text>
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <TouchableOpacity onPress={() => { setRenameValue(tag.name); setRenameModal({ type: 'tag', tag }); }}>
                        <Ionicons name="pencil-outline" size={14} color="#a0a0a0" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(tag)}>
                        <Ionicons name="trash-outline" size={14} color="#e05c5c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add standalone L2 */}
        <TouchableOpacity
          onPress={() => { setNewName(''); setCreateModal({ type: 'l2', parentId: null }); }}
          className="bg-surface-card rounded-2xl px-4 py-4 flex-row items-center justify-center" style={{ gap: 8 }}
        >
          <Ionicons name="add-circle-outline" size={18} color="#606060" />
          <Text className="text-text-muted text-sm">Añadir subcategoría compartida</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create modal */}
      <Modal
        visible={createModal.type !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModal({ type: null })}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-surface-card rounded-2xl mx-6 p-6 w-full" style={{ maxWidth: 380 }}>
            <Text className="text-text-primary text-lg font-semibold mb-3">
              {createModal.type === 'l1'
                ? 'Nueva categoría'
                : createModal.type === 'l2' && createModal.parentId === null
                  ? 'Nueva subcategoría compartida'
                  : 'Nueva subcategoría'}
            </Text>
            {createModal.type === 'l2' && createModal.parentId === null && (
              <Text className="text-text-muted text-sm mb-4">
                Aparecerá como opción bajo todas tus categorías. Útil para etiquetas universales como "Edición limitada" o "Vintage".
              </Text>
            )}
            <TextInput
              className="bg-surface-elevated rounded-xl px-4 py-3 text-text-primary text-sm mb-4"
              placeholder={
                createModal.type === 'l2' && createModal.parentId === null
                  ? 'Nombre de la subcategoría compartida'
                  : 'Nombre de la categoría'
              }
              placeholderTextColor="#606060"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              maxLength={50}
            />
            <View className="flex-row" style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCreateModal({ type: null })}
                className="flex-1 bg-surface-elevated rounded-xl py-3 items-center"
              >
                <Text className="text-text-secondary text-sm font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTag}
                disabled={saving || !newName.trim()}
                className={`flex-1 rounded-xl py-3 items-center ${saving || !newName.trim() ? 'bg-accent-muted' : 'bg-accent'}`}
              >
                {saving ? (
                  <ActivityIndicator color="#0f0f0f" size="small" />
                ) : (
                  <Text className="text-surface text-sm font-semibold">Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename modal */}
      <Modal
        visible={renameModal.type !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModal({ type: null })}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-surface-card rounded-2xl mx-6 p-6 w-full" style={{ maxWidth: 380 }}>
            <Text className="text-text-primary text-lg font-semibold mb-4">Renombrar</Text>
            <TextInput
              className="bg-surface-elevated rounded-xl px-4 py-3 text-text-primary text-sm mb-4"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              maxLength={50}
              selectTextOnFocus
            />
            <View className="flex-row" style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRenameModal({ type: null })}
                className="flex-1 bg-surface-elevated rounded-xl py-3 items-center"
              >
                <Text className="text-text-secondary text-sm font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
                disabled={saving || !renameValue.trim()}
                className={`flex-1 rounded-xl py-3 items-center ${saving || !renameValue.trim() ? 'bg-accent-muted' : 'bg-accent'}`}
              >
                {saving ? (
                  <ActivityIndicator color="#0f0f0f" size="small" />
                ) : (
                  <Text className="text-surface text-sm font-semibold">Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
