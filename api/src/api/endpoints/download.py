from enum import Enum
from pathlib import Path
from fastapi.responses import FileResponse, RedirectResponse, PlainTextResponse, Response
import io
import json
import zipfile

from api.main import app
from api.config import config
from api.common import PDB_ID_Type, Uniprot_ID_Type, SourceDatabase, uniprot_id_404_response, pdb_id_404_response
from api.endpoints.assembly import get_assembly_id
from api.endpoints.channels import get_channels
from api.export import *


class DownloadType(str, Enum):
    png = 'png'
    json = 'json'
    pdb = 'pdb'
    pymol = 'pymol'
    chimera = 'chimera'
    vmd = 'vmd'
    zip = 'zip'


EXTENSIONS: dict[DownloadType, str] = {
    DownloadType.png: 'png',
    DownloadType.json: 'json',
    DownloadType.pdb: 'pdb',
    DownloadType.pymol: 'py',
    DownloadType.chimera: 'py',
    DownloadType.vmd: 'tk',
    DownloadType.zip: 'zip',
}


@app.get('/download/alphafill/{uniprot_id}/{file_format}', name='Download data', tags=['AlphaFill'],
         description='Download various data about the protein', responses=uniprot_id_404_response)
async def download_alphafill(file_format: DownloadType, uniprot_id: Uniprot_ID_Type):
    return await download(SourceDatabase.AlphaFill, file_format, uniprot_id)


@app.get('/download/pdb/{pdb_id}/{file_format}', name='Download data', tags=['PDB'],
         description='Download various data about the protein', responses=pdb_id_404_response)
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
            return FileResponse('../assets/alphafill.png')

    channels = get_channels(source_db, protein_id)
    headers = {'Content-Disposition': f'attachment; filename="channelsdb_{protein_id}.{EXTENSIONS[file_format]}"'}
    match file_format:
        case DownloadType.json:
            return Response(content=json.dumps(channels), media_type='application/json', headers=headers)
        case DownloadType.pdb:
            return PlainTextResponse(get_PDB_file(channels), headers=headers)
        case DownloadType.pymol:
            return PlainTextResponse(get_Pymol_file(channels), headers=headers)
        case DownloadType.chimera:
            return PlainTextResponse(get_Chimera_file(channels), headers=headers)
        case DownloadType.vmd:
            return PlainTextResponse(get_VMD_file(channels), headers=headers)
        case DownloadType.zip:
            content = io.BytesIO()
            zf = zipfile.ZipFile(content, mode='w', compression=zipfile.ZIP_DEFLATED)
            zf.writestr(f'{protein_id}_chimera.py', get_Chimera_file(channels))
            zf.writestr(f'{protein_id}_pymol.py', get_Pymol_file(channels))
            zf.writestr(f'{protein_id}_vmd.tk', get_VMD_file(channels))
            zf.writestr(f'{protein_id}_report.json', json.dumps(channels))
            zf.writestr(f'{protein_id}_channels.pdb', get_PDB_file(channels))
            zf.close()

            return Response(content=content.getvalue(), media_type='application/zip', headers=headers)
