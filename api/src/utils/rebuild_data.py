"""Rebuilds the released data from the original data by all the fixes released so far, optionally
removing listed channels first.

Usage: rebuild_data.py SOURCE OUTPUT [REMOVALS]

SOURCE is the original data (PDB, AlphaFill and Annotations, as computed and annotated before the fixes of 2026), it is
only read. OUTPUT, a new directory on the same file system, receives the data to be released with update_data.sh. Each
entry goes through, in this order:

1. the channels listed in REMOVALS are removed: a JSON object {entry: {file: {group: [index, ...]}}}, e.g.
   {"PDB/a2/1a2n": {"csa.json": {"Tunnels": [0, 3]}}}, the indices of the channels in SOURCE;
2. fixes 1-7 (fix_data.py);
3. the channels whose layers end more than 5 Å past their profile (their profile cut short), and the channels a file has
   twice (but for their Id and Cavity), are removed (28 Oct 2026);
4. the Type of every channel says what it is (Tunnel); the names it held are in the annotations (28 Oct 2026);
5. the annotations as recorded in recorded_fixes.json (28 Oct 2026): the names moved from the channels' Type, the broken
   references and the annotations of channels the entry does not have fixed; and the residue annotations of Annotations;
6. the obsolete entries recorded in recorded_fixes.json are removed (28 Oct 2026);
7. the files of channels left without any are removed, and so are the entries left without any.

The channels are removed, and their Type set, in the text of the files, every other character kept as it is. Unchanged
files are hardlinked from SOURCE (never modify them in place), changed data.zip files are written anew, keeping their
members' order, names, times and compression. Without REMOVALS, OUTPUT is the release of 28 Oct 2026 file for file.
"""
import json
import os
import re
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from pathlib import Path
from zipfile import ZipFile, ZipInfo

from api.common import CHANNEL_TYPES
from utils.fix_data import DATA_DIRS, FixError, fix_member
from utils.validate_data import CHANNEL_KINDS, LAYERS_PAST_PROFILE, NUMBER, has_type


RECORDED = json.loads((Path(__file__).parent / 'recorded_fixes.json').read_text('utf-8'))

WHITESPACE = re.compile(r'[ \t\n\r]*')
DECODER = json.JSONDecoder()


def members_of(text: str, position: int) -> list[tuple[str, int, int]]:
    """The members of the JSON object starting at position: their key, where their value starts and ends"""
    members = []
    position = WHITESPACE.match(text, position + 1).end()
    while text[position] != '}':
        name, position = DECODER.raw_decode(text, position)
        position = WHITESPACE.match(text, position).end()
        if text[position] != ':':
            raise FixError('not a JSON object')
        start = WHITESPACE.match(text, position + 1).end()
        _, position = DECODER.raw_decode(text, start)
        members.append((name, start, position))
        position = WHITESPACE.match(text, position).end()
        if text[position] == ',':
            position = WHITESPACE.match(text, position + 1).end()
    return members


def elements_of(text: str, position: int) -> list[tuple[int, int]]:
    """Where each element of the JSON array starting at position starts and ends"""
    elements = []
    position = WHITESPACE.match(text, position + 1).end()
    while text[position] != ']':
        start = position
        _, position = DECODER.raw_decode(text, position)
        elements.append((start, position))
        position = WHITESPACE.match(text, position).end()
        if text[position] == ',':
            position = WHITESPACE.match(text, position + 1).end()
    return elements


def channel_groups(text: str) -> list[tuple[str, int, int]]:
    """The groups of Channels of a file of channels: their name, where their array starts and ends"""
    top = members_of(text, WHITESPACE.match(text).end())
    _, start, _ = next(member for member in top if member[0] == 'Channels')
    return members_of(text, start)


def without_channels(text: str, removed: dict[str, list[int]]) -> str:
    """The text of a file of channels without the channels at the indices of their groups, the rest of the text as it
    is: the remaining channels separated as the first two were"""
    data = json.loads(text)
    # From the end, so that the positions of the groups before stay
    for group, start, end in reversed(channel_groups(text)):
        if not (indices := set(removed.get(group, ()))):
            continue
        elements = elements_of(text, start)
        if not indices <= set(range(len(elements))):
            raise FixError(f'no channel {sorted(indices)} in {group}')
        kept = [element for i, element in enumerate(elements) if i not in indices]
        if kept:
            separator = text[elements[0][1]:elements[1][0]]
            text = text[:elements[0][0]] + separator.join(text[a:b] for a, b in kept) + text[elements[-1][1]:]
        else:
            text = text[:start] + '[]' + text[end:]
        data['Channels'][group] = [channel for i, channel in enumerate(data['Channels'][group]) if i not in indices]
    if json.loads(text) != data:
        raise FixError('more than the channels removed')
    return text


