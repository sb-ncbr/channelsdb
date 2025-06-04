/*
* Copyright (c) 2016 - now David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
*/
import React from "react";
import { GlobalRouter } from "./SimpleRouter";
import { showCavityVisuals, showChannelVisuals } from "./State";
import { AnnotationDataProvider, ChannelAnnotation } from "./AnnotationDataProvider";
import { showDefaultVisuals } from "./State";
import { Events } from "./Bridge";
import { SelectionHelper } from "./CommonUtils/Selection";
import { Tunnels } from "./CommonUtils/Tunnels";
import { ChannelsDBData, Tunnel, TunnelMetaInfo } from "./DataInterface";
import { Context } from "./Context";
import { Subscription } from "rxjs"

declare function $(p:any): any;

export class UI extends React.Component<{ plugin: Context }, { isLoading?: boolean, error?: string, data?: any, isWaitingForData?: boolean, apiStatus: number|undefined }> {

    state = { isLoading: false, data: void 0, error: void 0, apiStatus: undefined };

    private currentProteinId:string;
    private subDB:string;

    componentDidMount() {
        this.load();
        $(window).on("contentResize", this.onContentResize.bind(this));
        let globalRouter = GlobalRouter;
        const url = `${globalRouter.getChannelsURL()}/statistics`;
        fetch(url).then(resp => this.setState({apiStatus: resp.status}));
    }

    private onContentResize(_:any){
        let prevState = this.props.plugin.plugin.layout.state;
        this.props.plugin.plugin.layout.setProps({isExpanded:true});
        this.props.plugin.plugin.layout.setProps(prevState);
    }

    async defaultVisualsHandler() {
        const state = this.state;
        if (state.data !== void 0)
            await showDefaultVisuals(this.props.plugin, (state.data as any).Channels as ChannelsDBData, 2);
        this.setState({ isLoading: false });
    }

    load() {
        this.currentProteinId = GlobalRouter.getCurrentPid();
        this.subDB = GlobalRouter.getCurrentDB();
        const channelsURL = GlobalRouter.getChannelsURL();

        this.setState({ isLoading: true, error: void 0 });
        AnnotationDataProvider.subscribeToPluginContext(this.props.plugin);
        this.props.plugin.loadChannelData(channelsURL, this.currentProteinId, this.subDB)
            .then(data => {
                if ((data as any).Error !== void 0){
                    this.setState({ isLoading: false, error: (data as any).Error.detail ? (data as any).Error.detail as string : JSON.stringify((data as any).Error), apiStatus: (data as any).apiStatus });
                } else {
                    this.setState({ data: data });
                    AnnotationDataProvider.subscribeForData(this.defaultVisualsHandler.bind(this));
                }
            })
            .catch(e => {
                console.log(`ERR on loading: ${e}`);
                this.setState({ isLoading: false, error: e.message }); //'Application was unable to load data. Please try again later.'
            })

        this.props.plugin.loadAnnotations(channelsURL, this.currentProteinId, this.subDB)
            .catch(e => {
                console.log(`ERR on loading: ${e}`);
            })
    }

