import React from "react";
import { ColorBoundsMode, RadiusProperty, Vizualizer } from "./Vizualizer";
import Tooltips from "../CommonUtils/Tooltips";
import Tabs from "../CommonUtils/Tabs";
import { Tunnel } from "./Backend";
import { SelectionHelper } from "../CommonUtils/Selection";
import { LayerData, convertLayersToLayerData } from "../DataInterface";
import { QueryParam } from "../VizualizerMol/helpers";
import { Context } from "../Context";
import noImageUrl from "../../images/no_img.png";

import { initTooltips } from "../CommonUtils/Bootstrap";
import { emit, emitResize, listen } from "../CommonUtils/Events";

export class LayerVizualizer extends React.Component<{ vizualizer: Vizualizer, controller: Context }, State> {

    private tooltipsInitialized:boolean = false;

    state = {
        instanceId: -1,
        hasData: false,
        data: [] as LayerData[],
        layerId: 0,
        coloringPropertyKey: "",
        customColoringPropertyKey: "",
        radiusPropertyKey: "MinRadius" as RadiusProperty,
        customRadiusPropertyKey: "MinRadius" as RadiusProperty,
        colorBoundsMode: "Absolute" as ColorBoundsMode,
        isDOMReady: false,
        app: this,
        currentTunnelRef: "",
        isLayerSelected: false
    };

    // Removed when unmounted
    private subscriptions: (() => void)[] = [];

    componentDidMount() {
        var vizualizer = this.props.vizualizer;

        vizualizer.setColorBoundsMode(this.state.colorBoundsMode);

        let state = this.state;
        state.instanceId= vizualizer.getPublicInstanceIdx();
        state.customColoringPropertyKey=vizualizer.getCustomColoringPropertyKey();
        state.coloringPropertyKey=vizualizer.getColoringPropertyKey();
        state.customRadiusPropertyKey=vizualizer.getCustomRadiusPropertyKey();
        state.radiusPropertyKey=vizualizer.getRadiusPropertyKey();
        state.colorBoundsMode=this.state.colorBoundsMode;
        this.setState(state);

        this.subscriptions.push(listen('channelSelected', (data)=>{
            window.setTimeout(()=>{
                let s1 = this.state;
                s1.currentTunnelRef= SelectionHelper.getSelectedChannelRef();
                s1.isLayerSelected= false;
                this.setState(s1);
                Tabs.activateTab("left-tabs","1");
                let layers = convertLayersToLayerData(data);
                Tabs.doAfterTabActivated("left-tabs","1",()=>{
                    vizualizer.setData(layers);
                    let s2 = this.state;
                    s2.data= layers;
                    s2.hasData= true;
                    s2.isDOMReady=false;
                    s2.instanceId= vizualizer.getPublicInstanceIdx();
                    this.setState(s2, () => {   // had to use callBack since the state has to be set and component has to render the 'PaintingArea' before ''vizualizer.rebindDOMRefs'
                        vizualizer.rebindDOMRefs();
                        vizualizer.vizualize();
                        let s3 = this.state;
                        s3.data= layers;
                        s3.hasData= true;
                        s3.isDOMReady=true;
                        s3.instanceId= vizualizer.getPublicInstanceIdx();
                        this.setState(s3);
                    });
                });
            },50);
        }));

        const onResize = () => this.forceUpdate();
        window.addEventListener("resize", onResize);
        this.subscriptions.push(
            listen("lvContentResize", onResize),
            () => window.removeEventListener("resize", onResize),
        );
    }

    componentWillUnmount(){
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    }

    render() {
        if (this.state.hasData) {
            // Styled by tooltips.css
            initTooltips('.init-lvz-tooltip.lvz-radius', { customClass: 'lvz-tooltip' });
            initTooltips('.init-lvz-tooltip.lvz-properties', { customClass: 'lvz-tooltip lvz-properties-tooltip' });
            return <PaintingArea {...this.state} controller={this.props.controller}/>
        } 
        
        return <Hint {...this.state} />
    }
}  

