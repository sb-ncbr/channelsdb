# Running ChannelsDB with Compose

| File | Use |
|---|---|
| [`compose.yaml`](compose.yaml) | The website (`web`, nginx) and the API (`api`), locally and as the base of production |
| [`compose.production.yaml`](compose.production.yaml) | Production: HTTPS, the released data, restarts |
| [`compose.local-dist.yaml`](compose.local-dist.yaml) | Serves the website built locally instead of the one in the image |
| [`web.Dockerfile`](web.Dockerfile) | Builds the website and its nginx image |
| [`nginx/`](nginx) | The nginx configuration, `devel.conf` locally and `production.conf` in production |

nginx serves the website and forwards `/api/` to the API. Only nginx has a port on the host. The logs go to the
journal, tagged `channelsdb-web` and `channelsdb-api`.

## Locally

See the [main README](../README.md#running-locally). To try the website built by `npm run build` in `frontend/`
without rebuilding the image:

```bash
docker compose -f docker/compose.yaml -f docker/compose.local-dist.yaml up -d
```

## Production

Production uses both files:

```bash
docker compose -f docker/compose.yaml -f docker/compose.production.yaml up -d
```

It serves the site over HTTPS on ports 80 and 443, and the API reads the data from `/data/current`, a link to the
current release of the data (see [Updating the data](../api/README.md#updating-the-data)).

The TLS certificate is renewed by certbot on the host using the webroot method: certbot writes the challenges to
`/var/www/certbot`, which nginx serves under `/.well-known/acme-challenge/`, and reloads nginx afterwards. The
certificate was set up to renew this way by:

```bash
sudo mkdir -p /var/www/certbot
sudo certbot reconfigure --cert-name channelsdb.ncbr.muni.cz --webroot -w /var/www/certbot \
    --deploy-hook 'docker exec web nginx -s reload'
sudo certbot renew --dry-run
```
