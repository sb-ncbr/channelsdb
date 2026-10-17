/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

namespace ChannelsDB {
    export class Documentation extends React.Component<{}, {}> {
        render() {
            let justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };

            return <div style={{ margin: '60px 0 0 20px' }}>

                <h1 className='text-center'>Documentation</h1>                

                <h2>Table of content</h2>
                <div className='list-group well-sm'>
                    <a href='#db-content' className='list-group-item'>
                        <h4 className='list-group-item-heading'>Database content</h4>
                        <p className='list-group-item-text'>What you can find in the database?</p>
                    </a>
                    <a href='#db-nomenclature' className='list-group-item'>
                        <h4 className='list-group-item-heading'>Channels nomenclature </h4>
                        <p className='list-group-item-text'>Nomenclature used for channel naming.</p>
                    </a>
                    <a href='#db-mole' className='list-group-item'>
                        <h4 className='list-group-item-heading'>MOLE settings</h4>
                        <p className='list-group-item-text'>Settings used for channel extraction.</p>
                    </a>
                    <a href='#db-caver' className='list-group-item'>
                        <h4 className='list-group-item-heading'>CAVER settings</h4>
                        <p className='list-group-item-text'>Settings used for channel extraction.</p>
                    </a>
                    <a href='#db-cofactors' className='list-group-item'>
                        <h4 className='list-group-item-heading'>Cofactors</h4>
                        <p className='list-group-item-text'>List of cofactors used for channel calculation.</p>
                    </a>                    
                    <a href='#db-results' className='list-group-item'>
                        <h4 className='list-group-item-heading'>Results view</h4>
                        <p className='list-group-item-text'>How to read the results page?</p>
                    </a>                    
                    <a href='#db-api' className='list-group-item'>
                        <h4 className='list-group-item-heading'>API</h4>
                        <p className='list-group-item-text'>How to access content of the database programatically.</p>
                    </a>                                        
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />

                {React.createElement('a' as any, { 'name': 'db-content' })}
                {/* <a name='db-content' /> */}
                <div className='row'>
                    <div className='col-md-8'>
                        <h2 className='featurette-heading'>Database content</h2>
                        <p>
                            <b>The entire database is composed out of the following content:</b>
                                <ul>
                                    <li>Manually curated channel annotations from literature extracted entries</li>
                                    <li>Ligand-accessible tunnels to the catalytic sites annotated in the <a target='_blank' href='https://www.ebi.ac.uk/thornton-srv/m-csa/'>Catalytic Site Atlas</a></li>
                                    <li>Product/substrate tunnels leading towards the well-known enzyme cofactors such as <abbr className='abbr initialism' title='HEME (Protoporhpyrin IX containing Fe)'>HEM</abbr> or <abbr className='abbr initialism' title='Flavin-adenine dinucleotide'>FAD</abbr></li>
                                    <li>Pores in transmembrane proteins enabling flow of ions and small molecules across the lipid bilayer for proteins deposited in the <a target='_blank' href='https://opm.phar.umich.edu/' >OPM</a> database</li>
                                </ul>
                            All the channels have been extracted from biological assemblies as identified by the Protein Data Bank in Europe.
                        </p>
                    </div>
                    <div className='col-md-4'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/pretty_channel.webp'} width='500' height='500' alt='Channel details' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />                

