"""Fixes the data (DATA_FIXES.md):

- fix 1: the flags and numbers that CAVER's files store as text become JSON values
- fix 2: CAVER's flag of the bottleneck layer is named Bottleneck as in MOLE's files, not bottleneck
- fix 3: the Distance of each point of CAVER's profiles is the distance from the start along the points, not from the
  previous point, and T goes from 0 to 1 along the profile, as in MOLE's files
- fix 5: the channels of a single point are removed (CAVER stored them where it found no tunnel), and so are the files
  of channels and the entries left without any
- fix 6: the IDs of CAVER's channels are text, as in MOLE's files and as the annotations refer to them, not numbers
- fix 7: the cavities MOLE computed, which nothing reads, are removed from its files

Usage: fix_data.py SOURCE OUTPUT

SOURCE is the data (PDB, AlphaFill and Annotations), it is only read. OUTPUT, a new directory on the same file system,
receives all the fixed data, to be released with update_data.sh: the unchanged files are hardlinked from SOURCE (never
modify them in place), the changed data.zip files are written anew and the removed entries are left out. Nothing else
changes: the other files of an archive are copied byte for byte, and a fixed file keeps its formatting and the order of
its keys. Each fixed file is checked to differ from the original only in the fixes: with the original profiles, values,
names and channels put back, it is the original byte for byte. Errors are reported, the output is then incomplete and not to
be released.
"""
import json
import os
import re
import sys
from collections import Counter
from collections.abc import Callable
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from itertools import pairwise
from pathlib import Path
from zipfile import ZipFile, ZipInfo

from api.common import CHANNEL_TYPES
from utils.validate_data import (
    FLAG,
    NUMBER,
    RENAMED_GEOMETRY_KEYS,
    TEXT,
    UNUSED_KEYS,
    Types,
    along_path,
    geometries,
    has_type,
    is_channel,
    typed_fields,
)


DATA_DIRS = ('PDB', 'AlphaFill')

# Å, how far CAVER's stored distances may be from the steps between the points (they are rounded)
STEP_TOLERANCE = 1e-3

# How CAVER's files are formatted: on one line, or indented by 4 with Windows line ends
FORMATS: tuple[Callable[[dict], str], ...] = (
    json.dumps,
    lambda data: json.dumps(data, indent=4).replace('\n', '\r\n'),
)


class FixError(Exception):
    pass


def converted(value, types: Types):
    """The JSON value of a flag or number stored as text, or the text of an ID stored as a number (as it is written)"""
    if types == TEXT:
        if has_type(value, NUMBER):
            return json.dumps(value)
    elif isinstance(value, str):
        if types == FLAG and value in ('true', 'false'):
            return value == 'true'
        if types != FLAG:
            try:
                number = json.loads(value)
            except json.decoder.JSONDecodeError:
                pass
            else:
                if has_type(number, types):
                    return number
    raise FixError(f'unexpected value {value!r}')


def rename_keys(container: dict, names: dict[str, str]) -> None:
    """Renames the keys of the object in place, keeping their order"""
    items = list(container.items())
    container.clear()
    container.update((names.get(key, key), value) for key, value in items)


def fix_profiles(data: dict, counts: Counter) -> dict[str, list]:
    """Sets Distance and T of the points of the channels' profiles as in MOLE's files. The original (Distance, T) of the
    points by the path of the profile, for those changed."""
    originals = {}
    for group, channels in data['Channels'].items():
        for i, channel in enumerate(channels):
            path = f'Channels.{group}[{i}].Profile'
            profile = channel['Profile']
            distances = along_path(profile)
            if distances[-1] == 0:
                raise FixError(f'{path} has all its points at one place')
            fixed = [(distance, distance / distances[-1]) for distance in distances]
            stored = [(point['Distance'], point['T']) for point in profile]
            if stored == fixed:
                continue
            # The stored distances are the steps between the points, except in a few profiles: counted, fixed alike
            steps = [0.0] + [b - a for a, b in pairwise(distances)]
            if any(abs(point['Distance'] - step) > STEP_TOLERANCE for point, step in zip(profile, steps, strict=True)):
                counts['profiles whose distances were not the steps'] += 1
            for point, (distance, t) in zip(profile, fixed, strict=True):
                point['Distance'], point['T'] = distance, t
            originals[path] = stored
            counts['profiles along the path'] += 1
    return originals


