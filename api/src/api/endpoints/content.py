import json
from pathlib import Path
from pydantic import BaseModel
import pymongo

from api.main import app
from api.config import config
from api.common import CHANNEL_TYPES_PDB


class ContentModel(BaseModel):
    PDB: dict[str, list[int]]
    AlphaFill: dict[str, list[int]]


@app.get('/content', name='Database content', tags=['General'], description='Returns the counts of tunnels for each stored entry')
async def get_content() -> ContentModel:
    client = pymongo.MongoClient('mongodb://database:27017/')
    tunnels = client['channelsdb']['tunnels']

    for channel_type, software, _ in CHANNEL_TYPES_PDB.items():
        pipeline = [
            {'$match': {'Database': 'PDB', 'ChannelType': channel_type, 'Software': software}},
            {'$group': {'_id': '$StructureID', 'count': {'$sum': 1}}},
        ]

        tunnels.aggregate(pipeline)

    with open(Path(config['dirs']['base']) / 'db_content.json') as f:
        return json.load(f)
