import React from "react";
import { DGElementRow, DGRowEmpty, DGNoDataInfoRow } from "../Datagrid/Components";
import { Numbers } from "../CommonUtils/Numbers";
import { SelectionHelper } from "../CommonUtils/Selection";
import { LayersInfo } from "../DataInterface";
import { Context } from "../Context";

let DGTABLE_COLS_COUNT = 2;
let NO_DATA_MESSAGE = "Hover over channel(2D) for details...";

declare function $(p:any): any;
declare function datagridOnResize(str:string):any;

interface State{
    data: LayersInfo[] | null,
    app: LayerProperties,
    layerIdx: number
};

export class LayerProperties extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this,
        layerIdx: -1
    };

    layerIdx = -1;

    componentDidMount() {
        $( window ).on('layerTriggered', this.layerTriggerHandler.bind(this));
    }

    private layerTriggerHandler(event:any,layerIdx:number){

        this.layerIdx = layerIdx;

        let data = SelectionHelper.getSelectedChannelData();

        let state = this.state;
        if(data!==null){
            state.layerIdx = layerIdx;
            state.data = data.LayersInfo
            this.setState(state);
        }
        else{
            state.layerIdx = layerIdx;
            this.setState(state);
        }

        setTimeout(function(){
            $( window ).trigger('contentResize');
        },1);
    }

    componentWillUnmount(){
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
        return (<div className="datagrid" id="dg-layer-properties">
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
        return (<div className="datagrid" id="dg-layer-properties">
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
                    <th title="Property" className="col col-1">
                        Property
                    </th>
                    <th title="Value" className="col col-2">
                        Value
                    </th>                     
                </tr>
            </table>
        );
    };
}

class DGBody extends React.Component<State,{}>{        
    private generateRows(){
        if(this.props.data === null){
            return <DGNoDataInfoRow columnsCount={DGTABLE_COLS_COUNT} infoText={NO_DATA_MESSAGE}/>;
        }

        let layerData = this.props.data[this.props.layerIdx].Properties;

        let rows = [];
        
        let charge = `${Numbers.roundToDecimal(layerData.Charge,2).toString()} (+${Numbers.roundToDecimal(layerData.NumPositives,2).toString()}/-${Numbers.roundToDecimal(layerData.NumNegatives,2).toString()})`;
        let minRadius = this.props.data[this.props.layerIdx].LayerGeometry.MinRadius;
        
        rows.push(
                <DGElementRow columns={[<span><span className="glyphicon glyphicon-tint properties-icon" />{"Hydropathy"}</span>,<span>{Numbers.roundToDecimal(layerData.Hydropathy,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="glyphicon glyphicon-plus properties-icon" />{"Polarity"}</span>,<span>{Numbers.roundToDecimal(layerData.Polarity,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="glyphicon glyphicon-tint properties-icon upside-down" />{"Hydrophobicity"}</span>,<span>{Numbers.roundToDecimal(layerData.Hydrophobicity,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="glyphicon glyphicon-scissors properties-icon" />{"Mutability"}</span>,<span>{Numbers.roundToDecimal(layerData.Mutability,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="glyphicon glyphicon-flash properties-icon" />{"Charge"}</span>,<span>{charge}</span>]} />
        );
        rows.push(
                <DGElementRow columns={[<span><span className="icon bottleneck black properties-icon" />{"Radius"}</span>,<span>{Numbers.roundToDecimal(minRadius,1)}</span>]} />
        );
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

export default LayerProperties;