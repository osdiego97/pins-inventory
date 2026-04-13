import Papa from 'papaparse';
import { supabase } from './supabase';
import { Tag } from './types';

// ─── Schema fields ───────────────────────────────────────────────────────────

export type SchemaField =
  | 'description'
  | 'l1_category'
  | 'l2_category'
  | 'country'
  | 'city'
  | 'region'
  | 'year'
  | 'material'
  | 'color'
  | 'notes'
  | null; // null = ignored

export const SCHEMA_FIELD_LABELS: Record<Exclude<SchemaField, null>, string> = {
  description: 'Descripción *',
  l1_category: 'Categoría L1',
  l2_category: 'Subcategoría L2',
  country: 'País',
  city: 'Ciudad',
  region: 'Región',
  year: 'Año',
  material: 'Material',
  color: 'Color',
  notes: 'Notas',
};

export const ALL_SCHEMA_FIELDS = Object.keys(SCHEMA_FIELD_LABELS) as Exclude<SchemaField, null>[];

// ─── Color validation ─────────────────────────────────────────────────────────

const VALID_COLOR_VALUES = new Set([
  'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco',
  'dorado', 'plateado', 'multicolor', 'otro',
]);

function parseColor(raw: string): string[] {
  if (!raw?.trim()) return [];
  // Support comma-separated colors in one cell
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => VALID_COLOR_VALUES.has(s));
}

// ─── Auto-mapping ─────────────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, Exclude<SchemaField, null>> = {
  // description
  description: 'description', desc: 'description', nombre: 'description',
  name: 'description', pin: 'description', item: 'description',
  titulo: 'description', title: 'description', descripcion: 'description',
  descripción: 'description',

  // l1_category
  l1_category: 'l1_category', l1: 'l1_category', category: 'l1_category',
  categoría: 'l1_category', categoria: 'l1_category', tipo: 'l1_category',
  type: 'l1_category', serie: 'l1_category', series: 'l1_category',

  // l2_category
  l2_category: 'l2_category', l2: 'l2_category', subcategory: 'l2_category',
  subcategoría: 'l2_category', subcategoria: 'l2_category', subtipo: 'l2_category',
  subserie: 'l2_category',

  // country
  country: 'country', país: 'country', pais: 'country', país_de_origen: 'country',

  // city
  city: 'city', ciudad: 'city',

  // region
  region: 'region', región: 'region', province: 'region', provincia: 'region',

  // year
  year: 'year', año: 'year', ano: 'year', acquired_year: 'year', fecha: 'year',

  // material
  material: 'material', materiales: 'material',

  // color
  color: 'color', colour: 'color', colors: 'color', colores: 'color',

  // notes
  notes: 'notes', notas: 'notes', comments: 'notes', comentarios: 'notes',
  nota: 'notes', observaciones: 'notes',
};

/** Maps CSV headers to schema fields. Returns null for unrecognized headers. */
export function autoMapHeaders(headers: string[]): Record<string, SchemaField> {
  const mapping: Record<string, SchemaField> = {};
  for (const header of headers) {
    const key = header.trim().toLowerCase().replace(/\s+/g, '_');
    mapping[header] = FIELD_ALIASES[key] ?? null;
  }
  return mapping;
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  error?: string;
}

export function parseCSVString(content: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { headers: [], rows: [], error: 'No se pudo leer el archivo CSV.' };
  }

  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}

// ─── Tag resolution ───────────────────────────────────────────────────────────

interface TagMap {
  /** Maps lowercase l1 name → tag id */
  l1: Record<string, string>;
  /** Maps `${l1_id}::${lowercase l2 name}` → tag id */
  l2: Record<string, string>;
}

async function buildTagMap(userId: string, existingTags: Tag[]): Promise<TagMap> {
  const map: TagMap = { l1: {}, l2: {} };

  for (const tag of existingTags) {
    if (!tag.parent_id) {
      map.l1[tag.name.toLowerCase()] = tag.id;
    } else {
      map.l2[`${tag.parent_id}::${tag.name.toLowerCase()}`] = tag.id;
    }
  }

  return map;
}

async function getOrCreateL1(
  name: string,
  userId: string,
  map: TagMap,
  created: string[]
): Promise<string | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;

  if (map.l1[key]) return map.l1[key];

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: name.trim(), user_id: userId, is_shared: false })
    .select('id')
    .single();

  if (error || !data) return null;

  map.l1[key] = data.id;
  created.push(name.trim());
  return data.id;
}

