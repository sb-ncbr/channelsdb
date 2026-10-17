/**
 * Copyright (c) 2024 channelsdb contributors, licensed under Apache 2.0, See LICENSE file for more info.
 *
 * @author Dušan Veľký <dvelky@mail.muni.cz>
 */
import type { Context } from "../Context";
import { Plugin } from "molstar/lib/mol-plugin-ui/plugin";
import { GlobalRouter } from "../SimpleRouter";
import React from "react";
import "molstar/lib/mol-plugin-ui/skin/dark.scss";

export class Viewer extends React.Component<{ context: Context }> {
    
    render() {
        let pid = GlobalRouter.getCurrentPid();
        let subDB = GlobalRouter.getCurrentDB();
        this.props.context.canvas.setBgColor({r: 0, g: 0, b: 0})
        if (subDB === 'pdb') {
            this.props.context.load(`https://models.rcsb.org/${pid}.bcif`, true)
            // this.props.context.load(`https://www.ebi.ac.uk/pdbe/entry-files/download/${pid}.bcif`)
        } else {
            this.props.context.load(`https://alphafill.eu/v1/aff/${pid.toLocaleUpperCase()}`, false);
        }

        return <Plugin plugin={this.props.context.plugin} />;
    }
}
