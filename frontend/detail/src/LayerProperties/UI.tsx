import React from "react";
import { DGElementRow, DGRowEmpty, DGNoDataInfoRow, keyedByPosition } from "../Datagrid/Components";
import { Numbers } from "../CommonUtils/Numbers";
import { SelectionHelper } from "../CommonUtils/Selection";
import { LayersInfo } from "../DataInterface";
import { Context } from "../Context";

let DGTABLE_COLS_COUNT = 2;
let NO_DATA_MESSAGE = "Hover over channel(2D) for details...";

import { emit, listen } from "../CommonUtils/Events";

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
        listen('layerTriggered', this.layerTriggerHandler.bind(this));
    }

    private layerTriggerHandler(layerIdx:number){

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
            emit('contentResize');
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
            <table><tbody>
                <tr>
                    <th title="Property" className="dg-col dg-col-1">
                        Property
                    </th>
                    <th title="Value" className="dg-col dg-col-2">
                        Value
                    </th>                     
                </tr>
            </tbody></table>
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
                <DGElementRow columns={[<span><span className="bi bi-droplet-fill properties-icon" />{"Hydropathy"}</span>,<span>{Numbers.roundToDecimal(layerData.Hydropathy,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="bi bi-plus-lg properties-icon" />{"Polarity"}</span>,<span>{Numbers.roundToDecimal(layerData.Polarity,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="bi bi-droplet-fill properties-icon upside-down" />{"Hydrophobicity"}</span>,<span>{Numbers.roundToDecimal(layerData.Hydrophobicity,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="bi bi-scissors properties-icon" />{"Mutability"}</span>,<span>{Numbers.roundToDecimal(layerData.Mutability,2).toString()}</span>]} />
            );
        rows.push(
                <DGElementRow columns={[<span><span className="bi bi-lightning-fill properties-icon" />{"Charge"}</span>,<span>{charge}</span>]} />
        );
        rows.push(
                <DGElementRow columns={[<span><span className="icon bottleneck black properties-icon" />{"Radius"}</span>,<span>{Numbers.roundToDecimal(minRadius,1)}</span>]} />
        );
        rows.push(<DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>);

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
    
class DGRow extends React.Component<{columns: string[]},{}>{
    
    private generateRow(columns: string[]){
        let tds = [];
        for(let i=0;i<columns.length;i++){
            tds.push(
                <td key={tds.length} className={`dg-col dg-col-${i+1}`}>
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