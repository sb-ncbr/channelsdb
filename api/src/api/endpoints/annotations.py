import gzip
import json
import sys
import requests
from pathlib import Path
import xml.etree.ElementTree as ET
from fastapi import HTTPException
from pydantic import BaseModel

from api.main import app
from api.config import config
from api.common import PDB_ID_Type, Uniprot_ID_Type, uniprot_id_404_response, pdb_id_404_response


def parse_sifts_data(xml_data: str) -> dict[str, tuple[str, dict[str, str]]]:
    tree = ET.fromstring(xml_data)
    data = {}
    ns = {'': 'http://www.ebi.ac.uk/pdbe/docs/sifts/eFamily.xsd'}
    for entity in tree.iterfind('entity', ns):
        chain = entity.attrib['entityId']
        for segment in entity.iterfind('segment', ns):
            for residue in segment.find('listResidue', ns):
                if (uniprot_node := residue.find('./crossRefDb[@dbCoordSys="UniProt"]', ns)) is not None:
                    uniprot_id = uniprot_node.attrib['dbAccessionId']
                    uniprot_res_num = uniprot_node.attrib['dbResNum']
                    if (pdb_node := residue.find('./crossRefDb[@dbCoordSys="PDBresnum"]', ns)) is not None:
                        if (pdb_res_num := pdb_node.attrib['dbResNum']) == "null":
                            continue
                        if uniprot_id in data:
                            data[uniprot_id][1].update({uniprot_res_num: pdb_res_num})
                        else:
                            data[uniprot_id] = (chain, {uniprot_res_num: pdb_res_num})
    return data


def get_entry_annotations(uniprot_id: str, tree: ET) -> dict:
    ns = {'': 'https://uniprot.org/uniprot'}

    entry = {'UniProtId': uniprot_id,
             'Function': '',
             'Catalytics': [],
             'Name': ''
             }

    if (function := tree.find('entry/comment[@type="function"]/text', ns)) is not None:
        entry['Function'] = function.text

    for name_type in ('recommendedName', 'alternativeName', 'submittedName'):
        if (node := tree.find(f'entry/protein/{name_type}/fullName', ns)) is not None:
            entry['Name'] = node.text
            break

    for catalytics in tree.iterfind('entry/comment[@type="catalytic activity"]/*/text', ns):
        entry['Catalytics'].append(catalytics.text)

    return entry


def get_uniprot_residue_annotations(mapping: tuple[str, dict[str, str]] | None, tree: ET) -> list[dict]:
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

    for feature_type in features.keys():
        for item in features[feature_type]:
            residue_annotation = {
                'Id': '',
                'Chain': '',
                'Reference': '',
                'ReferenceType': '',
                'Text': ''
            }
            try:
                position = item.find('location/position', ns)
                if mapping is None:
                    residue_annotation['Chain'] = 'A'
                    residue_annotation['Id'] = position.attrib['position']
                else:
                    residue_annotation['Chain'] = mapping[0]
                    residue_annotation['Id'] = mapping[1][position.attrib['position']]

                if (evidence := item.attrib.get('evidence', None)) is not None:
                    # Picking only a first reference if multiple ones are provided
                    evidence = evidence.split()[0]
                    residue_annotation['Reference'] = references[evidence][0]
                    residue_annotation['ReferenceType'] = references[evidence][1]

                if feature_type in ('sequence variant', 'mutagenesis site'):
                    residue_annotation[
                        'Text'] = f'{item.find("original", ns).text} &rarr; {item.find("variation", ns).text}: {item.attrib["description"]}'
                else:
                    residue_annotation['Text'] = f'{item.attrib["type"].title()}: {item.attrib["description"]}'

            except (AttributeError, KeyError):
                continue

            residue_annotations.append(residue_annotation)

    return residue_annotations


def get_channelsdb_residue_annotations(uniprot_id: str, mapping: tuple[str, dict[str, str]] | None) -> list[dict]:
    path = Path(config['dirs']['annotations']) / f'{uniprot_id}.json'
    if not path.exists():
        return []

    with open(path) as f:
        data = json.load(f)

    if mapping is None:
        for annotation in data:
            annotation['Chain'] = 'A'
    else:
        for annotation in data:
            annotation['Chain'] = mapping[0]
            annotation['Id'] = mapping[1].get(annotation['Id'], None)

    return data


def fill_annotations(annotations: dict, mapping: tuple[str, dict[str, str]] | None, uniprot_id: str):
    req = requests.get(f'https://www.ebi.ac.uk/proteins/api/proteins/{uniprot_id}', headers={'accept': 'application/xml'})
    if req.status_code > 500:
        raise HTTPException(status_code=503, detail=f'PDBe API returned an error when accessing: {req.url}')
    if req.status_code != 200:
        raise HTTPException(status_code=404, detail=f'Cannot load annotations for Uniprot ID \'{uniprot_id}\'')
    xml_data = req.content.decode('utf-8')
    tree = ET.fromstring(xml_data)
    annotations['EntryAnnotations'].append(get_entry_annotations(uniprot_id, tree))
    annotations['ResidueAnnotations']['UniProt'].extend(get_uniprot_residue_annotations(mapping, tree))
    annotations['ResidueAnnotations']['ChannelsDB'].extend(get_channelsdb_residue_annotations(uniprot_id, mapping))


class ResidueAnnotations(BaseModel):
    ChannelsDB: list = []
    UniProt: list = []


class Annotations(BaseModel):
    EntryAnnotations: list = []
    ResidueAnnotations: ResidueAnnotations = ResidueAnnotations()


@app.get('/annotations/alphafill/{uniprot_id}', response_model=Annotations, name='Annotation data', tags=['AlphaFill'],
         description='Returns annotations of individual protein and its residues', responses=uniprot_id_404_response)
async def get_annotations_alphafill(uniprot_id: Uniprot_ID_Type):
    annotations = Annotations().model_dump()
    fill_annotations(annotations, None, uniprot_id)
    return annotations


@app.get('/annotations/pdb/{pdb_id}', response_model=Annotations, name='Annotation data', tags=['PDB'],
         description='Returns annotations of individual protein and its residues', responses=pdb_id_404_response)
async def get_annotations_pdb(pdb_id: PDB_ID_Type):
    annotations = Annotations().model_dump()
    req = requests.get(f'https://ftp.ebi.ac.uk/pub/databases/msd/sifts/xml/{pdb_id}.xml.gz')
    if req.status_code > 500:
        raise HTTPException(status_code=503, detail=f'PDBe server returned an error when accessing: {req.url}')
    if req.status_code != 200:
        raise HTTPException(status_code=404, detail=f'Cannot find annotations for PDB ID \'{pdb_id}\'')

    xml_data = gzip.decompress(req.content).decode('utf-8')
    sifts = parse_sifts_data(xml_data)
    try:
        for uniprot_id, mapping in sifts.items():
            fill_annotations(annotations, mapping, uniprot_id)
    except HTTPException as e:
        # We should never get here, this would mean incorrect SIFTS data
        print(e, file=sys.stderr)
        raise HTTPException(status_code=400, detail=f'Cannot load annotations for PDB ID \'{pdb_id}\'')

    return annotations
