export function getTabLinkById(tabbedElementId:string, tabId:string){
    const links = document.querySelectorAll<HTMLAnchorElement>(`#${tabbedElementId} li a`);
    return [...links].find((link) => link.getAttribute('href') === `#${tabbedElementId}-${tabId}`)!;
}

function isShown(link: HTMLAnchorElement) {
    const pane = document.querySelector(link.getAttribute('href')!)!;
    return link.parentElement!.classList.contains('active') && getComputedStyle(pane).display !== 'none';
}

export function isActive(tabbedElementId:string, tabId:string){
    return getTabLinkById(tabbedElementId,tabId).parentElement!.classList.contains('active');
}

export function activateTab(tabbedElementId:string, tabId:string){
    getTabLinkById(tabbedElementId,tabId).click();
}

export function doAfterTabActivated(tabbedElementId:string, tabId:string, callback:()=>void){
    const checker = () => {
        if(isShown(getTabLinkById(tabbedElementId,tabId))){
            callback();
        }
        else{
            window.setTimeout(checker,10);
        }
    };
    window.setTimeout(checker,10);
}

export default {
    getTabLinkById,
    isActive,
    activateTab,
    doAfterTabActivated,
}
