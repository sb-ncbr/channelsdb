"""Fixes CAVER's files: the flags and numbers stored as text become JSON values (DATA_FIXES.md, fix 1), and the flag of
the bottleneck layer is named Bottleneck as in MOLE's files, not bottleneck (fix 2).

Usage: fix_data.py SOURCE OUTPUT

SOURCE is the data (PDB and AlphaFill), it is only read. The data.zip files with anything fixed are written to OUTPUT
(a new directory) at the same paths, to be added to the data with update_data.sh --add. Nothing else changes: the other
files of an archive are copied byte for byte, and a fixed file keeps its formatting and the order of its keys. Each
fixed file is checked to differ from the original only in the fixes: with the original values and names put back, it
is the original byte for byte. An entry with any error is not written, the errors are reported.
"""
import json
import os
import sys
from collections import Counter
from collections.abc import Callable
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from pathlib import Path
from zipfile import ZipFile, ZipInfo

from utils.validate_data import FLAG, RENAMED_GEOMETRY_KEYS, Types, geometries, has_type, typed_fields


DATA_DIRS = ('PDB', 'AlphaFill')

# How CAVER's files are formatted: on one line, or indented by 4 with Windows line ends
FORMATS: tuple[Callable[[dict], str], ...] = (
    json.dumps,
    lambda data: json.dumps(data, indent=4).replace('\n', '\r\n'),
)


class FixError(Exception):
    pass


def converted(value, types: Types):
    """The JSON value of a flag or number stored as text"""
    if isinstance(value, str):
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


def fix_file(original: str) -> tuple[str, Counter]:
    """The file with its flags and numbers as JSON values and its keys named as in MOLE's files, and the numbers of the
    values fixed and the keys renamed by key"""
    data = json.loads(original)
    dump = next((dump for dump in FORMATS if dump(data) == original), None)
    if dump is None:
        raise FixError('formatted differently than expected')

    counts = Counter()
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
    fixed = dump(data)

    # Read back: all the values have their types now, and with the original values and names put back, it is the original
    restored = json.loads(fixed)
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
    if originals or renamed or dump(restored) != original:
        raise FixError('more than the fixes changed')
    return fixed, counts


def fix_entry(source: Path, output: Path, datafile: Path) -> tuple[Counter, list[str]]:
    """Writes the entry's data.zip (relative to source) to output if any value was fixed. The numbers of the values
    fixed by key (and of the files as 'files'), and the errors."""
    counts = Counter()
    errors = []
    members: list[tuple[ZipInfo, bytes]] = []
    with ZipFile(source / datafile) as z:
        for info in z.infolist():
            content = z.read(info)
            if info.filename.endswith('caver.json'):
                try:
                    fixed, fixed_counts = fix_file(content.decode('utf-8'))
                except (FixError, ValueError) as e:
                    # ValueError covers invalid UTF-8 and JSON
                    errors.append(f'{datafile}/{info.filename}: {e}')
                    continue
                if fixed_counts:
                    content = fixed.encode('utf-8')
                    counts += fixed_counts
                    counts['files'] += 1
            members.append((info, content))
    if errors or not counts:
        return Counter() if errors else counts, errors

    target = output / datafile
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_name(f'.{target.name}.tmp')
    # The members in their order, with their names, times and compression
    with ZipFile(tmp, 'w') as z:
        for info, content in members:
            z.writestr(info, content)
    with ZipFile(tmp) as z:
        if [(info.filename, z.read(info)) for info in z.infolist()] != [(info.filename, content) for info, content in members]:
            tmp.unlink()
            return Counter(), [f'{datafile}: written incorrectly']
    os.replace(tmp, target)
    return counts, errors


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    source, output = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    if output.exists():
        print(f'{output} exists, the fixed entries are written to a new directory', file=sys.stderr)
        return 2

    datafiles = sorted(datafile.relative_to(source) for data_dir in DATA_DIRS for datafile in (source / data_dir).glob('*/*/data.zip'))
    print(f'{len(datafiles)} entries in {source}', file=sys.stderr)
    output.mkdir(parents=True)

    total = Counter()
    entries = 0
    errors = []
    with ProcessPoolExecutor() as executor:
        results = executor.map(partial(fix_entry, source, output), datafiles, chunksize=64)
        for i, (counts, entry_errors) in enumerate(results, start=1):
            total += counts
            entries += bool(counts)
            errors += entry_errors
            if i % 10000 == 0:
                print(f'{i}/{len(datafiles)}', file=sys.stderr)

    for error in errors:
        print(error, file=sys.stderr)
    print(f'Fixed {entries} entries, {total.pop("files", 0)} files, values by key: {dict(sorted(total.items()))}')
    if errors:
        print(f'{len(errors)} errors, the entries with them were not written', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
