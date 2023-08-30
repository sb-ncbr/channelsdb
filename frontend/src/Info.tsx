/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

namespace ChannelsDB {
    export class Intro extends React.Component<{ state: State }, { statistics: any, statisticsExpanded: boolean }> {
        private sub: Rx.IDisposable | undefined = void 0;
        state = { statistics: this.props.state.statistics, statisticsExpanded: false };

        private toggle(e: React.MouseEvent<HTMLElement>) {
            e.preventDefault();
            this.setState({ statisticsExpanded: !this.state.statisticsExpanded });
        }

        componentDidMount() {
            if (!this.state.statistics) {
                this.sub = this.props.state.statisticsAvailable.subscribe((statistics) => this.setState({ statistics }));
            }
        }

        componentWillUnmount() {
            if (this.sub) {
                this.sub.dispose();
                this.sub = void 0;
            }
        }

        render() {
            const stats = this.state.statistics;
            let reference = {
                borderLeft: '2px solid #AAA',
                paddingLeft: 6,
            };

            return <div>
                <div className='row' >
                    <div className='well row table-responsive' style={{ marginTop: '0', marginBottom: '40px' }}>
                        <div className="text-center">
                            ChannelsDB last update on <b>{stats ? stats.date : 'n/a'}</b>
                            &nbsp;<small>contains:</small><b> {stats ? stats.Total : 'n/a'}</b> entries
                            &nbsp;<a href="_blank" onClick={e => this.toggle(e)}>Show more/less</a>
                        </div>
                        <table className="table table-condensed active w-auto" style={{ display: this.state.statisticsExpanded ? 'table' : 'none' }}>
                            <thead>
                                <tr>
                                    <th><b>Channel type</b></th>
                                    <th><b>MOLE</b></th>
                                    <th><b>CAVER</b></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Reviewed</td>
                                    <td><b>{stats && stats.statistics.ReviewedChannels_MOLE ? stats.statistics.ReviewedChannels_MOLE : 'n/a'}</b></td>
                                    <td><b>{stats && stats.statistics.ReviewedChannels_Caver ? stats.statistics.ReviewedChannels_Caver : 'n/a'}</b></td>
                                </tr>
                                <tr>
                                    <td>CSA</td>
                                    <td><b>{stats && stats.statistics.CSATunnels_MOLE ? stats.statistics.CSATunnels_MOLE : 'n/a'}</b></td>
                                    <td><b>{stats && stats.statistics.CSATunnels_Caver ? stats.statistics.CSATunnels_Caver : 'n/a'}</b></td>
                                </tr>
                                <tr>
                                    <td>Cofactor</td>
                                    <td><b>{stats && stats.statistics.CofactorTunnels_MOLE ? stats.statistics.CofactorTunnels_MOLE : 'n/a'}</b></td>
                                    <td><b>{stats && stats.statistics.CofactorTunnels_Caver ? stats.statistics.CofactorTunnels_Caver : 'n/a'}</b></td>
                                </tr>
                                <tr>
                                    <td>Transmembrane pores</td>
                                    <td><b>{stats && stats.statistics.TransmembranePores_MOLE ? stats.statistics.TransmembranePores_MOLE : 'n/a'}</b></td>
                                    <td><b>{stats && stats.statistics.TransmembranePores_Caver ? stats.statistics.TransmembranePores_Caver : 'n/a'}</b></td>
                                </tr>
                                <tr>
                                    <td>Procognate</td>
                                    <td><b>{stats && stats.statistics.ProcognateTunnels_MOLE ? stats.statistics.ProcognateTunnels_MOLE : 'n/a'}</b></td>
                                    <td><b>{stats && stats.statistics.ProcagnateTunnels_Caver ? stats.statistics.ProcagnateTunnels_Caver : 'n/a'}</b></td>
                                </tr>
                                <tr>
                                    <td>AlphaFill</td>
                                    <td><b>{stats && stats.statistics.AlphaFillTunnels_MOLE ? stats.statistics.AlphaFillTunnels_MOLE : 'n/a'}</b></td>
                                    <td><b>{stats && stats.statistics.AlphaFillTunnels_Caver ? stats.statistics.AlphaFillTunnels_Caver : 'n/a'}</b></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className='col-lg-9' style={{ textAlign: 'left', textJustify: 'inter-word', padding: '0' }}>

                        <p className="lead">ChannelsDB database is located at <a target="_blank" href="https://channelsdb.ncbr.muni.cz/">https://channelsdb.ncbr.muni.cz/</a>.</p>

                        <p className="lead">ChannelsDB 2.0 is a comprehensive and regularly updated resource of channels, pores and tunnels found in biomacromolecules deposited in the <a target="_blank" href="https://www.ebi.ac.uk/pdbe/">Protein Data Bank</a> and <a target="_blank" href="https://alphafill.eu/">AlphaFill</a> / <a target="_blank" href="https://alphafold.ebi.ac.uk/">AlphaFold</a> databases. As such, it is a unique service for channel-related analyses. Pathways were calculated using an algorithms <a target="_blank" href="https://loschmidt.chemi.muni.cz/caverweb/">CAVER</a> and <a target="_blank" href="https://mole.upol.cz/">MOLE</a>.</p>

                        <p className='text-justify'>
                            The database contains information about channel positions, geometry and physicochemical properties. Additionally, all the entries are crosslinked with
                                the <a href='https://www.uniprot.org' target='_blank'>UniProt database</a> a comprehensive high-quality resource of protein function information. Last but not least, all the results are displayed in
                                a clear interactive manner further facilitating data interpretation. </p>

                        <p>If you would like to provide your own research results to be displayed soon as a part of Protein Data Bank in Europe. <a href='mailto:webchemistryhelp@gmail.com'>Get in touch with us</a>, or use the <a href='contribute.html'>annotation form</a>.</p>

                        <hr className='featurette-divider' style={{ margin: '10px 0' }} />

                        <p>Should you find this resource useful, please cite it as:</p>
                        <p style={reference}>
                            <small>
                                <a href='https://dx.doi.org/10.1093/nar/gkx868' target='_blank'> Pravda,L., et al. (2018) ChannelsDB: database of biomacromolecular tunnels and pores. Nucleic Acids Res., 46, D399–D405.</a>
                            </small>
                        </p>
                    </div>
                    <div className='channelsdb-logo col-lg-3'><a href='https://dx.doi.org/10.1093/nar/gkx868' target='_blank'><img src={'assets/img/channelsdb_cover.png'} style={{width: '100%'}} /></a></div>
                </div>
            </div>;
        }
    }

