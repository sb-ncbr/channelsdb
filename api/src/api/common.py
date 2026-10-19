import http.cookiejar
import time
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Annotated

import requests
from fastapi import Depends, HTTPException
from fastapi import Path as AnnotationPath
from pydantic import BaseModel

from api.config import config


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


def unexpected_response(service: str, url: str) -> HTTPException:
    """Report a successful response from an external API that cannot be parsed as 502"""
    return HTTPException(status_code=502, detail=f'{service} returned an unexpected response when accessing: {url}')


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
PDBE_SUMMARY_URL = 'https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/{pdb_id}'


# Used both to validate PDB IDs and to look up assemblies, which the results page requests together.
# Summaries are kept for at most PDBE_SUMMARY_TTL, as entries can be revised or made obsolete.
# Failures are not cached. Callers must not modify the returned data.
def get_pdbe_summary(pdb_id: str) -> dict:
    return _get_pdbe_summary(pdb_id, int(time.monotonic() // PDBE_SUMMARY_TTL))


@lru_cache(maxsize=1024)
def _get_pdbe_summary(pdb_id: str, _time_window: int) -> dict:
    # A new time window makes the cached summaries from the previous one unused
    req = session.get(PDBE_SUMMARY_URL.format(pdb_id=pdb_id), timeout=10)
    check_response(req, 'PDBe API', f'Cannot find PDB ID \'{pdb_id}\'')
    try:
        summary = req.json()[pdb_id][0]
    except (ValueError, LookupError, TypeError):
        # ValueError covers invalid JSON
        raise unexpected_response('PDBe API', req.url) from None
    if not isinstance(summary, dict):
        raise unexpected_response('PDBe API', req.url)
    return summary


def validate_pdb_id(pdb_id: Annotated[str, AnnotationPath(description='PDB ID', pattern=PDB_ID_REGEX)]) -> str:
    pdb_id = pdb_id.lower()
    get_pdbe_summary(pdb_id)
    return pdb_id


pdb_id_404_response = {404: {'description': 'PDB ID not found', 'model': IDError}}
uniprot_id_404_response = {404: {'description': 'Uniprot ID not found', 'model': IDError}}


def pdb_id_format(pdb_id: Annotated[str, AnnotationPath(description='PDB ID', pattern=PDB_ID_REGEX)]) -> str:
    return pdb_id.lower()


PDB_ID_Type = Annotated[str, Depends(validate_pdb_id)]
# Only the format is checked, for the endpoints whose own external request reports unknown IDs
PDB_ID_Format_Type = Annotated[str, Depends(pdb_id_format)]
Uniprot_ID_Format_Type = Annotated[str, AnnotationPath(description='Uniprot ID', pattern=UNIPROT_ID_REGEX)]


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


def protein_dir(source_db: SourceDatabase, protein_id: str) -> Path:
    """The directory with the stored data of a protein, named by its lowercased ID"""
    protein_id = protein_id.lower()
    return Path(config['dirs'][source_db.lower()]) / protein_id[1:3] / protein_id


def is_stored(source_db: SourceDatabase, protein_id: str) -> bool:
    return (protein_dir(source_db, protein_id) / 'data.zip').exists()


# The stored data are served without asking the external APIs, so that they stay available when those are down.
# Only the IDs not stored are validated, so that an ID unknown to PDBe or UniProt is reported as such.
def stored_pdb_id(pdb_id: Annotated[str, AnnotationPath(description='PDB ID', pattern=PDB_ID_REGEX)]) -> str:
    pdb_id = pdb_id.lower()
    if not is_stored(SourceDatabase.PDB, pdb_id):
        validate_pdb_id(pdb_id)
    return pdb_id


def stored_uniprot_id(uniprot_id: Annotated[str, AnnotationPath(description='Uniprot ID', pattern=UNIPROT_ID_REGEX)]) -> str:
    if not is_stored(SourceDatabase.AlphaFill, uniprot_id):
        validate_uniprot_id(uniprot_id)
    return uniprot_id


Stored_PDB_ID_Type = Annotated[str, Depends(stored_pdb_id)]
Stored_Uniprot_ID_Type = Annotated[str, Depends(stored_uniprot_id)]