interface State{
    instanceId: number,
    hasData: boolean,
    data: LayerData[],
    layerId: number,
    coloringPropertyKey: string,
    customColoringPropertyKey: string,
    radiusPropertyKey: RadiusProperty,
    customRadiusPropertyKey: RadiusProperty,
    colorBoundsMode: ColorBoundsMode
    isDOMReady: boolean,
    app: LayerVizualizer,
    currentTunnelRef: string,
    isLayerSelected: boolean
};

class PaintingArea extends React.Component<State & {controller: Context}, {}>{
    render(){
        return(
            <div className="layerVizualizer"
                id={`layer-vizualizer-ui${this.props.instanceId}`}
                >
                <div className="wrapper-container">
                    <Controls {...this.props} isCustom={false} />
                    <CommonControls {...this.props} />
                    <CanvasWrapper {...this.props} controller={this.props.controller}/>
                    <Controls {...this.props} isCustom={true} />
                </div>
            </div>
        );
    };
}

class Hint extends React.Component<State,{}>{
    render(){
        return(
            <div id={`layer-vizualizer-hint-div${this.props.instanceId}`}
                className="layer-vizualizer-hint-div"
                >
                    Click on one of available channels to see more information...
                </div>
        );
    }
}

class ColorMenuItem extends React.Component<State & {propertyName:string, isCustom:boolean},{}>{
    private changeColoringProperty(e: React.MouseEvent<HTMLElement>){
        let targetElement = (e.target as HTMLElement);
        let instanceIdx = Number(targetElement.getAttribute("data-instanceidx")).valueOf();
        let instance = Vizualizer.ACTIVE_INSTANCES[instanceIdx];

        let propertyName = targetElement.getAttribute("data-propertyname");
        if(propertyName === null){
            console.log("No property name found!");
            return;
        }

        if(this.props.isCustom){
            instance.setCustomColoringPropertyKey(propertyName);
        }
        else{
            instance.setColoringPropertyKey(propertyName);                   
        }

        instance.vizualize();
        
        let state = this.props.app.state;
        if(this.props.isCustom){
            state.customColoringPropertyKey=propertyName;
            this.props.app.setState(state);
        }
        else{
            state.coloringPropertyKey=propertyName;
            this.props.app.setState(state);
        }
    }

    render(){
        if(Tooltips.hasTooltipText(this.props.propertyName)){
            return(
                <li><button type="button" data-instanceidx={this.props.instanceId} data-propertyname={this.props.propertyName} data-bs-toggle="tooltip" data-bs-placement="right" title={Tooltips.getMessageOrLeaveText(`tooltip-${this.props.propertyName}`)} className="dropdown-item init-lvz-tooltip lvz-properties" onClick={this.changeColoringProperty.bind(this)}>{Tooltips.getMessageOrLeaveText(this.props.propertyName)}</button></li>
            );
        }
        else{
            return(
                <li><button type="button" className="dropdown-item" data-instanceidx={this.props.instanceId} data-propertyname={this.props.propertyName} onClick={this.changeColoringProperty.bind(this)}>{Tooltips.getMessageOrLeaveText(this.props.propertyName)}</button></li>
            );
        }
    }
}

class RadiusMenuItem extends React.Component<State & {propertyName:string, isCustom:boolean},{}>{
    private changeRadiusProperty(e: React.MouseEvent<HTMLElement>){
        let targetElement = (e.target as HTMLElement);
        let instanceIdx = Number(targetElement.getAttribute("data-instanceidx")).valueOf();
        let instance = Vizualizer.ACTIVE_INSTANCES[instanceIdx];

        let propertyName = targetElement.getAttribute("data-propertyname") as RadiusProperty;
        if(propertyName === null || propertyName === void 0){
            return;
        }

        if(this.props.isCustom){
            instance.setCustomRadiusPropertyKey(propertyName);
        }
        else{
            instance.setRadiusPropertyKey(propertyName);
        }

        instance.vizualize();
        
        let state = this.props.app.state;
        if(this.props.isCustom){
            state.customRadiusPropertyKey=propertyName;
            this.props.app.setState(state);
        }
        else{
            state.radiusPropertyKey=propertyName;
            this.props.app.setState(state);
        }
    }

