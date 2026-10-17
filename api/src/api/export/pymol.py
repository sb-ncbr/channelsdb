COLORS = ['red', 'green', 'blue', 'yellow', 'violet', 'cyan', 'salmon', 'lime', 'pink', 'slate', 'magenta', 'orange', 'marine', 'olive',
          'purple', 'teal', 'forest', 'firebrick', 'chocolate', 'wheat', 'white', 'grey']


HEADER = '''\
from pymol import cmd
from pymol.cgo import *
import chempy
def add_atom(model, name, vdw, x, y, z):
    a = chempy.Atom()
    a.name = name
    a.vdw = vdw
    a.coord = [x, y, z]
    model.atom.append(a)
'''


FOOTER = '''\
    for a in range(len(model.atom) - 1):
        b = chempy.Bond()
        b.index = [a, a + 1]
        model.bond.append(b)
    cmd.set('surface_mode', 1)
    cmd.set('sphere_mode', 9)
    cmd.set('mesh_mode', 1)
    cmd.load_model(model, '{name}')
    cmd.hide('everything', '{name}')
    cmd.set('sphere_color', '{color}', '{name}')
    cmd.show('spheres', '{name}')
{name}()
cmd.group('Channels', '{name}', 'add')
'''


def get_Pymol_file(channels: dict) -> str:
    channel_count = 0
    lines = []
    for channel_type in channels['Channels']:
        for channel in channels['Channels'][channel_type]:
            channel_count += 1
            name = f'channel{channel_count}'
            lines.append(f'def {name}():')
            lines.append('    model = chempy.models.Indexed()')
            profile = channel['Profile']
            for current_atom_id, atom in enumerate(profile):
                line = (f'    add_atom(model, \'{current_atom_id}\', '
                        f'{atom["Radius"]:.3f}, {atom["X"]:.3f}, {atom["Y"]:.3f}, {atom["Z"]:.3f})')
                lines.append(line)
            lines.append(FOOTER.format(name=name, color=COLORS[(channel_count - 1) % len(COLORS)]))

    return HEADER + '\n'.join(lines) + '\n'
