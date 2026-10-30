"""Lists the channels to remove as near duplicates of others, from the analysis of 2025 (its log) and its application to
the data (data.zip files, with the original kept as data.backup.zip), for rebuild_data.py.

Usage: near_duplicates.py SOURCE APPLIED LOG REMOVALS REPORT

SOURCE is the original data, APPLIED the PDB directory of the data the analysis was applied to, LOG its log (lines like
"REMOVE(5): protein:7cqw,id:12.23,first_x_coord:-25.269 - its subset is protein:7cqw,id:8.87,first_x_coord:-23.027"; the
coordinate is X of the profile's first or last point). The analysis removed a channel

- REMOVE(1): whose ends are less than 5 Å apart;
- REMOVE(5): containing another one, every point of that within 3 Å of it;
- REMOVE(4): which is a duplicate of another one of the same category and method, each within 3 Å of the other.

A channel is listed in REMOVALS when it was removed in APPLIED and the log removes it, except
- a channel with an annotation (its name in the literature), which belongs to that channel;
- a reviewed channel removed as containing or duplicating another one (only the short ones are removed);
- a transmembrane pore, which is not a duplicate of a tunnel within it;
- a channel whose other one (the one it contains or duplicates) rebuild_data.py removes as cut short, which would leave
  neither;
- a channel whose log records disagree (the log identifies a channel by its entry, Id and coordinate, which channels
  found twice share).
REPORT lists every channel removed in APPLIED or by the log, tab separated, with the decision.
"""
import json
import math
import re
import sys
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from itertools import pairwise
from pathlib import Path
from zipfile import ZipFile

from utils.validate_data import LAYERS_PAST_PROFILE


RECORDED = json.loads((Path(__file__).parent / 'recorded_fixes.json').read_text('utf-8'))
REVIEWED = ('authors.json', 'aucaver.json')
PORES = ('pores.json', 'pocaver.json')
KEY = re.compile(r'protein:([^,]+),id:([^,]+),first_x_coord:([-0-9.e]+)')
# Å, the log's coordinates are rounded to 3 decimals
COORDINATE_TOLERANCE = 0.0015


def parse_log(path: Path) -> dict[str, list[tuple[str, str, float, tuple[str, float] | None]]]:
    """The log's records by entry: decision, the channel's Id and coordinate, the other channel's Id and coordinate"""
    log = defaultdict(list)
    with open(path) as f:
        for line in f:
            if not (keys := KEY.findall(line)):
                continue
            decision = line.split(':', 1)[0]
            (entry, channel_id, x), *other = keys
            log[entry].append((decision, channel_id, float(x), (other[0][1], float(other[0][2])) if other else None))
    return log


def without_type(channel: dict) -> str:
    """A channel's content but for its Type (the applied data have the Types of before 2024 in some entries)"""
    return json.dumps({key: value for key, value in channel.items() if key != 'Type'}, sort_keys=True)


def matches(channel: dict, channel_id: str, x: float) -> bool:
    profile = channel['Profile']
    return str(channel['Id']) == channel_id and bool(profile) and \
        any(abs(float(profile[i]['X']) - x) < COORDINATE_TOLERANCE for i in (0, -1))


def is_cut_short(channel: dict) -> bool:
    """rebuild_data.py removes the channel: its layers end more than LAYERS_PAST_PROFILE past its profile"""
    points = [tuple(float(point[axis]) for axis in 'XYZ') for point in channel['Profile']]
    length = sum(math.dist(a, b) for a, b in pairwise(points))
    layers = channel.get('Layers', {}).get('LayersInfo') or [{}]
    end = layers[-1].get('LayerGeometry', {}).get('EndDistance')
    return end is not None and float(end) - length > LAYERS_PAST_PROFILE


def channels_of(z: ZipFile) -> list[tuple[str, str, int, dict]]:
    return [(name, group, i, channel)
            for name in z.namelist() if name != 'annotations.json'
            for group, channels in json.loads(z.read(name)).get('Channels', {}).items()
            for i, channel in enumerate(channels)]


