import React from "react";
import { Residues } from "../CommonUtils/Residues";
import { SelectionHelper } from "../CommonUtils/Selection";
import { DGNoDataInfoRow, DGRowEmpty, DGElementRow } from "../Datagrid/Components";
import { AnnotationDataProvider, ResidueAnnotation } from "../AnnotationDataProvider";
import { Context } from "../Context";
import { QueryParam } from "../VizualizerMol/helpers";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";

let DGTABLE_COLS_COUNT = 2;
let NO_DATA_MESSAGE = "Select channel in 3D view for details...";

declare function $(p:any): any;
declare function datagridOnResize(str:string,str1:string,str2:string):any;

interface State{
    data: string[] | null,
    app: LiningResidues,
    isWaitingForData: boolean
};

export class LiningResidues extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this,
        isWaitingForData: false
    };

    layerIdx = -1;

    componentDidMount() {
        SelectionHelper.attachOnChannelSelectHandler((data)=>{
            if(data===null){
                return;
            }

            let state = this.state;
            state.data = Residues.sort(data.ResidueFlow,void 0, true, false);
            this.setState(state);

            setTimeout(function(){
                $( window ).trigger('contentResize');
            },1);
        });
    }

    private dataWaitHandler(){
        let state = this.state;
        state.isWaitingForData = false;
        this.setState(state);
    }

    public invokeDataWait(){
        if(this.state.isWaitingForData){
            return;
        }

        let state = this.state;
        state.isWaitingForData = true;
        this.setState(state);
        AnnotationDataProvider.subscribeForData(this.dataWaitHandler.bind(this));
    }

    componentWillUnmount(){
    }

    render() {
        if (this.state.data !== null) {
            return(
                <div>
                    <DGTable {...this.state} />
                    <Controls {...this.state} />
                </div>
                );
        } 
        
        return <div>
                    <DGNoData {...this.state} />
                </div>
    }
}  
function residueStringToResidueLight(residue:string, focus: boolean):QueryParam{
    let residueParts = residue.split(" ");
    let rv = {
        struct_asym_id: residueParts[2],
        start_auth_residue_number: Number(residueParts[1]),
        end_auth_residue_number: Number(residueParts[1]),
        color:{r:255,g:0,b:255},
        sideChain: true,
        focus
    }

    return rv;
}

class Controls extends React.Component<State,{}>{

    clearSelection(){
        this.props.app.props.controller.visual.clearSelection();
        SelectionHelper.updateSelectionLabel("");
    }

    async selectAll(){
        let residues: QueryParam[] = [];
        if(this.props.app.state.data === null){
            return;
        }

        for(let residue of this.props.app.state.data){
            residues.push(residueStringToResidueLight(residue, false));
        }

        await this.props.app.props.controller.visual.select({data: residues}).then(() => {
            PluginCommands.Camera.Reset(this.props.app.props.controller.plugin, {});
        });
        SelectionHelper.updateSelectionLabel(this.props.app.state.data);
    }

    render(){
        return <div className="lining-residues select-controls">
            <span className="btn-xs btn-default bt-all hand" onClick={this.selectAll.bind(this)}>Select all</span>
            <span className="btn-xs btn-default bt-none hand" onClick={this.clearSelection.bind(this)}>Clear selection</span>
        </div>
    }
}

class DGNoData extends React.Component<State,{}>{
    render(){
        return (<div className="datagrid" id="dg-lining-residues">
                    <div className="header">
                        <DGHead {...this.props}/>			
                    </div>
                    <div className="body">
                        <table>
                            <DGNoDataInfoRow columnsCount={DGTABLE_COLS_COUNT} infoText={NO_DATA_MESSAGE}/>
                            <DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>
                        </table>
                    </div>
                </div>);
    }
}

class DGTable extends React.Component<State,{}>{
    render(){
        return (<div className="datagrid" id="dg-lining-residues">
                    <div className="header">
                        <DGHead {...this.props}/>			
                    </div>
                    <div className="body">
                        <DGBody {...this.props} />
                    </div>
                </div>);
    }
}

class DGHead extends React.Component<State,{}>{
    render(){
        return(
            <table>
                <tr>
                    <th title="Residue" className="col col-1">
                        Residue
                    </th>
                    <th title="Annotation" className="col col-2">
                        Annotation
                    </th>                             
                </tr>
            </table>
        );
    };
}

class DGBody extends React.Component<State,{}>{ 