    render() {
        if (this.state.data !== undefined && !this.state.isLoading) {
            return <Data data={this.state.data} plugin={this.props.plugin!} />
        } else {
            let controls = [];
            if (this.state.isLoading) {
                controls.push(<h1>Loading...</h1>);
            } else {
                if (this.state.error) {
                    let error = this.state.error as string|undefined;
                    let errorMessage:string = (error===void 0) ? "" : error;
                    if (this.state.apiStatus) {
                        if (this.state.apiStatus !== 404) {
                            controls.push(
                                <div className="error-message">
                                    <div>
                                        <b>Data for specified protein are not available.</b>
                                    </div>
                                    <div>
                                        <b>Reason:</b> <i dangerouslySetInnerHTML={{__html:errorMessage}}></i>
                                    </div>
                                </div>);
                            controls.push(<button className="reload-data btn btn-primary" onClick={() => this.load()}>Reload Data</button>);
                        } else {
                            controls.push(
                                <div className="error-message">
                                    <div>
                                        <b>Data for specified protein are not available.</b>
                                    </div>
                                    <div>
                                        <i>If you think this protein has tunnels, try to calculate them at <a href="https://mole.upol.cz">MOLEonline</a> or <a href="https://loschmidt.chemi.muni.cz/caverweb/">CaverWeb</a>.</i>
                                    </div>
                                </div>);
                        }
                    } else {
                        controls.push(
                            <div className="error-message">
                                <div>
                                    <b>Data for specified protein are not available.</b>
                                </div>
                                <div>
                                    <b>Reason:</b> <i dangerouslySetInnerHTML={{__html:errorMessage}}></i>
                                </div>
                            </div>);
                        controls.push(<button className="reload-data btn btn-primary" onClick={() => this.load()}>Reload Data</button>);
                    }
                }
            }
            return <div>{controls}</div>;
        }
    }
}

export interface State {
    plugin: Context,

    /**
     * This represents the JSON data returned by MOLE.
     * 
     * In a production environment (when using TypeScript),
     * it would be a good idea to write type interfaces for the
     * data to avoid bugs.
     */
    data: any
}

export class Data extends React.Component<State, { hideAll: boolean}> {
    state = { hideAll: false }

    private toggle(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        this.setState({ hideAll: !this.state.hideAll });
    }

    render() {          
        return <div>
            <Selection {...this.props} />

            <div className="ui-header">
                <div className="channels-header">
                    <span>Channels</span>
                    <button className="btn btn-primary btn-sm bt-none" style={{ marginTop: '0.5em', marginBottom:'0.5em' }} onClick={e => this.toggle(e)}>Hide all</button>
                </div>
            </div>
            <div>
                {this.props.data.Channels.ReviewedChannels_MOLE.length > 0 ? <Channels channels={this.props.data.Channels.ReviewedChannels_MOLE} state={this.props}  header='Reviewed Channels MOLE' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.ReviewedChannels_Caver.length > 0 ? <Channels channels={this.props.data.Channels.ReviewedChannels_Caver} state={this.props}  header='Reviewed Channels CAVER' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.CSATunnels_MOLE.length > 0 ? <Channels channels={this.props.data.Channels.CSATunnels_MOLE} state={this.props}  header='CSA Tunnels MOLE' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.CSATunnels_Caver.length > 0 ? <Channels channels={this.props.data.Channels.CSATunnels_Caver} state={this.props}  header='CSA Tunnels CAVER' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.TransmembranePores_MOLE.length > 0 ? <Channels channels={this.props.data.Channels.TransmembranePores_MOLE} state={this.props}  header='Transmembrane Pores MOLE' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.TransmembranePores_Caver.length > 0 ? <Channels channels={this.props.data.Channels.TransmembranePores_Caver} state={this.props}  header='Transmembrane Pores CAVER' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.CofactorTunnels_MOLE.length > 0 ? <Channels channels={this.props.data.Channels.CofactorTunnels_MOLE} state={this.props}  header='Cofactor Tunnels MOLE' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.CofactorTunnels_Caver.length > 0 ? <Channels channels={this.props.data.Channels.CofactorTunnels_Caver} state={this.props}  header='Cofactor Tunnels CAVER' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.ProcognateTunnels_MOLE.length > 0 ? <Channels channels={this.props.data.Channels.ProcognateTunnels_MOLE} state={this.props}  header='COGNATE Tunnels MOLE' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.ProcognateTunnels_Caver.length > 0 ? <Channels channels={this.props.data.Channels.ProcognateTunnels_Caver} state={this.props}  header='COGNATE Tunnels CAVER' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.AlphaFillTunnels_MOLE.length > 0 ? <Channels channels={this.props.data.Channels.AlphaFillTunnels_MOLE} state={this.props}  header='AlphaFill Tunnels MOLE' hide={this.state.hideAll} /> : null}
                {this.props.data.Channels.AlphaFillTunnels_Caver.length > 0 ? <Channels channels={this.props.data.Channels.AlphaFillTunnels_Caver} state={this.props}  header='AlphaFill Tunnels CAVER' hide={this.state.hideAll} /> : null}
            </div>
        </div>;
        /*
        <h2>Empty Space</h2>
            <Cavities cavities={[this.props.data.Cavities.Surface]} state={this.props} header='Surface' />
            <Cavities cavities={this.props.data.Cavities.Cavities} state={this.props} header='Cavities' />
            <Cavities cavities={this.props.data.Cavities.Voids} state={this.props} header='Voids' />
            
            <h2>Origins</h2>
            <Origins origins={this.props.data.Origins.User} {...this.props} label='User Specifed (optimized)' />
            <Origins origins={this.props.data.Origins.InputOrigins} {...this.props} label='User Specifed' />                
            <Origins origins={this.props.data.Origins.Computed} {...this.props} label='Computed' />
            <Origins origins={this.props.data.Origins.Database} {...this.props} label='Database' />
            */            
    }
}

