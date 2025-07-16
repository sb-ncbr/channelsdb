/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

namespace ChannelsDB {
    export class Methods extends React.Component<{}, {}> {
        render() {
            let justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };

            let reference = {
                borderLeft: '2px solid #AAA',
                paddingLeft: 6,
            };

            return <div style={{ margin: '60px 0 0 20px' }}>

                <h1 className='text-center'>Methods</h1>

                <div className='row'>
                    <div className='col-md-7'>
                        <h2 className='featurette-heading'>Channels</h2>
                        <p style={justify}>
                            Channels (tunnels and pores) are highly important structural pathways within proteins and other biomacromolecules. Tunnels connect internal spaces of 
                            biomacromolecules with exterior enabling, e.g., substrate/product transport towards enzymes’ active sites, nascent synthetized proteins to leave
                             ribosomal proteosynthetic center via ribosomal exit tunnel, etc. Pores are channels passing through the whole biomacromolecular structure, typically
                             facilitating transport of ions or molecules through cellular biomembranes.                    
                        </p>
                        <p style={justify}>
                            Channel walls are made from surrounding amino acids making up for a specific micro-environment (see e.g. <a href='https://dx.doi.org/10.1186/s12859-014-0379-x' target='_blank' >Pravda and Berka et al.</a>),
                            which influence to a great extent specificity and selectivity of plethora biologically important processes. Their constitution is especially important in channel's
                            constriction sites such as local minima and bottlenecks, which can function as gatekeepers.
                        </p>
                        <p style={justify}>
                            In the database a channel is represented by its centerline (3D natural spline of a given volume), physicochemical properties and lining residues. Channel volume
                            is formed by the distance to the closest protein atom and decomposed into discrete regions called layers. Each layer is defined by the residues lining it.
                            A new layer starts whenever there is a change in residues lining it along its length. Their size and composition is in turn used for estimating channel's 
                            physicochemical properties. These are especially important for local minima and a bottleneck (the narrowest part of the channel).
                        </p>
                        <p style={reference}><small><a href='https://dx.doi.org/10.1186/s12859-014-0379-x' target='_blank' >
                          Pravda,L. and Berka,K. et al. <i>Anatomy of enzyme channels</i>. BMC Bioinformatics, 15, 379. (2014)</a></small></p>
                    </div>
                    <div className='col-md-5'>
                        <img style={{margin: '60px 0'}} className='featurette-image img-responsive center-block' src={'assets/img/channel_detail.png'} width='500' height='500' alt='Channel details' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />

                <div className='row featurette'>
                    <h2 className='featurette-heading'>MOLE</h2>
                    <div className='col-md-7 col-md-push-5'>
                        <p style={justify}>MOLE is a software tool used for channel identification throughout the ChannelsDB. First, the algorithm calculates Delaunay triangulation/Voronoi diagram of the atomic centers
                            (see step (1) in the figure). Next, regions suitable for channel identification are calculated using a set of predefined parameters (2,3). Channel starting and end points
                            are identified in these cavity diagrams (4,5) and the most favourable channels are identified among a set of starting points and ending points (6). 
                        </p> 
                        <p style={justify}>
                            Once the channels have been identified a unique set of residues surrounding channel volume is retrieved. Given this set of residues, a physicochemical properties such as Hydropathy
                            are computed for each channel and its parts. Individual steps of the algorithm are highlighted at the picture below  and more details on the channel identification can be found
                            in the respective <a href='https://dx.doi.org/10.1186/1758-2946-5-39' target='_blank'>paper</a>. Finally, user structures can be analysed using the <a href='https://moleonline.cz' target='_blank'>
                            online</a> as well as the <a href='https://webchem.ncbr.muni.cz/Platform/App/Mole' target='_blank'>command-line</a> version of MOLE.
                        </p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1186/1758-2946-5-39'>
                                Sehnal,D., et al. <span style={{ fontStyle: 'italic' }}>MOLE 2.0: advanced approach for analysis of biomacromolecular channels.</span>
                                 J. Cheminform., 5, 39. (2013)</a></small></p>  
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1093/nar/gks363'>
                        Berka,K. et al. <i>MOLEonline 2.0: interactive web-based analysis of biomacromolecular channels</i>.
                        Nucleic Acids Res., 40, W222-7. (2012)</a></small></p>
                    </div>
                     <div className='col-md-5 col-md-pull-7'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/alg_outline.jpg'} width='500' height='500' alt='Channel details' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />

