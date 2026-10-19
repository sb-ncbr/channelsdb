import shutil
import subprocess

import pytest

from api.export import get_VMD_file


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
