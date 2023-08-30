import json
from datetime import date
from collections import Counter
from zipfile import ZipFile
from pathlib import Path

from api.config import config
from api.common import CHANNEL_TYPES, CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, SourceDatabase


def get_statistics(database: SourceDatabase) -> dict[str, Counter]:
    counts = {}
    root = Path(config['dirs'][database.value.lower()])
    for datafile in root.rglob('data.zip'):
        protein_id = datafile.parts[-2]
        if database == SourceDatabase.PDB:
            counts[protein_id] = Counter({value: 0 for value in CHANNEL_TYPES_PDB.values()})
        else:
            counts[protein_id] = Counter({value: 0 for value in CHANNEL_TYPES_ALPHAFILL.values()})
        with ZipFile(datafile) as z:
            for json_file in z.namelist():
                if (name := Path(json_file).stem) in CHANNEL_TYPES:
                    with z.open(json_file) as f:
                        try:
                            orig = json.load(f)
                            for key in ('Paths', 'Tunnels', 'Pores', 'MergedPores'):
                                counts[protein_id][CHANNEL_TYPES[name]] += len(orig['Channels'][key])
                        except json.decoder.JSONDecodeError:
                            print(f'{protein_id} / {json_file} not a correct JSON')
                            continue
    return counts


def save_statistics() -> None:
    pdb_stats = get_statistics(SourceDatabase.PDB)
    alphafill_stats = get_statistics(SourceDatabase.AlphaFill)

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

    with open(Path(config['dirs']['base']) / 'statistics.json', 'w') as f:
        json.dump(statistics, f, sort_keys=True, indent=4)

    db_content = {
        'PDB': {},
        'AlphaFill': {}
    }

    for pdb_id, counts in pdb_stats.items():
        db_content['PDB'][pdb_id] = [counts[value] for value in CHANNEL_TYPES_PDB.values()]

    for uniprot_id, counts in alphafill_stats.items():
        db_content['AlphaFill'][uniprot_id] = [counts[value] for value in CHANNEL_TYPES_ALPHAFILL.values()]

    with open(Path(config['dirs']['base']) / 'db_content.json', 'w') as f:
        json.dump(db_content, f, sort_keys=True)


if __name__ == '__main__':
    save_statistics()
