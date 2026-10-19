from fastapi import APIRouter, HTTPException

from api.common import PDBE_SUMMARY_URL, PDB_ID_Type, get_pdbe_summary, pdb_id_404_response, unexpected_response


router = APIRouter()


@router.get('/assembly/{pdb_id}', name='Assembly', tags=['PDB'], description='Returns prefered assembly for a given protein',
            responses=pdb_id_404_response)
def get_assembly_id(pdb_id: PDB_ID_Type) -> str:
    summary = get_pdbe_summary(pdb_id)
    try:
        assembly_id = next((assembly['assembly_id'] for assembly in summary['assemblies'] if assembly['preferred']), None)
    except (LookupError, TypeError):
        raise unexpected_response('PDBe API', PDBE_SUMMARY_URL.format(pdb_id=pdb_id)) from None
    if assembly_id is None:
        raise HTTPException(status_code=404, detail=f'No preferred assembly found for PDB ID \'{pdb_id}\'')
    return assembly_id
