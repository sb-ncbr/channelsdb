import io
import shutil
import subprocess
import zipfile

import pytest
import requests
from fastapi.testclient import TestClient

from api.common import session
from api.endpoints import download
from api.export import get_PDB_file, get_VMD_file
from api.main import app


CHANNELS = {'Channels': {'ReviewedChannels_MOLE': [{'Profile': [
    {'X': -4.146, 'Y': 38.618, 'Z': 59.435, 'Radius': 3.129},
    {'X': 1.0, 'Y': -2.5, 'Z': 0.0, 'Radius': 1.5},
]}]}}

# Stand-ins for the VMD commands used by the export, checking the values as VMD does
VMD_STUBS = '''
proc mol {args} { return 0 }
proc animate {args} {}
proc display {args} {}
proc atomselect {mol selection} {
    set name sel[incr ::selections]
    proc $name {cmd attributes values} {
        foreach atom $values {
            if {[llength $atom] != [llength $attributes]} { error "expected [llength $attributes] values: $atom" }
            foreach value $atom { if {![string is double -strict $value]} { error "not a number: $value" } }
            lappend ::values {*}$attributes {*}$atom
        }
    }
    return $name
}
set ::selections 0
'''


@pytest.mark.skipif(shutil.which('tclsh') is None, reason='Tcl is not installed')
def test_vmd_script_sets_numeric_values():
    script = get_VMD_file(CHANNELS).replace('package require http\n', '')
    result = subprocess.run(['tclsh'], input=VMD_STUBS + script + 'puts $::values\n', capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stderr
    assert result.stdout.split() == ['x', 'y', 'z', '-4.146', '38.618', '59.435', 'radius', '3.129',
                                     'x', 'y', 'z', '1.000', '-2.500', '0.000', 'radius', '1.500']


def test_pdb_atoms_are_unique():
    # More channels than chain IDs
    channels = {'Channels': {'ReviewedChannels_MOLE': [
        {'Profile': [{'X': 0.0, 'Y': 0.0, 'Z': 0.0, 'Distance': d, 'Radius': 1.0} for d in range(3)]} for _ in range(70)
    ]}}
    atoms = [line for line in get_PDB_file(channels).splitlines() if line.startswith('HETATM')]
    assert len(atoms) == 210
    # Chain and residue number
    identities = [(atom[21], int(atom[22:26])) for atom in atoms]
    assert len(set(identities)) == len(identities)
    # One chain per channel while the chain IDs last, then continuing in the least used chain
    assert identities[:3] == [('A', 1), ('A', 2), ('A', 3)]
    assert identities[26 * 3] == ('a', 1)
    assert identities[61 * 3] == ('9', 1)
    assert identities[62 * 3:62 * 3 + 3] == [('A', 4), ('A', 5), ('A', 6)]


def profile(length: int) -> dict:
    return {'Profile': [{'X': 1.5, 'Y': 23.456, 'Z': -7.0, 'Distance': 0.0, 'Radius': 1.0}] * length}


def test_pdb_long_channels_use_the_least_used_chain():
    # The first chain is long, so the 63rd channel continues another one
    channels = {'Channels': {'ReviewedChannels_MOLE': [profile(5000)] + [profile(1)] * 61 + [profile(5000)]}}
    atoms = [line for line in get_PDB_file(channels).splitlines() if line.startswith('HETATM')]
    assert (atoms[-1][21], int(atoms[-1][22:26])) == ('B', 5001)
    # The coordinates stay in their columns
    assert all(float(atom[38:46]) == 23.456 for atom in atoms)


@pytest.mark.parametrize('lengths', [[10000], [9999] * 11])
def test_pdb_limits(lengths):
    # Too long for a chain's residue numbers, or too many atoms
    channels = {'Channels': {'ReviewedChannels_MOLE': [profile(length) for length in lengths]}}
    with pytest.raises(ValueError, match='do not fit'):
        get_PDB_file(channels)


@pytest.fixture
def too_long_channel(monkeypatch):
    """An AlphaFill entry whose channel does not fit in the PDB format"""
    def head(url, **kwargs):
        r = requests.Response()
        r.status_code = 200
        return r

    monkeypatch.setattr(session, 'head', head)
    channels = {'Channels': {'AlphaFillTunnels_MOLE': [profile(10000)]}}
    monkeypatch.setattr(download, 'get_channels', lambda source_db, protein_id: channels)


def test_pdb_download_too_long(too_long_channel):
    response = TestClient(app).get('/download/alphafill/P11111/pdb')
    assert response.status_code == 422
    assert 'do not fit' in response.json()['detail']


def test_zip_download_without_pdb(too_long_channel):
    response = TestClient(app).get('/download/alphafill/P11111/zip')
    assert response.status_code == 200
    names = zipfile.ZipFile(io.BytesIO(response.content)).namelist()
    assert 'P11111_vmd.tk' in names
    assert 'P11111_channels.pdb' not in names