def with_kinds(text: str) -> tuple[str, int]:
    """The text of a file of channels with the Type of each channel what it is (Tunnel) where it held a name, the rest of
    the text as it is, and the number of the channels changed"""
    data = json.loads(text)
    changes = []
    for group, start, _ in channel_groups(text):
        for i, (a, _) in enumerate(elements_of(text, start)):
            for name, value_start, value_end in members_of(text, a):
                if name == 'Type' and data['Channels'][group][i]['Type'] not in CHANNEL_KINDS:
                    changes.append((value_start, value_end))
                    data['Channels'][group][i]['Type'] = 'Tunnel'
    for a, b in reversed(changes):
        text = text[:a] + json.dumps('Tunnel') + text[b:]
    if json.loads(text) != data:
        raise FixError('more than the Types changed')
    return text, len(changes)


def removed_by_rules(data: dict) -> dict[str, list[int]]:
    """The indices of the channels of each group to be removed: their layers end more than LAYERS_PAST_PROFILE past their
    profile, or the file has the channel before (but for its Id and Cavity)"""
    removed: dict[str, list[int]] = {}
    seen = set()
    for group, channels in data['Channels'].items():
        for i, channel in enumerate(channels):
            layers = channel.get('Layers', {}).get('LayersInfo') or [{}]
            end = layers[-1].get('LayerGeometry', {}).get('EndDistance')
            content = json.dumps({key: value for key, value in channel.items() if key not in ('Id', 'Cavity')}, sort_keys=True)
            if (has_type(end, NUMBER) and end - channel['Profile'][-1]['Distance'] > LAYERS_PAST_PROFILE) or content in seen:
                removed.setdefault(group, []).append(i)
            seen.add(content)
    return removed


def rebuilt_member(name: str, content: bytes, removed: dict[str, list[int]], counts: Counter) -> bytes | None:
    """A file of channels through steps 1-4, None when no channel is left"""
    if removed:
        text = without_channels(content.decode('utf-8'), removed)
        counts['channels removed as listed'] += sum(len(indices) for indices in removed.values())
        if not any(json.loads(text)['Channels'].values()):
            return None
        content = text.encode('utf-8')
    fixed, fixed_counts = fix_member(name, content)
    counts += fixed_counts
    if fixed is None:
        return None
    text = fixed.decode('utf-8')
    if by_rules := removed_by_rules(json.loads(text)):
        text = without_channels(text, by_rules)
        counts['channels cut short or twice removed'] += sum(len(indices) for indices in by_rules.values())
        if not any(json.loads(text)['Channels'].values()):
            return None
    text, kinds = with_kinds(text)
    if kinds:
        counts['Types set'] += kinds
    return text.encode('utf-8')


