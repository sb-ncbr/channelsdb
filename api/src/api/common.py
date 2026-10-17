import http.cookiejar
import time
from enum import StrEnum
from functools import lru_cache
from typing import Annotated

import requests
from fastapi import Depends, HTTPException
from fastapi import Path as AnnotationPath
from pydantic import BaseModel


# Shared session to reuse connections to the external APIs. Each thread uses at most one connection at a time,
# so keeping up to 40 connections per host (the size of FastAPI's default thread pool) means none are discarded.
# This is not a limit, more connections are opened when needed. Cookies are not stored, so that no state is shared
# between requests.
session = requests.Session()
session.mount('https://', requests.adapters.HTTPAdapter(pool_maxsize=40))
session.cookies.set_policy(http.cookiejar.DefaultCookiePolicy(allowed_domains=[]))


class IDError(BaseModel):
    detail: str


def check_response(req: requests.Response, service: str, not_found_detail: str) -> None:
    """Report 404 from an external API as not found, and any other failure (server error, rate limiting, ...) as 502"""
    if req.status_code == 404:
        raise HTTPException(status_code=404, detail=not_found_detail)
    if req.status_code != 200:
        raise HTTPException(status_code=502, detail=f'{service} returned an error ({req.status_code}) when accessing: {req.url}')


PDB_ID_LOWER_REGEX = '^[1-9][a-z0-9]{3}$'
PDB_ID_REGEX = '^[1-9]([a-z0-9]{3}|[A-Z0-9]{3})$'
UNIPROT_ID_REGEX = '^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$'


# The validators are dependencies rather than pydantic validators, so that FastAPI runs their blocking requests
# in the thread pool instead of on the event loop
def validate_uniprot_id(uniprot_id: Annotated[str, AnnotationPath(description='Uniprot ID', pattern=UNIPROT_ID_REGEX)]) -> str:
    req = session.head(f'https://rest.uniprot.org/uniprotkb/{uniprot_id}.txt', timeout=10)
    check_response(req, 'UniProt API', f'Cannot find Uniprot ID \'{uniprot_id}\'')
    return uniprot_id


PDBE_SUMMARY_TTL = 3600  # seconds


# Used both to validate PDB IDs and to look up assemblies, which the results page requests together.
# Summaries are kept for at most PDBE_SUMMARY_TTL, as entries can be revised or made obsolete.
# Failures are not cached. Callers must not modify the returned data.
def get_pdbe_summary(pdb_id: str) -> dict:
    return _get_pdbe_summary(pdb_id, int(time.monotonic() // PDBE_SUMMARY_TTL))


@lru_cache(maxsize=1024)
def _get_pdbe_summary(pdb_id: str, _time_window: int) -> dict:
    # A new time window makes the cached summaries from the previous one unused
    req = session.get(f'https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/{pdb_id}', timeout=10)
    check_response(req, 'PDBe API', f'Cannot find PDB ID \'{pdb_id}\'')
    return req.json()[pdb_id][0]


def validate_pdb_id(pdb_id: Annotated[str, AnnotationPath(description='PDB ID', pattern=PDB_ID_REGEX)]) -> str:
    pdb_id = pdb_id.lower()
    get_pdbe_summary(pdb_id)
    return pdb_id


pdb_id_404_response = {404: {'description': 'PDB ID not found', 'model': IDError}}
uniprot_id_404_response = {404: {'description': 'Uniprot ID not found', 'model': IDError}}


PDB_ID_Type = Annotated[str, Depends(validate_pdb_id)]
Uniprot_ID_Type = Annotated[str, Depends(validate_uniprot_id)]


class SourceDatabase(StrEnum):
    PDB = 'PDB'
    AlphaFill = 'AlphaFill'


CHANNEL_TYPES_PDB = {
    'csa': 'CSATunnels_MOLE',
    'cscaver': 'CSATunnels_Caver',

    'authors': 'ReviewedChannels_MOLE',
    'aucaver': 'ReviewedChannels_Caver',

    'cofactors': 'CofactorTunnels_MOLE',
    'cocaver': 'CofactorTunnels_Caver',

    'pores': 'TransmembranePores_MOLE',
    'pocaver': 'TransmembranePores_Caver',

    'procognate': 'ProcognateTunnels_MOLE',
    'procaver': 'ProcognateTunnels_Caver'
}

CHANNEL_TYPES_ALPHAFILL = {
    'alphafill': 'AlphaFillTunnels_MOLE',
    'alphacaver': 'AlphaFillTunnels_Caver'
}

CHANNEL_TYPES = CHANNEL_TYPES_PDB | CHANNEL_TYPES_ALPHAFILL
