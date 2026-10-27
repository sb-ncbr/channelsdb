# ChannelsDB API

The API serves the channels stored in ChannelsDB and their annotations to the website and to anyone else. It is
written in Python with FastAPI.

The channels are read from the stored data. The annotations of the proteins and their residues come from UniProt
(the [EBI Proteins API](https://www.ebi.ac.uk/proteins/api/doc/)), mapped to the residues of PDB entries by
[SIFTS](https://www.ebi.ac.uk/pdbe/docs/sifts/), together with the residue annotations of ChannelsDB. The stored
channels are served even when PDBe and UniProt are not available.

## API

Interactive documentation is at `/api/` on the running site, e.g.
[channelsdb2.biodata.ceitec.cz/api/](https://channelsdb2.biodata.ceitec.cz/api/). The site serves the API under
`/api`, so the paths below are relative to it, e.g. `/api/channels/pdb/1ymg`.

| Endpoint | Description |
|---|---|
| `GET /channels/pdb/{pdb_id}` | Channels of a PDB entry |
| `GET /channels/alphafill/{uniprot_id}` | Channels of an AlphaFill model |
| `GET /annotations/pdb/{pdb_id}` | Annotations of the proteins of a PDB entry and of their residues |
| `GET /annotations/alphafill/{uniprot_id}` | Annotations of the protein of an AlphaFill model and of its residues |
| `GET /download/pdb/{pdb_id}/{format}` | Channels of a PDB entry as `json`, `pdb`, `pymol`, `chimera`, `vmd` or all of them in a `zip`, or a `png` image of the entry. Channels too many or too long for the PDB format are not exported as `pdb` (422), and the `zip` leaves it out |
| `GET /download/alphafill/{uniprot_id}/{format}` | The same for an AlphaFill model |
| `GET /assembly/{pdb_id}` | Preferred assembly of a PDB entry, from PDBe |
| `GET /content` | Numbers of channels of each type for all entries |
| `GET /statistics` | Numbers of entries with each type of channels |

Errors are returned with a `detail` message: 404 for an unknown or not stored entry, 502 or 504 when PDBe or UniProt
fail or do not answer.

## Data

The data are read from the directory set by `base` in the configuration:

| Path | Contents |
|---|---|
| `PDB/<xx>/<pdb_id>/data.zip` | Channels of a PDB entry, `<xx>` being the 2nd and 3rd character of its ID |
| `PDB/<xx>/<pdb_id>/<pdb_id>.png` | Image of the entry (optional, PDBe's otherwise) |
| `AlphaFill/<xx>/<uniprot_id>/data.zip` | Channels of an AlphaFill model |
| `Annotations/<uniprot_id>.json` | Residue annotations of ChannelsDB |
| `db_content.json`, `statistics.json` | Numbers of channels, calculated from the data |

The directories of the entries are named by their lowercased IDs. Each `data.zip` has a JSON file for each type of
channels computed, named as in `CHANNEL_TYPES` in `src/api/common.py` (`csa.json` and `cscaver.json` for the channels
of catalytic sites by MOLE and CAVER, ...), and `annotations.json` with the annotations of the channels, if any.

### Updating the data

In production, the API reads `/data/current`, a link to one of the releases of the data in `/data/releases`. A new
release is made from a directory with the new data (containing `PDB`, `AlphaFill` and `Annotations`) by running in
`api/`:

```bash
src/utils/update_data.sh /path/to/new/data
```

The data are copied to a new release, validated and their statistics calculated. Then the changes against the current
release are shown: the added, removed and changed entries with their numbers of channels, and the changes of the
statistics (all of them are listed in `changes.txt` of the release). When you approve them, `/data/current` is switched
to the new release, and the API uses it from the next request on.

Entries missing in the directory are removed. To add or update only some entries, keeping the rest:

```bash
src/utils/update_data.sh --add /path/to/some/data
```

An entry is updated as a whole file, so a changed `data.zip` must contain all the channels of the entry.

Files unchanged since the current release are hardlinked, so a release takes only the space of the changed files.
Never modify the files of a release in place, the change would show in all of them. Only the new and changed files are
read to validate them and calculate the statistics, and all of them after the rules of the validation change; the
progress of reading them is shown every 30 seconds.

To roll back, point the link to the previous release:

```bash
ln -sfn releases/<previous> /data/current.new && mv -T /data/current.new /data/current
```

After switching, only the current release and the one it replaced are kept. Older releases and failed ones (named
`*.incomplete`, kept for inspection until then) are removed. Set `KEEP` to keep more of the newest releases.

## Configuration

The API reads `config.ini` next to this README. It sets the data directory, `base`, and the directories in it.
`CHANNELSDB_BASE` in the environment overrides `base`. The image is built with `config_docker.ini` as its `config.ini`
(`/channelsdb/config.ini`).

## Development

The API uses [uv](https://docs.astral.sh/uv/). Create `config.ini` from `config_docker.ini` with `base` pointing to
your data, then:

```bash
uv sync
uv run uvicorn --app-dir src api.main:app --reload
```

### Tests

The tests use the stored data and query PDBe and UniProt, so they need network access:

```bash
uv run pytest
uv run ruff check src
```

By default, all stored entries are tested. To test only some, use `--subset random` or `--subset first` with
`--count N` (10 by default).
