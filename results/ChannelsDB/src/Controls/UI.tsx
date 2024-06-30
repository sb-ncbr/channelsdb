/**
 * Copyright (c) 2024 channelsdb contributors, licensed under Apache 2.0, See LICENSE file for more info.
 *
 * @author Dušan Veľký <dvelky@mail.muni.cz>
 */
import React from "react";
import DownloadReport from "../DownloadReport/UI";
import PdbIdSign from "../PdbIdSign/UI";
import { Context } from "../Context";

export class Controls extends React.Component<{controller: Context}, {viewerExpanded: boolean}> {
    state = { viewerExpanded: false };

    componentDidMount() {
        this.props.controller.plugin.layout.events.updated.subscribe(() => { this.setState({viewerExpanded: this.props.controller.plugin.layout.state.isExpanded}) });
    }

    render() {
        return this.state.viewerExpanded
        ? (<div></div>)
        : (<div className="channelsdb-controls">
            <div className="home-button" title="Home"><a href="/"><span className="glyphicon glyphicon-home" /></a></div>
            <PdbIdSign />
            <DownloadReport />
        </div>)
    }
}