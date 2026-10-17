from fastapi import Depends, Path as AnnotationPath, HTTPException
from typing import Annotated
from enum import Enum
import requests
from pydantic import BaseModel


class IDError(BaseModel):
    detail: str


PDB_ID_LOWER_REGEX = '^[1-9][a-z0-9]{3}$'
PDB_ID_REGEX = '^[1-9]([a-z0-9]{3}|[A-Z0-9]{3})$'
UNIPROT_ID_REGEX = '^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$'


# The validators are dependencies rather than pydantic validators, so that FastAPI runs their blocking requests
# in the thread pool instead of on the event loop
def validate_uniprot_id(uniprot_id: Annotated[str, AnnotationPath(description='Uniprot ID', pattern=UNIPROT_ID_REGEX)]) -> str:
    req = requests.head(f'https://rest.uniprot.org/uniprotkb/{uniprot_id}.txt', timeout=10)
    if req.status_code >= 500:
        raise HTTPException(status_code=502, detail=f'UniProt API returned an error when accessing: {req.url}')
    if req.status_code != 200:
        raise HTTPException(status_code=404, detail=f'Cannot find Uniprot ID \'{uniprot_id}\'')
    return uniprot_id


def validate_pdb_id(pdb_id: Annotated[str, AnnotationPath(description='PDB ID', pattern=PDB_ID_REGEX)]) -> str:
    pdb_id = pdb_id.lower()

    req = requests.get(f"https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/{pdb_id}", timeout=10)

    if req.status_code >= 500:
        raise HTTPException(status_code=502, detail=f'PDBe API returned an error when accessing: {req.url}')
    if req.status_code != 200:
        raise HTTPException(status_code=404, detail=f'Cannot find PDB ID \'{pdb_id}\'')
    return pdb_id


pdb_id_404_response = {404: {'description': 'PDB ID not found', 'model': IDError}}
uniprot_id_404_response = {404: {'description': 'Uniprot ID not found', 'model': IDError}}


PDB_ID_Type = Annotated[str, Depends(validate_pdb_id)]
Uniprot_ID_Type = Annotated[str, Depends(validate_uniprot_id)]


class SourceDatabase(Enum):
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