        private generateLink(annotation:ResidueAnnotation){
        if(annotation.reference===""){
            return (annotation.text!== void 0 && annotation.text !== null)?<span>{annotation.text}</span>:<span className="no-annotation"/>;
        }
        return <a target="_blank" href={annotation.link} dangerouslySetInnerHTML={{__html:annotation.text}}></a>
    }    

    private shortenBackbone(residue:string){
        return residue.replace(/Backbone/g,'');
    }

    private isBackbone(residue:string){
        return residue.indexOf("Backbone") >= 0;
    }

    private async selectResidue(residue:string){
        let residueLightEntity = residueStringToResidueLight(residue, true);
        await this.props.app.props.controller.visual.select({data: [residueLightEntity], forceClear: true});
        if (this.isBackbone(residue)) {
            residue = residue.split(" ").splice(0, 3).join(" ");
        }
        SelectionHelper.updateSelectionLabel(residue);
    }

    private getSelect3DLink(residue:string){           
        let residueEl = (this.isBackbone(residue))?<i><strong>{this.shortenBackbone(residue)}</strong></i>:<span>{residue}</span>;
        return <a className="hand" onClick={(e)=>{this.selectResidue(residue)}}>{residueEl}</a>
    }

    private generateSpannedRows(residue:string, annotations: ResidueAnnotation[]){
        let trs:JSX.Element[] = [];

        let residueNameEl = this.getSelect3DLink(residue);//(this.isBackbone(residue))?<i><strong>{this.shortenBackbone(residue)}</strong></i>:<span>{residue}</span>;

        let first = true;
        for(let annotation of annotations){
            if(first === true){
                first = false;
                trs.push(
                    <tr title={(this.isBackbone(residue)?residue:"")} className={(this.isBackbone(residue)?"help":"")}>
                        <td className={`col col-1`} rowSpan={(annotations.length>1)?annotations.length:void 0}>
                            {residueNameEl}
                        </td>    
                        <td className={`col col-2`} >
                            {this.generateLink(annotation)}
                        </td>
                    </tr>
                );
            }
            else{
                trs.push(
                    <tr>    
                        <td className={`col col-2`} >
                            {this.generateLink(annotation)}
                        </td>
                    </tr>
                ); 
            }
        }
        return trs;
    }

    private generateRows(){
        if(this.props.data === null){
            return <DGNoDataInfoRow columnsCount={DGTABLE_COLS_COUNT} infoText={NO_DATA_MESSAGE}/>;
        }

        let rows:JSX.Element[] = [];
        
        for(let residue of this.props.data){
            let residueId = residue.split(" ").slice(1,3).join(" ");
            
            let annotation;
            let annotationText = "";
            let annotationSource = "";

            annotation = AnnotationDataProvider.getResidueAnnotations(residueId);
            //let residueNameEl = (this.isBackbone(residue))?<i><strong>{this.shortenBackbone(residue)}</strong></i>:<span>{residue}</span>;
            if(annotation === void 0){
                this.props.app.invokeDataWait();
                rows.push(
                    <DGElementRow columns={[this.getSelect3DLink(residue),<span>Annotation data still loading...</span>]} title={[(this.isBackbone(residue)?residue:""),""]} trClass={(this.isBackbone(residue)?"help":"")} />
                );
            }
            else if(annotation !== null && annotation.length>0){
                rows = rows.concat(
                    this.generateSpannedRows(residue,annotation)
                );
            }
            else{
                rows.push(
                    <DGElementRow columns={[this.getSelect3DLink(residue),<span/>]} title={[(this.isBackbone(residue)?residue:""),(this.isBackbone(residue)?residue:"")]} trClass={(this.isBackbone(residue)?"help":"")} />
                );
            }
        }            
        rows.push(<DGRowEmpty columnsCount={DGTABLE_COLS_COUNT} />);

        return rows;
    }

    private generateRows_old(){
        if(this.props.data === null){
            return <DGNoDataInfoRow columnsCount={DGTABLE_COLS_COUNT} infoText={NO_DATA_MESSAGE}/>;
        }

        let rows:JSX.Element[] = [];
        
        for(let residue of this.props.data){
            let residueId = residue.split(" ").slice(1,3).join(" ");

            
            rows.push(
                <DGElementRow columns={[this.getSelect3DLink(residue)]} title={[(this.isBackbone(residue)?residue:"")]} trClass={(this.isBackbone(residue)?"help":"")} />
            );
        }            
        rows.push(<DGRowEmpty columnsCount={DGTABLE_COLS_COUNT} />);

        return rows;
    }

    render(){
        let rows = this.generateRows();
        
        return(
            <table>
                {rows}
            </table>
        );
    };
}

export default LiningResidues;