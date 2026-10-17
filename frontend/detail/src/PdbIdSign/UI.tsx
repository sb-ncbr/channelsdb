import React from "react";
import { GlobalRouter } from "../SimpleRouter";

export class PdbIdSign extends React.Component<{}, {}> {

    componentDidMount() {
    }

    componentWillUnmount(){
    }

    render() {
        let pid = GlobalRouter.getCurrentPid();
        let subDB = GlobalRouter.getCurrentDB();
        return <div id="pdbid-sign" className="current-pdbid-sign">
            <a href={subDB === "pdb" ? `https://pdbe.org/${pid}` : `https://alphafill.eu/model?id=${pid}`} style={subDB === "pdb" ? {} : {fontSize: "14px"}} target="_blank">{pid} <span className="glyphicon glyphicon-new-window href-ico"></span></a>
        </div>
    }
}

export default PdbIdSign;