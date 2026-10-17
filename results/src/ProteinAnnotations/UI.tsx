import { DGNoDataInfoRow, DGRowEmpty, DGRow, DGElementRow } from "../Datagrid/Components";
import { ProteinAnnotation, AnnotationDataProvider, ResidueAnnotation } from "../AnnotationDataProvider";
import { GlobalRouter } from "../SimpleRouter";
import { Context } from "../Context";
import React from "react";

let DGTABLE_COLS_COUNT = 3;

declare function $(p:any): any;
declare function datagridOnResize(str:string,str1:string,str2:string):any;

interface State{
    data: ProteinAnnotation[] | null,
    app: ProteinAnnotations
};

export class ProteinAnnotations extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this
    };

    layerIdx = -1;

    private handleData(){
        let annotations = AnnotationDataProvider.getProteinAnnotations();
        if(annotations !== void 0){
            let state = this.state;
            state.data = annotations;
            this.setState(state);
            setTimeout(function(){
                $( window ).trigger('contentResize');
            },1);
        }
    }

    componentDidMount() {
        if(!AnnotationDataProvider.isDataReady()){
            AnnotationDataProvider.subscribeForData(this.handleData.bind(this));
        }
        else{
            this.handleData();
        }
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
        return (<div className="datagrid" id="dg-protein-annotations">
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
            <table></table>
        );
    };
}

class DGBody extends React.Component<State,{}>{ 
    private generateLink(annotation:ResidueAnnotation){
        if(annotation.reference===""){
            return "";
        }
        return <a target="_blank" href={annotation.link}>{annotation.reference}</a>
    }    
    private generateSpannedRows(residue:string, annotations: ResidueAnnotation[]){
        let trs:JSX.Element[] = [];

        let first = true;
        for(let annotation of annotations){
            if(first === true){
                first = false;
                trs.push(
                    <tr className={(annotation.isLining)?"highlight":""}>
                        <td className={`col col-1`}>
                            {residue}
                        </td>    
                        <td className={`col col-2`} >
                            {annotation.text}
                        </td>    
                        <td className={`col col-3`} >
                            {this.generateLink(annotation)}
                        </td>
                    </tr>
                );
            }
            else{
                trs.push(
                    <tr className={(annotation.isLining)?"highlight":""}>    
                        <td className={`col col-2`} >
                            {annotation.text}
                        </td>    
                        <td className={`col col-3`} >
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

        let annotations = this.props.data;
        let rows:JSX.Element[] = [];
        
        for(let annotation of annotations){
            let noDataText = "No data provided";
            
            rows.push(
                    <DGRow columns={["Name:",annotation.name]} trClass="highlight hl-main"/>
                );

            rows.push(
                    <DGElementRow columns={[<span>UniProt Id:</span>,<a href={annotation.link} target="_blank">{GlobalRouter.getCurrentDB() === 'alphafill' ? annotation.uniProtId.toUpperCase() : annotation.uniProtId}</a>]} />
                );

            rows.push(
                    <DGRow columns={["Function:"]} columnsCount={DGTABLE_COLS_COUNT} trClass="highlight"/>
                );
            rows.push(
                    <DGRow columns={[(annotation.function!==null && annotation.function!=="")?annotation.function:noDataText]} columnsCount={DGTABLE_COLS_COUNT} trClass="justify"/>
                );

            rows.push(
                    <DGRow columns={["Catalytic activity:"]} columnsCount={DGTABLE_COLS_COUNT} trClass="highlight"/>
                );
            if(annotation.catalytics.length==0){
                rows.push(
                        <DGRow columns={["No data provided"]} columnsCount={DGTABLE_COLS_COUNT} />
                    );
            }
            /*
            let catalytics:JSX.Element[] = [];
            for(let entry of annotation.catalytics){
                catalytics.push(<li><span dangerouslySetInnerHTML={{__html:entry}}></span></li>);
            }
            rows.push(
                <DGComponents.DGElementRow columns={[<ul>{catalytics}</ul>]} columnsCount={DGTABLE_COLS_COUNT} trClass="catalytics" />
            );
            */
            for(let entry of annotation.catalytics){
                rows.push(
                        <DGRow columns={[entry]} columnsCount={DGTABLE_COLS_COUNT} forceHtml={true} trClass="catalytics" />
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


export default ProteinAnnotations;