from fastapi import APIRouter, HTTPException

from api.common import PDB_ID_Type, check_response, pdb_id_404_response, session


router = APIRouter()


@router.get('/assembly/{pdb_id}', name='Assembly', tags=['PDB'], description='Returns prefered assembly for a given protein',
            responses=pdb_id_404_response)
def get_assembly_id(pdb_id: PDB_ID_Type) -> str:
    req = session.get(f'https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/{pdb_id}', timeout=10)
    check_response(req, 'PDBe API', f'Cannot find assembly for PDB ID \'{pdb_id}\'')
    data = req.json()[pdb_id][0]['assemblies']
    if (assembly_id := next((assembly['assembly_id'] for assembly in data if assembly['preferred']), None)) is None:
        raise HTTPException(status_code=404, detail=f'No preferred assembly found for PDB ID \'{pdb_id}\'')
    return assembly_id