export class Selection extends React.Component<State, { label?: string|JSX.Element }> {
    state = { label: void 0}
    
    private observer: Subscription;
    private observerChannels: Subscription;
    componentWillMount() {           
        SelectionHelper.attachOnSelect((label: string|string[]) => {
            if (Array.isArray(label)) {
                this.setState({
                    label: <div className="columns">
                        {label.map(element => (<div>{element},</div>))}
                    </div>
                });
            } else {
                this.setState({ label: label ? <span dangerouslySetInnerHTML={{ __html: label }}/> : '' })
            }
        })

        // this.observer = this.props.plugin.plugin.behaviors.interaction.click.subscribe(({current, button, modifiers}) => {
        //     console.log(current)
        // })

        // this.observerChannels =  this.props.plugin.plugin.behaviors.interaction.click.subscribe(({current, button, modifiers}) => {
        //     if (current.loci.kind == "group-loci") {
        //         const loci = current.loci as ShapeGroup.Loci;
        //         const data = loci.shape.sourceData as ChannelSourceData;
        //         // if(annotation === void 0 || annotation === null){
        //         //     this.setState({ label: <span><b>{c.Type}</b>, {`Length: ${len} Å`}</span> });
        //         // }
        //         // else{
        //         //     this.setState({ label: <span><b>{annotation.text}</b>, Length: {len} Å</span> });
        //         // }
        //     }
        // })
    }

    // componentWillUnmount() {
    //     if (this.observer) {
    //         this.observer.unsubscribe();
    //         // this.observer = void 0;
    //     }
    //     if (this.observerChannels) {
    //         this.observerChannels.unsubscribe();
    //         // this.observerChannels = void 0;
    //     }
    // }

    render() {
        return <div>
            <div className="ui-selection-header">Selection</div>  
            <div className="ui-selection">{ !this.state.label 
                ? <i>Click on any object of molecule</i>
                : this.state.label}
            </div>
        </div>
    }
}

export class Section extends React.Component<{ header: string, count: number, children: React.ReactNode, controls: React.ReactNode }, { isExpanded: boolean }> {
    state = { isExpanded: false }

    private toggle(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    render() {
        return <div className="ui-item-container" style={{ position: 'relative' }}>
            <div className="ui-subheader">
                <a href='#' onClick={e => this.toggle(e)} className='section-header'><div style={{ width: '15px', display: 'inline-block', textAlign: 'center' }}>{this.state.isExpanded ?  '-' : '+'}</div> {this.props.header} ({this.props.count})</a>
                <div style={{ display: this.state.isExpanded ? 'block' : 'none' }}>{this.props.controls}</div>
            </div>
            <div style={{ display: this.state.isExpanded ? 'block' : 'none' }}>{this.props.children}</div>
        </div>
    }
}

export class Renderable extends React.Component<{ label: string | JSX.Element, element: any, annotations?: ChannelAnnotation[], toggle: (plugin: Context, elements: any[], visible: boolean) => Promise<any> } & State, { isAnnotationsVisible:boolean }> {
    
