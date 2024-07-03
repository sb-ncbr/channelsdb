import argparse
from pathlib import Path
import pymongo
import zipfile
import json

from api.common import CHANNEL_TYPES


def process_json(json_file, struct_id: str, name: str, last_modified: int):
    orig = json.load(json_file)
    res = []
    for key in ('Paths', 'Tunnels', 'Pores', 'MergedPores'):
        for tunnel in orig['Channels'][key]:
            tunnel_data = {'StructureID': struct_id, 'ChannelType': CHANNEL_TYPES[name].type, 'Software': CHANNEL_TYPES[name].software,
                           'Data': tunnel, '_LastModified': last_modified}
            res.append(tunnel_data)
    return res


def add_entries(collection, file, struct_id: str, last_modified: int) -> int:
    count = 0
    with zipfile.ZipFile(file, 'r') as zf:
        # For each tunnel type
        for json_file in zf.namelist():
            if (name := Path(json_file).stem) in CHANNEL_TYPES:
                with zf.open(json_file) as f:
                    data = process_json(f, struct_id, name, last_modified)
                    for tunnel in data:
                        collection.insert_one(tunnel)
                        count += 1

    return count


def main():
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument('directory', help='Directory containing tunnels')
    args = arg_parser.parse_args()

    client = pymongo.MongoClient('mongodb://localhost:27017/')

    db = client['channelsdb']
    tunnels = db['tunnels']

    root = Path(args.directory)
    for d in root.glob('*'):
        # For each structure
        for struct_path in d.glob('*'):
            struct_id = struct_path.stem
            datafile = struct_path / 'data.zip'
            if datafile.exists():
                last_modified = int(datafile.lstat().st_mtime)
                print(f'{struct_id}: ', end='')
                if tunnels.count_documents({'StructureID': struct_id}) == 0:
                    count = add_entries(tunnels, datafile, struct_id, last_modified)
                    print(f'Added {count} entries')
                else:
                    result = tunnels.delete_many({'StructureID': struct_id, '_LastModified': {'$lt': last_modified}})
                    if result.deleted_count > 0:
                        count = add_entries(tunnels, datafile, struct_id, last_modified)
                        print(f'Remove {result.deleted_count} obsoleted entries, added {count} entries')
                    else:
                        print('Entries are up to date')

    print(f'Total number of tunnel entries: {tunnels.count_documents({})}')
    stats = db.command('collstats', 'tunnels')
    print(f'Storage size: {int(stats['storageSize'] / (1024 ** 2))} MB')


if __name__ == '__main__':
    main()
