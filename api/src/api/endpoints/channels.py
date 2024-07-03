import json
from pathlib import Path
from zipfile import ZipFile
from fastapi import HTTPException
from pydantic import BaseModel, create_model

from api.main import app
from api.common import CHANNEL_TYPES_PDB, CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES
from api.config import config
from api.common import SourceDatabase, PDB_ID_Type, Uniprot_ID_Type, pdb_id_404_response, uniprot_id_404_response


ChannelModel = create_model('ChannelModel', **{tunnel: (list, []) for tunnel in (x.name for x in CHANNEL_TYPES.values())})


class Channels(BaseModel):
    Annotations: list = []
    Channels: ChannelModel = ChannelModel()


@app.get('/channels/pdb/{pdb_id}', response_model=Channels, name='Channel data', tags=['PDB'],
         description='Returns information about channels for a given protein', responses=pdb_id_404_response)
async def get_channels_pdb(pdb_id: PDB_ID_Type):
    return get_channels(SourceDatabase.PDB, pdb_id)


@app.get('/channels/alphafill/{uniprot_id}', response_model=Channels, name='Channel data', tags=['AlphaFill'],
         description='Returns information about channels for a given protein', responses=uniprot_id_404_response)
async def get_channels_alphafill(uniprot_id: Uniprot_ID_Type):
    return get_channels(SourceDatabase.AlphaFill, uniprot_id)


def get_channels(source_db: SourceDatabase, protein_id: str):

    data = Channels().model_dump()

    protein_dir = Path(config['dirs'][source_db.value.lower()]) / protein_id[1:3] / protein_id

    if source_db == SourceDatabase.PDB:
        channel_types = CHANNEL_TYPES_PDB
    else:
        channel_types = CHANNEL_TYPES_ALPHAFILL

    if not Path(protein_dir).exists():
        raise HTTPException(status_code=404, detail=f'Protein with ID \'{protein_id}\' not found in ChannelsDB ({source_db.value})')

    with ZipFile(protein_dir / 'data.zip') as z:
        for json_file in z.namelist():
            if (name := Path(json_file).stem) in channel_types:
                with z.open(json_file) as f:
                    try:
                        orig = json.load(f)
                        res = []
                        for key in ('Paths', 'Tunnels', 'Pores', 'MergedPores'):
                            res.extend(orig['Channels'][key])
                        data['Channels'][channel_types[name].name] = res
                    except json.decoder.JSONDecodeError:
                        print(f'{protein_id} / {json_file} not a correct JSON')
                        continue
        try:
            with z.open('annotations.json') as f:
                data['Annotations'] = json.load(f)
        except KeyError:
            pass

    return data
