#!/bin/bash
# Releases new data: copies them next to the current ones, checks them and only then switches the API to them.
#
# Usage: update_data.sh [--add] SOURCE [DATA_DIR]
#
# SOURCE contains all the data (PDB, AlphaFill and Annotations), the entries missing in it are removed. With --add,
# it contains only the new or changed files, which are added to the current data, and nothing is removed.
#
# The releases are kept in DATA_DIR/releases (default /data/releases), the API reads DATA_DIR/current, a link
# to one of them. Files unchanged since the current release are hardlinked, so a release takes the space of the
# changed files only. Nothing is switched if any step fails, the release is left as NAME.incomplete for inspection.
# Before switching, the changes against the current release are shown and have to be approved (YES=1 approves
# them without asking). Set FORCE=1 to release data with considerably fewer entries than the current ones.
#
# After switching, only KEEP releases (default 2) are kept: the current one, the one it replaced (to roll back to)
# and the newest others. The older releases and the ones that failed are removed. The current release is never
# removed, and removing the others does not touch its files, the hardlinked files remain as long as any links them.

set -euo pipefail

add=0
if [[ ${1:-} == --add ]]; then
    add=1
    shift
fi
source=${1:?Usage: $0 [--add] SOURCE [DATA_DIR]}
data_dir=$(realpath "${2:-/data}")
keep=${KEEP:-2}
if [[ ! $keep =~ ^[1-9][0-9]*$ ]]; then
    echo "KEEP has to be a positive number" >&2
    exit 1
fi
api_dir=$(realpath "$(dirname "$0")/../..")

current=$data_dir/current
name=$(date +%Y%m%d-%H%M%S)
# Renamed to its name once checked, so that releases that failed are told apart
release=$data_dir/releases/$name.incomplete

mkdir -p "$data_dir/releases"

# The API runs as another user, it has to be able to read all the data
rsync_opts=(-a --chmod=a+rX)
link_dest=()
previous=
if [[ -e $current ]]; then
    link_dest=(--link-dest "$(realpath "$current")")
    previous=$(basename "$(realpath "$current")")
fi

if (( add )); then
    [[ -e $current ]] || { echo "No current data to add to" >&2; exit 1; }
    echo "Copying $current to $release"
    rsync "${rsync_opts[@]}" "${link_dest[@]}" "$current/" "$release/"
    # rsync replaces the changed files with new ones, the hardlinked files of the current release are not modified
    echo "Adding $source to $release"
    rsync "${rsync_opts[@]}" "$source/" "$release/"
else
    echo "Copying $source to $release"
    rsync "${rsync_opts[@]}" --delete "${link_dest[@]}" "$source/" "$release/"
    # What was read of the current release, so that only the new and changed files are read again
    for cache in .validation_cache.json .statistics_cache.json; do
        if [[ -f $current/$cache ]]; then
            cp "$current/$cache" "$release/"
        fi
    done
fi

cd "$api_dir"
export CHANNELSDB_BASE=$release PYTHONPATH=src

echo 'Validating'
uv run --no-dev python src/utils/validate_data.py

echo 'Calculating statistics'
uv run --no-dev python src/utils/calculate_stats.py

if [[ -e $current ]]; then
    echo
    status=0
    uv run --no-dev python src/utils/compare_data.py "$(realpath "$current")" "$release" || status=$?
    if (( status == 2 )); then
        echo "Nothing has changed, not switching. The release is left in $release"
        exit 0
    elif (( status != 0 )); then
        exit "$status"
    fi
    echo
fi

# Guards against releasing an incomplete copy, e.g. of a wrong or partially written source
if [[ -f $current/statistics.json && ${FORCE:-0} != 1 ]]; then
    old_count=$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["entries_count"])' "$current/statistics.json")
    new_count=$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["entries_count"])' "$release/statistics.json")
    if (( new_count * 100 < old_count * 95 )); then
        echo "The release has considerably fewer entries than the current one, not switching (set FORCE=1 to do so)" >&2
        exit 1
    fi
fi

if [[ ${YES:-0} != 1 ]]; then
    if [[ ! -t 0 ]]; then
        echo "Not run interactively, set YES=1 to switch without asking. The release is left in $release" >&2
        exit 1
    fi
    while true; do
        read -r -p "Switch the API to this release? [y = yes, l = list all changes, anything else = no] " answer
        case $answer in
            y | yes) break ;;
            l) less "$release/changes.txt" ;;
            *) echo "Not switched. The release is left in $release"; exit 1 ;;
        esac
    done
fi

mv -T "$release" "$data_dir/releases/$name"

# A relative link, so that it also resolves in the container, where the directory may be mounted elsewhere.
# Renaming over the old link switches atomically, the API sees either the old or the new release.
ln -sfn "releases/$name" "$data_dir/current.new"
mv -T "$data_dir/current.new" "$current"

echo "Released $name"

current_release=$(realpath "$current")
kept=("$name")
if [[ -n $previous && $previous != "$name" ]]; then
    kept+=("$previous")
fi
# The names are timestamps, so the newest come first
for dir in $(ls -r "$data_dir/releases"); do
    if [[ $dir != *.incomplete && ! " ${kept[*]} " =~ " $dir " ]]; then
        kept+=("$dir")
    fi
done
kept=("${kept[@]:0:keep}")

for dir in $(ls "$data_dir/releases"); do
    path=$data_dir/releases/$dir
    # The current release is kept in any case
    if [[ " ${kept[*]} " =~ " $dir " || $(realpath "$path") == "$current_release" ]]; then
        continue
    fi
    echo "Removing $path"
    rm -rf -- "$path"
done

echo "Kept releases:"
ls "$data_dir/releases"
