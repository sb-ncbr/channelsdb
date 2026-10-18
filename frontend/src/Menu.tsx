/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as React from 'react';

export class Menu extends React.Component<{}, {}> {
    render() {
        // On narrow screens, the links are shown by the toggle button
        return <nav className='navbar navbar-expand-md bg-body-tertiary border rounded mb-4'>
            <div className='container-fluid'>
                <a className='navbar-brand' href='index.html'><img height='70' style={{margin: '10px 0'}} src={'assets/img/channelsdb2_logo.png'}/></a>
                <button className='navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#navbar' aria-controls='navbar' aria-expanded='false' aria-label='Toggle navigation'>
                    <span className='navbar-toggler-icon'></span>
                </button>
                <div id='navbar' className='collapse navbar-collapse'>
                    <ul className='navbar-nav ms-auto'>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='index.html'>Search</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='methods.html'>Methods</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='/api' target='_blank'>API</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='documentation.html'>Documentation</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='https://moleonline.cz' target='_blank'>MOLE</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='https://loschmidt.chemi.muni.cz/caverweb/' target='_blank'>CAVER</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='contribute.html'>Contribute</a></li>
                        <li className='nav-item' style={{marginTop: '12px', fontSize: '120%', fontWeight: 'bold'}}><a className='nav-link' href='about.html'>About</a></li>
                    </ul>
                </div>
            </div>
        </nav>;
    }
}