def annotated_ids(entry: str, z: ZipFile) -> set[str]:
    """The Ids of the entry's channels with an annotation, as released: the original ones and the recorded"""
    annotations = json.loads(z.read('annotations.json')) if 'annotations.json' in z.namelist() else []
    if (recorded := RECORDED['annotations'].get(entry, False)) is not False:
        annotations += json.loads(recorded['content']) if recorded else []
    return {str(annotation.get('Id')) for annotation in annotations}


def select(source: Path, applied: Path, log: dict, entry: str) -> tuple[dict, list[tuple]]:
    """The channels of the entry (e.g. PDB/a2/1a2n) to remove, by file and group, and the report's rows"""
    pdb_id = Path(entry).name
    directory = applied / pdb_id[1:3] / pdb_id
    if not (directory / 'data.backup.zip').exists():
        return {}, []
    with ZipFile(source / entry / 'data.zip') as z, ZipFile(directory / 'data.backup.zip') as before, \
            ZipFile(directory / 'data.zip') as after:
        original = channels_of(z)
        annotated = annotated_ids(entry, z)
        kept = Counter((name, without_type(channel)) for name, _, _, channel in channels_of(after))
        removed_applied = Counter((name, without_type(channel)) for name, _, _, channel in channels_of(before)) - kept
    records = log.get(pdb_id, [])

    removals: dict[str, dict[str, list[int]]] = {}
    rows = []
    for name, group, i, channel in original:
        content = without_type(channel)
        applied_removed = removed_applied[(name, content)] > 0
        if applied_removed:
            removed_applied[(name, content)] -= 1
        own = [record for record in records if matches(channel, record[1], record[2])]
        decisions = sorted({record[0] for record in own})
        if not applied_removed and not any(d.startswith('REMOVE') for d in decisions):
            continue
        others = [other for record in own if record[0].startswith('REMOVE') and (other := record[3])]
        if not applied_removed:
            decision = 'kept: not removed when applied'
        elif not any(d.startswith('REMOVE') for d in decisions):
            decision = 'kept: the log keeps it' if decisions else 'kept: not in the log'
        elif 'LEAVE' in decisions:
            decision = 'kept: log records disagree'
        elif str(channel['Id']) in annotated:
            decision = 'kept: annotated'
        elif name in REVIEWED and 'REMOVE(1)' not in decisions:
            decision = 'kept: reviewed'
        elif name in PORES:
            decision = 'kept: pore'
        elif any(is_cut_short(c) for other in others for _, _, _, c in original if matches(c, *other)):
            decision = 'kept: the other one is cut short'
        else:
            decision = 'removed'
            removals.setdefault(name, {}).setdefault(group, []).append(i)
        rows.append((entry, name, group, i, str(channel['Id']), channel.get('Type'), '+'.join(decisions) or '-', decision))
    return removals, rows


def main() -> int:
    if len(sys.argv) != 6:
        print(__doc__, file=sys.stderr)
        return 2
    source, applied, log_path, removals_path, report_path = map(Path, sys.argv[1:])
    log = parse_log(log_path)
    entries = sorted(datafile.parent.relative_to(source).as_posix() for datafile in (source / 'PDB').glob('*/*/data.zip'))
    removals = {}
    counts = Counter()
    with ProcessPoolExecutor() as executor, open(report_path, 'w') as report:
        report.write('entry\tfile\tgroup\tindex\tid\ttype\tlog\tdecision\n')
        results = executor.map(partial(select, source, applied, log), entries, chunksize=32)
        for entry, (entry_removals, rows) in zip(entries, results, strict=True):
            if entry_removals:
                removals[entry] = entry_removals
            for row in rows:
                report.write('\t'.join(map(str, row)) + '\n')
                counts[row[-1]] += 1
    removals_path.write_text(json.dumps(removals) + '\n')
    for decision, n in sorted(counts.items()):
        print(f'{n}\t{decision}')
    print(f'{sum(len(i) for files in removals.values() for groups in files.values() for i in groups.values())} channels '
          f'to remove in {len(removals)} entries')
    return 0


if __name__ == '__main__':
    sys.exit(main())
