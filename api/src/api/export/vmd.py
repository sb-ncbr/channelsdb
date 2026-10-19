HEADER = '''\
package require http
# To run this script please run it in VMD as source script.tk
# 
# If you find this tool useful for your work, please cite it as:
# Sehnal D, Svobodová Vařeková R, Berka K, Pravda L, Navrátilová V, Banáš P, Ionescu C-M, Otyepka M, Koča J: MOLE 2.0: advanced approach for analysis of biomacromolecular channels. J. Cheminform. 2013, 5:39.
# 
proc add_atom {id center r} {
 set atom [atomselect top "index $id"]
 $atom set {x y z}  $center
 $atom set radius $r
}
'''

CHANNEL_START = '''\
set {name} [mol new atoms {num_atoms}]
mol top ${name}
animate dup ${name}
mol color ColorID {color_id}
mol representation VDW 1 60'''


CHANNEL_END = '''\
mol delrep 0 ${name}
mol addrep ${name}
mol selection {{{{all}}}}
mol rename top {{{name}}}

'''


def get_VMD_file(channels: dict) -> str:
    channel_count = 0
    lines = []
    for channel_type in channels['Channels']:
        for channel in channels['Channels'][channel_type]:
            channel_count += 1
            name = f'channel{channel_count}'
            profile = channel['Profile']
            lines.append(CHANNEL_START.format(name=name, num_atoms=len(profile), color_id=channel_count % 33))
            for current_atom_id, atom in enumerate(profile):
                # A Tcl list of the atom's coordinates (separated by spaces only)
                line = f'add_atom {current_atom_id} {{{{ {atom["X"]:.3f} {atom["Y"]:.3f} {atom["Z"]:.3f} }}}} {atom["Radius"]:.3f}'
                lines.append(line)

            lines.append(CHANNEL_END.format(name=name))
    return HEADER + '\n'.join(lines) + 'display reset view\n'