def rebuild_entry(source: Path, output: Path, removals: dict, entry: Path) -> tuple[str, Counter, list[str]]:
    """Writes the entry (its directory relative to source) to output. Whether it is unchanged, changed or removed, the
    numbers of what was done, and the errors."""
    counts = Counter()
    key = entry.as_posix()
    if key in RECORDED['removed_entries']:
        counts['obsolete entries removed'] += 1
        return 'removed', counts, []
    listed = removals.get(key, {})
    members = []
    changed = False
    with ZipFile(source / entry / 'data.zip') as z:
        if unknown := set(listed) - set(z.namelist()):
            return 'error', Counter(), [f'{key}: no {", ".join(sorted(unknown))} to remove channels from']
        for info in z.infolist():
            content = z.read(info)
            if Path(info.filename).stem in CHANNEL_TYPES:
                try:
                    rebuilt = rebuilt_member(info.filename, content, listed.get(info.filename, {}), counts)
                except (FixError, ValueError, KeyError) as e:
                    return 'error', Counter(), [f'{key}/{info.filename}: {e}']
                if rebuilt is None:
                    counts['files removed'] += 1
                    changed = True
                    continue
                if rebuilt != content:
                    changed = True
                content = rebuilt
            members.append((info, content))

    if key in RECORDED['annotations']:
        # Replaced in place, added at the end with its recorded times and compression, or removed
        recorded = RECORDED['annotations'][key]
        position = next((i for i, (info, _) in enumerate(members) if info.filename == 'annotations.json'), len(members))
        annotations = members.pop(position)[0] if position < len(members) else None
        if recorded is not None:
            if annotations is None:
                annotations = ZipInfo('annotations.json', date_time=tuple(recorded['zipinfo']['date_time']))
                for attribute in ('compress_type', 'create_system', 'external_attr'):
                    setattr(annotations, attribute, recorded['zipinfo'][attribute])
            members.insert(position, (annotations, recorded['content'].encode('utf-8')))
        counts['annotations recorded'] += 1
        changed = True

    if not any(Path(info.filename).stem in CHANNEL_TYPES for info, _ in members):
        counts['entries removed'] += 1
        return 'removed', counts, []

    target = output / entry
    target.mkdir(parents=True)
    for file in (source / entry).iterdir():
        if file.name != 'data.zip' or not changed:
            os.link(file, target / file.name)
    if not changed:
        return 'unchanged', counts, []
    datafile = target / 'data.zip'
    with ZipFile(datafile, 'w') as z:
        for info, content in members:
            z.writestr(info, content)
    with ZipFile(datafile) as z:
        if [(info.filename, z.read(info)) for info in z.infolist()] != [(info.filename, content) for info, content in members]:
            return 'error', Counter(), [f'{key}: written incorrectly']
    return 'changed', counts, []


def main() -> int:
    if len(sys.argv) not in (3, 4):
        print(__doc__, file=sys.stderr)
        return 2
    source, output = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    removals = json.loads(Path(sys.argv[3]).read_text('utf-8')) if len(sys.argv) == 4 else {}
    if output.exists():
        print(f'{output} exists, the data are written to a new directory', file=sys.stderr)
        return 2
    if source.stat().st_dev != output.parent.stat().st_dev:
        print(f'{output} is not on the file system of {source}, the unchanged files are hardlinked', file=sys.stderr)
        return 2

    entries = sorted(datafile.parent.relative_to(source) for data_dir in DATA_DIRS for datafile in (source / data_dir).glob('*/*/data.zip'))
    if unknown := set(removals) - {entry.as_posix() for entry in entries}:
        print(f'{len(unknown)} entries to remove channels from are not in {source}, e.g. {min(unknown)}', file=sys.stderr)
        return 2
    print(f'{len(entries)} entries in {source}, channels to remove listed in {len(removals)}', file=sys.stderr)
    output.mkdir(parents=True)
    for data_dir in DATA_DIRS:
        (output / data_dir).mkdir()
    (output / 'Annotations').mkdir()
    for file in (source / 'Annotations').iterdir():
        if file.name in RECORDED['residue_annotations']:
            (output / 'Annotations' / file.name).write_text(RECORDED['residue_annotations'][file.name], 'utf-8')
        else:
            os.link(file, output / 'Annotations' / file.name)

    total = Counter()
    states: dict[str, list[Path]] = {'unchanged': [], 'changed': [], 'removed': [], 'error': []}
    errors = []
    with ProcessPoolExecutor() as executor:
        results = executor.map(partial(rebuild_entry, source, output, removals), entries, chunksize=64)
        for i, (entry, (state, counts, entry_errors)) in enumerate(zip(entries, results, strict=True), start=1):
            states[state].append(entry)
            total += counts
            errors += entry_errors
            if i % 10000 == 0:
                print(f'{i}/{len(entries)}', file=sys.stderr)

    for error in errors:
        print(error, file=sys.stderr)
    print(f'Entries: {len(states["unchanged"])} unchanged, {len(states["changed"])} changed, {len(states["removed"])} removed')
    print(f'Done: {dict(sorted(total.items()))}')
    for entry in states['removed']:
        print(f'Removed: {entry}')
    if errors:
        print(f'{len(errors)} errors in {len(states["error"])} entries, which are left out: the output is incomplete', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
