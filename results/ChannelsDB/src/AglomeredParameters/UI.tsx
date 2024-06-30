import React from "react";
import { Tunnels } from "../CommonUtils/Tunnels";
import { Numbers } from "../CommonUtils/Numbers";
import { getMessageOrLeaveText } from "../CommonUtils/Tooltips";
import { DGRowEmpty } from "../Datagrid/Components";
import { AnnotationDataProvider } from "../AnnotationDataProvider";
import { Tunnel, ChannelsDBData } from "../DataInterface";
import { Context } from "../Context";
import { SimpleObservable } from "../CommonUtils/Observable";

let DGTABLE_COLS_COUNT = 7;

declare function $(p:any): any;
declare function datagridOnResize(str:string):any;

interface State{
    data: Tunnel[] | null,
    app: AglomeredParameters,
    isWaitingForData: boolean
};

export class AglomeredParameters extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this,
        isWaitingForData: false
    };

    componentDidMount() {
        const checkDataAvailability = () => {
            return this.props.controller.data as ChannelsDBData;
        };
    
        const onDataLoaded = (data: ChannelsDBData) => {
            if (data) {
                let toShow: Tunnel[] = [];
                toShow = toShow.concat(data.Channels.CSATunnels_MOLE);
                toShow = toShow.concat(data.Channels.CSATunnels_Caver);
                toShow = toShow.concat(data.Channels.ReviewedChannels_MOLE);
                toShow = toShow.concat(data.Channels.ReviewedChannels_Caver);
                toShow = toShow.concat(data.Channels.CofactorTunnels_MOLE);
                toShow = toShow.concat(data.Channels.CofactorTunnels_Caver);
                toShow = toShow.concat(data.Channels.TransmembranePores_MOLE);
                toShow = toShow.concat(data.Channels.TransmembranePores_Caver);
                toShow = toShow.concat(data.Channels.ProcognateTunnels_MOLE);
                toShow = toShow.concat(data.Channels.ProcognateTunnels_Caver);
                toShow = toShow.concat(data.Channels.AlphaFillTunnels_MOLE);
                toShow = toShow.concat(data.Channels.AlphaFillTunnels_Caver);
    
                this.setState({ data: toShow });
            }
        };
    
        const simpleObservable = new SimpleObservable(checkDataAvailability, onDataLoaded);
        simpleObservable.subscribe();
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
        $('.init-agp-tooltip').tooltip({container:'body'});
        return(
            <div>
                <DGTable {...this.state} />
            </div>
            );
    }
}  

class DGTable extends React.Component<State,{}>{
    render(){
        return (<div className="datagrid" id="dg-aglomered-parameters">
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
                    <th title="Name" className="col col-1 ATable-header-identifier init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        Name
                    </th>
                    <th title={getMessageOrLeaveText("tooltip-Length")} className="col col-2 ATable-header-length init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        <span className="glyphicon glyphicon-resize-horizontal" /> <span className="ATable-label">Length</span>
                    </th>
                    <th title={getMessageOrLeaveText("tooltip-Bottleneck")} className="col col-3 ATable-header-bottleneck init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        <span className="icon bottleneck" /> <span className="ATable-label">Bottleneck</span>
                    </th>
                    <th title={getMessageOrLeaveText("tooltip-agl-Hydropathy")} className="col col-4 ATable-header-hydropathy init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        <span className="glyphicon glyphicon-tint" /> <span className="ATable-label">Hydropathy</span>
                    </th>
                    <th title="Charge" className="col col-5 ATable-header-charge init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        <span className="glyphicon glyphicon-flash" /> <span className="ATable-label">Charge</span>
                    </th>
                    <th title={getMessageOrLeaveText("tooltip-agl-Polarity")} className="col col-6 ATable-header-polarity init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        <span className="glyphicon glyphicon-plus" /> <span className="ATable-label">Polarity</span>
                    </th>
                    <th title={getMessageOrLeaveText("tooltip-agl-Mutability")} className="col col-7 ATable-header-mutability init-agp-tooltip" data-toggle="tooltip" data-placement="bottom">
                        <span className="glyphicon glyphicon-scissors" /> <span className="ATable-label">Mutability</span>
                    </th>                     
                </tr>
            </table>
        );
    };
}

class DGBody extends React.Component<State,{}>{
    
    private generateMockData(){
        if(this.props.data === null){
            return <tr><td colSpan={DGTABLE_COLS_COUNT} >There are no data to be displayed...</td></tr>;
        }

        let rows = [];

        for(let tunnel of this.props.data){
            rows.push(
                <DGRow tunnel={tunnel} app={this.props.app} />
            );
        }

        if(rows.length===0){
            return rows;
        }

        for(let i=rows.length;i<100;i++){
            rows.push(rows[0]);
        }            

        rows.push(<DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>);

        return rows;
    }
    
    private generateRows(){
        if(this.props.data === null || this.props.data.length == 0){
            return [
                <tr><td colSpan={DGTABLE_COLS_COUNT} >There are no data to be displayed...</td></tr>,
                <DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>
            ]
        }

        let rows = [];

        for(let tunnel of this.props.data){
            rows.push(
                <DGRow tunnel={tunnel} app={this.props.app}/>
            );
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
    
class DGRow extends React.Component<{tunnel: Tunnel, app: AglomeredParameters},{}>{
    
    render(){
        let tunnelID = this.props.tunnel.Type;
        let annotation = AnnotationDataProvider.getChannelAnnotation(this.props.tunnel.Id);
        if(annotation!== void 0 && annotation !== null){
            tunnelID = annotation.text;
        }

        if(annotation === void 0){
            this.props.app.invokeDataWait();
        }
        return (
                <tr>
                    <td className="col col-1">
                        {tunnelID}
                    </td>
                    <td className="col col-2">
                        {Tunnels.getLength(this.props.tunnel)} Å
                    </td>
                    <td className="col col-3">
                        {Tunnels.getBottleneck(this.props.tunnel)} Å
                    </td>
                    <td className="col col-4">
                        {Numbers.roundToDecimal(this.props.tunnel.Properties.Hydropathy,2)}
                    </td>
                    <td className="col col-5">
                        {Numbers.roundToDecimal(this.props.tunnel.Properties.Charge,2)}
                    </td>
                    <td className="col col-6">
                        {Numbers.roundToDecimal(this.props.tunnel.Properties.Polarity,2)}
                    </td>
                    <td className="col col-7">
                        {Numbers.roundToDecimal(this.props.tunnel.Properties.Mutability,2)}
                    </td>                     
                </tr>);
    }
}

export default AglomeredParameters;