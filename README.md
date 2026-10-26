# ChannelsDB

[![ChannelsDB 2.0 paper](https://img.shields.io/badge/Nucleic%20Acids%20Res-2024-blue)](https://doi.org/10.1093/nar/gkad1012)
[![API licence: MIT](https://img.shields.io/badge/API%20licence-MIT-green)](api/LICENSE)
[![Web licence: Apache 2.0](https://img.shields.io/badge/web%20licence-Apache%202.0-green)](frontend/LICENSE)

ChannelsDB is a database of channels, tunnels and pores in proteins. For entries of the Protein Data Bank and
AlphaFill models of UniProt proteins, it has the channels computed by [MOLE](https://doi.org/10.1186/1758-2946-5-39)
and [CAVER](https://doi.org/10.1371/journal.pcbi.1002708): leading to catalytic sites, cofactors and cognate ligands,
pores through the membrane, and channels described in the literature. You can view them in 3D with the lining residues
and their annotations, see how their properties change along them, and download them for PyMOL, Chimera or VMD.

The public instance runs at [channelsdb2.biodata.ceitec.cz](https://channelsdb2.biodata.ceitec.cz), its API with
documentation at [channelsdb2.biodata.ceitec.cz/api/](https://channelsdb2.biodata.ceitec.cz/api/).

## Repository

- [`api/`](api): the API serving the channels and their annotations (Python)
- [`frontend/`](frontend): the website (TypeScript, React, Mol*)
- [`docker/`](docker): running it all with Compose, locally and in production
- [`e2e/`](e2e): browser tests of the website

Each of `api/`, `frontend/` and `docker/` has its own README with more detail.

## Running locally

You need Docker or Podman with Compose, and the ChannelsDB data, which are not part of the repository (see
[`api/README.md`](api/README.md#data) for what they look like). Then:

```bash
git clone https://github.com/sb-ncbr/channelsdb
cd channelsdb
docker compose -f docker/compose.yaml up -d --build
```

The site is at http://localhost. Compose starts the website and the API.

You can change these settings in the environment:

| Setting | Default | Meaning |
|---|---|---|
| `CHANNELSDB_PORT` | `80` | Port of the site on your machine |
| `CHANNELSDB_DATA` | `/data` | Directory with the data |

The production setup is described in [`docker/README.md`](docker/README.md).

## Citing

If ChannelsDB helps your research, please cite:

> Špačková A., Vávra O., Raček T., Bazgier V., Sehnal D., Damborský J., Svobodová R., Bednář D., Berka K.
> ChannelsDB 2.0: a comprehensive database of protein tunnels and pores in AlphaFold era. *Nucleic Acids Research*
> 52(D1), D413–D418 (2024). https://doi.org/10.1093/nar/gkad1012

The channels are computed by MOLE and CAVER, please cite them too:

- Sehnal D. et al. MOLE 2.0: advanced approach for analysis of biomacromolecular channels. *Journal of
  Cheminformatics* 5, 39 (2013). https://doi.org/10.1186/1758-2946-5-39
- Chovancová E. et al. CAVER 3.0: a tool for the analysis of transport pathways in dynamic protein structures.
  *PLoS Computational Biology* 8(10), e1002708 (2012). https://doi.org/10.1371/journal.pcbi.1002708

A step-by-step guide to ChannelsDB and MOLEonline is in Špačková A. et al., Analysis and Visualization of Protein
Channels, Tunnels, and Pores with MOLEonline and ChannelsDB 2.0, *Methods in Molecular Biology*, 219–233 (2024).
https://doi.org/10.1007/978-1-0716-4007-4_12

## Licence

The API is under the MIT licence, see [`api/LICENSE`](api/LICENSE). The website is under the Apache License 2.0, see
[`frontend/LICENSE`](frontend/LICENSE).
