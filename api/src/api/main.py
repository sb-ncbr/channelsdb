import logging

import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uvicorn.logging import DefaultFormatter

from api.common import ObsoleteEntry
from api.endpoints import annotations, assembly, channels, content, download, statistics


# Log in the same format as uvicorn, which only configures its own loggers
handler = logging.StreamHandler()
handler.setFormatter(DefaultFormatter('%(levelprefix)s %(message)s'))
logging.basicConfig(handlers=[handler])

fastapi_app = FastAPI(title='ChannelsDB 2.0 API',
                      contact={'name': 'Tomáš Raček', 'email': 'tomas.racek@muni.cz'},
                      redoc_url=None, docs_url='/',
                      version='1.0.0',
                      swagger_ui_parameters={'syntaxHighlight': False, 'defaultModelsExpandDepth': -1})

for module in (annotations, assembly, channels, content, statistics, download):
    fastapi_app.include_router(module.router)


@fastapi_app.exception_handler(ObsoleteEntry)
async def obsolete_entry_handler(request: Request, exc: ObsoleteEntry):
    # Since when the entry is obsolete and its successors, besides the detail of any other 404
    return JSONResponse(status_code=404, content=exc.error.model_dump())


@fastapi_app.exception_handler(requests.ConnectionError)
@fastapi_app.exception_handler(requests.Timeout)
async def upstream_error_handler(request: Request, exc: requests.RequestException):
    # ConnectTimeout is both a ConnectionError and a Timeout, so decide here rather than by handler
    url = exc.request.url if exc.request is not None else 'external API'
    if isinstance(exc, requests.Timeout):
        return JSONResponse(status_code=504, content={'detail': f'External API did not respond in time: {url}'})
    return JSONResponse(status_code=502, content={'detail': f'Cannot connect to external API: {url}'})


# The API is used by other sites too. Around the whole application, so that also the responses to
# unhandled exceptions (made outside of any middleware added to FastAPI) have the CORS headers.
app = CORSMiddleware(fastapi_app, allow_origins=['*'], allow_methods=['GET'], allow_headers=['Content-Type'])
