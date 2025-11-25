import json
from pathlib import Path
from zipfile import ZipFile
import sys
import re

from api.config import config
from api.common import CHANNEL_TYPES_PDB, CHANNEL_TYPES_ALPHAFILL, SourceDatabase, UNIPROT_ID_REGEX, PDB_ID_LOWER_REGEX


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


def validate_data(database: SourceDatabase) -> bool:
    if database == SourceDatabase.PDB:
        channel_types = set(CHANNEL_TYPES_PDB)
        regex = PDB_ID_LOWER_REGEX
    else:
        channel_types = set(CHANNEL_TYPES_ALPHAFILL)
        regex = UNIPROT_ID_REGEX
    is_ok = True
    root = Path(config['dirs'][database.value.lower()])
    for datafile in root.rglob('*'):
        relpath = datafile.relative_to(root)
        if datafile.is_dir():
            pathlen = len(relpath.parts)
            if pathlen == 1 and len(relpath.parts[0]) != 2 or \
               pathlen == 2 and (relpath.parts[0] != relpath.parts[1][1:3]) or \
               pathlen > 2:
                print(f'{datafile} is not a correctly placed directory', file=sys.stderr)
                is_ok = False
            elif pathlen == 2 and re.search(regex, relpath.parts[1]) is None:
                print(f'{datafile} does not represent a valid ID for {database.value}', file=sys.stderr)
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