    state = {isAnnotationsVisible: false};

    private toggle() {
        this.props.element.__isBusy = true;
        this.forceUpdate(() =>
            this.props.toggle(this.props.plugin, [this.props.element], !this.props.element.__isVisible)
                .then(() => this.forceUpdate()).catch(() => this.forceUpdate()));
    }

    private toggleAnnotations(e:any){
        this.setState({isAnnotationsVisible:!this.state.isAnnotationsVisible});
    }

    private getAnnotationToggler(){
        return [(this.state.isAnnotationsVisible)
            ?<span className="hand glyphicon glyphicon-chevron-up" title="Hide list annotations for this channel" onClick={this.toggleAnnotations.bind(this)} />
        :<span className="hand glyphicon glyphicon-chevron-down" title="Show all annotations available for this channel" onClick={this.toggleAnnotations.bind(this)} />];
    }

    private getAnnotationsElements(){
        if(this.props.annotations === void 0){
            return [];
        }
        if(!this.state.isAnnotationsVisible){
            return [];
        }
        let elements:JSX.Element[] = [];
        for(let annotation of this.props.annotations){
            let reference = <i>(No reference provided)</i>;
            if(annotation.reference!==""){
                reference = <a target="_blank" href={annotation.link}>{annotation.reference} <span className="glyphicon glyphicon-new-window"/></a>;
            }
            elements.push(
                <div className="annotation-line">
                    <span className="bullet"/> <b>{annotation.text}</b>, {reference}
                </div>
            );
        }
        return elements;
    }

    render() {   
        let emptyToggler = <span className="disabled glyphicon glyphicon-chevron-down" title="No annotations available for this channel" onClick={this.toggleAnnotations.bind(this)} />
        return <div className="ui-label">
            <input type='checkbox' checked={!!this.props.element.__isVisible} onChange={() => this.toggle()} disabled={!!this.props.element.__isBusy} />
            <label className="ui-label-element">
                    {(this.props.annotations!==void 0 && this.props.annotations.length>0)?this.getAnnotationToggler():emptyToggler} {this.props.label}
            </label>
            {this.getAnnotationsElements()}
        </div>
    }
}

export class Channels extends React.Component<{state: State, channels: any[], header: string, hide: boolean }, { isBusy: boolean }> {
    state = { isBusy: false }

    show(visible: boolean) {
        for (let element of this.props.channels) { element.__isBusy = true; }
        this.setState({ isBusy: true }, () => 
            showChannelVisuals(this.props.state.plugin!, this.props.channels, visible)
                .then(() => this.setState({ isBusy: false })).catch(() => this.setState({ isBusy: false })));
    }

    private isDisabled(){
        return !this.props.channels || (this.props.channels!==void 0 && this.props.channels.length==0);
    }

    componentDidUpdate(prevProps: any) {
        if (this.props.hide !== prevProps.hide) {
            this.show(false);
        }
    }

    render() {
        return <Section 
            header={this.props.header} 
            count={(this.props.channels || '').length}
            children={ this.props.channels && this.props.channels.length > 0
                ? this.props.channels.map((c, i) => <Channel key={i} channel={c} state={this.props.state} />)
                : <div className="ui-label ui-no-data-available">No data available...</div>}
            controls={<div className='ui-show-all'><button className="btn btn-primary btn-xs bt-all" onClick={() => this.show(true)} disabled={this.state.isBusy||this.isDisabled()}>All</button><button className="btn btn-primary btn-xs bt-none" onClick={() => this.show(false)} disabled={this.state.isBusy||this.isDisabled()}>None</button></div>}
        />
    }
}

export class Channel extends React.Component<{state:State, channel: any }, { isVisible: boolean, isWaitingForData:boolean }> {
    state = { isVisible: false, isWaitingForData: false };

