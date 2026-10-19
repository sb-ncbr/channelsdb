import gzip
import json
import logging
import xml.etree.ElementTree as ET
import zlib
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.common import (
    PDB_ID_Format_Type,
    Uniprot_ID_Format_Type,
    check_response,
    pdb_id_404_response,
    session,
    unexpected_response,
    uniprot_id_404_response,
)
from api.config import config


logger = logging.getLogger(__name__)

router = APIRouter()

# Mappings of UniProt residue numbers to PDB residue numbers by author chain ID (as in the channel data),
# a protein can be present in several chains
type SiftsMapping = dict[str, dict[str, str]]


class EntryAnnotation(BaseModel):
    UniProtId: str
    Function: str = ''
    Catalytics: list[str] = []
    Name: str = ''


class ResidueAnnotation(BaseModel):
    Id: str
    Chain: str
    Reference: str = ''
    ReferenceType: str = ''
    Text: str


class ResidueAnnotationsModel(BaseModel):
    # Loaded from the stored files as they are
    ChannelsDB: list[dict[str, Any]] = []
    UniProt: list[ResidueAnnotation] = []


class Annotations(BaseModel):
    EntryAnnotations: list[EntryAnnotation] = []
    ResidueAnnotations: ResidueAnnotationsModel = ResidueAnnotationsModel()


def parse_sifts_data(xml_data: str) -> dict[str, SiftsMapping]:
    tree = ET.fromstring(xml_data)
    data: dict[str, SiftsMapping] = {}
    ns = {'': 'http://www.ebi.ac.uk/pdbe/docs/sifts/eFamily.xsd'}
    if tree.tag != f'{{{ns[""]}}}entry':
        raise ValueError(f'Unexpected root element of SIFTS data: {tree.tag}')
    # The entity IDs are label chain IDs, the author chain IDs are in the references to the PDB entry
    for residue in tree.iterfind('entity/segment/listResidue/residue', ns):
        if (uniprot_node := residue.find('./crossRefDb[@dbCoordSys="UniProt"]', ns)) is not None:
            uniprot_id = uniprot_node.attrib['dbAccessionId']
            uniprot_res_num = uniprot_node.attrib['dbResNum']
            if (pdb_node := residue.find('./crossRefDb[@dbCoordSys="PDBresnum"]', ns)) is not None:
                if (pdb_res_num := pdb_node.attrib['dbResNum']) == "null":
                    continue
                chain = pdb_node.attrib['dbChainId']
                data.setdefault(uniprot_id, {}).setdefault(chain, {})[uniprot_res_num] = pdb_res_num
    return data


def residue_locations(mapping: SiftsMapping | None, uniprot_res_num: str) -> list[tuple[str, str]]:
    """Chains and PDB residue numbers of a UniProt residue. Without a mapping (AlphaFill models),
    the protein is chain A numbered as in UniProt."""
    if mapping is None:
        return [('A', uniprot_res_num)]
    return [(chain, residues[uniprot_res_num]) for chain, residues in mapping.items() if uniprot_res_num in residues]


def get_entry_annotations(uniprot_id: str, tree: ET.Element) -> EntryAnnotation:
    ns = {'': 'https://uniprot.org/uniprot'}

    entry = EntryAnnotation(UniProtId=uniprot_id)

    if (function := tree.find('entry/comment[@type="function"]/text', ns)) is not None:
        entry.Function = function.text or ''

    for name_type in ('recommendedName', 'alternativeName', 'submittedName'):
        if (node := tree.find(f'entry/protein/{name_type}/fullName', ns)) is not None:
            entry.Name = node.text or ''
            break

    for catalytics in tree.iterfind('entry/comment[@type="catalytic activity"]/*/text', ns):
        entry.Catalytics.append(catalytics.text or '')

    return entry