                {React.createElement('a' as any, { 'name': 'db-nomenclature' })}
                <div className='row'>
                        <h2 className='featurette-heading'>Channel nomenclature</h2>
                        <p>Unless the channel has been given a particular name in literature, which is the case e.g. for a group of <a href='https://dx.doi.org/10.1016/j.bbagen.2006.07.005' target='_blank'>cytochrome P450s</a>, 
                        names are given to accordingly the following controlled vocabulary:</p>
                        <div className='row table-responsive col-md-8 col-md-offset-2'>
                            <table className='table table-condensed active'>
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                            </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Channel</td>
                                    <td>Generic term for any ligand transporting pathway</td>
                                </tr>
                                <tr>
                                    <td>Tunnel</td>
                                    <td>Generic term for a ligand transporting pathway towards the enzyme active site</td>
                                </tr>
                                <tr>
                                    <td>Pore</td>
                                    <td>Generic term for a channel spanning across a biomacromolecule</td>
                                </tr>
                                <tr>
                                    <td>Solvent tunnel</td>
                                    <td>Tunnel transporting water molecules, which are consumed/egressed during a chemical reaction</td>
                                </tr>                               
                                <tr>
                                    <td>Substrate tunnel</td>
                                    <td>Tunnel transporting various chemical species consumed in a chemical reaction</td>
                                </tr>
                                <tr>
                                    <td>Substrate/Product tunnel</td>
                                    <td>Single tunnel facilitating transport of all chemical species to/from the catalytic site.</td>
                                </tr>                                
                                <tr>
                                    <td>Product tunnel</td>
                                    <td>Tunnel transporting chemical species that are an outcome of chemical reaction</td>
                                </tr>
                                <tr>
                                    <td>Water channel</td>
                                    <td>Tunnel transporting water molecules; mainly found in aquaporins.</td>
                                </tr>                                
                                <tr>
                                    <td>Ion channel</td>
                                    <td>Pore providing a pathway for ion and other charged chemical species to pass through lipid bilayer</td>
                                </tr>                          
                                <tr>  
                                    <td>Hydrophobic channel</td>
                                    <td>Pore providing a pathway for apolar chemical species to pass through lipid bilayer</td>
                                </tr>
                                <tr>  
                                    <td>Peptide channel</td>
                                    <td>Channel enabling a passage of polypeptides</td>
                                </tr>
                                <tr>  
                                    <td>Nucleotide channel</td>
                                    <td>Channel enabling a passage of nucleotides</td>
                                </tr>                                
                            </tbody>                        
                        </table>    
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />

                {React.createElement('a' as any, { 'name': 'db-mole' })}
                <div className='row'>
                    <h2 className='featurette-heading'>MOLE settings</h2>
                    <p style={justify}>Throughout the ChannelsDB the following settings of the MOLE algorithm have been used for individual types of channels.</p>
                    <h4 className='featurette-heading'>Reviewed channels</h4>
                    <p style={justify}>Each calculation has been independently adjusted, in order to extract deemed channels.</p>                        
                    <div className='row table-responsive col-md-4 col-md-offset-1'>
                        <h2 className='featurette-heading'>CSA tunnels</h2>
                        <table className='table table-condensed active'>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><i>ProbeRadius</i></td>
                                    <td>5.0</td>
                                </tr>
                                <tr>
                                    <td><i>InteriorThreshold</i></td>
                                    <td>1.1</td>
                                </tr>
                                <tr>
                                    <td><i>MinTunnelLength</i></td>
                                    <td>15.0</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckRadius</i></td>
                                    <td>1.25</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckTolerance</i></td>
                                    <td>3.0</td>
                                </tr>
                                <tr>
                                    <td><i>MaxTunnelSimilarity</i></td>
                                    <td>0.7</td>
                                </tr>                                                                                                
                                <tr>
                                    <td><i>NonActiveParts</i></td>
                                    <td data-toggle='tooltip' data-placement='bottom' title='HetResidues().Filter(lambda m: m.IsNotConnectedTo(AminoAcids()))'>Query</td>
                                </tr>                                                                                                
                            </tbody>
                        </table>
                    </div>

                    <div className='row table-responsive col-md-4 col-md-push-2'>
                        <h2 className='featurette-heading'>Cofactor tunnels</h2>
                        <table className='table table-condensed active'>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><i>ProbeRadius</i></td>
                                    <td>5.0</td>
                                </tr>
                                <tr>
                                    <td><i>InteriorThreshold</i></td>
                                    <td>1.4</td>
                                </tr>
                                <tr>
                                    <td><i>IgnoreHetResidues</i></td>
                                    <td>True</td>
                                </tr>
                                <tr>
                                    <td><i>MinTunnelLength</i></td>
                                    <td>15.0</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckRadius</i></td>
                                    <td>1.25</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckTolerance</i></td>
                                    <td>1.0</td>
                                </tr>
                                <tr>
                                    <td><i>MaxTunnelSimilarity</i></td>
                                    <td>0.7</td>
                                </tr>                                                                                                
                                <tr>
                                    <td><i>NonActiveParts</i></td>
                                    <td data-toggle='tooltip' data-placement='bottom' title='Various queries e.g. Atoms("Fe").Inside(Residues("HEM", "HEC", "HEA"))'>Query</td>
                                </tr>                                                                                                
                            </tbody>
                        </table>
                    </div>

