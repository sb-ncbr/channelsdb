import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile

from api.common import CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, PDB_ID_LOWER_REGEX, UNIPROT_ID_REGEX, SourceDatabase
from api.config import config


def validate_annotations() -> bool:
    is_ok = True
    root = Path(config['dirs']['annotations'])
    for datafile in root.glob('*.json'):
        with open(datafile) as f:
            try:
                json.load(f)
            except json.decoder.JSONDecodeError as e:
                print(f'{datafile} is not a valid JSON', file=sys.stderr)
                print(e, file=sys.stderr)
                is_ok = False
    return is_ok


def is_valid_id_dir(name: str, database: SourceDatabase) -> bool:
    # Entry directories are named by lowercased IDs, as the API looks them up
    if name != name.lower():
        return False
    if database == SourceDatabase.PDB:
        return re.search(PDB_ID_LOWER_REGEX, name) is not None
    return re.search(UNIPROT_ID_REGEX, name.upper()) is not None


def validate_data(database: SourceDatabase) -> bool:
    channel_types = set(CHANNEL_TYPES_PDB) if database == SourceDatabase.PDB else set(CHANNEL_TYPES_ALPHAFILL)
    is_ok = True
    root = Path(config['dirs'][database.lower()])
    for datafile in root.rglob('*'):
        relpath = datafile.relative_to(root)
        if datafile.is_dir():
            pathlen = len(relpath.parts)
            if (pathlen == 1 and len(relpath.parts[0]) != 2) or \
               (pathlen == 2 and (relpath.parts[0] != relpath.parts[1][1:3])) or \
               pathlen > 2:
                print(f'{datafile} is not a correctly placed directory', file=sys.stderr)
                is_ok = False
            elif pathlen == 2 and not is_valid_id_dir(relpath.parts[1], database):
                print(f'{datafile} does not represent a valid ID for {database}', file=sys.stderr)
                is_ok = False
        elif datafile.is_file():
            if len(relpath.parts) != 3:
                print(f'{datafile} is not a correctly placed file', file=sys.stderr)
                is_ok = False
            elif datafile.name == 'data.zip':
                with ZipFile(datafile) as z:
                    for file in z.namelist():
                        if Path(file).suffix != '.json' or Path(file).stem not in channel_types | {'annotations'}:
                            print(f'{datafile} contains invalid file {file}', file=sys.stderr)
                            is_ok = False
                            continue
                        with z.open(file) as f:
                            try:
                                json.load(f)
                            except json.decoder.JSONDecodeError as e:
                                print(f'{datafile}/{file} is not a valid JSON', file=sys.stderr)
                                print(e, file=sys.stderr)
                                is_ok = False
            elif datafile.suffix == '.png':
                if datafile.stem != relpath.parts[-2]:
                    print(f'{datafile} is not a correctly named image', file=sys.stderr)
                    is_ok = False
            else:
                print(f'{datafile} is not a correctly placed file', file=sys.stderr)
                is_ok = False
        else:
            print(f'{datafile} is not a file, neither a directory', file=sys.stderr)
            is_ok = False
    return is_ok


def validate() -> bool:
    is_ok = validate_annotations()
    is_ok &= validate_data(SourceDatabase.PDB)
    is_ok &= validate_data(SourceDatabase.AlphaFill)
    return is_ok


if __name__ == '__main__':
    if not validate():
        sys.exit(1)
