import json
from pathlib import Path
from pydantic import BaseModel

from api.main import app
from api.config import config


class ContentModel(BaseModel):
    PDB: dict[str, list[int]]
    AlphaFill: dict[str, list[int]]


@app.get('/content', name='Database content', tags=['General'], description='Returns the counts of tunnels for each stored entry')
def get_content() -> ContentModel:
    with open(Path(config['dirs']['base']) / 'db_content.json') as f:
        return json.load(f)
