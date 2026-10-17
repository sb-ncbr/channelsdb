import { SimpleObservable } from "./CommonUtils/Observable";
import { Context } from "./Context";
import { AnnotationObject, Annotations, ChannelsDBData, Tunnel } from "./DataInterface";
import { Map } from "immutable";

export interface ResidueAnnotation{
    text: string,
    reference: string,
    link: string,
    isLining: boolean
};
export interface ChannelAnnotation{
    text: string,
    reference: string,
    description: string,
    link: string
};
export interface ProteinAnnotation{
    function: string,
    name: string,
    catalytics: string[],
    uniProtId: string,
    link: string
};

export class AnnotationDataProvider{

    private static residueAnnotations: Map<string,ResidueAnnotation[]>;
    private static channelAnnotations: Map<string,ChannelAnnotation[]>;
    private static proteinAnnotations: ProteinAnnotation[];

    private static liningResidues: string[];

    private static subscribed: boolean = false;

    private static dataReady:boolean = false;

    private static moleDataPromise: Promise<any>;
    private static channelsDBPromise: Promise<any>;

    private static retries:number = 0;
    

    private static isLining(residue:string):boolean{
        return this.liningResidues.indexOf(residue)>=0;
    }

    private static parseChannelsData(data:AnnotationObject[]){
        let map = Map<string,ChannelAnnotation[]>();

        for(let annotation of data){               
            let channelId = annotation.Id
            
            if(channelId === null){
                console.log("Found channel annotation wihtout id. Skipping...");
                continue;
            }

            let list:ChannelAnnotation[] = [];
            if(map.has(channelId)){
                let l = map.get(channelId);
                if(l!==void 0){
                    list = l;
                }
            }
            list.push(
                {
                    text: annotation.Name,
                    reference: annotation.Reference,
                    description: annotation.Description,
                    link: this.createLink(annotation.ReferenceType, annotation.Reference)
                }
            );
            map = map.set(channelId,list); // immutable
        }

        return map;
    }

    private static stripChars(str:string,chars:string[]):string{
        for(let char of chars){
            str = str.replace(char,"");
        }

        return str;
    }
    private static parseCatalytics(items: string[]):string[]{
        let rv:string[] = [];
        for(let item of items){
            let line = item.replace(/\(\d*\)/g,(x:string)=>`<sub>${this.stripChars(x,['(',')'])}</sub>`);
            line = line.replace(/\(\+\)|\(\-\)/g,(x:string)=>`<sup>${this.stripChars(x,['(',')'])}</sup>`)
            
            rv.push(line);
        }
        return rv;
    }

    private static parseProteinData(data:Annotations.ProteinAnnotation[]){
        let list:ProteinAnnotation[] = [];

        for(let item of data){
            list.push({
                name: item.Name,
                function: item.Function,
                link: this.createLink("UniProt",item.UniProtId),
                uniProtId: item.UniProtId,
                catalytics: this.parseCatalytics(item.Catalytics)
            });
        }

        return list; 
    }

    //PUBMEDID vs UniProtId ??? PUBMED není v JSONU vůbec přítomné
    //link pro uniprot používá adresu http://www.uniprot.org/uniprot/
    private static createLink(type: string, reference: string):string{
        if(type === "DOI"){
            return `http://dx.doi.org/${reference}`;
        }
        else if(type === "UniProt"){
            return `http://www.uniprot.org/uniprot/${reference}`;
        }
        else if(type === "PubMed"){
            return `http://europepmc.org/abstract/MED/${reference}`;
        }
        else{
            console.log(`Unknown reference type ${type} for reference ${reference}`);
            return `#unknown-reference-type`;
        }
    }

    private static parseResidueItem(item: Annotations.Annotation,map: Map<string,ResidueAnnotation[]>){
        let residueId = `${item.Id} ${item.Chain}`;
        let annotations = map.get(residueId);
            if(annotations === void 0){
                annotations = [];
            }
            annotations.push({
                text: item.Text,
                reference: item.Reference,
                link: this.createLink(item.ReferenceType,item.Reference),
                isLining: this.isLining(residueId)
            });
        return map.set(`${item.Id} ${item.Chain}`,annotations); // since it is Immutable map
    }

    private static parseResidueData(data:Annotations.ResidueAnnotations){
        let map = Map<string,ResidueAnnotation[]>();

        for(let item of data.ChannelsDB){
            map = this.parseResidueItem(item,map); // immutable
        }

        for(let item of data.UniProt){
            map = this.parseResidueItem(item,map); // immutable
        }

        return map;   
    }

