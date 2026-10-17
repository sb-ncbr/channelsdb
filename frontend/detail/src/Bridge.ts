type HandlerType = "ChannelSelect";
export type Handler<T,R> = (args:T)=>R;
export class Events{
    private static handlers: Map<HandlerType,Handler<any,any>[]> = new Map<HandlerType,Handler<any,any>[]>();
    
    public static subscribeChannelSelect(handler:Handler<string,void>){
        let hndlrs = this.handlers.get("ChannelSelect");
        if(hndlrs===void 0){
            hndlrs = [];
        }
        hndlrs.push(handler);
        this.handlers.set("ChannelSelect",hndlrs);
    }

    public static invokeChannelSelect(channelId:string){
        let hndlrs = this.handlers.get("ChannelSelect");
        if(hndlrs === void 0){
            return;
        }
        
        for(let h of hndlrs){
            h(channelId);
        }
    }
}
