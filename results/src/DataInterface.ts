import { Shape } from "molstar/lib/mol-model/shape"
import { Color } from "molstar/lib/mol-util/color"

export interface LayerGeometry{
    MinRadius:number,
    MinFreeRadius:number,
    StartDistance:number,
    EndDistance:number,
    LocalMinimum: boolean,
    Bottleneck: boolean,
    bottleneck: boolean
};
export interface LayerGeometryCaver{
    MinRadius:number,
    MinFreeRadius:number,
    StartDistance:number,
    EndDistance:number,
    LocalMinimum: boolean,
    bottleneck: boolean
};
export interface Layerweightedproperties{
    Hydrophobicity: number,
    Hydropathy: number,
    Polarity: number,
    Mutability: number
};
export interface LayersInfo{
    LayerGeometry:LayerGeometry,
    Residues:string[],
    FlowIndices:string[],
    Properties:Properties 
};
export interface LayersInfoCaver{
    LayerGeometry:LayerGeometryCaver,
    Residues:string[],
    FlowIndices:string[],
    Properties:Properties 
};
export interface Layers{
    ResidueFlow:string[],
    HetResidues:any[], //Not Used
    LayerWeightedProperties:Layerweightedproperties
    LayersInfo:LayersInfo[]
};
export interface LayersCaver{
    ResidueFlow:string[],
    HetResidues:any[], //Not Used
    LayerWeightedProperties:Layerweightedproperties
    LayersInfo:LayersInfoCaver[]
};
export interface Profile{
    Radius: number,
    FreeRadius: number,
    T: number,
    Distance: number,
    X: number,
    Y: number,
    Z: number,
    Charge: number
};
export interface Properties{
    Charge: number,
    NumPositives: number,
    NumNegatives: number,
    Hydrophobicity: number,
    Hydropathy: number,
    Polarity: number,
    Mutability: number
};
export interface Tunnel{
    Type: string,
    Id: string,
    Cavity: string,
    Auto: boolean,
    Properties: Properties,
    Profile: Profile[],
    Layers: Layers
};
export interface TunnelMetaInfo{
    __id:string,
    __isVisible:boolean,
    __color:Color,
    __isBusy:boolean,
    __ref: string,
    __group: number,
    __loci: Shape.Loci,
};
export interface TunnelCaver{
    Type: string,
    Id: string,
    Cavity: string,
    Auto: boolean,
    Properties: Properties,
    Profile: Profile[],
    Layers: LayersCaver
};
export interface MoleData{
    Channels:{
        Tunnels:Tunnel[],
        MergedPores:Tunnel[],
        Pores:Tunnel[],
        Paths:Tunnel[]
    }
};
export interface ChannelsDBData{
    Channels:{
        /*
        Tunnels:Tunnel[],
        MergedPores:Tunnel[],
        Pores:Tunnel[],
        Paths:Tunnel[]
        */
        CSATunnels_MOLE: Tunnel[],
        CSATunnels_Caver: Tunnel[],
        ReviewedChannels_MOLE: Tunnel[],
        ReviewedChannels_Caver: Tunnel[],
        CofactorTunnels_MOLE: Tunnel[],
        CofactorTunnels_Caver: Tunnel[],
        TransmembranePores_MOLE: Tunnel[],
        TransmembranePores_Caver: Tunnel[],
        ProcognateTunnels_MOLE: Tunnel[],
        ProcognateTunnels_Caver: Tunnel[],
        AlphaFillTunnels_MOLE: Tunnel[],
        AlphaFillTunnels_Caver: Tunnel[]
    },
    Annotations:AnnotationObject[]
}

export type ChannelSourceData = {
    id?: string | number,
    type?: string,
    label?: string,
    description?: string
  }

export interface AnnotationObject{
    Id: string,
    Name: string,
    Description: string,
    Reference: string,
    ReferenceType: string
};

//--

export interface LayerData{
    StartDistance: number,
    EndDistance: number,
    MinRadius: number,
    MinFreeRadius: number,
    Properties: any,
    Residues: any
};

export function convertLayersToLayerData(layersObject:Layers):LayerData[]{
        let layersData: LayerData[] = [];
        let layerCount = layersObject.LayersInfo.length;
        
        /*
        export interface LayerData{
        StartDistance: number,
        EndDistance: number,
        MinRadius: number,
        MinFreeRadius: number,
        Properties: any,
        Residues: any
        */

        for(let i=0;i<layerCount;i++){
            /*
            Hydrophobicity: number,
            Hydropathy: number,
            Polarity: number,
            Mutability: number
            */
            let properties = {
                Charge: layersObject.LayersInfo[i].Properties.Charge,
                NumPositives: layersObject.LayersInfo[i].Properties.NumPositives,
                NumNegatives: layersObject.LayersInfo[i].Properties.NumNegatives,
                Hydrophobicity: layersObject.LayerWeightedProperties.Hydrophobicity,
                Hydropathy: layersObject.LayerWeightedProperties.Hydropathy,
                Polarity: layersObject.LayerWeightedProperties.Polarity,
                Mutability: layersObject.LayerWeightedProperties.Mutability
            };
            layersData.push({
                StartDistance: layersObject.LayersInfo[i].LayerGeometry.StartDistance,
                EndDistance: layersObject.LayersInfo[i].LayerGeometry.EndDistance,
                MinRadius: layersObject.LayersInfo[i].LayerGeometry.MinRadius,
                MinFreeRadius: layersObject.LayersInfo[i].LayerGeometry.MinFreeRadius,
                Properties: layersObject.LayersInfo[i].Properties,//? Proc sem davat weighted properties?
                Residues: layersObject.LayersInfo[i].Residues
            });
        }

        return layersData;
    }

export namespace Annotations{
    export interface ChannelsDBData{
        EntryAnnotations: ProteinAnnotation[],
        ResidueAnnotations: ResidueAnnotations
    };

    export interface ProteinAnnotation{
        Function: string,
        Name: string,
        Catalytics: string[],
        UniProtId: string
    };

    export interface ResidueAnnotations{
        ChannelsDB: Annotation[],
        UniProt: Annotation[]
    };

    export interface Annotation {
        Id: string,
        Chain: string,
        Text: string,
        Reference: string,
        ReferenceType: string
    }
}