                <div className='row featurette'>
                    <h2 className='featurette-heading'>CAVER</h2>
                    <div className='col-md-7 col-md-push-5'>
                        <p style={justify}>CAVER is a software tool for the detection of tunnels and channels in the protein structures and their ensembles. In the first step, the Voronoi diagram representation
                         of the molecule (A) is constructed and the cost for each Voronoi edge is calculated with respect to its width (B). In the second step, too narrow edges are filtered out and the Djikstra’s 
                         algorithm is used to find all shortest paths to the protein surface (C). In the third step, the tunnels are clustered and too similar tunnels are removed. In the last step, the characteristics 
                         like length and throughput are calculated for all tunnels and their spherical representation is saved (D). CAVER is available as an <a href="https://loschmidt.chemi.muni.cz/caverweb/" target="_blank">online </a>
                         tool, as a <a href="https://caver.cz/" target="_blank">command-line </a>program, analytical <a href="https://caver.cz/index.php?sid=199" target="_blank">software suite </a>
                         CAVER Analyst, or as a PyMOL <a href="https://pymolwiki.org/index.php/Caver3" target="_blank">plugin. </a>
                        </p> 
                        <p style={reference}><small><a target='_blank' href='https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3475669/'>
                        Chovancova E, Pavelka A, Benes P, Strnad O, Brezovsky J, Kozlikova B, Gora A, Sustr V, Klvana M, Medek P, Biedermannova L, Sochor J, Damborsky J. 
                        <span style={{ fontStyle: 'italic' }}>CAVER 3.0: a tool for the analysis of transport pathways in dynamic protein structures. PLoS Comput Biol. 
                        2012;8(10):e1002708. doi: 10.1371/journal.pcbi.1002708.
                        </span></a></small></p>  
                    </div>
                     <div className='col-md-5 col-md-pull-7'>
                        <img className='featurette-image img-responsive center-block' src={'assets/img/figure_caver.jpg'} width='500' height='500' alt='Channel details' />
                    </div>
                </div>

                <hr className='featurette-divider' style={{ margin: '50px 0' }} />                

