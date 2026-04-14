import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useTags } from '../../hooks/useTags';
import {
  parseCSVString,
  autoMapHeaders,
  importFromCSV,
  ALL_SCHEMA_FIELDS,
  SCHEMA_FIELD_LABELS,
  ImportSummary,
  SchemaField,
} from '../../lib/csvImport';

type Step = 'pick' | 'map' | 'importing' | 'done';

const IGNORE_LABEL = 'Ignorar columna';

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { session } = useAuth();
  const { tagGroups, standaloneTags } = useTags();
  const tags = [
    ...tagGroups.map((g) => g.category),
    ...tagGroups.flatMap((g) => g.subcategories),
    ...standaloneTags,
  ];

  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState<string>('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, SchemaField>>({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // ── Step 1: pick file ──────────────────────────────────────────────────────

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const text = await FileSystem.readAsStringAsync(asset.uri);
    const parsed = parseCSVString(text);

    if (parsed.error || parsed.rows.length === 0) {
      Alert.alert('Error', parsed.error ?? 'El archivo está vacío o no tiene el formato correcto.');
      return;
    }

    setFileName(asset.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(autoMapHeaders(parsed.headers));
    setStep('map');
  }

  // ── Step 2: mapping ────────────────────────────────────────────────────────

  function setFieldMapping(header: string, field: SchemaField) {
    setMapping((prev) => {
      // Clear any other column that had this field to avoid duplicates
      const updated: Record<string, SchemaField> = {};
      for (const [h, f] of Object.entries(prev)) {
        updated[h] = f === field && h !== header ? null : f;
      }
      updated[header] = field;
      return updated;
    });
  }

  const descriptionMapped = Object.values(mapping).includes('description');

  async function handleStartImport() {
    if (!descriptionMapped) return;
    if (!session?.user?.id) return;

    setProgress({ done: 0, total: rows.length });
    setStep('importing');

    const result = await importFromCSV({
      userId: session.user.id,
      rows,
      mapping,
      existingTags: tags,
      onProgress: (done, total) => setProgress({ done, total }),
    });

    setSummary(result);
    setStep('done');
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => (step === 'map' ? setStep('pick') : router.back())}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-text-primary text-lg font-semibold flex-1">
          Importar colección
        </Text>
      </View>

      {step === 'pick' && <StepPick onPick={handlePickFile} colors={colors} />}
      {step === 'map' && (
        <StepMap
          headers={headers}
          mapping={mapping}
          rowCount={rows.length}
          descriptionMapped={descriptionMapped}
          onChangeMapping={setFieldMapping}
          onImport={handleStartImport}
          colors={colors}
          insets={insets}
        />
      )}
      {step === 'importing' && (
        <StepImporting progress={progress} colors={colors} />
      )}
      {step === 'done' && summary && (
        <StepDone
          summary={summary}
          fileName={fileName}
          colors={colors}
          insets={insets}
        />
      )}
    </View>
  );
}

// ─── Step: Pick ───────────────────────────────────────────────────────────────

