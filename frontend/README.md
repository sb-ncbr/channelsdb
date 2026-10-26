# ChannelsDB website

The website of ChannelsDB: you search for a protein and look at its channels. It is written in TypeScript with React,
and uses [Mol*](https://molstar.org/) for the 3D view.

It has the main pages (search, documentation, methods, about) and the results page of an entry (`detail/`), e.g.
`/detail/pdb/1ymg` or `/detail/alphafill/P10635`. What it offers:

- search of PDB entries by ID, name, organism and other terms, using the [PDBe search](https://www.ebi.ac.uk/pdbe/),
  and of AlphaFill models by UniProt ID
- channels in the 3D view, with their lining residues
- properties along a channel (radius, hydropathy, charge, ...) layer by layer
- annotations of the protein and its residues from UniProt and ChannelsDB
- downloads of the channels for PyMOL, Chimera or VMD, as PDB or JSON

## Deployment

The image built by [`docker/web.Dockerfile`](../docker/web.Dockerfile) serves the built website with nginx and
forwards `/api/` to the [API](../api). It runs together with the API, see the
[main README](../README.md#running-locally).

## Development

Start the whole application with Compose first (see the [main README](../README.md#running-locally)). Then:

```bash
npm install
npm run dev
```

The development server is at http://localhost:5173 (a results page at http://localhost:5173/detail/pdb/1ymg). It
forwards `/api` to the running application, using the same `CHANNELSDB_PORT` as Compose (`80` by default). To use
another instance, set `CHANNELSDB_URL` to its address.

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type check and production build into `dist/` |
| `npm run preview` | Serves the production build |

To try a production build in the running application without rebuilding the image, build it and start Compose with
[`compose.local-dist.yaml`](../docker/compose.local-dist.yaml) (see [`docker/README.md`](../docker/README.md)).

### End-to-end tests

[`../e2e`](../e2e) has browser tests of the website, using [Playwright](https://playwright.dev/) with the installed
Google Chrome. They test the running application, whose data must contain the entries the main page's examples and
the tests use (`1ymg`, `P10635`). Run them in `e2e/`:

```bash
npm install
npm test
```

Like the development server, they use `CHANNELSDB_PORT` or `CHANNELSDB_URL`. They also run against the development
server (`CHANNELSDB_URL=http://localhost:5173 npm test`), where they fail on React's warnings too.

A test fails on any error in the page, and the pages are compared with screenshots in `tests/*-snapshots`. After an
intended visual change, update them with `npm run test:update` and review the new images. A failed test leaves a trace
with screenshots, DOM and network log in `test-results`, see `npx playwright show-trace`.
