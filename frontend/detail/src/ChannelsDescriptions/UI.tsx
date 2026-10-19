import React from "react";
import { DGRowEmpty, keyedByPosition } from "../Datagrid/Components";
import { emit } from "../CommonUtils/Events";
import { AnnotationDataProvider } from "../AnnotationDataProvider";
import { Tunnel, ChannelsDBData } from "../DataInterface";
import { Context } from "../Context";

let DGTABLE_COLS_COUNT = 2;


interface State{
    data: Tunnel[] | null,
    app: ChannelsDescriptions,
};

export class ChannelsDescriptions extends React.Component<{controller: Context }, State> {

    state:State = {
        data: null,
        app: this,
    };

    // Removed when unmounted
    private subscriptions: (() => void)[] = [];

    componentDidMount() {
        // The channels are loaded by then, unless their request failed
        this.subscriptions.push(AnnotationDataProvider.subscribeForData(() => this.onDataLoaded(this.props.controller.data)));
    }

    private onDataLoaded(data: ChannelsDBData | undefined) {
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
        } else {
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
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
        return (<div className="datagrid" id="dg-channels-descriptions">
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
                    <th title="Name" className="dg-col dg-col-1">
                        Name
                    </th>
                    <th title="Description" className="dg-col dg-col-2">
                        Description
                    </th>                 
                </tr>
            </tbody></table>
        );
    };
}

class DGBody extends React.Component<State,{}>{

    private generateRows(){
        if(this.props.data === null || this.props.data.length == 0){
            return [
                <tr><td colSpan={DGTABLE_COLS_COUNT} >There are no data to be displayed...</td></tr>,
                <DGRowEmpty columnsCount={DGTABLE_COLS_COUNT}/>
            ]
        }

        let rows = [];

        for(let tunnel of this.props.data){
            let mainAnnotation = AnnotationDataProvider.getChannelAnnotation(tunnel.Id);
            let annotations = AnnotationDataProvider.getChannelAnnotations(tunnel.Id);

            if(annotations !== void 0 && annotations !== null && mainAnnotation !== void 0 && mainAnnotation !== null){
                for(let annotation of annotations){
                    let name = `${mainAnnotation.text} / ${annotation.text}`;
                    if(mainAnnotation.text===annotation.text){
                        name = mainAnnotation.text;
                    }
                    let description = annotation.description;
                    if(description===""){
                        continue;
                    }

                    rows.push(
                        <DGRow tunnelName={name} description={description} channelId={tunnel.Id} app={this.props.app}/>
                    );
                }
            }
        }

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
    
class DGRow extends React.Component<{tunnelName: string, description:string, channelId:string, app: ChannelsDescriptions},{}>{
    private selectChannel(channelId:string){
        emit('channelChosen', channelId);
    }

    render(){
        let name = this.props.tunnelName;
        let description = this.props.description;

        return (
                <tr>
                    <td className="dg-col dg-col-1">
                        <a className="hand" onClick={()=>this.selectChannel(this.props.channelId)}>{name}</a>
                    </td>
                    <td className="dg-col dg-col-2">
                        {description}
                    </td>                  
                </tr>);
    }
}

export default ChannelsDescriptions;