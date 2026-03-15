/**
 * seed-pins.js — one-time script to import 478 pins from CSV into Supabase.
 *
 * Prerequisites — add to .env:
 *   SUPABASE_SERVICE_ROLE_KEY   ← Supabase dashboard → Settings → API → service_role key
 *   SUPABASE_SEED_USER_ID       ← Supabase dashboard → Authentication → Users → your UUID
 *
 * Usage:
 *   node scripts/seed-pins.js
 *
 * Safe to inspect before running. Will abort if pins table already has data.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return {
    url: env['EXPO_PUBLIC_SUPABASE_URL'],
    serviceKey: env['SUPABASE_SERVICE_ROLE_KEY'],
    userId: env['SUPABASE_SEED_USER_ID'],
  };
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let i = 0;
    while (i <= line.length) {
      if (line[i] === '"') {
        let j = i + 1;
        while (j < line.length && line[j] !== '"') j++;
        fields.push(line.slice(i + 1, j).trim());
        i = j + 2;
      } else {
        let j = i;
        while (j < line.length && line[j] !== ',') j++;
        fields.push(line.slice(i, j).trim());
        i = j + 1;
      }
    }
    rows.push(fields);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Tag mapping
// Old CSV tags → new taxonomy defined in docs/decisions.md
// ---------------------------------------------------------------------------

function mapTags(tag1, tag2, tag3) {
  // Flatten all tag cells into individual lowercase tokens
  const tokens = [tag1, tag2, tag3]
    .flatMap(t => (t ? t.split(',').map(s => s.trim()) : []))
    .filter(Boolean)
    .map(t => t.toLowerCase());

  const isCommemorativo = tokens.includes('conmemorativo');
  const has = t => tokens.includes(t);
  const result = new Set();

  const hasEscudo  = has('escudo');
  const hasBandera = has('bandera');
  const hasFutbol  = has('fútbol') || has('futbol');
  const hasCiudad  = has('ciudad');
  const hasRegion  = has('región') || has('region');
  const hasPais    = has('país') || has('pais');

  // --- Escudo combinations ---
  if (hasEscudo && hasFutbol) {
    // Shield of a football club
    result.add('Fútbol');
    result.add('Club');
  } else if (hasEscudo && hasCiudad) {
    result.add('Geografía'); result.add('Escudo de Ciudad');
  } else if (hasEscudo && hasRegion) {
    result.add('Geografía'); result.add('Escudo de Región');
  } else if (hasEscudo && hasPais) {
    result.add('Geografía'); result.add('Escudo de País');
  } else if (hasEscudo) {
    // Ambiguous subtype — use L1
    result.add('Geografía');
  }

  // --- Bandera combinations ---
  if (hasBandera && hasCiudad) {
    result.add('Geografía'); result.add('Bandera de Ciudad');
  } else if (hasBandera && hasRegion) {
    result.add('Geografía'); result.add('Bandera de Región');
  } else if (hasBandera && hasPais) {
    result.add('Geografía'); result.add('Bandera de País');
  } else if (hasBandera) {
    result.add('Geografía');
  }

  // --- Direct token mappings ---
  // L2 tags also add their L1 parent so category-level filtering works.
  const directMap = {
    'fútbol':                   'Fútbol',
    'futbol':                   'Fútbol',
    'selección':                ['Fútbol', 'Selección'],
    'seleccion':                ['Fútbol', 'Selección'],
    'disney':                   ['Series y Películas', 'Disney'],
    'series y películas':       'Series y Películas',
    'series y peliculas':       'Series y Películas',
    'harry potter':             ['Series y Películas', 'Harry Potter'],
    'hard rock':                'Hard Rock',
    'música':                   'Música',
    'musica':                   'Música',
    'grupos de música':         'Música',
    'grupos de musica':         'Música',
    'turismo':                  'Turismo',
    'militar':                  'Militar',
    'símbolo':                  'Símbolos',
    'simbolo':                  'Símbolos',
    'animal':                   'Animales',
    'cerdito':                  'Animales',
    'icono comercial':          'Marcas',
    'vehículo':                 ['Objetos', 'Vehículo'],
    'vehiculo':                 ['Objetos', 'Vehículo'],
    'coches/motos':             ['Objetos', 'Vehículo'],
    'objeto':                   'Objetos',
    'religioso':                ['Símbolos', 'Religión'],
    'religión':                 ['Símbolos', 'Religión'],
    'religion':                 ['Símbolos', 'Religión'],
    'monumento':                'Turismo',
  };

  for (const token of tokens) {
    const mapped = directMap[token];
    if (!mapped) continue;
    if (Array.isArray(mapped)) {
      mapped.forEach(t => result.add(t));
    } else {
      result.add(mapped);
    }
  }

  return { newTagNames: [...result], isCommemorativo };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { url, serviceKey, userId } = loadEnv();

  if (!url || !serviceKey || !userId) {
    console.error(
      'Missing env vars. Add to .env:\n  SUPABASE_SERVICE_ROLE_KEY\n  SUPABASE_SEED_USER_ID'
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // Guard: abort if pins already exist
  const { count } = await supabase
    .from('pins')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.error(`Aborted: pins table already has ${count} rows. Clear it first if you want to re-seed.`);
    process.exit(1);
  }

  // Fetch tags
  console.log('Fetching tags...');
  const { data: dbTags, error: tagsError } = await supabase
    .from('tags')
    .select('id, name, parent_id');

  if (tagsError) {
    console.error('Failed to fetch tags:', tagsError.message);
    process.exit(1);
  }

  const tagByName = Object.fromEntries(dbTags.map(t => [t.name, t]));
  console.log(`${dbTags.length} tags loaded.`);

  // Parse CSV
  const csvPath = path.join(__dirname, '../source-data/coleccion-pins.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCSV(csvContent);
  const dataRows = rows.slice(1).filter(r => r[0]?.trim());
  console.log(`${dataRows.length} rows parsed from CSV.`);

  // Map rows to pins
  const pinsToInsert = [];
  const unmappedTagNames = new Set();

  for (const row of dataRows) {
    const description = row[0]?.trim();
    if (!description) continue;

    const city    = row[1]?.trim() || null;
    const country = row[2]?.trim() || null;
    const region  = row[3]?.trim() || null;
    const tag1    = row[4]?.trim() || '';
    const tag2    = row[5]?.trim() || '';
    const tag3    = row[6]?.trim() || '';

    const { newTagNames, isCommemorativo } = mapTags(tag1, tag2, tag3);

    const validTagNames = newTagNames.filter(name => {
      if (tagByName[name]) return true;
      unmappedTagNames.add(name);
      return false;
    });

    pinsToInsert.push({
      pin: {
        user_id: userId,
        description,
        city,
        country,
        region,
        image_url: null,
        acquired_year: null,
        is_commemorative: isCommemorativo,
        collection_number: pinsToInsert.length + 1,
      },
      tagNames: validTagNames,
    });
  }

  if (unmappedTagNames.size > 0) {
    console.warn('⚠ These tag names had no DB match (skipped):', [...unmappedTagNames].sort());
  }

  // Insert in batches of 50
  const BATCH = 50;
  let totalPins = 0;
  let totalTags = 0;

  console.log(`\nInserting ${pinsToInsert.length} pins...`);

  for (let i = 0; i < pinsToInsert.length; i += BATCH) {
    const batch = pinsToInsert.slice(i, i + BATCH);

    const { data: inserted, error: pinError } = await supabase
      .from('pins')
      .insert(batch.map(b => b.pin))
      .select('id');

    if (pinError) {
      console.error(`Batch ${i}–${i + BATCH} failed:`, pinError.message);
      continue;
    }

    const tagInserts = [];
    for (let j = 0; j < inserted.length; j++) {
      for (const tagName of batch[j].tagNames) {
        tagInserts.push({
          pin_id: inserted[j].id,
          tag_id: tagByName[tagName].id,
          user_id: userId,
        });
      }
    }

    if (tagInserts.length > 0) {
      const { error: tagError } = await supabase.from('pin_tags').insert(tagInserts);
      if (tagError) {
        console.error('Tag insert error:', tagError.message);
      } else {
        totalTags += tagInserts.length;
      }
    }

    totalPins += inserted.length;
    process.stdout.write(`\r  ${totalPins}/${pinsToInsert.length} pins inserted...`);
  }

  console.log(`\n\nDone! ${totalPins} pins, ${totalTags} tag assignments.`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
