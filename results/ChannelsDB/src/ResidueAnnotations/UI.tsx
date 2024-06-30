import React from "react";
import { Residues } from "../CommonUtils/Residues";
import { DGNoDataInfoRow, DGRowEmpty, DGElementRow } from "../Datagrid/Components";
import { AnnotationDataProvider, ResidueAnnotation } from "../AnnotationDataProvider";
import { Context } from "../Context";

let DGTABLE_COLS_COUNT = 2;

declare function $(p:any): any;
declare function datagridOnResize(str:string,str1:string,str2:string):any;

interface State{
    data: string[] | null,
    app: ResidueAnnotations,
    isWaitingForData: boolean
};

export class ResidueAnnotations extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this,
        isWaitingForData: false
    };

    layerIdx = -1;

    sortResidues(residues:string[], useAnnotations?:boolean){
        if(useAnnotations===void 0){
            useAnnotations = false;
        }
        if(useAnnotations && (this.state.isWaitingForData || AnnotationDataProvider.getResidueAnnotations(residues[0])===void 0)){
            useAnnotations = false;
        }

        if(residues.length===0){
            return residues;
        }

        interface RType{chain: {authAsymId: string}, authSeqNumber:number};

        let groupFn = (resParsed:RType[])=>{
            let lining:RType[] = [];
            let other:RType[] = [];

            if(useAnnotations){
                for(let r of resParsed){
                    let annotation = AnnotationDataProvider.getResidueAnnotations(`${r.authSeqNumber} ${r.chain.authAsymId}`);
                    
                    //annotation data not ready
                    if(annotation===void 0){
                        other = resParsed;
                        lining = [];
                        break;
                    }
                    
                    //annotation data available
                    if(annotation.length!==0){
                        let isLining = false;
                        for(let a of annotation){
                            if(a.isLining===true){
                                lining.push(r);
                                isLining = true;
                                break;
                            }
                        }

                        if(!isLining){
                            other.push(r);   
                        }
                    }     
                    else{  //no annotation data available
                        other.push(r);
                    }
                }
            }
            else{
                other = resParsed;
            }

            return [lining, other];
        }

        return Residues.sort(residues, groupFn);
    }

    componentDidMount() {
        let list = AnnotationDataProvider.getResidueList();
        if(list !== void 0){
            let state = this.state;
            state.data = this.sortResidues(list);
            this.setState(state);
        }else{
            AnnotationDataProvider.subscribeForData((()=>{
                let list = AnnotationDataProvider.getResidueList();
                if(list === void 0){
                    return;
                }
                let s = this.state;
                s.data = this.sortResidues(list, true);
                this.setState(s);
                setTimeout(function(){
                    $( window ).trigger('contentResize');
                },1);
            }).bind(this))
        }
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

    public async selectResiude(residueId:string){
        let residueParts = residueId.split(" ").slice(0,2);
        let residue = {chain: {authAsymId: residueParts[1]}, authSeqNumber: Number(residueParts[0])};
        await this.props.controller.visual.select({ data: [{
            struct_asym_id: residue.chain.authAsymId, 
            start_auth_residue_number: residue.authSeqNumber, 
            end_auth_residue_number: residue.authSeqNumber, 
            color:{r:255,g:0,b:255},
            sideChain: true,
            focus: true
          }] })
    }

    componentWillUnmount(){
    }

    render() {
        return(
            <div>
                <DGTable {...this.state} />
            </div>
            ); 
    }
}  

class DGTable extends React.Component<State,{}>{
    render(){
        return (<div className="datagrid" id="dg-residue-annotations">
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
            return (annotation.text!== void 0 && annotation.text !== null)?<span dangerouslySetInnerHTML={{__html:annotation.text}}></span>:<span className="no-annotation"/>;
        }
        return <a target="_blank" href={annotation.link} dangerouslySetInnerHTML={{__html:annotation.text}}></a>
    }   

    private generateSpannedRows(residue:string, annotations: ResidueAnnotation[]){
        let trs:JSX.Element[] = [];

        let first = true;
        for(let annotation of annotations){ 
            if(first === true){
                first = false;
                trs.push(
                    <tr className={(annotation.isLining)?"highlight":""}>
                        <td rowSpan={(annotations.length>1)?annotations.length:void 0} className={`col col-1`}>
                            <a className="hand" onClick={()=>{this.props.app.selectResiude(residue)}}>{residue}</a>
                        </td>  
                        <td className={`col col-2`} >
                            {this.generateLink(annotation)}
                        </td>
                    </tr>
                );
            }
            else{
                trs.push(
                    <tr className={(annotation.isLining)?"highlight":""}>       
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
        if(this.props.data === null || this.props.data.length == 0){
            return [
                <tr><td colSpan={DGTABLE_COLS_COUNT} >There are no data to be displayed...</td></tr>,
                <DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>
            ]
        }

        let residues = this.props.data;
        let rows:JSX.Element[] = [];
        
        for(let residueId of residues){
            let annotation;
            let annotationText = "";
            let annotationSource = "";

            annotation = AnnotationDataProvider.getResidueAnnotations(residueId);
            if(annotation === void 0){
                this.props.app.invokeDataWait();
                rows.push(
                    <DGElementRow columns={[<a className="hand" onClick={()=>{this.props.app.selectResiude(residueId)}}>{residueId}</a>,<span>Annotation data still loading...</span>]} />
                );
            }
            else if(annotation !== null && annotation.length>0){
                rows = rows.concat(
                    this.generateSpannedRows(residueId,annotation)
                );
            }
            else{
                rows.push(
                    <DGElementRow columns={[<a className="hand" onClick={()=>{this.props.app.selectResiude(residueId)}}>{residueId}</a>,<span/>,<span/>]} />
                );
            }
        }
        
        rows.push(<DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>);

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

class DGRow extends React.Component<{columns: string[]},{}>{
    
    private generateRow(columns: string[]){
        let tds = [];
        for(let i=0;i<columns.length;i++){
            tds.push(
                <td className={`col col-${i+1}`}>
                    {columns[i]}
                </td>    
            );
        }

        return tds;
    }

    render(){
        return (
                <tr>
                    {this.generateRow(this.props.columns)}                     
                </tr>);
    }
}

export default ResidueAnnotations;