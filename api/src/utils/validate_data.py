import hashlib
import json
import math
import os
import re
import sys
from collections.abc import Iterator
from concurrent.futures import ProcessPoolExecutor
from itertools import pairwise, repeat
from pathlib import Path
from zipfile import ZipFile

import api.common
from api.common import CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, PDB_ID_LOWER_REGEX, UNIPROT_ID_REGEX, SourceDatabase
from api.config import config
from utils.progress import Progress


BASE = Path(config['dirs']['base'])
# The data.zip files that passed the validation, so that only the new and changed ones are read again, as reading all of
# them takes long on the network storage. Keyed by paths relative to the data directory, so that the cache can be carried
# over to a new release of the data; valid for the rules they were validated by (this file and the channel types).
CACHE_FILE = BASE / '.validation_cache.json'
RULES = hashlib.sha256(Path(__file__).read_bytes() + Path(api.common.__file__).read_bytes()).hexdigest()[:16]
# Reading is bound by the latency of the storage, more parallel reads keep it busy
WORKERS = 16


type Types = tuple[type, ...]
FLAG: Types = (bool,)
NUMBER: Types = (int, float)
TEXT: Types = (str,)


def has_type(value, types: Types) -> bool:
    # A bool is an int in Python, but not a number in JSON
    return isinstance(value, types) and (bool in types or not isinstance(value, bool))


# Parts of MOLE's files that nothing reads, the API serves only the channels (DATA_FIXES.md, fix 7)
UNUSED_KEYS = ('Cavities',)

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
    """The flags, numbers and IDs of a file of channels whose types are checked: the object holding each, its key, its
    path in the file and its types. CAVER's files had the flags and numbers stored as text (DATA_FIXES.md, fix 1), the
    website and MOLEonline read the text "false" as a set flag; and the IDs of the channels as numbers (fix 6), while the
    annotations refer to them as text, so the website did not find the annotations of CAVER's channels."""
    def field(container, key: str, path: str, types: Types) -> Iterator[tuple[dict, str, str, Types]]:
        if isinstance(container, dict) and key in container:
            yield container, key, f'{path}.{key}' if path else key, types

    yield from field(data, 'FoundOrigin', '', FLAG)
    for key in ('InMembrane', 'IsBetaBarel'):
        yield from field(data.get('config'), key, 'config', FLAG)
    for group, channels in data.get('Channels', {}).items():
        for i, channel in enumerate(channels):
            yield from field(channel, 'Id', f'Channels.{group}[{i}]', TEXT)
            yield from field(channel, 'Auto', f'Channels.{group}[{i}]', FLAG)
    for geometry, path in geometries(data):
        for key in ('LocalMinimum', 'Bottleneck'):
            yield from field(geometry, key, path, FLAG)
        for key in ('StartDistance', 'EndDistance'):
            yield from field(geometry, key, path, NUMBER)


def type_errors(name: str, data: dict) -> list[str]:
    errors = []
    wrong = [(path, container[key]) for container, key, path, types in typed_fields(data) if not has_type(container[key], types)]
    if wrong:
        path, value = wrong[0]
        errors.append(f'{name} has {len(wrong)} values of a wrong type, e.g. {path} = {value!r}')
    renamed = [f'{path}.{key}' for geometry, path in geometries(data) for key in RENAMED_GEOMETRY_KEYS if key in geometry]
    if renamed:
        errors.append(f'{name} has {len(renamed)} keys named differently than in MOLE, e.g. {renamed[0]}')
    return errors


def is_channel(channel: dict) -> bool:
    """A channel is a path: CAVER stored a single point where it found none (DATA_FIXES.md, fix 5)"""
    return len(channel.get('Profile', [])) >= 2


def along_path(profile: list[dict]) -> list[float]:
    """The distance of each point of a profile from the first one, along the path through the points"""
    distances = [0.0]
    for a, b in pairwise(profile):
        distances.append(distances[-1] + math.dist((a['X'], a['Y'], a['Z']), (b['X'], b['Y'], b['Z'])))
    return distances


# The profile's Distance is the distance from the start along the points and T goes from 0 to 1, as in MOLE's files
# (DATA_FIXES.md, fix 3). The last Distance of MOLE's profiles is the length of the path through the points within
# 0.2 %, their values are rounded.
PROFILE_TOLERANCE = 1e-3  # Å, and of T
PATH_LENGTH_TOLERANCE = 0.005  # relative


# Å, how far a channel's last layer may end past its profile. CAVER's end 4 % after it in the median; those ending much
# further had their profile cut short, the rest of the tunnel squeezed into the last layer. MOLE's end before it.
LAYERS_PAST_PROFILE = 5.0

