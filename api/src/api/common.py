from fastapi import Path as AnnotationPath, HTTPException
from typing import Annotated
from pydantic import AfterValidator
from enum import Enum
import requests
from pydantic import BaseModel
from collections import namedtuple

ChannelInfo = namedtuple('ChannelInfo', ['type', 'software', 'name'])


class IDError(BaseModel):
    detail: str


def validate_uniprot_id(uniprot_id: str):
    req = requests.head(f'https://rest.uniprot.org/uniprotkb/{uniprot_id}.txt')
    if req.status_code > 500:
        raise HTTPException(status_code=503, detail=f'UniProt API returned an error when accessing: {req.url}')
    if req.status_code != 200:
        raise HTTPException(status_code=404, detail=f'Cannot find Uniprot ID \'{uniprot_id}\'')
    return uniprot_id


def validate_pdb_id(pdb_id: str):
    req = requests.head(f'https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/{pdb_id}')
    if req.status_code > 500:
        raise HTTPException(status_code=503, detail=f'PDBe API returned an error when accessing: {req.url}')
    if req.status_code != 200:
        raise HTTPException(status_code=404, detail=f'Cannot find PDB ID \'{pdb_id}\'')
    return pdb_id


pdb_id_404_response = {404: {'description': 'PDB ID not found', 'model': IDError}}
uniprot_id_404_response = {404: {'description': 'Uniprot ID not found', 'model': IDError}}


PDB_ID_REGEX = '^[1-9][a-z0-9]{3}$'
UNIPROT_ID_REGEX = '^[a-zA-Z0-9]+$'

PDB_ID_Type = Annotated[str, AnnotationPath(description='PDB ID', pattern=PDB_ID_REGEX), AfterValidator(validate_pdb_id)]
Uniprot_ID_Type = Annotated[str, AnnotationPath(description='Uniprot ID', pattern=UNIPROT_ID_REGEX), AfterValidator(validate_uniprot_id)]


class SourceDatabase(Enum):
    PDB = 'PDB'
    AlphaFill = 'AlphaFill'


CHANNEL_TYPES_PDB = {
    'csa': ChannelInfo('CSA', 'MOLE', 'CSATunnels_MOLE'),
    'cscaver': ChannelInfo('CSA', 'Caver', 'CSATunnels_Caver'),

    'authors': ChannelInfo('Reviewed', 'MOLE', 'ReviewedChannels_MOLE'),
    'aucaver': ChannelInfo('Reviewed', 'Caver', 'ReviewedChannels_Caver'),

    'cofactors': ChannelInfo('Cofactor', 'MOLE', 'CofactorTunnels_MOLE'),
    'cocaver': ChannelInfo('Cofactor', 'Caver', 'CofactorTunnels_Caver'),

    'pores': ChannelInfo('Pore', 'MOLE', 'TransmembranePores_MOLE'),
    'pocaver': ChannelInfo('Pore', 'Caver', 'TransmembranePores_Caver'),

    'procognate': ChannelInfo('Procognate', 'MOLE', 'ProcognateTunnels_MOLE'),
    'procaver': ChannelInfo('Procognate', 'Caver', 'ProcognateTunnels_Caver')
}

CHANNEL_TYPES_ALPHAFILL = {
    'alphafill': ChannelInfo('AlphaFill', 'MOLE', 'AlphaFillTunnels_MOLE'),
    'alphacaver': ChannelInfo('AlphaFill', 'Caver', 'AlphaFillTunnels_Caver')
}

CHANNEL_TYPES = CHANNEL_TYPES_PDB | CHANNEL_TYPES_ALPHAFILL
