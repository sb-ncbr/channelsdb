import random
from pathlib import Path

from api.config import config


def get_stored_ids(datadir: str) -> list[str]:
    root = Path(datadir)
    protein_ids = []
    for datafile in root.glob('**/data.zip'):
        protein_ids.append(datafile.parts[-2])

    return protein_ids


stored_pdb_ids = get_stored_ids(config['dirs']['pdb'])
# AlphaFill directories are named by lowercased UniProt IDs
stored_uniprot_ids = [uniprot_id.upper() for uniprot_id in get_stored_ids(config['dirs']['alphafill'])]


def pytest_addoption(parser):
    parser.addoption('--subset', action='store', default='all', type=str, choices=('all', 'random', 'first'))
    parser.addoption('--count', action='store', default=10, type=int)


def pytest_generate_tests(metafunc):
    subset = metafunc.config.option.subset
    count = metafunc.config.option.count
    if 'stored_pdb_ids' in metafunc.fixturenames:
        if subset == 'all':
            metafunc.parametrize('stored_pdb_ids', stored_pdb_ids)
        elif subset == 'random':
            metafunc.parametrize('stored_pdb_ids', random.sample(stored_pdb_ids, k=count))
        else:
            # first
            metafunc.parametrize('stored_pdb_ids', stored_pdb_ids[:count])
    if 'stored_uniprot_ids' in metafunc.fixturenames:
        if subset == 'all':
            metafunc.parametrize('stored_uniprot_ids', stored_uniprot_ids)
        elif subset == 'random':
            metafunc.parametrize('stored_uniprot_ids', random.sample(stored_uniprot_ids, k=count))
        else:
            metafunc.parametrize('stored_uniprot_ids', stored_uniprot_ids[:count])