# What a channel is; its name, if any, is in the annotations, with its reference
CHANNEL_KINDS = ('Tunnel', 'Pore', 'Path')


def profile_errors(profile: list[dict]) -> list[str]:
    """The rules of fix 3 the channel's profile (of at least 2 points) breaks"""
    distances = [point['Distance'] for point in profile]
    ts = [point['T'] for point in profile]
    length = along_path(profile)[-1]
    errors = []
    if abs(distances[0]) > PROFILE_TOLERANCE:
        errors.append('Distance does not start at 0')
    if any(b < a - PROFILE_TOLERANCE for a, b in pairwise(distances)):
        errors.append('Distance decreases')
    if abs(distances[-1] - length) > max(PROFILE_TOLERANCE, PATH_LENGTH_TOLERANCE * length):
        errors.append('the last Distance is not the length of the path through the points')
    if abs(ts[0]) > PROFILE_TOLERANCE or abs(ts[-1] - 1) > PROFILE_TOLERANCE:
        errors.append('T does not go from 0 to 1')
    if any(b < a - PROFILE_TOLERANCE for a, b in pairwise(ts)):
        errors.append('T decreases')
    return errors


def channel_errors(name: str, data: dict) -> list[str]:
    errors = []
    channels = [(f'Channels.{group}[{i}]', channel) for group, group_channels in data.get('Channels', {}).items()
                for i, channel in enumerate(group_channels)]
    if not channels:
        errors.append(f'{name} has no channels')
    single = [path for path, channel in channels if not is_channel(channel)]
    if single:
        errors.append(f'{name} has {len(single)} channels with fewer than 2 points, e.g. {single[0]}')
    kinds = [f'{path}.Type = {channel.get("Type")!r}' for path, channel in channels if channel.get('Type') not in CHANNEL_KINDS]
    if kinds:
        errors.append(f'{name} has {len(kinds)} channels whose Type is not one of {", ".join(CHANNEL_KINDS)}, e.g. {kinds[0]}')
    profiles: dict[str, list[str]] = {}
    for path, channel in channels:
        if is_channel(channel):
            for error in profile_errors(channel['Profile']):
                profiles.setdefault(error, []).append(path)
            layers = channel.get('Layers', {}).get('LayersInfo') or [{}]
            end = layers[-1].get('LayerGeometry', {}).get('EndDistance')
            if has_type(end, NUMBER) and end - channel['Profile'][-1]['Distance'] > LAYERS_PAST_PROFILE:
                profiles.setdefault(f'the layers end more than {LAYERS_PAST_PROFILE} Å past it', []).append(path)
    for error, paths in profiles.items():
        errors.append(f'{name} has {len(paths)} channels whose profile is wrong: {error}, e.g. {paths[0]}')
    # The same channel twice, possibly found from two cavities
    seen: dict[str, str] = {}
    duplicates = []
    for path, channel in channels:
        content = json.dumps({key: value for key, value in channel.items() if key not in ('Id', 'Cavity')}, sort_keys=True)
        if content in seen:
            duplicates.append(f'{path} (of {seen[content]})')
        else:
            seen[content] = path
    if duplicates:
        errors.append(f'{name} has {len(duplicates)} channels twice, e.g. {duplicates[0]}')
    errors += [f'{name} has {key}, which nothing reads' for key in UNUSED_KEYS if key in data]
    return errors + type_errors(name, data)


DOI_REGEX = re.compile(r'^10\.\d{4,9}/\S+$')


def reference_errors(name: str, annotations: list[dict]) -> list[str]:
    """The annotations (of channels or residues) whose reference is broken: its type is missing, it has whitespace around
    it (e.g. tabs, which break it as a link), or a DOI does not look like one"""
    wrong = [annotation for annotation in annotations
             if not isinstance(reference_type := annotation.get('ReferenceType'), str) or not reference_type
             or not isinstance(reference := annotation.get('Reference'), str) or reference != reference.strip()
             or (reference_type == 'DOI' and not DOI_REGEX.match(reference))]
    if wrong:
        example = f'{wrong[0].get("Id")}: {wrong[0].get("ReferenceType")!r} {wrong[0].get("Reference")!r}'
        return [f'{name} has {len(wrong)} annotations with a broken reference, e.g. {example}']
    return []


def validate_annotations() -> bool:
    is_ok = True
    root = Path(config['dirs']['annotations'])
    for datafile in root.glob('*.json'):
        with open(datafile) as f:
            try:
                annotations = json.load(f)
            except json.decoder.JSONDecodeError as e:
                print(f'{datafile} is not a valid JSON', file=sys.stderr)
                print(e, file=sys.stderr)
                is_ok = False
                continue
        for error in reference_errors(str(datafile), annotations):
            print(error, file=sys.stderr)
            is_ok = False
    return is_ok