async function getOrCreateL2(
  name: string,
  parentId: string,
  userId: string,
  map: TagMap,
  created: string[]
): Promise<string | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;

  const mapKey = `${parentId}::${key}`;
  if (map.l2[mapKey]) return map.l2[mapKey];

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: name.trim(), parent_id: parentId, user_id: userId, is_shared: false })
    .select('id')
    .single();

  if (error || !data) return null;

  map.l2[mapKey] = data.id;
  created.push(name.trim());
  return data.id;
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportOptions {
  userId: string;
  rows: Record<string, string>[];
  mapping: Record<string, SchemaField>;
  existingTags: Tag[];
  onProgress?: (done: number, total: number) => void;
}

export interface ImportSummary {
  imported: number;
  categoriesCreated: string[];
  skipped: { row: number; reason: string }[];
}

/** Reads the value for a schema field from a row using the column mapping. */
function getField(row: Record<string, string>, mapping: Record<string, SchemaField>, field: SchemaField): string {
  for (const [col, mapped] of Object.entries(mapping)) {
    if (mapped === field) return row[col]?.trim() ?? '';
  }
  return '';
}

const BATCH_SIZE = 50;

export async function importFromCSV({
  userId,
  rows,
  mapping,
  existingTags,
  onProgress,
}: ImportOptions): Promise<ImportSummary> {
  const summary: ImportSummary = { imported: 0, categoriesCreated: [], skipped: [] };
  const tagMap = await buildTagMap(userId, existingTags);

  // Get current max collection_number to continue sequence
  const { data: maxData } = await supabase
    .from('items')
    .select('collection_number')
    .eq('user_id', userId)
    .order('collection_number', { ascending: false })
    .limit(1)
    .single();

  let nextCollectionNumber = (maxData?.collection_number ?? 0) + 1;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const itemInserts: object[] = [];
    const tagLinks: { rowIndex: number; tagIds: string[] }[] = [];

    for (let j = 0; j < batch.length; j++) {
      const rowIndex = i + j + 2; // 1-based + header row
      const row = batch[j];

      const description = getField(row, mapping, 'description');
      if (!description) {
        summary.skipped.push({ row: rowIndex, reason: 'Sin descripción' });
        continue;
      }

      const l1Name = getField(row, mapping, 'l1_category');
      const l2Name = getField(row, mapping, 'l2_category');
      const yearRaw = getField(row, mapping, 'year');
      const year = yearRaw ? parseInt(yearRaw, 10) : null;
      const colorRaw = getField(row, mapping, 'color');
      const colors = parseColor(colorRaw);

      // Resolve tags
      const tagIds: string[] = [];
      if (l1Name) {
        const l1Id = await getOrCreateL1(l1Name, userId, tagMap, summary.categoriesCreated);
        if (l1Id) {
          tagIds.push(l1Id);
          if (l2Name) {
            const l2Id = await getOrCreateL2(l2Name, l1Id, userId, tagMap, summary.categoriesCreated);
            if (l2Id) tagIds.push(l2Id);
          }
        }
      }

      itemInserts.push({
        user_id: userId,
        description,
        country: getField(row, mapping, 'country') || null,
        city: getField(row, mapping, 'city') || null,
        region: getField(row, mapping, 'region') || null,
        acquired_year: year && !isNaN(year) ? year : null,
        material: getField(row, mapping, 'material') || null,
        color: colors.length > 0 ? colors : null,
        is_commemorative: false,
        collection_number: nextCollectionNumber++,
      });

      tagLinks.push({ rowIndex: itemInserts.length - 1, tagIds });
    }

    if (itemInserts.length === 0) continue;

    const { data: insertedItems, error: insertError } = await supabase
      .from('items')
      .insert(itemInserts)
      .select('id');

    if (insertError || !insertedItems) {
      // Mark all rows in batch as skipped
      for (let j = 0; j < itemInserts.length; j++) {
        summary.skipped.push({ row: i + j + 2, reason: 'Error al insertar' });
      }
      continue;
    }

    // Insert item_tags
    const itemTagInserts = tagLinks.flatMap(({ rowIndex, tagIds }) => {
      const item = insertedItems[rowIndex];
      if (!item) return [];
      return tagIds.map((tagId) => ({
        item_id: item.id,
        tag_id: tagId,
        user_id: userId,
      }));
    });

    if (itemTagInserts.length > 0) {
      await supabase.from('item_tags').insert(itemTagInserts);
    }

    summary.imported += insertedItems.length;
    onProgress?.(summary.imported, rows.length);
  }

  return summary;
}
