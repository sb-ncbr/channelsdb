import React from "react";
import { DGElementRow, DGRowEmpty, DGNoDataInfoRow, keyedByPosition } from "../Datagrid/Components";
import { SelectionHelper } from "../CommonUtils/Selection";
import { AnnotationDataProvider, ResidueAnnotation } from "../AnnotationDataProvider";
import { LayersInfo } from "../DataInterface";
import { Context } from "../Context";


let DGTABLE_COLS_COUNT = 2;
let NO_DATA_MESSAGE = "Hover over channel(2D) for details...";

import { emit, listen } from "../CommonUtils/Events";

interface State{
    data: LayersInfo[] | null,
    app: LayerResidues,
    layerIdx: number,
};

export class LayerResidues extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this,
        layerIdx: -1,
    };

    layerIdx = -1;

    // Removed when unmounted
    private subscriptions: (() => void)[] = [];

    componentDidMount() {
        this.subscriptions.push(AnnotationDataProvider.subscribeForData(() => this.forceUpdate()));
        this.subscriptions.push(listen('layerTriggered', this.layerTriggerHandler.bind(this)));
    }

    private layerTriggerHandler(layerIdx:number){

        this.layerIdx = layerIdx;

        let data = SelectionHelper.getSelectedChannelData();

        let state = this.state;
        if(data!==null){
            state.layerIdx = layerIdx;
            state.data = data.LayersInfo;
            this.setState(state);
        }
        else{
            state.layerIdx = layerIdx;
            this.setState(state);
        }
        
        setTimeout(function(){
            emit('contentResize');
        },1);
    }

    componentWillUnmount(){
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    }

    render() {
        if (this.state.data !== null && this.state.layerIdx>=0) {
            return(
                <div>
                    <DGTable {...this.state} />
                </div>
                );
        } 
        
        return <div>
                    <DGNoData {...this.state} />
                </div>
    }
}  

class DGNoData extends React.Component<State,{}>{
    render(){
        return (<div className="datagrid" id="dg-layer-residues">
                    <div className="header">
                        <DGHead {...this.props}/>			
                    </div>
                    <div className="body">
                        <table><tbody>
                            <DGNoDataInfoRow columnsCount={DGTABLE_COLS_COUNT} infoText={NO_DATA_MESSAGE}/>
                            <DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>
                        </tbody></table>
                    </div>
                </div>);
    }
}

class DGTable extends React.Component<State,{}>{
    render(){
        return (<div className="datagrid" id="dg-layer-residues">
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
            <table><tbody>
                <tr>
                    <th title="Residue" className="dg-col dg-col-1">
                        Residue
                    </th>
                    <th title="Annotation" className="dg-col dg-col-2">
                        Annotation
                    </th>                             
                </tr>
            </tbody></table>
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

    private generateSpannedRows(residue:string, annotations: ResidueAnnotation[]){
        let trs:JSX.Element[] = [];

        let residueNameEl = (this.isBackbone(residue))?<i><strong>{this.shortenBackbone(residue)}</strong></i>:<span>{residue}</span>;

        let first = true;
        for(let annotation of annotations){
            if(first === true){
                first = false;
                trs.push(
                    <tr>
                        <td title={(this.isBackbone(residue)?residue:"")} className={`dg-col dg-col-1 ${(this.isBackbone(residue)?"help":"")}`} rowSpan={(annotations.length>1)?annotations.length:void 0}>
                            {residueNameEl}
                        </td>    
                        <td className={`dg-col dg-col-2`} >
                            {this.generateLink(annotation)}
                        </td>
                    </tr>
                );
            }
            else{
                trs.push(
                    <tr>    
                        <td className={`dg-col dg-col-2`} >
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

        let layerData = this.props.data[this.props.layerIdx].Residues;
        let rows:JSX.Element[] = [];
        
        for(let residue of layerData){
            let residueId = residue.split(" ").slice(1,3).join(" ");
            
            let annotation;
            let annotationText = "";
            let annotationSource = "";

            annotation = AnnotationDataProvider.getResidueAnnotations(residueId);
            let residueNameEl = (this.isBackbone(residue))?<i><strong>{this.shortenBackbone(residue)}</strong></i>:<span>{residue}</span>;
            if(annotation === void 0){
                rows.push(
                    <DGElementRow columns={[residueNameEl,<span>Annotation data still loading...</span>]} title={[(this.isBackbone(residue)?residue:""),(this.isBackbone(residue)?residue:"")]} trClass={(this.isBackbone(residue)?"help":"")} />
                );
            }
            else if(annotation !== null && annotation.length>0){
                rows = rows.concat(
                    this.generateSpannedRows(residue,annotation)
                );
            }
            else{
                rows.push(
                    <DGElementRow columns={[residueNameEl,<span/>]} title={[(this.isBackbone(residue)?residue:""),(this.isBackbone(residue)?residue:"")]} trClass={(this.isBackbone(residue)?"help":"")} />
                );
            }
        }            
        rows.push(<DGRowEmpty columnsCount={DGTABLE_COLS_COUNT} />);

        return rows;
    }

    render(){
        let rows = keyedByPosition(this.generateRows());
        
        return(
            <table><tbody>
                {rows}
            </tbody></table>
        );
    };
}    


export default LayerResidues;