# ChannelsDB 2

The project consists of two parts: Python API (`/api`) and the web pages (`/frontend`), which include the results page (`/frontend/detail`).

## Running

Two setups are available, a local development version and a production version meant to be run in Openstack cloud. 

### Development

To run the development version of ChannelsDB 2, use the following commands:

```bash
$ docker compose -f docker/compose.yaml build
$ docker compose -f docker/compose.yaml up
```

By default, the application runs on port `80` and uses `/data` as the data directory. To change this behaviour,
set the following environment variables before running `docker compose up`. For example:

```bash
export CHANNELSDB_PORT=8080
export CHANNELSDB_DATA=/home/channelsdb/data
```

### Production

The production version has to use `docker/compose.production.yaml` together with the main `docker/compose.yaml` file.

```bash
$ docker compose -f docker/compose.yaml -f docker/compose.production.yaml up -d
```

No further setup is allowed.

The TLS certificate is renewed by certbot on the host using the webroot method: certbot writes the challenges to
`/var/www/certbot`, which nginx serves under `/.well-known/acme-challenge/`, and reloads nginx afterwards. The
certificate was set up to renew this way by:

```bash
$ sudo mkdir -p /var/www/certbot
$ sudo certbot reconfigure --cert-name channelsdb.ncbr.muni.cz --webroot -w /var/www/certbot \
    --deploy-hook 'docker exec web nginx -s reload'
$ sudo certbot renew --dry-run
```

## API development

The API uses [uv](https://docs.astral.sh/uv/) to manage dependencies. To set up the environment, run in `/api`:

```bash
$ uv sync
```

The API reads its configuration from `api/config.ini`. Create it from `api/config_docker.ini` and point `base` to your data directory.

### Tests

The tests use the stored data and query the external APIs (PDBe, UniProt), so they need network access. Run them in `/api`:

```bash
$ uv run pytest
```

By default, all stored entries are tested. To test only a subset, use `--subset random` or `--subset first` together with `--count N` (default 10).

### Linting

The code is checked with [ruff](https://docs.astral.sh/ruff/). Run it in `/api`:

```bash
$ uv run ruff check src
```

## Frontend development

The web pages (`/frontend`) are built with [Vite](https://vite.dev/). With the application running (see above), start a development server with live reload there:

```bash
$ npm install
$ npm run dev
```

It serves the pages at http://localhost:5173 (a results page at http://localhost:5173/detail/pdb/1ymg) and forwards the API to the running application, using the same `CHANNELSDB_PORT` as docker compose (port `80` by default). To use another instance, set `CHANNELSDB_URL` to its address.

### End-to-end tests

`/e2e` contains browser tests of the web pages, using [Playwright](https://playwright.dev/) with the installed Google Chrome. They test the running application, so start it first (see above). The main page examples and the detail pages they use (`1ymg`, `P10635`) must be in its data. Run them in `/e2e`:

```bash
$ npm install
$ npm test
```

Like the development servers, they use `CHANNELSDB_PORT` (port `80` by default) or `CHANNELSDB_URL`. A test fails on any error in the page, and the pages are compared with screenshots in `tests/*-snapshots`. After an intended visual change, update them with `npm run test:update` and review the new images. Failed tests leave a trace with screenshots, DOM and network log in `test-results`, see `npx playwright show-trace`.

The tests also run against the development server (`CHANNELSDB_URL=http://localhost:5173 npm test`), where they also fail on React's warnings.

To test a change of the web pages without rebuilding the image, build them with `npm run build` in `/frontend` and serve the built files:

```bash
$ docker compose -f docker/compose.yaml -f docker/compose.local-dist.yaml up -d
```