    export class Info extends React.Component<{ state: State }, {}> {

        render() {
            let centerStyle = {
                display: 'block',
                margin: '0 auto',
                marginTop: 0,
            };

            let justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };

            let reference = {
                borderLeft: '2px solid #AAA',
                paddingLeft: 6,
            };

            return <div style={{ marginTop: '0px' }}>
                <Intro state={this.props.state} />

                <div className='row' style={{ marginTop: '30px' }}>
                    <div className='col-lg-12'>
                        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontWeight: 'bold' }}>Examples</h2>
                        <div className='well'>
                            <div>
                                <div className='col-lg-4'>
                                    <a href='/detail/pdb/1ymg'>
                                        <img style={centerStyle} className='img-circle' src={'assets/img/1ymg.png'} alt='1ymg channel detail' width='140' height='140' />
                                    </a>
                                    <a href='#ex-1ymg' role='button'><h3>Aquaporin water channel</h3></a>
                                    <p style={justify}>The pore architecture of Aquaporin O at 2.2&#8491; resolution highlights residues critical for water permeation regulation.</p>
                                </div>
                                <div className='col-lg-4'>
                                    <a href='/detail/pdb/4nm9'>
                                        <img style={centerStyle} className='img-circle' src={'assets/img/4nm9.png'} alt='4nm9 channel detail' width='140' height='140' />
                                    </a>
                                    <a href='#ex-4nm9' role='button'><h3>Substrate channeling system</h3></a>
                                    <p style={justify}>Proline utilization A protein contains two active sites separated by ~75&#8491; long channeling system accompanied by a complex network of channels.</p>
                                </div>
                                <div className='col-lg-4'>
                                    <a href='/detail/pdb/1jj2'>
                                        <img style={centerStyle} className='img-circle' src={'assets/img/1jj2.png'} alt='1jj2 channel detail' width='140' height='140' />
                                    </a>
                                    <a href='#ex-1jj2' role='button'><h3>Ribosomal polypeptide exit tunnel</h3></a>
                                    <p style={justify}>Ribosomal polypeptide exit tunnel directs a nascent protein from the peptidyl transferase center to the outside of the ribosome.</p>
                                </div>
                            </div>
                            <div className='row' style={{ margin: '20px 0' }}>
                                <div className='col-lg-4'><a className='btn btn-block btn-default' href='#ex-1ymg' role='button'>View details &raquo;</a></div>
                                <div className='col-lg-4'><a className='btn btn-block btn-default' href='#ex-4nm9' role='button'>View details &raquo;</a></div>
                                <div className='col-lg-4'><a className='btn btn-block btn-default' href='#ex-1jj2' role='button'>View details &raquo;</a></div>
                            </div>
                            <div>
                                <div className='col-lg-6'>
                                    <a href='/detail/pdb/3tbg'>
                                        <img style={centerStyle} className='img-circle' src={'assets/img/3tbg.png'} alt='3tbg channel detail' width='140' height='140' />
                                    </a>
                                    <a href='#ex-3tbg' role='button'><h3>Cytochrome P450 2D6 tunnels in experimental structure</h3></a>
                                    <p style={justify}>Cytochromes P450 are known for complex net of multiple channels leading towards the active site. These channels serve multiple roles.</p>
                                </div>
                                <div className='col-lg-6'>
                                    <a href='/detail/alphafill/P10635'>
                                        <img style={centerStyle} className='img-circle' src={'assets/img/alphafill_example.png'} alt='P10635 channel detail' width='140' height='140' />
                                    </a>
                                    <a href='#ex-P10635' role='button'><h3>Cytochrome P450 2D6 tunnels in Alphafill model</h3></a>
                                    <p style={justify}>Complex net of multiple channels in cytochrome P450 2D6 leading towards the active site is visible even in AlphaFold structures.</p>
                                </div>
                            </div>
                            <div className='row' style={{ margin: '20px 0' }}>
                                <div className='col-lg-6'><a className='btn btn-block btn-default' href='#ex-3tbg' role='button'>View details &raquo;</a></div>
                                <div className='col-lg-6'><a className='btn btn-block btn-default' href='#ex-P10635' role='button'>View details &raquo;</a></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row featurette' style={{ marginTop: '40px' }}>
                    {React.createElement('a' as any, { 'name': 'ex-1ymg' })}
                    <div className='col-md-7'>
                        <a href='/detail/pdb/1ymg'><h2 className='featurette-heading'>Aquaporin O <span className='text-muted'>(1ymg)</span></h2></a>
                        <p style={justify} className='lead'>The pore architecture of Aquaporin O at 2.2&#8491; resolution highlights residues critical for water permeation regulation.</p>
                        <p style={justify}>The channel is ~ 30&#8491; long and highlights with some of the residues crucial for its proper function. Selectivity filter (ar/R), which allows water molecules passage through the membrane in a single file (green sticks). Residues providing canonical AQP hydrogen bond acceptor that align waters through the channel in balls and stick model. Finally, Tyr-149 important for channel gating (orange).</p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1073/pnas.0405274101'>
                            Harries, W. E. C., et. al. <span style={{ fontStyle: 'italic' }}>The channel architecture of aquaporin 0 at a 2.2&#8491; resolution</span>. Proc. Natl. Acad. Sci. 101, 14045–14050 (2004)</a></small></p>
                    </div>
                    <div className='col-md-5'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/1ymg_detail.png'} width='500' height='500' alt='1ymg detailed channel view' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '40px 0' }} />

                <div className='row featurette'>
                    {React.createElement('a' as any, { 'name': 'ex-3tbg' })}
                    <div className='col-md-7 col-md-push-5'>
                        <a href='/detail/pdb/3tbg'><h2 className='featurette-heading'>Cytochrome P450 2D6 experimental <br/>structures<span className='text-muted'>(3tbg)</span></h2></a>
                        <p style={justify} className='lead'>Cytochromes P450 are known for complex net of multiple channels leading towards active site. These channels serve multiple roles in substrate access, product release or hydration pathways.</p>
                        <p style={justify}>Cytochrome  P450  2D6  contributes  significantly  to  the  metabolism  of  >15%  of  the  200  most marketed drugs. Cytochrome P450 2D6 structure shows a second molecule of thioridazine bound in an expanded substrate access channel (channel 2f according to <a href='https://doi.org/10.1016/j.bbagen.2006.07.005' target='_blank'>Cojocaru et al. classification</a>  antechamber  with  its  piperidine  moiety  forming  a charge-stabilized hydrogen bond with Glu-222.</p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1074/jbc.M114.627661'>
                            Wang, A., et al. <span style={{ fontStyle: 'italic' }}>Contributions of Ionic Interactions and Protein Dynamics to Cytochrome P450 2D6 (CYP2D6) Substrate and Inhibitor Binding</span> J.Biol.Chem. 290: 5092-5104 (2015)</a></small></p>
                    </div>
                    <div className='col-md-5 col-md-pull-7'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/3tbg_detail.png'} alt='Cytochrome P450 substrate channel details' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '40px 0' }} />

                <div className='row featurette'>
                    {React.createElement('a' as any, { 'name': 'ex-P10635' })}
                    <div className='col-md-7 '>
                        <a href='/detail/alphafill/P10635'><h2 className='featurette-heading'>Cytochrome P450 2D6 Alphafill models<span className='text-muted'>(P10635)</span></h2></a>
                        <p style={justify} className='lead'>Cytochromes P450 channels starts at HEM cofactor, which can be used to guide channels even in AlphaFill models.</p>
                        <p style={justify}>As mentioned above, Cytochrome P450 2D6 contributes significantly to the metabolism of >15% of the 200 most marketed drugs. Cytochrome P450 2D6 structure shows a second molecule of thioridazine bound in an expanded substrate access channel (channel 2f according to Cojocaru et al. classification antechamber with its piperidine moiety forming a charge-stabilized hydrogen bond with Glu-222).</p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1074/jbc.M114.627661'>
                            Wang, A., et al.  <span style={{ fontStyle: 'italic' }}>Contributions of Ionic Interactions and Protein Dynamics to Cytochrome P450 2D6 (CYP2D6) Substrate and Inhibitor Binding</span> J.Biol.Chem. 290: 5092-5104 (2015)</a></small></p>
                    </div>
                    <div className='col-md-5'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/alphafill_example.png'} alt='Cytochrome P450 substrate channel details' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '40px 0' }} />

                <div className='row featurette'>
                    {React.createElement('a' as any, { 'name': 'ex-1jj2' })}
                    <div className='col-md-7 '>
                        <a href='/detail/pdb/1jj2'><h2 className='featurette-heading'>Large Ribosomal Subunit <span className='text-muted'>(1jj2)</span></h2></a>
                        <p style={justify} className='lead'>The ribosomal polypeptide tunnel provides an insight into the release of a nascent polypeptide chain out of the ribosomal complex.</p>
                        <p style={justify}>The exit tunnel is surrounded by arginine side chains (stick model), bearing positive charges as well as RNA backbone phosphate groups (spheres), thus providing fragmental charge along the tunnel, which is necessary to prevent the nascent peptide from sticking to the channel wall inside the ribosome. Subunits L4, L22 and L39e interacting with the exit tunnel are highlighted in yellow, green and magenta respectivelly.</p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1016/j.jmb.2006.05.023'>
                            Voss, N. R., et. al. <span style={{ fontStyle: 'italic' }}>The geometry of the ribosomal polypeptide exit tunnel.</span>. J. Mol. Biol. 360, 893–906 (2006)</a></small></p>
                    </div>
                    <div className='col-md-5 '>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/1jj2_detail.png'} alt='Polypeptide exit tunnel' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '40px 0' }} />

                <div className='row featurette'>
                    {React.createElement('a' as any, { 'name': 'ex-4nm9' })}
                    <div className='col-md-7 col-md-push-5'>
                        <a href='/detail/pdb/4nm9'><h2 className='featurette-heading'>PutA channeling system <span className='text-muted'>(4nm9)</span></h2></a>
                        <p style={justify} className='lead'>Substrate channeling is a process of passing intermediate metabolic product from one reaction site to another through intramolecular tunnel.</p>
                        <p style={justify}>In Gram-negative bacteria a proline catabolism is exerted by a single protein combining two different enzymes commonly known as Proline utilization A protein (PutA).
                            The active sites of flavoenzyme proline dehydrogenase (PRODH) and ∆-1-pyrroline-5-carboxylate dehydrogenase (P5CDH) are connected by ~75&#8491; long channel throughout the hydrolysis
                            cavity. Both active sites are supplied by a network of channels for substrate, water consumed by hydrolysis and egress channel for the product - L-glutamate.</p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1073/pnas.1321621111'>
                            Singh,H., et al. <span style={{ fontStyle: 'italic' }}>Structures of the PutA peripheral membrane flavoenzyme reveal a dynamic substrate-channeling tunnel and the quinone-binding site</span> Proc. Natl. Acad. Sci., 111, 3389–3394. (2014)</a></small></p>
                    </div>
                    <div className='col-md-5 col-md-pull-7'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/4nm9_detail.png'} alt='PutA channel system' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '40px 0' }} />
                <hr className='featurette-divider' style={{ margin: '40px 0' }} />

                <img className='img' src={'assets/img/elixirlogo.png'} alt='ELIXIR logo' height='70' />
                <img className="img" src="assets/img/kfc.jpg" alt="KFC logo" height="70" />
                <img className="img" src="assets/img/upol.jpg" alt="UPOL logo" height="70"/>
                <img className="img" src="assets/img/metacentrum.jpg" alt="METACENTRUM logo" height="70"/>
                <img className="img" src="assets/img/recetox.jpg" alt="RECETOX logo" height="70"/>
                <img className="img" src="assets/img/ceitec.jpg" alt="CEITEC logo" height="70"/>
                <img className="img" src="assets/img/muni.jpg" alt="MUNI logo" height="70"/>
                <div className='row well well-sm featurette text-center' style={{ marginTop: '10px' }}>
                    ChannelsDB is a part of services provided by <a href='https://www.elixir-czech.cz/' target='_blank'>ELIXIR</a> &ndash;
                     European research infrastructure for biological information. This work was supported by ELIXIR CZ research infrastructure project (MEYS Grant No: LM2015047)
                     including access to computing and storage facilities. For other services provided by ELIXIR's Czech Republic Node visit <a href='https://www.elixir-czech.cz/services' target='_blank'>www.elixir-czech.cz/services</a>.
                </div>

                <ScrollButton scrollStepInPx='50' delayInMs='10' />
            </div>;
        }
    }
}