def fix_file(original: str) -> tuple[str | None, Counter]:
    """CAVER's file without its channels of a single point, with its flags and numbers as JSON values, its keys named and
    its profiles measured as in MOLE's files (None when no channel is left), and the numbers of the channels removed,
    the values fixed, the keys renamed by key and the profiles fixed"""
    data = json.loads(original)
    dump = next((dump for dump in FORMATS if dump(data) == original), None)
    if dump is None:
        raise FixError('formatted differently than expected')

    counts = Counter()
    removed = []
    for group, channels in data.get('Channels', {}).items():
        removed += [(group, i, channel) for i, channel in enumerate(channels) if not is_channel(channel)]
        channels[:] = [channel for channel in channels if is_channel(channel)]
    if removed:
        counts['channels of a single point'] = len(removed)
    if not any(data.get('Channels', {}).values()):
        return None, counts

    renamed = set()
    for geometry, path in geometries(data):
        if found := [key for key in RENAMED_GEOMETRY_KEYS if key in geometry]:
            if clashing := [RENAMED_GEOMETRY_KEYS[key] for key in found if RENAMED_GEOMETRY_KEYS[key] in geometry]:
                raise FixError(f'{path} has both {found} and {clashing}')
            rename_keys(geometry, RENAMED_GEOMETRY_KEYS)
            renamed.add(path)
            counts.update(f'{key} -> {RENAMED_GEOMETRY_KEYS[key]}' for key in found)

    originals = {}
    for container, key, path, types in typed_fields(data):
        if not has_type(value := container[key], types):
            try:
                container[key] = converted(value, types)
            except FixError as e:
                raise FixError(f'{path}: {e}') from None
            originals[path] = value
            counts[key] += 1
    profiles = fix_profiles(data, counts)
    fixed = dump(data)

    # Read back: all the values have their types now, and with the original profiles, values, names and channels put
    # back (in the reverse order of the fixes), it is the original
    restored = json.loads(fixed)
    for group, channels in restored['Channels'].items():
        for i, channel in enumerate(channels):
            if (path := f'Channels.{group}[{i}].Profile') in profiles:
                for point, (distance, t) in zip(channel['Profile'], profiles.pop(path), strict=True):
                    point['Distance'], point['T'] = distance, t
    for container, key, path, types in typed_fields(restored):
        if not has_type(container[key], types):
            raise FixError(f'{path} still has a wrong type')
        if path in originals:
            container[key] = originals.pop(path)
    original_names = {new: old for old, new in RENAMED_GEOMETRY_KEYS.items()}
    for geometry, path in geometries(restored):
        if path in renamed:
            rename_keys(geometry, original_names)
            renamed.remove(path)
    for group, i, channel in removed:
        restored['Channels'][group].insert(i, channel)
    if profiles or originals or renamed or dump(restored) != original:
        raise FixError('more than the fixes changed')
    return fixed, counts


WHITESPACE = re.compile(r'[ \t\n\r]*')


def without_member(text: str, key: str) -> str:
    """The text of a JSON object without its top-level member key, every other character kept as it is (MOLE's files
    are not written back the same by json.dumps)"""
    decoder = json.JSONDecoder()
    position = WHITESPACE.match(text).end()
    if text[position] != '{':
        raise FixError('not a JSON object')
    position = WHITESPACE.match(text, position + 1).end()
    members = []  # (key, where it starts, where its value ends)
    while text[position] != '}':
        start = position
        name, position = decoder.raw_decode(text, position)
        position = WHITESPACE.match(text, position).end()
        if text[position] != ':':
            raise FixError('not a JSON object')
        _, position = decoder.raw_decode(text, WHITESPACE.match(text, position + 1).end())
        members.append((name, start, position))
        position = WHITESPACE.match(text, position).end()
        if text[position] == ',':
            position = WHITESPACE.match(text, position + 1).end()
        elif text[position] != '}':
            raise FixError('not a JSON object')

    i = [name for name, _, _ in members].index(key)
    if i + 1 < len(members):
        # The member up to the next one, with its comma
        cut = members[i][1], members[i + 1][1]
    elif i > 0:
        # The last member, with the comma after the previous one
        cut = members[i - 1][2], members[i][2]
    else:
        cut = members[i][1], members[i][2]
    fixed = text[:cut[0]] + text[cut[1]:]

    # Read back: the same object without the member
    original = json.loads(text)
    del original[key]
    if json.loads(fixed) != original:
        raise FixError(f'more than {key} removed')
    return fixed


