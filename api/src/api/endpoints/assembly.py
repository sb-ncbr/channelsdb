from fastapi import APIRouter, HTTPException

from api.common import PDB_ID_Type, get_pdbe_summary, pdb_id_404_response


router = APIRouter()


@router.get('/assembly/{pdb_id}', name='Assembly', tags=['PDB'], description='Returns prefered assembly for a given protein',
            responses=pdb_id_404_response)
def get_assembly_id(pdb_id: PDB_ID_Type) -> str:
    data = get_pdbe_summary(pdb_id)['assemblies']
    if (assembly_id := next((assembly['assembly_id'] for assembly in data if assembly['preferred']), None)) is None:
        raise HTTPException(status_code=404, detail=f'No preferred assembly found for PDB ID \'{pdb_id}\'')
    return assembly_id
