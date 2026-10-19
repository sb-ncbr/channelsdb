import xml.etree.ElementTree as ET

from api.config import config
from api.endpoints.annotations import get_channelsdb_residue_annotations, get_uniprot_residue_annotations, parse_sifts_data


def residue(uniprot_id: str, uniprot_res_num: int, chain: str, pdb_res_num: int | str) -> str:
    return (f'<residue><crossRefDb dbCoordSys="UniProt" dbAccessionId="{uniprot_id}" dbResNum="{uniprot_res_num}"/>'
            f'<crossRefDb dbCoordSys="PDBresnum" dbResNum="{pdb_res_num}" dbChainId="{chain}"/></residue>')


def sifts(*entities: tuple[str, list[str]]) -> str:
    return ('<entry xmlns="http://www.ebi.ac.uk/pdbe/docs/sifts/eFamily.xsd">'
            + ''.join(f'<entity entityId="{entity_id}"><segment><listResidue>{"".join(residues)}</listResidue></segment></entity>'
                      for entity_id, residues in entities)
            + '</entry>')


# Two copies of a protein, numbered differently; the entity IDs (label chain IDs) differ from the author chain IDs
TWO_CHAINS = sifts(('C', [residue('P11111', 1, 'A', 10), residue('P11111', 2, 'A', 11)]),
                   ('D', [residue('P11111', 1, 'B', 20), residue('P11111', 2, 'B', 'null')]))


def test_chains_are_kept_apart():
    assert parse_sifts_data(TWO_CHAINS) == {'P11111': {'A': {'1': '10', '2': '11'}, 'B': {'1': '20'}}}


UNIPROT = ('<uniprot xmlns="https://uniprot.org/uniprot"><entry>'
           '<feature type="active site" description="Nucleophile"><location><position position="{position}"/></location></feature>'
           '</entry></uniprot>')


def uniprot_annotations(position: int) -> set[tuple[str, str]]:
    mapping = parse_sifts_data(TWO_CHAINS)['P11111']
    tree = ET.fromstring(UNIPROT.format(position=position))
    return {(annotation.Chain, annotation.Id) for annotation in get_uniprot_residue_annotations(mapping, tree)}


def test_uniprot_annotations_of_all_chains():
    assert uniprot_annotations(1) == {('A', '10'), ('B', '20')}
    # Not observed in chain B
    assert uniprot_annotations(2) == {('A', '11')}


def test_uniprot_annotations_without_mapping():
    tree = ET.fromstring(UNIPROT.format(position=5))
    assert [(a.Chain, a.Id) for a in get_uniprot_residue_annotations(None, tree)] == [('A', '5')]


def test_channelsdb_annotations_of_all_chains(tmp_path, monkeypatch):
    monkeypatch.setitem(config['dirs'], 'annotations', str(tmp_path))
    (tmp_path / 'P11111.json').write_text('[{"Id": "1", "Text": "First"}, {"Id": "2", "Text": "Second"}, {"Id": "3", "Text": "Third"}]')
    mapping = parse_sifts_data(TWO_CHAINS)['P11111']
    annotations = get_channelsdb_residue_annotations('P11111', mapping)
    assert {(a['Chain'], a['Id'], a['Text']) for a in annotations} == {('A', '10', 'First'), ('B', '20', 'First'), ('A', '11', 'Second')}
    assert [(a['Chain'], a['Id']) for a in get_channelsdb_residue_annotations('P11111', None)] == [('A', '1'), ('A', '2'), ('A', '3')]
