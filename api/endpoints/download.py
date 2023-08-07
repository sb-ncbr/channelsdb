from enum import Enum
from pathlib import Path
from fastapi.responses import FileResponse, RedirectResponse

from api.main import app
from api.config import config
from api.common import PDB_ID_Type, Uniprot_ID_Type, SourceDatabase
from api.endpoints.assembly import get_assembly_id
from api.endpoints.channels import get_channels


class DownloadType(str, Enum):
    png = 'png'
    json = 'json'


@app.get('/download/alphafill/{uniprot_id}/{file_format}', name='Download data', tags=['AlphaFill'],
         description='Download various data about the protein')
async def download_alphafill(file_format: DownloadType, uniprot_id: Uniprot_ID_Type):
    return await download(SourceDatabase.AlphaFill, file_format, uniprot_id)


@app.get('/download/pdb/{pdb_id}/{file_format}', name='Download data', tags=['PDB'],
         description='Download various data about the protein')
async def download_pdb(file_format: DownloadType, pdb_id: PDB_ID_Type):
    return await download(SourceDatabase.PDB, file_format, pdb_id)


async def download(source_db: SourceDatabase, file_format: DownloadType, protein_id: str):
    match (source_db, file_format):
        case SourceDatabase.PDB, DownloadType.png:
            image_file = Path(config['dirs']['pdb']) / protein_id[1:3] / protein_id / f'{protein_id}.png'

            if image_file.exists():
                return FileResponse(image_file)

            assembly_id = await get_assembly_id(protein_id)

            return RedirectResponse(f'https://www.ebi.ac.uk/pdbe/static/entry/'
                                    f'{protein_id}_assembly_{assembly_id}_chemically_distinct_molecules_front_image-200x200.png')
        case SourceDatabase.AlphaFill, DownloadType.png:
            return FileResponse('assets/alphafill.png')
        case _, DownloadType.json:
            return await get_channels(source_db, protein_id)