    render(){
        if(Tooltips.hasTooltipText(this.props.propertyName)){
            return(
                <li><button type="button" data-instanceidx={this.props.instanceId} data-propertyname={this.props.propertyName} data-bs-toggle="tooltip" data-bs-placement="right" title={Tooltips.getMessageOrLeaveText(`tooltip-${this.props.propertyName}`)} className="dropdown-item init-lvz-tooltip lvz-radius" onClick={this.changeRadiusProperty.bind(this)}>{Tooltips.getMessageOrLeaveText(this.props.propertyName)}</button></li>
            );
        }
        else{
            return(
                <li><button type="button" className="dropdown-item" data-instanceidx={this.props.instanceId} data-propertyname={this.props.propertyName} onClick={this.changeRadiusProperty.bind(this)}>{Tooltips.getMessageOrLeaveText(this.props.propertyName)}</button></li>
            );
        }
    }
}

class ColorBoundsMenuItem extends React.Component<State & {mode:string},{}>{
    private changeColorBoundsMode(e: React.MouseEvent<HTMLElement>){
        let targetElement = (e.target as HTMLElement);
        let instanceIdx = Number(targetElement.getAttribute("data-instanceidx")).valueOf();
        let instance = Vizualizer.ACTIVE_INSTANCES[instanceIdx];

        let mode = targetElement.getAttribute("data-mode") as ColorBoundsMode;
        if(mode === null || mode === void 0){
            return;
        }

        instance.setColorBoundsMode(mode);
        instance.vizualize();
        
        let state = this.props.app.state;
        state.colorBoundsMode=mode;
        this.props.app.setState(state);
    }

    render(){
        return(
            <li><button type="button" className="dropdown-item" data-instanceidx={this.props.instanceId} data-mode={this.props.mode} onClick={this.changeColorBoundsMode.bind(this)}>{this.props.mode}</button></li>
        );
    }
}

class BootstrapDropUpMenuButton extends React.Component<{label: string, items: React.JSX.Element[]},{}>{
    render(){
        return <div className="btn-group dropup">
                <button type="button" className="btn btn-sm btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {this.props.label}
                </button>
                <ul className="dropdown-menu">
                    {this.props.items}
                </ul>
            </div>
    }
}

class Controls extends React.Component<State & {isCustom:boolean},{}>{
    render(){
        return(
            <div className="controls">
                <RadiusSwitch state={this.props} isCustom={this.props.isCustom} radiusProperty={(this.props.isCustom)?this.props.customRadiusPropertyKey:this.props.radiusPropertyKey} />
                <ColorBySwitch state={this.props} isCustom={this.props.isCustom} coloringProperty={(this.props.isCustom)?this.props.customColoringPropertyKey:this.props.coloringPropertyKey} />
            </div>
        );
    }
}

class CommonControls extends React.Component<State,{}>{

    render(){
        return(
            <div className="controls">
                <CommonButtonArea {...this.props} />
            </div>
        );
    }
}

class ColorBySwitch extends React.Component<{state: State, coloringProperty:string, isCustom:boolean},{}>{
    private generateColorMenu(){

        let rv = [];
        for(let prop in this.props.state.data[0].Properties){
            rv.push(
                <ColorMenuItem key={rv.length} propertyName={prop} isCustom={this.props.isCustom} {...this.props.state} />
            );
        }

        return <BootstrapDropUpMenuButton items={rv} label={Tooltips.getMessageOrLeaveText(this.props.coloringProperty)} />
    }

    render(){
        let items = this.generateColorMenu();
        return (
            <span className="block-like">
                <span className="control-label">Color by:</span> {items}
            </span>
            );
    }
}

class RadiusSwitch extends React.Component<{state: State, radiusProperty:RadiusProperty,isCustom:boolean},{}>{
    private generateRadiusSwitch(){
        let properties = ["MinRadius","MinFreeRadius"];
        let rv = [];
        for(let prop of properties){
            rv.push(
                <RadiusMenuItem key={rv.length} propertyName={prop} isCustom={this.props.isCustom} {...this.props.state} />
            );
        }

        return <BootstrapDropUpMenuButton items={rv} label={Tooltips.getMessageOrLeaveText(this.props.radiusProperty)} />
    }