def is_valid_id_dir(name: str, database: SourceDatabase) -> bool:
    # Entry directories are named by lowercased IDs, as the API looks them up
    if name != name.lower():
        return False
    if database == SourceDatabase.PDB:
        return re.search(PDB_ID_LOWER_REGEX, name) is not None
    return re.search(UNIPROT_ID_REGEX, name.upper()) is not None


def datafile_errors(datafile: Path, channel_types: set[str]) -> list[str]:
    """The errors of an entry's data.zip, read in a worker process"""
    errors = []
    channel_ids: set[str] = set()
    annotations: list[dict] = []
    with ZipFile(datafile) as z:
        if not any(Path(file).stem in channel_types for file in z.namelist()):
            errors.append(f'{datafile} has no channels')
        for file in z.namelist():
            if Path(file).suffix != '.json' or Path(file).stem not in channel_types | {'annotations'}:
                errors.append(f'{datafile} contains invalid file {file}')
                continue
            with z.open(file) as f:
                try:
                    data = json.load(f)
                except json.decoder.JSONDecodeError as e:
                    errors.append(f'{datafile}/{file} is not a valid JSON\n{e}')
                    continue
            if Path(file).stem in channel_types:
                errors += channel_errors(f'{datafile}/{file}', data)
                channel_ids.update(str(channel.get('Id')) for group in data.get('Channels', {}).values() for channel in group)
            else:
                errors += reference_errors(f'{datafile}/{file}', data)
                annotations = data
    # The website shows an annotation with the channel of its Id, an annotation of no channel is not shown
    if orphans := sorted({str(annotation.get('Id')) for annotation in annotations} - channel_ids):
        errors.append(f'{datafile}/annotations.json has annotations of channels the entry does not have: {", ".join(orphans)}')
    return errors


def validate_datafiles(database: SourceDatabase, datafiles: list[Path], cache: dict[str, list], new_cache: dict[str, list]) -> bool:
    """Validates the data.zip files not validated by these rules before, unchanged since then, in parallel"""
    channel_types = set(CHANNEL_TYPES_PDB) if database == SourceDatabase.PDB else set(CHANNEL_TYPES_ALPHAFILL)
    to_read = []
    for datafile in datafiles:
        stat = datafile.stat()
        key = str(datafile.relative_to(BASE))
        if cache.get(key) == [stat.st_size, stat.st_mtime_ns, RULES]:
            new_cache[key] = cache[key]
        else:
            to_read.append((datafile, key, stat))

    print(f'{database}: {len(datafiles)} entries, validating {len(to_read)} new, changed or not validated by these rules',
          file=sys.stderr, flush=True)
    is_ok = True
    progress = Progress(database, len(to_read))
    with ProcessPoolExecutor(WORKERS) as executor:
        results = executor.map(datafile_errors, [datafile for datafile, _, _ in to_read], repeat(channel_types), chunksize=16)
        for (_, key, stat), errors in zip(to_read, results, strict=True):
            for error in errors:
                print(error, file=sys.stderr)
            if errors:
                # Files with errors are not cached, so that they are reported again
                is_ok = False
            else:
                new_cache[key] = [stat.st_size, stat.st_mtime_ns, RULES]
            progress.update(stat.st_size)
    return is_ok


def validate_data(database: SourceDatabase, cache: dict[str, list], new_cache: dict[str, list]) -> bool:
    is_ok = True
    root = Path(config['dirs'][database.lower()])
    datafiles = []
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
                datafiles.append(datafile)
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
    return validate_datafiles(database, datafiles, cache, new_cache) and is_ok


def load_cache() -> dict[str, list]:
    try:
        with open(CACHE_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        return {}


def save_cache(cache: dict[str, list]) -> None:
    tmp = CACHE_FILE.with_name(f'.{CACHE_FILE.name}.tmp')
    with open(tmp, 'w') as f:
        json.dump(cache, f)
    os.replace(tmp, CACHE_FILE)


def validate() -> bool:
    cache = load_cache()
    new_cache: dict[str, list] = {}
    is_ok = validate_annotations()
    is_ok &= validate_data(SourceDatabase.PDB, cache, new_cache)
    is_ok &= validate_data(SourceDatabase.AlphaFill, cache, new_cache)
    save_cache(new_cache)
    return is_ok


if __name__ == '__main__':
    if not validate():
        sys.exit(1)
