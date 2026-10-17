HEADER = '''\
import chimera


def add_atom(molecule, id, residue, x, y, z, radius):
    at = molecule.newAtom(id, chimera.Element("Tunn"))
    at.setCoord(chimera.Coord(x,y,z))
    at.radius = radius
    residue.addAtom(at)
'''

FOOTER = '''\
channel_object = chimera.Molecule()
channel_object.name = '{name}'
{name}(channel_object)
chimera.openModels.add([channel_object])
'''

COLORS = ['red', 'orange red', 'orange', 'yellow', 'green', 'forest green', 'cyan', 'light sea green', 'blue', 'cornflower blue',
          'medium blue', 'purple', 'hot pink', 'magenta', 'spring green', 'plum', 'sky blue', 'goldenrod', 'olive drab', 'coral',
          'rosy brown', 'slate gray']


def get_Chimera_file(channels: dict) -> str:
    channel_count = 0
    lines = []
    for channel_type in channels['Channels']:
        for channel in channels['Channels'][channel_type]:
            channel_count += 1
            name = f'channel{channel_count}'
            lines.append(f'def {name}(channel_object):')
            lines.append(f'    channel = channel_object.newResidue(\'{name}\', \'\', 1, \'\')')
            profile = channel['Profile']
            for atom in profile:
                line = (f'    add_atom(channel_object, \'{name}\', channel, '
                        f'{atom["X"]:.3f}, {atom["Y"]:.3f}, {atom["Z"]:.3f}, {atom["Radius"]:.3f})')
                lines.append(line)

            lines.append(FOOTER.format(name=name))

    for i in range(channel_count):
        lines.append(f'chimera.runCommand(\'color {COLORS[i % len(COLORS)]} #{i + 1}\')')
        lines.append(f'chimera.runCommand(\'repr cpk #{i + 1}\')')

    return HEADER + '\n'.join(lines) + '\n'