                <div className='row'>
                    <h2 className='featurette-heading'>Physicochemical properties</h2>
                    <p>Altogether with the position and radius of a channel a set of unique residues constituting the channel walls is reported. This set is in turn used for estimation 
                       of a various physicochemical properties.
                    </p>
                </div>
                    <div className='row'>
                        <div className='col-md-6'>
                            <h2 className='featurette-heading'>Hydropathy</h2>
                            <p style={justify}>Hydrophobicity and hydrophilicity are two extremes of a spectrum, commonly referred to as Hydropathy, and relate to the tendency of a molecule to interact
                                with water. Several hydropathy scales have been developed in order to grasp the overall character of proteins or their parts. Kyte-Doolittle scale is a widely applied
                                 measure for expressing the hydrophobicity of amino acids residues. Regions with values above 0 are considered hydrophobic in character.</p>
                                 <p>The scale is symmetrical in interval from -4.5 (Arg) to 4.5 (Ile).</p>
                            <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1016/0022-2836(82)90515-0'>
                                Kyte, J. &amp; Doolittle, R. F. <span style={{ fontStyle: 'italic' }}>A simple method for displaying the hydropathic character of a protein.</span>
                                 J. Mol. Biol. 157, 105–132 (1982)</a></small></p>  
                        </div>
                        <div className='col-md-6'>
                            <h2 className='featurette-heading'>Polarity</h2>
                                <p style={justify}>Polarity is the property of a molecule given by the separation of electric charge, leading to the molecule having electric poles.
                                    Generally speaking, polar molecules are hydrophilic, while non polar molecules are usually hydrophobic, but there can be exceptions. In the
                                    terms of amino acids residues, hydrophilic/polar and hydrophobic/non polar can be considered as synonyms.</p>
                                    <p>The scale ranges from 0 for small aliphatic amino acids (Ala, Gly) to 51.6 (His).</p>
                                <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1016/0022-5193(68)90069-6'>
                                    Zimmerman, J. M., Eliezer, N. &amph; Simha, R <span style={{ fontStyle: 'italic' }}>The characterization of amino acid sequences in proteins by statistical methods.</span>
                                    J. Theor. Biol. 21, 170–201 (1968).</a></small></p>  
                        </div>                      
                    </div>                              
                <div className='row'>
                    <div className='col-md-6'>
                        <h2 className='featurette-heading'>Mutability</h2>
                        <p style={justify}>Relative mutability quantifies the tendency of an amino acid to be substituted (mutated) in a protein structure. Substitution by similar amino
                             acids generally retains protein function, while substitution by amino acids with different properties may affect the protein structure or function. Relative
                             mutability is high for easily substitutable amino acids, such as small polar residues and low for amino acids which play a significant role in protein structure,
                             i.e. substrate binding or catalytic activity. Alanine has a normalized value of 100.</p>
                        <p style={reference}><small><a target='_blank' href='https://dx.doi.org/10.1093/bioinformatics/8.3.275'>
                            Jones, D. T., Taylor, W. R. &amph; Thornton, J. M. <span style={{ fontStyle: 'italic' }}>The rapid generation of mutation data matrices from protein sequences.</span>
                            Bioinformatics 8, 275–282 (1992)</a></small></p>  
                    </div>
                    <div className='col-md-6'>
                        <h2 className='featurette-heading'>Charge</h2>
                            <p style={justify}>Some amino acids can be (de)protonated based on the pH and, therefore, charged. At physiological pH, lysine and arginine are positively
                                charged, whereas aspartic and glutamic acids are negatively charged. On the other hand, the protonation state of histidine is dependent on its 
                                micro-environment. In this study, all histidines are treated as positively charged.</p>
                                <p>Charge property is a sum of all positively and negatively charged amino acids.</p>
                    </div>
                    <div style={{ marginTop: 30 }} className='row table-responsive col-md-8 col-md-offset-2'>
                        <table className='table table-condensed active'>
                            <thead>
                            <tr>
                                <th>Residue</th>
                                <th>Charge</th>
                                <th>Hydropathy</th>
                                <th>Polarity</th>
                                <th>Mutability</th>
                            </tr>
                            </thead>
                            <tbody>
                                <tr><td>Ala</td><td>0</td><td>1.8</td><td>0</td><td>100</td></tr>
                                <tr><td>Arg</td><td>1</td><td>-4.5</td><td>52</td><td>83</td></tr>                         
                                <tr><td>Asn</td><td>0</td><td>-3.5</td><td>3.38</td><td>104</td></tr>
                                <tr><td>Asp</td><td>-1</td><td>-3.5</td><td>49.7</td><td>86</td></tr>                         
                                <tr><td>Cys</td><td>0</td><td>2.5</td><td>1.48</td><td>44</td></tr>
                                <tr><td>Glu</td><td>-1</td><td>-3.5</td><td>49.9</td><td>77</td></tr>
                                <tr><td>Gln</td><td>0</td><td>-3.5</td><td>3.53</td><td>84</td></tr>
                                <tr><td>Gly</td><td>0</td><td>-0.4</td><td>0</td><td>50</td></tr>
                                <tr><td>His</td><td>0</td><td>-3.2</td><td>51.6</td><td>91</td></tr>
                                <tr><td>Ile</td><td>0</td><td>4.5</td><td>0.13</td><td>103</td></tr>
                                <tr><td>Leu</td><td>0</td><td>3.8</td><td>0.13</td><td>54</td></tr>
                                <tr><td>Lys</td><td>1</td><td>-3.9</td><td>49.5</td><td>72</td></tr>
                                <tr><td>Met</td><td>0</td><td>1.9</td><td>1.43</td><td>93</td></tr>
                                <tr><td>Phe</td><td>0</td><td>2.8</td><td>0.35</td><td>51</td></tr>
                                <tr><td>Pro</td><td>0</td><td>-1.6</td><td>1.58</td><td>58</td></tr>
                                <tr><td>Ser</td><td>0</td><td>-0.8</td><td>1.67</td><td>117</td></tr>
                                <tr><td>Thr</td><td>0</td><td>-0.7</td><td>1.66</td><td>107</td></tr>
                                <tr><td>Trp</td><td>0</td><td>-0.9</td><td>2.1</td><td>25</td></tr>
                                <tr><td>Tyr</td><td>0</td><td>-1.3</td><td>1.61</td><td>50</td></tr>
                                <tr><td>Val</td><td>0</td><td>4.2</td><td>0.13</td><td>98</td></tr>
                            </tbody>                        
                        </table>      
                     </div>              
                </div>    
                <ScrollButton scrollStepInPx='50' delayInMs='10'/>                                          
            </div>;
        }
    }
}