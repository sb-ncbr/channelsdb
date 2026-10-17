import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

from api.config import config


router = APIRouter()


class ContentModel(BaseModel):
    PDB: dict[str, list[int]]
    AlphaFill: dict[str, list[int]]


@router.get('/content', name='Database content', tags=['General'], description='Returns the counts of tunnels for each stored entry')
def get_content() -> ContentModel:
    with open(Path(config['dirs']['base']) / 'db_content.json') as f:
        return json.load(f)