    private static parseLiningResidues(data:ChannelsDBData){
        let channels:Tunnel[] = [];
        
        if(data.Channels.CSATunnels_MOLE !== void 0) channels = channels.concat(data.Channels.CSATunnels_MOLE);

        if(data.Channels.CSATunnels_Caver !== void 0) channels = channels.concat(data.Channels.CSATunnels_Caver);

        if(data.Channels.ReviewedChannels_MOLE !== void 0) channels = channels.concat(data.Channels.ReviewedChannels_MOLE);

        if(data.Channels.ReviewedChannels_Caver !== void 0) channels = channels.concat(data.Channels.ReviewedChannels_Caver);

        if(data.Channels.CofactorTunnels_MOLE !== void 0) channels = channels.concat(data.Channels.CofactorTunnels_MOLE);

        if(data.Channels.CofactorTunnels_Caver !== void 0) channels = channels.concat(data.Channels.CofactorTunnels_Caver);

        if(data.Channels.TransmembranePores_MOLE !== void 0) channels = channels.concat(data.Channels.TransmembranePores_MOLE);

        if(data.Channels.TransmembranePores_Caver !== void 0) channels = channels.concat(data.Channels.TransmembranePores_Caver);

        if(data.Channels.ProcognateTunnels_MOLE !== void 0) channels = channels.concat(data.Channels.ProcognateTunnels_MOLE);

        if(data.Channels.ProcognateTunnels_Caver !== void 0) channels = channels.concat(data.Channels.ProcognateTunnels_Caver);

        if(data.Channels.AlphaFillTunnels_MOLE !== void 0) channels = channels.concat(data.Channels.AlphaFillTunnels_MOLE);

        if(data.Channels.AlphaFillTunnels_Caver !== void 0) channels = channels.concat(data.Channels.AlphaFillTunnels_Caver);

        let liningResidues:string[] = [];
        for(let channel of channels){                
            for(let layerInfo of channel.Layers.LayersInfo){
                for(let residue of layerInfo.Residues){
                    let residueId = residue.split(" ").slice(1,3).join(" ");
                    if(liningResidues.indexOf(residueId)<0){
                        liningResidues.push(residueId);
                    }
                }
            }
            
        }

        return liningResidues;
    }

    public static isDataReady():boolean{
        return this.dataReady;
    }

    private static handleChannelsAPIData(data:any){
        if (Object.keys(data).length !== 0 ) {
            let liningResidues = this.parseLiningResidues(data);
            let channelsData = this.parseChannelsData(data.Annotations);
            return {liningResidues,channelsData};
        }
        return {};
    }

    private static handleAnnotationsAPIData(data:any){
        if (Object.keys(data).length !== 0 ) {
            let proteinData = this.parseProteinData(data.EntryAnnotations);
            let residueData = this.parseResidueData(data.ResidueAnnotations);
            return {proteinData,residueData};
        }
        return {}
    }

    public static subscribeToPluginContext(context: Context) {
        interface ChannelsAPIDataHandledPromiseResult {
          liningResidues: any,
          channelsData: any
        }
        interface AnnotationAPIDataHandledPromiseResult {
          proteinData: any,
          residueData: any
        }
      
        let channelsAPIobserver: SimpleObservable;
        let annotationsAPIobserver: SimpleObservable;
      
        new Promise<Object>((res, rej) => {
          channelsAPIobserver = new SimpleObservable(
            () => context.data,
            (moleData) => res(this.handleChannelsAPIData(moleData)),
            {} as ChannelsDBData
          );
          channelsAPIobserver.subscribe();
        }).then((val: ChannelsAPIDataHandledPromiseResult) => {
            if (Object.keys(val).length !== 0 ) {
                this.liningResidues = val.liningResidues;
                this.channelAnnotations = val.channelsData;
            }
        
            return new Promise<Object>((res, rej) => {
            annotationsAPIobserver = new SimpleObservable(
                () => context.annotations,
                (annotationData) => res(this.handleAnnotationsAPIData(annotationData)),
                {} as Annotations.ChannelsDBData
            );
            annotationsAPIobserver.subscribe();
            });
        }).then((val: AnnotationAPIDataHandledPromiseResult) => {
            if (Object.keys(val).length !== 0 ) {
                this.proteinAnnotations = val.proteinData;
                this.residueAnnotations = val.residueData;
            }
          
          this.dataReady = true;
          this.invokeHandlers();
        }).catch((err) => {
          console.log("API Parse Error:", err);
          if (this.retries > 5) {
            return;
          }
          this.retries++;
          setTimeout(() => this.subscribeToPluginContext(context), 100);
        });
      
        this.subscribed = true;
    }

    private static handlers: {handler:()=>void}[];
    public static subscribeForData(handler:()=>void){
        if(this.handlers === void 0){
            this.handlers = [];
        }
        this.handlers.push({handler});
    }

    private static invokeHandlers(){
        if(this.handlers === void 0){
            console.log("no handlers attached... Skiping...");
            return;
        }
        for(let h of this.handlers){
            h.handler();
        }
    }

    public static getResidueAnnotations(residueId:string):ResidueAnnotation[]|undefined{
        if(!this.subscribed){
            return void 0;
        }

        if(this.residueAnnotations !== void 0){
            let value = this.residueAnnotations.get(residueId);
            if(value === void 0){
                return [];
            }
            
            return value;             
        }

        return void 0;
    }

    public static getResidueList():string[]|undefined{
        if(!this.subscribed || this.residueAnnotations === void 0){
            return void 0;
        }

        let rv:string[] = [];
        this.residueAnnotations.forEach((_,key,map)=>{
            if(rv.indexOf(key)<0){
                rv.push(key);
            }
        });

        return rv;
    }

    public static getChannelAnnotations(channelId:string):ChannelAnnotation[]|null|undefined{
        if(!this.subscribed){
            return void 0; 
        }

        if(this.channelAnnotations !== void 0){
            let value = this.channelAnnotations.get(channelId);
            if(value === void 0){
                return null;
            }

            return value;
        }

        return void 0;
    }

    public static getChannelAnnotation(channelId:string):ChannelAnnotation|null|undefined{
        if(!this.subscribed){
            return void 0; 
        }

        if(this.channelAnnotations !== void 0){
            let value = this.channelAnnotations.get(channelId);
            if(value === void 0){
                return null;
            }

            return value[0];
        }

        return void 0;
    }

    public static getProteinAnnotations():ProteinAnnotation[]|undefined{
            if(!this.subscribed){
                return void 0;
            }

            if(this.proteinAnnotations !== void 0){
                return this.proteinAnnotations;
            }

            return void 0;
    }
}