    render(){
        let items = this.generateRadiusSwitch();
        return (
            <span className="block-like">
                <span className="control-label">Tunnel radius:</span> {items}
            </span>
            );
    }
}

class CommonButtonArea extends React.Component<State,{}>{
    private generateColorBoundsSwitch(){
        let properties = ["Min/max","Absolute"];
        let rv = [];
        for(let prop of properties){
            rv.push(
                <ColorBoundsMenuItem key={rv.length} mode={prop} {...this.props} />
            );
        }
        
        let label = properties[(this.props.colorBoundsMode=="Min/max")?0:1];

        return <BootstrapDropUpMenuButton items={rv} label={label} />
    }

    render(){
        let items = this.generateColorBoundsSwitch();
        return (
            <div className="common-area">
                <ColorBoundsSwitchButton items={items} />
                <ExportButton instanceId={this.props.instanceId} />
            </div>
            );
    }
}

class ExportTypeButton extends React.Component<{instanceId:number,exportType:string},{}>{
    private dataURItoBlob(dataURI:string):Blob{
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(dataURI.split(',')[1]);
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var dw = new DataView(ab);
        for(var i = 0; i < byteString.length; i++) {
            dw.setUint8(i, byteString.charCodeAt(i));
        }
        // write the ArrayBuffer to a blob, and you're done
        return new Blob([ab], {type: mimeString});
    }

    private triggerDownload(dataUrl:string, fileName:string){
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        let blob = this.dataURItoBlob(dataUrl)
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    private export(e: React.MouseEvent<HTMLElement>){
        let targetElement = (e.target as HTMLElement);
        let instanceIdx = Number(targetElement.getAttribute("data-instanceidx")).valueOf();
        let instance = Vizualizer.ACTIVE_INSTANCES[instanceIdx];

        let exportType = targetElement.getAttribute("data-exporttype");
        if(exportType === null){
            return;
        }

        let imgDataUrl = null;

        switch(exportType){
            case "PNG":
                imgDataUrl = instance.exportImage();
                break;
            case "SVG":
                imgDataUrl = instance.exportSVGImage();
                break;
            default:
                throw new Error(`Unsupported export type '${exportType}'`);
        }

        this.triggerDownload(imgDataUrl,`export-2D.${exportType.toLowerCase()}`);
    }

    render(){
        return <li><button type="button" className="dropdown-item" data-instanceidx={this.props.instanceId} data-exporttype={this.props.exportType} onClick={this.export.bind(this)}>{this.props.exportType}</button></li>
    }
}

class ExportButton extends React.Component<{instanceId:number},{}>{
    private generateItems(){
        let rv = [] as React.JSX.Element[];
        let supportedExportTypes = ["PNG","SVG"];
        for(let type of supportedExportTypes){
            rv.push(
                <ExportTypeButton key={rv.length} instanceId={this.props.instanceId} exportType={type} />
            );
        }
        
        return rv;
    }

    render(){
        let label = "Export";
        let rv = this.generateItems();
        return (<BootstrapDropUpMenuButton items={rv} label={label} />);
    }
}

class ColorBoundsSwitchButton extends React.Component<{items:React.JSX.Element},{}>{
    render(){
        return (
            <span className="color-bounds-button-container">
                <span className="control-label" title="Color bounds for both halfs of vizualized tunnel.">
                    Color bounds:
                </span> {this.props.items}
            </span>
            );
    }
}

class CanvasWrapper extends React.Component<State & {controller: Context},{}>{
    render(){
        return (
        <div className="canvas-wrapper">
            <RealCanvas {...this.props} />
            <ImgOverlay {...this.props} />
            <InteractionMap {...this.props} controller={this.props.controller} />
        </div>
        );
    }
}

class ImgOverlay extends React.Component<State,{}>{
    render(){
        return (
            <img className="fake-canvas"
                id={`layer-vizualizer-fake-canvas${this.props.instanceId}`}
                useMap={`#layersInteractiveMap${this.props.instanceId}`}
                src={noImageUrl}
                ></img>
        );
    }
}

class RealCanvas extends React.Component<State,{}>{
    render(){
        return (
            <canvas id={`layer-vizualizer-canvas${this.props.instanceId}`} 
                className="layer-vizualizer-canvas"
                width="700"
                height="150"
                ></canvas>
        );
    }
}

interface TunnelScale{
            xScale:number,
            yScale:number
        };
interface Bounds{
    x:number,
    y:number,
    width:number,
    height:number
};

class InteractionMap extends React.Component<State & {controller: Context},{}>{

