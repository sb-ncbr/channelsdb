# ChannelsDB 2

The project consists of three parts: Python API (`/api`), main page (`/frontend`) and the results page (`/results`).

## Running

Two setups are available, a local development version and a production version meant to be run in Openstack cloud. 

### Development

To run the development version of ChannelsDB 2, use the following commands:

```bash
$ docker compose -f docker/docker-compose.yaml build
$ docker compose -f docker/docker-compose.yaml up
```

By default, the application runs on port `80` and uses `/data` as the data directory. To change this behaviour,
set the following environment variables before running `docker compose up`. For example:

```bash
export CHANNELSDB_PORT=8080
export CHANNELSDB_DATA=/home/channelsdb/data
```

### Production

The production version has to use `docker/docker-compose.production.yaml` together with the main `docker/docker-compose.yaml` file.
No further setup is allowed.

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

## Main page development

The main page (`/frontend`) is built with [Vite](https://vite.dev/). With the application running (see above), start a development server with live reload in `/frontend`:

```bash
$ npm install
$ npm run dev
```

It serves the pages at http://localhost:5173 and forwards the API and the results pages to the running application, using the same `CHANNELSDB_PORT` as docker compose (port `80` by default). To use another instance, set `CHANNELSDB_URL` to its address.