def get_uniprot_residue_annotations(mapping: SiftsMapping | None, tree: ET.Element) -> list[ResidueAnnotation]:
    ns = {'': 'https://uniprot.org/uniprot'}

    references: dict[str, tuple[str, str]] = {}
    for evidence in tree.iterfind('entry/evidence', ns):
        key = evidence.attrib['key']
        if (reference := evidence.find('source/dbReference', ns)) is not None:
            ref_id, ref_type = reference.attrib['id'], reference.attrib['type']
            references[key] = (ref_id, ref_type)

    features = {}
    for feature_type in ('sequence variant', 'active site', 'binding site', 'mutagenesis site', 'site', 'metal ion-binding site'):
        features[feature_type] = tree.findall(f'entry/feature[@type="{feature_type}"]', ns)

    residue_annotations = []

    for feature_type, items in features.items():
        for item in items:
            try:
                position = item.find('location/position', ns).attrib['position']

                # Only the first reference is shown; evidence without one (e.g. curator inference) is skipped,
                # and a feature without any is still shown
                evidence_keys = item.attrib.get('evidence', '').split()
                ref_id, ref_type = next((references[key] for key in evidence_keys if key in references), ('', ''))

                if feature_type in ('sequence variant', 'mutagenesis site'):
                    text = f'{item.find("original", ns).text} &rarr; {item.find("variation", ns).text}: {item.attrib["description"]}'
                else:
                    text = f'{item.attrib["type"].title()}: {item.attrib["description"]}'

            except (AttributeError, KeyError):
                continue

            for chain, residue_id in residue_locations(mapping, position):
                residue_annotations.append(ResidueAnnotation(Id=residue_id, Chain=chain, Reference=ref_id,
                                                             ReferenceType=ref_type, Text=text))

    return residue_annotations


def get_channelsdb_residue_annotations(uniprot_id: str, mapping: SiftsMapping | None) -> list[dict[str, Any]]:
    path = Path(config['dirs']['annotations']) / f'{uniprot_id}.json'
    if not path.exists():
        return []

    with open(path) as f:
        data = json.load(f)

    # Residues not in the structure are left out
    return [annotation | {'Chain': chain, 'Id': residue_id}
            for annotation in data for chain, residue_id in residue_locations(mapping, annotation['Id'])]


def fill_annotations(annotations: Annotations, mapping: SiftsMapping | None, uniprot_id: str) -> None:
    req = session.get(f'https://www.ebi.ac.uk/proteins/api/proteins/{uniprot_id}', headers={'accept': 'application/xml'}, timeout=10)
    check_response(req, 'EBI Proteins API', f'Cannot load annotations for Uniprot ID \'{uniprot_id}\'')
    try:
        tree = ET.fromstring(req.content.decode('utf-8'))
        # A well-formed document of another kind (e.g. an error page) would otherwise yield no annotations
        if tree.tag != '{https://uniprot.org/uniprot}uniprot' or tree.find('{https://uniprot.org/uniprot}entry') is None:
            raise ValueError(f'Unexpected root element of UniProt data: {tree.tag}')
        entry_annotations = get_entry_annotations(uniprot_id, tree)
        residue_annotations = get_uniprot_residue_annotations(mapping, tree)
    except (ET.ParseError, ValueError, KeyError):
        # ValueError covers invalid UTF-8 and unexpected documents
        raise unexpected_response('EBI Proteins API', req.url) from None
    annotations.EntryAnnotations.append(entry_annotations)
    annotations.ResidueAnnotations.UniProt.extend(residue_annotations)
    annotations.ResidueAnnotations.ChannelsDB.extend(get_channelsdb_residue_annotations(uniprot_id, mapping))


@router.get('/annotations/alphafill/{uniprot_id}', name='Annotation data', tags=['AlphaFill'],
            description='Returns annotations of individual protein and its residues', responses=uniprot_id_404_response)
def get_annotations_alphafill(uniprot_id: Uniprot_ID_Format_Type) -> Annotations:
    annotations = Annotations()
    fill_annotations(annotations, None, uniprot_id)
    return annotations


@router.get('/annotations/pdb/{pdb_id}', name='Annotation data', tags=['PDB'],
            description='Returns annotations of individual protein and its residues', responses=pdb_id_404_response)
def get_annotations_pdb(pdb_id: PDB_ID_Format_Type) -> Annotations:
    annotations = Annotations()
    req = session.get(f'https://ftp.ebi.ac.uk/pub/databases/msd/sifts/xml/{pdb_id}.xml.gz', timeout=10)
    check_response(req, 'PDBe server', f'Cannot find annotations for PDB ID \'{pdb_id}\'')

    try:
        sifts = parse_sifts_data(gzip.decompress(req.content).decode('utf-8'))
    except (OSError, EOFError, zlib.error, ET.ParseError, ValueError, KeyError):
        # OSError, EOFError and zlib.error cover invalid, truncated or corrupted gzip data,
        # ValueError invalid UTF-8 and unexpected documents
        raise unexpected_response('PDBe server', req.url) from None
    for uniprot_id, mapping in sifts.items():
        try:
            fill_annotations(annotations, mapping, uniprot_id)
        except HTTPException as e:
            # Only unknown UniProt IDs are skipped, upstream failures are reported as they are
            if e.status_code != 404:
                raise
            # SIFTS can refer to obsolete UniProt IDs, return annotations for the remaining ones
            logger.warning('Skipping UniProt ID %s for PDB ID %s: %s', uniprot_id, pdb_id, e.detail)

    return annotations