    private getLayerResidues(layerIdx:number):QueryParam[]{
        let res = [];
        for(let residue of this.props.data[layerIdx].Residues){
            let parts = (residue as string).split(" ");
            res.push({
                auth_asym_id: parts[2],
                start_auth_residue_number: Number(parts[1]),
                end_auth_residue_number: Number(parts[1]),
                color:{r:255,g:0,b:255},
                sideChain: true,
                focus: true
            })
        }

        return res;
    }

    private resetFocusToTunnel(){
        const loci = SelectionHelper.getSelectedChannelLoci();
        if (loci) this.props.app.props.controller.plugin.managers.camera.focusLoci(loci);
    }

    private async showLayerResidues3DAndFocus(layerIdx:number){
        /*
        let theme = generateLayerSelectColorTheme(layerIdx,this.props.app);
        applyTheme(theme,this.props.app.props.controller,this.props.app.state.currentTunnelRef);
        */
        let residues = this.getLayerResidues(layerIdx);

        await this.props.app.props.controller.visual.clearSelection();
        await this.props.app.props.controller.visual.select({data: residues});
    }

    private displayDetailsEventHandler(e: React.MouseEvent<HTMLElement>){
        let targetElement = (e.target as HTMLElement);
        let layerIdx = Number(targetElement.getAttribute("data-layeridx")).valueOf();
        let instanceIdx = Number(targetElement.getAttribute("data-instanceidx")).valueOf();
        let instance = Vizualizer.ACTIVE_INSTANCES[instanceIdx];
        
        instance.highlightHitbox(layerIdx);
        if(!this.props.app.state.isLayerSelected){
            let state = this.props.app.state;
            state.layerId= layerIdx;
            this.props.app.setState(state);    
            emit('layerTriggered',layerIdx);
        }      
    }

    private async displayLayerResidues3DEventHandler(e: React.MouseEvent<HTMLElement>){
        let targetElement = (e.target as HTMLElement);
        let layerIdx = Number(targetElement.getAttribute("data-layeridx")).valueOf();
        let instanceIdx = Number(targetElement.getAttribute("data-instanceidx")).valueOf();
        let instance = Vizualizer.ACTIVE_INSTANCES[instanceIdx];      
        
        if(instance.getSelectedLayer() === layerIdx){
            this.props.app.state.isLayerSelected = false;
            await this.props.app.props.controller.visual.clearSelection();
            this.resetFocusToTunnel();
            instance.deselectLayer();
            instance.highlightHitbox(layerIdx);
        }
        else{
            let state = this.props.app.state;
            state.layerId = layerIdx;
            state.isLayerSelected = true;
            this.props.app.setState(state);   
            await this.showLayerResidues3DAndFocus(layerIdx);
            instance.deselectLayer();
            instance.selectLayer(layerIdx);
            emit('layerTriggered',layerIdx);
            emitResize();
        }
        SelectionHelper.highlightSelectedChannel(this.props.controller);
    }

    private getTunnelScale(tunnel:Tunnel | null):TunnelScale{
        let xScale = 0;
        let yScale = 0;

        if(tunnel !== null){
            let scale = tunnel.getScale();
            if(scale !== null){
                xScale = scale.x;
                yScale = scale.y;
            }
        }

        return {
            xScale,
            yScale
        };
    }

