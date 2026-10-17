FROM python:3.14-alpine

COPY --from=ghcr.io/astral-sh/uv:0.12.24 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0

WORKDIR /channelsdb

COPY pyproject.toml uv.lock /channelsdb/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project

ENV PATH="/channelsdb/.venv/bin:$PATH"

COPY config_docker.ini /channelsdb/config.ini

COPY assets /channelsdb/assets

COPY src/api /channelsdb/code/api

WORKDIR /channelsdb/code

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "80"]
