import json
import re
import sys
from collections.abc import Iterator
from pathlib import Path
from zipfile import ZipFile

from api.common import CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, PDB_ID_LOWER_REGEX, UNIPROT_ID_REGEX, SourceDatabase
from api.config import config


type Types = tuple[type, ...]
FLAG: Types = (bool,)
NUMBER: Types = (int, float)


def has_type(value, types: Types) -> bool:
    # A bool is an int in Python, but not a number in JSON
    return isinstance(value, types) and (bool in types or not isinstance(value, bool))


# Keys of the layers' geometry that CAVER's files named differently from MOLE's (DATA_FIXES.md, fix 2)
RENAMED_GEOMETRY_KEYS = {'bottleneck': 'Bottleneck'}


def geometries(data: dict) -> Iterator[tuple[dict, str]]:
    """The geometry of each layer of each channel of a file of channels, and its path in the file"""
    for group, channels in data.get('Channels', {}).items():
        for i, channel in enumerate(channels):
            for j, layer in enumerate(channel.get('Layers', {}).get('LayersInfo', [])):
                if isinstance(geometry := layer.get('LayerGeometry'), dict):
                    yield geometry, f'Channels.{group}[{i}].Layers.LayersInfo[{j}].LayerGeometry'


def typed_fields(data: dict) -> Iterator[tuple[dict, str, str, Types]]:
    """The flags and numbers of a file of channels whose types are checked: the object holding each, its key, its path
    in the file and its types. CAVER's files had them stored as text (DATA_FIXES.md, fix 1), the website and MOLEonline
    read the text "false" as a set flag."""
    def field(container, key: str, path: str, types: Types) -> Iterator[tuple[dict, str, str, Types]]:
        if isinstance(container, dict) and key in container:
            yield container, key, f'{path}.{key}' if path else key, types

    yield from field(data, 'FoundOrigin', '', FLAG)
    for key in ('InMembrane', 'IsBetaBarel'):
        yield from field(data.get('config'), key, 'config', FLAG)
    for group, channels in data.get('Channels', {}).items():
        for i, channel in enumerate(channels):
            yield from field(channel, 'Auto', f'Channels.{group}[{i}]', FLAG)
    for geometry, path in geometries(data):
        for key in ('LocalMinimum', 'Bottleneck'):
            yield from field(geometry, key, path, FLAG)
        for key in ('StartDistance', 'EndDistance'):
            yield from field(geometry, key, path, NUMBER)


def validate_types(name: str, data: dict) -> bool:
    wrong = [(path, container[key]) for container, key, path, types in typed_fields(data) if not has_type(container[key], types)]
    if wrong:
        path, value = wrong[0]
        print(f'{name} has {len(wrong)} values of a wrong type, e.g. {path} = {value!r}', file=sys.stderr)
    renamed = [f'{path}.{key}' for geometry, path in geometries(data) for key in RENAMED_GEOMETRY_KEYS if key in geometry]
    if renamed:
        print(f'{name} has {len(renamed)} keys named differently than in MOLE, e.g. {renamed[0]}', file=sys.stderr)
    return not wrong and not renamed


def is_channel(channel: dict) -> bool:
    """A channel is a path: CAVER stored a single point where it found none (DATA_FIXES.md, fix 5)"""
    return len(channel.get('Profile', [])) >= 2


def validate_channels(name: str, data: dict) -> bool:
    channels = [(f'Channels.{group}[{i}]', channel) for group, group_channels in data.get('Channels', {}).items()
                for i, channel in enumerate(group_channels)]
    if not channels:
        print(f'{name} has no channels', file=sys.stderr)
    single = [path for path, channel in channels if not is_channel(channel)]
    if single:
        print(f'{name} has {len(single)} channels with fewer than 2 points, e.g. {single[0]}', file=sys.stderr)
    return bool(channels) and not single and validate_types(name, data)


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
                    if not any(Path(file).stem in channel_types for file in z.namelist()):
                        print(f'{datafile} has no channels', file=sys.stderr)
                        is_ok = False
                    for file in z.namelist():
                        if Path(file).suffix != '.json' or Path(file).stem not in channel_types | {'annotations'}:
                            print(f'{datafile} contains invalid file {file}', file=sys.stderr)
                            is_ok = False
                            continue
                        with z.open(file) as f:
                            try:
                                data = json.load(f)
                            except json.decoder.JSONDecodeError as e:
                                print(f'{datafile}/{file} is not a valid JSON', file=sys.stderr)
                                print(e, file=sys.stderr)
                                is_ok = False
                                continue
                        if Path(file).stem in channel_types:
                            is_ok &= validate_channels(f'{datafile}/{file}', data)
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