    private transformCoordinates(x:number,y:number,width:number,height:number,scale:TunnelScale,bounds:Bounds):{
        sx:number,sy:number,dx:number,dy:number}{
        let vizualizer = Vizualizer.ACTIVE_INSTANCES[this.props.instanceId];
        
        //Real width can be different to canvas width - hitboxes could run out of space
        let realXScale = 1;
        let realWidth = vizualizer.getCanvas().offsetWidth.valueOf();
        if(realWidth != 0){
            realXScale = 1/(vizualizer.getCanvas().width/realWidth);
        }

        let realYScale = 1;
        let realHeight = vizualizer.getCanvas().offsetHeight.valueOf();
        if(realHeight != 0){
            realYScale = 1/(vizualizer.getCanvas().height/realHeight);
        }

        return {
            sx: (bounds.x + x * scale.xScale)* realXScale,
            sy: (bounds.y + y * scale.yScale) * realYScale,
            dx: (bounds.x + (x+width) * scale.xScale) * realXScale,
            dy: (bounds.y + (y+height) * scale.yScale) * realYScale
        };

    }

    private makeCoordinateString(x:number,y:number,width:number,height:number,scale:TunnelScale,bounds:Bounds):string{
        let coordinates = this.transformCoordinates(x,y,width,height,scale,bounds);
        return String(coordinates.sx)+','
                    +String(coordinates.sy)+','
                    +String(coordinates.dx)+','
                    +String(coordinates.dy);
    }

    private generatePhysicalHitboxesCoords(): {layerIdx:number,coords:string}[]{
        let vizualizer = Vizualizer.ACTIVE_INSTANCES[this.props.instanceId];
        let data = this.props.data;

        //Data was not prepared yet
        if(vizualizer.isDataDirty()){
            vizualizer.prepareData();
        }

        let hitboxes = vizualizer.getHitboxes();
        let tunnels = vizualizer.getTunnels();

        if(tunnels === null 
            || hitboxes === null
            || (hitboxes.defaultTunnel === null && hitboxes.customizable === null)){
                return [];
        }

        let defaultTunnel = tunnels.default;
        let customizableTunnel = tunnels.customizable;

        let dTproperties = null;
        let dTbounds = null;
        if(defaultTunnel !== null){
            dTproperties = this.getTunnelScale(defaultTunnel.tunnel);
            dTbounds = defaultTunnel.bounds;
        }
        let cTproperties = null;
        let cTbounds = null;
        if(customizableTunnel !== null){
            cTproperties = this.getTunnelScale(customizableTunnel.tunnel);
            cTbounds = customizableTunnel.bounds;
        }
        
        let rv = [];
        for(let i=0;i<data.length;i++){
            if(hitboxes.defaultTunnel !== null && dTproperties !== null && dTbounds !== null){
                let hitbox = hitboxes.defaultTunnel[i];
                rv.push({
                        layerIdx: i,
                        coords:this.makeCoordinateString(hitbox.x,hitbox.y,hitbox.width,hitbox.height,dTproperties,dTbounds)
                    });
            }
            if(hitboxes.customizable !== null && cTproperties !== null && cTbounds !== null){
                let hitbox = hitboxes.customizable[i];
                rv.push({
                        layerIdx:i,
                        coords:this.makeCoordinateString(hitbox.x,hitbox.y,hitbox.width,hitbox.height,cTproperties,cTbounds)
                    });
            }
        }

        return rv;
    }

    render(){
        let areas = [];
        if(this.props.isDOMReady){
            let hitboxesCoords = this.generatePhysicalHitboxesCoords();
            for(let i=0;i<hitboxesCoords.length;i++){
                areas.push(<area key={areas.length} shape="rect"
                    coords={hitboxesCoords[i].coords.valueOf()} 
                    data-layeridx={String(hitboxesCoords[i].layerIdx.valueOf())}
                    data-instanceidx={String(this.props.instanceId)}
                    onMouseOver={this.displayDetailsEventHandler.bind(this)}
                    onMouseDown={this.displayLayerResidues3DEventHandler.bind(this)} />);
            }
        }

        return (
            <div className="layerVizualizer">
            <map name={`layersInteractiveMap${this.props.instanceId}`} 
                id={`layer-vizualizer-hitbox-map${this.props.instanceId}`}
                >
                {areas}
            </map>
            </div>
        );
    }
}

export default LayerVizualizer;