function StepPick({ onPick, colors }: { onPick: () => void; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Info */}
      <View className="bg-surface-card rounded-2xl p-4 mb-4">
        <Text className="text-text-primary text-sm font-semibold mb-2">Formato esperado</Text>
        <Text className="text-text-secondary text-sm mb-3">
          Sube un archivo CSV. Las columnas se detectan automáticamente — podrás confirmar el
          mapeo antes de importar.
        </Text>
        <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
          Columnas reconocidas *
        </Text>
        {ALL_SCHEMA_FIELDS.map((field) => (
          <View key={field} className="flex-row items-center py-1" style={{ gap: 8 }}>
            <View
              className="w-1.5 h-1.5 rounded-full bg-accent"
              style={field === 'description' ? { backgroundColor: colors.accent } : {}}
            />
            <Text className="text-text-secondary text-sm">
              {SCHEMA_FIELD_LABELS[field]}
              {field === 'description' ? '' : ''}
            </Text>
          </View>
        ))}
        <Text className="text-text-muted text-xs mt-3">
          * Las categorías nuevas se crean automáticamente. Los colores deben coincidir con los
          valores del app (rojo, azul, verde, amarillo, negro, blanco, dorado, plateado,
          multicolor, otro).
        </Text>
      </View>

      <TouchableOpacity
        onPress={onPick}
        className="bg-accent rounded-2xl py-4 items-center flex-row justify-center"
        style={{ gap: 10 }}
      >
        <Ionicons name="document-outline" size={20} color={colors.surface} />
        <Text className="text-surface text-base font-semibold">Seleccionar archivo CSV</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step: Map ────────────────────────────────────────────────────────────────

interface StepMapProps {
  headers: string[];
  mapping: Record<string, SchemaField>;
  rowCount: number;
  descriptionMapped: boolean;
  onChangeMapping: (header: string, field: SchemaField) => void;
  onImport: () => void;
  colors: ReturnType<typeof useThemeColors>;
  insets: { bottom: number };
}

function StepMap({
  headers,
  mapping,
  rowCount,
  descriptionMapped,
  onChangeMapping,
  onImport,
  colors,
  insets,
}: StepMapProps) {
  const [expandedHeader, setExpandedHeader] = useState<string | null>(null);

  const fieldOptions: { label: string; value: SchemaField }[] = [
    { label: IGNORE_LABEL, value: null },
    ...ALL_SCHEMA_FIELDS.map((f) => ({ label: SCHEMA_FIELD_LABELS[f], value: f as SchemaField })),
  ];

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-text-secondary text-sm mb-4">
          {rowCount} filas detectadas. Confirma cómo mapear cada columna.
        </Text>

        <View className="bg-surface-card rounded-2xl overflow-hidden mb-4">
          {headers.map((header, idx) => {
            const currentField = mapping[header];
            const label = currentField ? SCHEMA_FIELD_LABELS[currentField] : IGNORE_LABEL;
            const isExpanded = expandedHeader === header;

            return (
              <View key={header}>
                {idx > 0 && <View className="h-px bg-surface-elevated" />}
                <TouchableOpacity
                  onPress={() => setExpandedHeader(isExpanded ? null : header)}
                  className="px-4 py-3 flex-row items-center justify-between"
                  activeOpacity={0.7}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-text-muted text-xs mb-0.5">Columna CSV</Text>
                    <Text className="text-text-primary text-sm font-medium" numberOfLines={1}>
                      {header}
                    </Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Text
                      className={`text-sm ${currentField ? 'text-accent' : 'text-text-muted'}`}
                    >
                      {label}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View className="bg-surface-elevated">
                    {fieldOptions.map((opt) => (
                      <TouchableOpacity
                        key={String(opt.value)}
                        onPress={() => {
                          onChangeMapping(header, opt.value);
                          setExpandedHeader(null);
                        }}
                        className="px-6 py-3 flex-row items-center justify-between"
                      >
                        <Text
                          className={`text-sm ${
                            mapping[header] === opt.value
                              ? 'text-accent font-medium'
                              : 'text-text-secondary'
                          }`}
                        >
                          {opt.label}
                        </Text>
                        {mapping[header] === opt.value && (
                          <Ionicons name="checkmark" size={16} color={colors.accent} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {!descriptionMapped && (
          <View className="bg-surface-card rounded-xl px-4 py-3 flex-row items-center" style={{ gap: 8 }}>
            <Ionicons name="warning-outline" size={16} color={colors.danger} />
            <Text className="text-danger text-sm flex-1">
              Debes mapear al menos una columna a "Descripción *" para continuar.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 bg-surface"
        style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
      >
        <TouchableOpacity
          onPress={onImport}
          disabled={!descriptionMapped}
          className={`rounded-2xl py-4 items-center ${
            descriptionMapped ? 'bg-accent' : 'bg-accent-muted'
          }`}
        >
          <Text className="text-surface text-base font-semibold">
            Importar {rowCount} elementos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step: Importing ──────────────────────────────────────────────────────────

function StepImporting({
  progress,
  colors,
}: {
  progress: { done: number; total: number };
  colors: ReturnType<typeof useThemeColors>;
}) {
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ gap: 16 }}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text className="text-text-primary text-base font-semibold">Importando...</Text>
      <Text className="text-text-muted text-sm">
        {progress.done} / {progress.total} ({pct}%)
      </Text>
    </View>
  );
}

// ─── Step: Done ───────────────────────────────────────────────────────────────

function StepDone({
  summary,
  fileName,
  colors,
  insets,
}: {
  summary: ImportSummary;
  fileName: string;
  colors: ReturnType<typeof useThemeColors>;
  insets: { bottom: number };
}) {
  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Result header */}
        <View className="bg-surface-card rounded-2xl p-4 mb-4" style={{ gap: 4 }}>
          <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text className="text-text-primary text-base font-semibold">Importación completa</Text>
          </View>
          <Text className="text-text-muted text-xs">{fileName}</Text>
        </View>

        {/* Stats */}
        <View className="bg-surface-card rounded-2xl overflow-hidden mb-4">
          <StatRow
            icon="albums-outline"
            label="Elementos importados"
            value={String(summary.imported)}
            iconColor={colors.success}
            colors={colors}
          />
          <View className="h-px bg-surface-elevated" />
          <StatRow
            icon="pricetags-outline"
            label="Categorías creadas"
            value={String(summary.categoriesCreated.length)}
            iconColor={colors.accent}
            colors={colors}
          />
          {summary.skipped.length > 0 && (
            <>
              <View className="h-px bg-surface-elevated" />
              <StatRow
                icon="warning-outline"
                label="Filas omitidas"
                value={String(summary.skipped.length)}
                iconColor={colors.danger}
                colors={colors}
              />
            </>
          )}
        </View>

        {/* Created categories */}
        {summary.categoriesCreated.length > 0 && (
          <>
            <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
              Categorías creadas
            </Text>
            <View className="bg-surface-card rounded-2xl px-4 py-3 mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
              {summary.categoriesCreated.map((name) => (
                <View key={name} className="bg-surface-elevated rounded-lg px-3 py-1.5">
                  <Text className="text-text-secondary text-sm">{name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Skipped rows */}
        {summary.skipped.length > 0 && (
          <>
            <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
              Filas omitidas
            </Text>
            <View className="bg-surface-card rounded-2xl overflow-hidden mb-4">
              {summary.skipped.slice(0, 20).map(({ row, reason }, idx) => (
                <View key={idx}>
                  {idx > 0 && <View className="h-px bg-surface-elevated" />}
                  <View className="px-4 py-3 flex-row items-center justify-between">
                    <Text className="text-text-muted text-sm">Fila {row}</Text>
                    <Text className="text-text-secondary text-sm">{reason}</Text>
                  </View>
                </View>
              ))}
              {summary.skipped.length > 20 && (
                <View className="px-4 py-3">
                  <Text className="text-text-muted text-sm">
                    +{summary.skipped.length - 20} más...
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 bg-surface"
        style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
      >
        <TouchableOpacity
          onPress={() => router.replace('/(app)/(tabs)/' as any)}
          className="bg-accent rounded-2xl py-4 items-center"
        >
          <Text className="text-surface text-base font-semibold">Ver colección</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatRow({
  icon,
  label,
  value,
  iconColor,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  iconColor: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View className="px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
        <Text className="text-text-secondary text-sm">{label}</Text>
      </View>
      <Text className="text-text-primary text-sm font-semibold">{value}</Text>
    </View>
  );
}
