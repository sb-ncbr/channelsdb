"""Summary of the changes between two releases of the data, to be reviewed before switching to the new one.

Usage: compare_data.py OLD NEW

The unchanged files of a release are hardlinked to the previous one, so a file is changed when its inode differs.
The inodes are read from the directory listings, no file is opened. All the changes are written to NEW/changes.txt.
"""
import json
import os
import sys
from pathlib import Path


DATA_DIRS = ('PDB', 'AlphaFill', 'Annotations')
SHOWN = 20


def list_files(root: Path) -> dict[str, int]:
    """Inodes of the data files by their paths relative to the root"""
    files = {}
    stack = [root / data_dir for data_dir in DATA_DIRS if (root / data_dir).is_dir()]
    while stack:
        with os.scandir(stack.pop()) as it:
            for entry in it:
                if entry.is_dir(follow_symlinks=False):
                    stack.append(Path(entry.path))
                else:
                    files[str(Path(entry.path).relative_to(root))] = entry.inode()
    return files


def entry_of(path: str) -> tuple[str, str]:
    """The database and ID of the entry a file belongs to"""
    parts = Path(path).parts
    if parts[0] == 'Annotations':
        return 'Annotations', Path(parts[1]).stem
    return parts[0], parts[2] if len(parts) > 3 else parts[-1]


def load_json(path: Path) -> dict:
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def channels_count(content: dict, database: str, entry_id: str) -> int | None:
    counts = content.get(database, {}).get(entry_id)
    return sum(counts) if counts is not None else None


def compare(old_root: Path, new_root: Path) -> list[str]:
    old_files = list_files(old_root)
    new_files = list_files(new_root)
    old_content = load_json(old_root / 'db_content.json')
    new_content = load_json(new_root / 'db_content.json')

    # Changed files by entry
    changes: dict[tuple[str, str], list[str]] = {}
    for path in sorted(old_files.keys() | new_files.keys()):
        if path not in new_files:
            change = 'removed'
        elif path not in old_files:
            change = 'added'
        elif old_files[path] != new_files[path]:
            change = 'changed'
        else:
            continue
        changes.setdefault(entry_of(path), []).append(f'{Path(path).name} {change}')

    old_entries = {entry_of(path) for path in old_files}
    new_entries = {entry_of(path) for path in new_files}

    lines = []
    summary = {database: {'added': 0, 'removed': 0, 'changed': 0} for database in DATA_DIRS}
    for (database, entry_id), files in sorted(changes.items()):
        if (database, entry_id) not in old_entries:
            kind, mark = 'added', '+'
        elif (database, entry_id) not in new_entries:
            kind, mark = 'removed', '-'
        else:
            kind, mark = 'changed', '~'
        summary[database][kind] += 1
        line = f'{mark} {database} {entry_id}: {", ".join(files)}'
        old_count = channels_count(old_content, database, entry_id)
        new_count = channels_count(new_content, database, entry_id)
        if old_count != new_count:
            line += f' (channels {"-" if old_count is None else old_count} -> {"-" if new_count is None else new_count})'
        lines.append(line)

    print(f'Changes against {old_root}:')
    for database, counts in summary.items():
        total = sum(1 for entry in new_entries if entry[0] == database)
        if any(counts.values()):
            print(f'  {database:12} {counts["added"]} added, {counts["removed"]} removed, {counts["changed"]} changed '
                  f'({total} entries now)')
        else:
            print(f'  {database:12} no changes ({total} entries)')

    if lines:
        print()
        for line in lines[:SHOWN]:
            print(f'  {line}')
        if len(lines) > SHOWN:
            print(f'  ... and {len(lines) - SHOWN} more')

    old_statistics = load_json(old_root / 'statistics.json')
    new_statistics = load_json(new_root / 'statistics.json')
    rows = [('Entries', old_statistics.get('entries_count'), new_statistics.get('entries_count'))]
    for channel_type, count in sorted(new_statistics.get('statistics', {}).items()):
        rows.append((channel_type, old_statistics.get('statistics', {}).get(channel_type), count))
    changed_rows = [row for row in rows if row[1] != row[2]]
    print()
    if changed_rows:
        print('Statistics (entries with each channel type):')
        for name, old, new in changed_rows:
            print(f'  {name:26} {"-" if old is None else old} -> {new}')
    else:
        print('Statistics unchanged')

    return lines


def main() -> None:
    old_root, new_root = Path(sys.argv[1]), Path(sys.argv[2])
    lines = compare(old_root, new_root)
    # Replaced rather than overwritten, as the file of the previous release may be hardlinked to this one
    changes_file = new_root / 'changes.txt'
    tmp = new_root / '.changes.txt.tmp'
    with open(tmp, 'w') as f:
        f.write(f'Changes against {old_root}:\n')
        f.writelines(f'{line}\n' for line in lines)
    os.replace(tmp, changes_file)
    if not lines:
        sys.exit(2)


if __name__ == '__main__':
    main()
