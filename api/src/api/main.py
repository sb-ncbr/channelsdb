from fastapi import FastAPI


app = FastAPI(title='ChannelsDB 2.0 API',
              contact={'name': 'Tomáš Raček', 'email': 'tomas.racek@muni.cz'},
              redoc_url=None, docs_url='/',
              version='1.0.0',
              swagger_ui_parameters={'syntaxHighlight': False, 'defaultModelsExpandDepth': -1})
