import json
import os
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from datetime import date
from pathlib import Path
from zipfile import ZipFile

from api.common import CHANNEL_TYPES, CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, SourceDatabase
from api.config import config
from utils.progress import Progress


BASE = Path(config['dirs']['base'])
# Counts of the entries from the previous run, so that only the new and changed data.zip files are read again.
# Reading all of them takes long on the network storage, while they rarely change.
# Keyed by paths relative to the data directory, so that the cache can be carried over to a new release of the data.
CACHE_FILE = BASE / '.statistics_cache.json'
# Reading is bound by the latency of the storage, more parallel reads keep it busy
WORKERS = 16


def count_channels(datafile: Path) -> tuple[dict[str, int], bool]:
    """Counts of channels by type in a data.zip, and whether all its files were read correctly"""
    counts = {}
    is_ok = True
    with ZipFile(datafile) as z:
        for json_file in z.namelist():
            if (name := Path(json_file).stem) in CHANNEL_TYPES:
                with z.open(json_file) as f:
                    try:
                        orig = json.load(f)
                    except json.decoder.JSONDecodeError:
                        print(f'{datafile.parts[-2]} / {json_file} not a correct JSON', file=sys.stderr)
                        is_ok = False
                        continue
                counts[CHANNEL_TYPES[name]] = sum(len(orig['Channels'][key]) for key in ('Paths', 'Tunnels', 'Pores', 'MergedPores'))
    return counts, is_ok


def load_cache() -> dict[str, list]:
    try:
        with open(CACHE_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        return {}


def get_statistics(database: SourceDatabase, cache: dict[str, list], new_cache: dict[str, list]) -> dict[str, Counter]:
    root = Path(config['dirs'][database.lower()])
    channel_types = CHANNEL_TYPES_PDB if database == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL

    all_counts: dict[str, dict[str, int]] = {}
    to_read = []
    for datafile in root.glob('*/*/data.zip'):
        stat = datafile.stat()
        key = str(datafile.relative_to(BASE))
        if (cached := cache.get(key)) and cached[:2] == [stat.st_size, stat.st_mtime_ns]:
            new_cache[key] = cached
            all_counts[datafile.parts[-2]] = cached[2]
        else:
            to_read.append((datafile, stat))

    print(f'{database}: {len(all_counts) + len(to_read)} entries, reading {len(to_read)} new or changed', file=sys.stderr, flush=True)
    progress = Progress(database, len(to_read))
    with ProcessPoolExecutor(WORKERS) as executor:
        results = executor.map(count_channels, [datafile for datafile, _ in to_read], chunksize=16)
        for (datafile, stat), (counts, is_ok) in zip(to_read, results, strict=True):
            all_counts[datafile.parts[-2]] = counts
            # Entries with errors are not cached, so that they are reported again
            if is_ok:
                new_cache[str(datafile.relative_to(BASE))] = [stat.st_size, stat.st_mtime_ns, counts]
            progress.update(stat.st_size)

    return {protein_id: Counter({value: counts.get(value, 0) for value in channel_types.values()})
            for protein_id, counts in all_counts.items()}


def write_json(path: Path, data, **kwargs) -> None:
    # The API reads the files while they are being replaced, so they are never seen half-written
    tmp = path.with_name(f'.{path.name}.tmp')
    with open(tmp, 'w') as f:
        json.dump(data, f, **kwargs)
    os.replace(tmp, path)


def save_statistics() -> None:
    cache = load_cache()
    new_cache: dict[str, list] = {}
    pdb_stats = get_statistics(SourceDatabase.PDB, cache, new_cache)
    alphafill_stats = get_statistics(SourceDatabase.AlphaFill, cache, new_cache)

    overall = Counter({value: 0 for value in CHANNEL_TYPES.values()})
    total_entries = 0
    for stats in (pdb_stats, alphafill_stats):
        for protein_stats in stats.values():
            total_entries += 1
            for channel_type, count in protein_stats.items():
                if count:
                    overall[channel_type] += 1

    statistics = {
        'statistics': overall,
        'entries_count': total_entries,
        'date': date.today().strftime('%d/%m/%Y')
    }

    write_json(BASE / 'statistics.json', statistics, sort_keys=True, indent=4)

    db_content = {
        'PDB': {},
        'AlphaFill': {}
    }

    for pdb_id, counts in pdb_stats.items():
        db_content['PDB'][pdb_id] = [counts[value] for value in CHANNEL_TYPES_PDB.values()]

    for uniprot_id, counts in alphafill_stats.items():
        db_content['AlphaFill'][uniprot_id] = [counts[value] for value in CHANNEL_TYPES_ALPHAFILL.values()]

    write_json(BASE / 'db_content.json', db_content, sort_keys=True)

    # Removed entries are left out of the cache
    write_json(CACHE_FILE, new_cache)


if __name__ == '__main__':
    save_statistics()
