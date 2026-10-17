import json
from pathlib import Path

from api.config import config
from api.common import CHANNEL_TYPES
from fastapi import APIRouter
from pydantic import BaseModel, create_model


router = APIRouter()


TunnelModel = create_model('TunnelTypes', **{tunnel: (int, ...) for tunnel in CHANNEL_TYPES.values()})


class StatisticsModel(BaseModel):
    date: str
    entries_count: int
    statistics: TunnelModel


@router.get('/statistics', name='General statistics', tags=['General'], description='Returns summary statistics about the data stored')
def get_statistics() -> StatisticsModel:
    with open(Path(config['dirs']['base']) / 'statistics.json') as f:
        return json.load(f)