    componentDidMount(){
        Events.subscribeChannelSelect(((channelId:string)=>{
            if(this.props.channel.Id === channelId){
                this.selectChannel(true);
            }
        }).bind(this));
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

    render() {
        let c = this.props.channel as (Tunnel & TunnelMetaInfo);
        let len = Tunnels.getLength(c);

        //TODO use just getAnnotation
        let annotations = AnnotationDataProvider.getChannelAnnotations(c.Id);
        if(annotations === void 0 && annotations !== null){
            this.invokeDataWait();
        }

        if(annotations!==null && annotations !== void 0){
            let annotation = annotations[0];
            return <Renderable annotations={annotations} label={<span><b><a onClick={this.selectChannel.bind(this, true)}>{`${annotation.text} (Id: ${c.Id})`}</a></b>, Length: {len} Å</span>} element={c} toggle={showChannelVisuals} {...this.props.state} />
        }
        else{
            return <Renderable label={<span><b><a onClick={this.selectChannel.bind(this, true)}>{`${c.Type} (Id: ${c.Id})`}</a></b>, {`Length: ${len} Å`}</span>} element={c} toggle={showChannelVisuals} {...this.props.state} />
        }
    }

    private selectChannel(preserveSelection:boolean){
        const channel = this.props.channel as (Tunnel & TunnelMetaInfo)
        if (!channel.__isVisible) {
            showChannelVisuals(this.props.state.plugin, [channel], true).then(() => {
                if (channel) SelectionHelper.channelSelected(channel, this.props.state.plugin, preserveSelection);
            });
        } else {
            if (channel) SelectionHelper.channelSelected(channel, this.props.state.plugin, preserveSelection);
        }
        this.forceUpdate();
    }
}

// Right now not used, may be reused in the future
export class Cavities extends React.Component<{ state:State, cavities: any[], header: string }, { isBusy: boolean }> {
    state = { isBusy: false }
    private show(visible: boolean) {
        for (let element of this.props.cavities) { element.__isBusy = true; }
        this.setState({ isBusy: true }, () => 
            showCavityVisuals(this.props.state.plugin!, this.props.cavities, visible)
                .then(() => this.setState({ isBusy: false })).catch(() => this.setState({ isBusy: false })));
    }

    private isDisabled(){
        return !this.props.cavities ||(this.props.cavities!==void 0 && this.props.cavities.length==0);
    }

    render() {
        return <Section 
            header={this.props.header}
            count={(this.props.cavities || '').length}
            children={ this.props.cavities && this.props.cavities.length > 0
                ? this.props.cavities.map((c, i) => <Cavity key={i} cavity={c} state={this.props.state} />)
                : <div className="ui-label ui-no-data-available">No data available...</div>}
            controls={<div className='ui-show-all'><button className="btn btn-primary btn-xs" onClick={() => this.show(true)} disabled={this.state.isBusy||this.isDisabled()}>All</button><button className="btn btn-primary btn-xs" onClick={() => this.show(false)} disabled={this.state.isBusy||this.isDisabled()}>None</button></div>}
        />
    }
}

// Right now not used, may be reused in the future
export class Cavity extends React.Component<{state: State, cavity: any }, { isVisible: boolean }> {
    state = { isVisible: false };

    render() {
        let c = this.props.cavity;
        return <div>
            <Renderable label={<span><b>{c.Id}</b>, {`Volume: ${c.Volume | 0} Å`}<sup>3</sup></span>} element={c} toggle={showCavityVisuals} {...this.props.state} />
        </div>
    }
}

    export class Origins extends React.Component<{ label: string | JSX.Element, origins: any } & State, { }> {
    private toggle() {
        this.props.origins.__isBusy = true;
    }

    render() {
        if (!this.props.origins.Points.length) {
            return <div style={{ display: 'none' }} />
        }

        return <div>
            <label>
                <input type='checkbox' checked={!!this.props.origins.__isVisible} onChange={() => this.toggle()} disabled={!!this.props.origins.__isBusy} /> {this.props.label}
            </label>
        </div>
    }
}

export default UI;