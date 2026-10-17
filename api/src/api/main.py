import logging

import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from uvicorn.logging import DefaultFormatter

from api.endpoints import annotations, assembly, channels, content, download, statistics


# Log in the same format as uvicorn, which only configures its own loggers
handler = logging.StreamHandler()
handler.setFormatter(DefaultFormatter('%(levelprefix)s %(message)s'))
logging.basicConfig(handlers=[handler])

app = FastAPI(title='ChannelsDB 2.0 API',
              contact={'name': 'Tomáš Raček', 'email': 'tomas.racek@muni.cz'},
              redoc_url=None, docs_url='/',
              version='1.0.0',
              swagger_ui_parameters={'syntaxHighlight': False, 'defaultModelsExpandDepth': -1})

for module in (annotations, assembly, channels, content, statistics, download):
    app.include_router(module.router)


@app.exception_handler(requests.ConnectionError)
@app.exception_handler(requests.Timeout)
async def upstream_error_handler(request: Request, exc: requests.RequestException):
    # ConnectTimeout is both a ConnectionError and a Timeout, so decide here rather than by handler
    url = exc.request.url if exc.request is not None else 'external API'
    if isinstance(exc, requests.Timeout):
        return JSONResponse(status_code=504, content={'detail': f'External API did not respond in time: {url}'})
    return JSONResponse(status_code=502, content={'detail': f'Cannot connect to external API: {url}'})