def fixed_members(datafile: Path) -> tuple[list[tuple[ZipInfo, bytes]], Counter, list[str]]:
    """The members of the entry's data.zip as they are to be (the files of channels left without any are removed), the
    numbers of what was fixed (and of the files changed and removed), and the errors"""
    counts = Counter()
    errors = []
    members = []
    with ZipFile(datafile) as z:
        for info in z.infolist():
            content = z.read(info)
            name = info.filename
            if Path(name).stem in CHANNEL_TYPES:
                try:
                    if name.endswith('caver.json'):
                        fixed, fixed_counts = fix_file(content.decode('utf-8'))
                    else:
                        # MOLE's files are not rewritten, their formatting would not be kept: what nothing reads is cut
                        # out of their text
                        text = content.decode('utf-8')
                        data = json.loads(text)
                        channels = [channel for group in data['Channels'].values() for channel in group]
                        if not all(is_channel(channel) for channel in channels):
                            raise FixError('MOLE channels of a single point are not expected')
                        fixed, fixed_counts = (text if channels else None), Counter()
                        if fixed is not None:
                            for key in UNUSED_KEYS:
                                if key in data:
                                    fixed = without_member(fixed, key)
                                    fixed_counts[f'{key} removed'] += 1
                except (FixError, ValueError, KeyError) as e:
                    # ValueError covers invalid UTF-8 and JSON
                    errors.append(f'{datafile}/{name}: {e}')
                    members.append((info, content))
                    continue
                counts += fixed_counts
                if fixed is None:
                    counts['files removed'] += 1
                    continue
                if fixed_counts:
                    content = fixed.encode('utf-8')
                    counts['files changed'] += 1
            members.append((info, content))
    return members, counts, errors


def fix_entry(source: Path, output: Path, entry: Path) -> tuple[str, Counter, list[str]]:
    """Writes the entry (its directory relative to source) to output: its data.zip fixed, its other files hardlinked.
    Whether it is unchanged, changed or removed (left without channels), the numbers of what was fixed, and the errors."""
    members, counts, errors = fixed_members(source / entry / 'data.zip')
    if errors:
        return 'error', Counter(), errors
    if not any(Path(info.filename).stem in CHANNEL_TYPES for info, _ in members):
        counts['entries removed'] += 1
        return 'removed', counts, []

    target = output / entry
    target.mkdir(parents=True)
    for file in (source / entry).iterdir():
        if file.name != 'data.zip' or not counts:
            os.link(file, target / file.name)
    if not counts:
        return 'unchanged', counts, []

    datafile = target / 'data.zip'
    # The members in their order, with their names, times and compression
    with ZipFile(datafile, 'w') as z:
        for info, content in members:
            z.writestr(info, content)
    with ZipFile(datafile) as z:
        if [(info.filename, z.read(info)) for info in z.infolist()] != [(info.filename, content) for info, content in members]:
            return 'error', Counter(), [f'{entry}: written incorrectly']
    return 'changed', counts, []


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    source, output = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    if output.exists():
        print(f'{output} exists, the fixed data are written to a new directory', file=sys.stderr)
        return 2
    if source.stat().st_dev != output.parent.stat().st_dev:
        print(f'{output} is not on the file system of {source}, the unchanged files are hardlinked', file=sys.stderr)
        return 2

    entries = sorted(datafile.parent.relative_to(source) for data_dir in DATA_DIRS for datafile in (source / data_dir).glob('*/*/data.zip'))
    print(f'{len(entries)} entries in {source}', file=sys.stderr)
    output.mkdir(parents=True)
    for data_dir in DATA_DIRS:
        (output / data_dir).mkdir()
    (output / 'Annotations').mkdir()
    for file in (source / 'Annotations').iterdir():
        os.link(file, output / 'Annotations' / file.name)

    total = Counter()
    states: dict[str, list[Path]] = {'unchanged': [], 'changed': [], 'removed': [], 'error': []}
    errors = []
    with ProcessPoolExecutor() as executor:
        results = executor.map(partial(fix_entry, source, output), entries, chunksize=64)
        for i, (entry, (state, counts, entry_errors)) in enumerate(zip(entries, results, strict=True), start=1):
            states[state].append(entry)
            total += counts
            errors += entry_errors
            if i % 10000 == 0:
                print(f'{i}/{len(entries)}', file=sys.stderr)

    for error in errors:
        print(error, file=sys.stderr)
    print(f'Entries: {len(states["unchanged"])} unchanged, {len(states["changed"])} changed, {len(states["removed"])} removed')
    print(f'Fixed: {dict(sorted(total.items()))}')
    for entry in states['removed']:
        print(f'Removed: {entry}')
    if errors:
        print(f'{len(errors)} errors in {len(states["error"])} entries, which are left out: the output is incomplete', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