                    <div className='row table-responsive col-md-4 col-md-push-2'>
                        <h2 className='featurette-heading'>Cognate tunnels</h2>
                        <table className='table table-condensed active'>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><i>ProbeRadius</i></td>
                                    <td>5.0</td>
                                </tr>
                                <tr>
                                    <td><i>InteriorThreshold</i></td>
                                    <td>1.4</td>
                                </tr>
                                <tr>
                                    <td><i>IgnoreHetResidues</i></td>
                                    <td>True</td>
                                </tr>
                                <tr>
                                    <td><i>MinTunnelLength</i></td>
                                    <td>15.0</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckRadius</i></td>
                                    <td>1.25</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckTolerance</i></td>
                                    <td>1.0</td>
                                </tr>
                                <tr>
                                    <td><i>MaxTunnelSimilarity</i></td>
                                    <td>0.7</td>
                                </tr>                                                                                                
                                <tr>
                                    <td><i>NonActiveParts</i></td>
                                    <td data-toggle='tooltip' data-placement='bottom' title='Various queries e.g. Atoms("Fe").Inside(Residues("HEM", "HEC", "HEA"))'>Query</td>
                                </tr>                                                                                                
                            </tbody>
                        </table>
                    </div>

                    <div className='row table-responsive col-md-4 col-md-push-2'>
                        <h2 className='featurette-heading'>AlphaFill tunnels</h2>
                        <table className='table table-condensed active'>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><i>ProbeRadius</i></td>
                                    <td>5.0</td>
                                </tr>
                                <tr>
                                    <td><i>InteriorThreshold</i></td>
                                    <td>1.4</td>
                                </tr>
                                <tr>
                                    <td><i>IgnoreHetResidues</i></td>
                                    <td>True</td>
                                </tr>
                                <tr>
                                    <td><i>MinTunnelLength</i></td>
                                    <td>15.0</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckRadius</i></td>
                                    <td>1.25</td>
                                </tr>
                                <tr>
                                    <td><i>BottleneckTolerance</i></td>
                                    <td>1.0</td>
                                </tr>
                                <tr>
                                    <td><i>MaxTunnelSimilarity</i></td>
                                    <td>0.7</td>
                                </tr>                                                                                                
                                <tr>
                                    <td><i>NonActiveParts</i></td>
                                    <td data-toggle='tooltip' data-placement='bottom' title='Various queries e.g. Atoms("Fe").Inside(Residues("HEM", "HEC", "HEA"))'>Query</td>
                                </tr>                                                                                                
                            </tbody>
                        </table>
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />

                {React.createElement('a' as any, { 'name': 'db-caver' })}
                <div className='row'>
                    <h2 className='featurette-heading'>CAVER settings</h2>
                    <p style={justify}>All tunnels from CAVER in ChannelsDB were calculated using the following settings. Reviewed tunnels calculated by Caver used manually adjusted startings points and smaller probe 0.7 Å.</p>
                    <div className='row table-responsive col-md-4 col-md-offset-1'>
                        <h2 className='featurette-heading'>CAVER tunnels</h2>
                        <table className='table table-condensed active'>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><i>ProbeRadius</i></td>
                                    <td>0.9</td>
                                </tr>
                                <tr>
                                    <td><i>Shell radius</i></td>
                                    <td>3</td>
                                </tr>
                                <tr>
                                    <td><i>Shell depth</i></td>
                                    <td>4</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />

