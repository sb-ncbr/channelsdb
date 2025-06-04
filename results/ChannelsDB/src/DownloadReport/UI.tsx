
import React from "react";
import { GlobalRouter } from "../SimpleRouter";
import { Context } from "../Context";

export class DownloadReport extends React.Component<{}, {disabled: boolean}> {
    state = { disabled: false };

    private apiStatusWaitHandler(){
        this.setState({disabled: true})
    }
    
    componentDidMount() {
        Context.subscribeForApiStatus(this.apiStatusWaitHandler.bind(this));
    }

    componentWillUnmount(){
    }

    render() {
        return <div id="download-report" className="download-button">
            <DownloadResultsMenu disabled={this.state.disabled}/>
        </div>
    }
}

class BootstrapDropDownMenuItem extends React.Component<{link: string, linkText:string, targetBlank: boolean},{}>{
    render(){
        return(
            <li><a target={(this.props.targetBlank)?"_blank":""} href={this.props.link}>{this.props.linkText}</a></li>
        );
    }
}

class BootstrapDropDownMenuElementItem extends React.Component<{link: string, linkElement:JSX.Element, targetBlank: boolean},{}>{
    render(){
        return(
            <li><a target={(this.props.targetBlank)?"_blank":""} href={this.props.link}>{this.props.linkElement}</a></li>
        );
    }
}

class BootstrapDropDownMenuButton extends React.Component<{label: string, items: JSX.Element[], disabled: boolean},{}>{
    render(){
        return <div className="btn-group dropdown">
                <button type="button" className={this.props.disabled ? "download dropdown-toggle disabled" : "download dropdown-toggle"} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {this.props.label} <span className="glyphicon glyphicon-download"></span>
                </button>
                <ul className="dropdown-menu">
                    {this.props.items}
                </ul>
            </div>
    }
}

class DownloadResultsMenu extends React.Component<{disabled: boolean},{}>{
    render(){
        let protein_id = GlobalRouter.getCurrentPid();
        let subDB = GlobalRouter.getCurrentDB();
        let url = GlobalRouter.getChannelsURL();
        let linkBase = `${url}/download/${subDB}/${protein_id}`;
        let items:JSX.Element[] = [];
    
        items.push(
            <BootstrapDropDownMenuItem linkText=".zip" link={`${linkBase}/zip`} targetBlank={true} />
        );
        items.push(
            <BootstrapDropDownMenuItem linkText=".pdb" link={`${linkBase}/pdb`} targetBlank={true} />
        );
        items.push(
            <BootstrapDropDownMenuItem linkText=".json" link={`${linkBase}/json`} targetBlank={true} />
        );
        items.push(
            <BootstrapDropDownMenuItem linkText=".py" link={`${linkBase}/pymol`} targetBlank={true} />
        );
        items.push(
            <BootstrapDropDownMenuItem linkText=".vmd" link={`${linkBase}/vmd`} targetBlank={true} />
        );
        items.push(
            <BootstrapDropDownMenuItem linkText=".png" link={`${linkBase}/png`} targetBlank={true} />
        );
        items.push(
            <BootstrapDropDownMenuItem linkText="chimera" link={`${linkBase}/chimera`} targetBlank={true} />
        );
        
        return <BootstrapDropDownMenuButton label="Download report" items={items} disabled={this.props.disabled} />
    }
}

export default DownloadReport;