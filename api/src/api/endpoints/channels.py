import json
import logging
from pathlib import Path
from zipfile import ZipFile

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, create_model

from api.common import (
    CHANNEL_TYPES,
    CHANNEL_TYPES_ALPHAFILL,
    CHANNEL_TYPES_PDB,
    SourceDatabase,
    Stored_PDB_ID_Type,
    Stored_Uniprot_ID_Type,
    pdb_id_404_response,
    protein_dir,
    uniprot_id_404_response,
)


logger = logging.getLogger(__name__)

router = APIRouter()


ChannelModel = create_model('ChannelModel', **{tunnel: (list, []) for tunnel in CHANNEL_TYPES.values()})


class Channels(BaseModel):
    Annotations: list = []
    Channels: ChannelModel = ChannelModel()


@router.get('/channels/pdb/{pdb_id}', response_model=Channels, name='Channel data', tags=['PDB'],
            description='Returns information about channels for a given protein', responses=pdb_id_404_response)
def get_channels_pdb(pdb_id: Stored_PDB_ID_Type):
    return get_channels(SourceDatabase.PDB, pdb_id)


@router.get('/channels/alphafill/{uniprot_id}', response_model=Channels, name='Channel data', tags=['AlphaFill'],
            description='Returns information about channels for a given protein', responses=uniprot_id_404_response)
def get_channels_alphafill(uniprot_id: Stored_Uniprot_ID_Type):
    return get_channels(SourceDatabase.AlphaFill, uniprot_id)


def get_channels(source_db: SourceDatabase, protein_id: str):

    data = Channels().model_dump()

    channel_types = CHANNEL_TYPES_PDB if source_db == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL

    data_file = protein_dir(source_db, protein_id) / 'data.zip'
    if not data_file.exists():
        raise HTTPException(status_code=404, detail=f'Protein with ID \'{protein_id}\' not found in ChannelsDB ({source_db})')

    with ZipFile(data_file) as z:
        for json_file in z.namelist():
            if (name := Path(json_file).stem) in channel_types:
                with z.open(json_file) as f:
                    try:
                        orig = json.load(f)
                        res = []
                        for key in ('Paths', 'Tunnels', 'Pores', 'MergedPores'):
                            res.extend(orig['Channels'][key])
                        data['Channels'][channel_types[name]] = res
                    except json.decoder.JSONDecodeError:
                        logger.warning('%s / %s not a correct JSON', protein_id, json_file)
                        continue
        try:
            with z.open('annotations.json') as f:
                data['Annotations'] = json.load(f)
        except KeyError:
            pass

    return data
