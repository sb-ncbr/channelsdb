import { Messages } from "../StaticData";

export function getMessageOrLeaveText(text:string){
    let message = Messages.get(text);
    if(message === void 0){
        return text;
    }

    return message;
}

export function hasTooltipText(messageKey:string){
    let message = Messages.get(`tooltip-${messageKey}`);
    return (message !== void 0);
}

export default {
    getMessageOrLeaveText,
    hasTooltipText
}
