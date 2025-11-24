import { Tunnel } from "../DataInterface";
import { Numbers } from "./Numbers";

export class Tunnels{
    public static getLength(tunnel:Tunnel):number{
        let len = tunnel.Layers.LayersInfo[tunnel.Layers.LayersInfo.length - 1].LayerGeometry.EndDistance;
        len = Numbers.roundToDecimal(len,1);//Math.round(len*10)/10;
        return len;
    }

    public static getBottleneck(tunnel: Tunnel):string{        
        let bneck = "<Unknown>";
        for(let element of tunnel.Layers.LayersInfo){
            if(element.LayerGeometry.Bottleneck || element.LayerGeometry.bottleneck){
                let val = element.LayerGeometry.MinRadius;
                bneck = (Math.round(val*10)/10).toString();
                break;
            }
        }

        return bneck;
    }
}