                {React.createElement('a' as any, { 'name': 'db-cofactors' })}
                <div className='row'>
                        <h2 className='featurette-heading'>Cofactors list</h2>
                        <p>The well-known biologically important cofactors, which are often buried within a protein structure, have been selected for a channel extraction.</p>
                        <div className='row table-responsive col-md-8 col-md-offset-2'>
                            <table className='table table-condensed active'>
                            <thead>
                            <tr>
                                <th>Group</th>
                                <th>Origin</th>
                                <th>Ligand list</th>                                
                            </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Hems</td>
                                    <td>Fe (<i>type_symbol</i>)</td>
                                    <td><i>HEA, HEM, HEC</i></td>
                                </tr>
                                <tr>
                                    <td>Flavins</td>
                                    <td>N5 (<i>auth_atom_id</i>)</td>
                                    <td><i>FAD, FMN</i></td>
                                </tr>
                                <tr>
                                    <td>Nicotinadenins</td>
                                    <td>N1N (<i>auth_atom_id</i>)</td>
                                    <td><i>NAD, NAP, NDP, NAI</i></td>
                                </tr>
                                <tr>
                                    <td>Nucleotides</td>
                                    <td>PA atom (<i>auth_atom_id</i>)</td>
                                    <td><i>ATP, CTP, UTP, GTP, TTP, ADP, CDP, UDP, GDP, TDP, AMP, CMP, ANP</i></td>
                                </tr>                               
                                <tr>
                                    <td>Vitamin B2</td>
                                    <td>N5 (<i>auth_atom_id</i>)</td>
                                    <td><i>RBF</i></td>
                                </tr>
                                <tr>
                                    <td>Vitamin B6</td>
                                    <td>C4A (<i>auth_atom_id</i>)</td>
                                    <td><i>PLP</i></td>
                                </tr>
                                <tr>
                                    <td>Vitamin B12</td>
                                    <td>CO (<i>auth_atom_id</i>)</td>
                                    <td><i>B12</i></td>
                                </tr>         
                                <tr>
                                    <td>Biotin</td>
                                    <td>C3 (<i>auth_atom_id</i>)</td>
                                    <td><i>BTN</i></td>
                                </tr>                                                                
                                <tr>
                                    <td>Coenzym</td>
                                    <td>S1P (<i>auth_atom_id</i>)</td>
                                    <td><i>COA, ACO</i></td>
                                </tr>                                
                                <tr>
                                    <td>Glutathione</td>
                                    <td>SG2 (<i>auth_atom_id</i>)</td>
                                    <td><i>GSH, GDS</i></td>
                                </tr>                          
                            </tbody>                        
                        </table>    
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />                

                {React.createElement('a' as any, { 'name': 'db-results' })}
                <div className='row featurette'>
                        <h2 className='featurette-heading'>Results interpretation</h2>
                        <div className='col-md-5'>
                        <p style={justify}>The results page is separated into 5 different sections. All of them are interactive, so play around!</p>
                          <ol>
                              <li>
                                The main part contains molecule visualization using LiteMol. The documentation how to change visual representation of the results
                                is available in the <a href='https://webchem.ncbr.muni.cz/Wiki/LiteMol:UserManual' target='_blank'>LiteMol documentation</a>.<br/>
                                Note that MacOS trackpad controls are slightly different, i.e.:
                                  <ul>
                                      <li>Zoom (using default settings on MacBook) works with two-finger click + move up/down</li>
                                      <li>Translation works by holding down Shift + single-finger click + move</li>
                                  </ul>
                              </li>
                              <li>
                                 Right next to the visualization panel is a list of all channels identified for the particular PDB entry displayed. All channels are grouped to respective categories.
                              </li>
                              <li>
                                Directly below the visualization pane you can find an interactive visualization of a channel profile. All the physicochemical properties are mapped on the
                                channel profile. User can select deemed type of property to visualize, change the radius being measured to the closest atom or to the backbone. On the top of that to a publication quality image is available for export as well.
                              </li>
                              <li>
                                  Next to the 2D channel visualization is a list with details for individual regions of a channel (so called layers). Additional level of information is provided
                                  as a residue level annotations with the respective reference.
                             </li>
                             <li> Protein annotations from the UniProt resource.</li>
                          </ol>
                            
                        </div>                    
                    <div className='col-md-7'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/web-fig1.webp'} width='500' height='500' alt='Result window detail' />
                    </div>                    
                </div>

                <div style={{ margin: '50px 0' }} className='row featurette col-md-12'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/web-fig2.webp'} width='800' alt='2D detailed channel view' />
                </div>  

                {React.createElement('a' as any, { 'name': 'db-api' })}
                <div className='channelsdb-api-docs'>
                        <h2 className='featurette-heading'>API </h2>
                    <p> The entire database is powered by the API with an interactive <a href="/api">documentation</a> available.
                        Therefore, all the channel-related information can be programmatically retrieved and used for further processing. The returned content is <i>application/json</i> object
                        and all the properties are self-explanatory. Should you have further questions or comments, do not hesitate to <a href='mailto:webchemistryhelp@gmail.com?subject=ChannelsDB2 - API'>contact us.</a></p>
                   </div>

                <ScrollButton scrollStepInPx='50' delayInMs='10'/>

            </div>;
        }
    }
}