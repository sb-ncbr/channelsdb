import datetime
import pymongo

from api.main import app
from api.common import CHANNEL_TYPES
from pydantic import BaseModel, create_model

TunnelModel = create_model('TunnelTypes', **{tunnel: (int, ...) for tunnel in (x.name for x in CHANNEL_TYPES.values())})


class StatisticsModel(BaseModel):
    date: str
    entries_count: int
    statistics: TunnelModel


@app.get('/statistics', name='General statistics', tags=['General'], description='Returns summary statistics about the data stored',
         response_model=StatisticsModel)
async def get_statistics():
    client = pymongo.MongoClient('mongodb://database:27017/')
    tunnels = client['channelsdb']['tunnels']

    entries_count = len(tunnels.distinct('StructureID'))

    last_modified = tunnels.find().sort({'_LastModified': -1}).limit(1)[0]['_LastModified']
    last_modified = datetime.datetime.fromtimestamp(last_modified).strftime('%d/%m/%Y')

    data = {}
    for channel_type, software, name in CHANNEL_TYPES.values():
        data[name] = tunnels.count_documents({'ChannelType': channel_type, 'Software': software})

    return StatisticsModel(date=last_modified, entries_count=entries_count, statistics=data)
