"use strict";
/**
 * Copyright (c) 2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const tslib_1 = require("tslib");
const argparse = tslib_1.__importStar(require("argparse"));
function getConfig() {
    const cmdParser = new argparse.ArgumentParser({
        add_help: true
    });
    cmdParser.add_argument('--working-folder', { help: 'Working forlder path.', required: true });
    cmdParser.add_argument('--port', { help: 'Server port. Altenatively use ENV variable PORT.', type: 'int', required: false });
    cmdParser.add_argument('--api-prefix', { help: 'Server API prefix.', default: '', required: false });
    cmdParser.add_argument('--max-states', { help: 'Maxinum number of states that could be saved.', default: 40, type: 'int', required: false });
    const config = cmdParser.parse_args();
    if (!config.port)
        config.port = process.env.port || 1339;
    return config;
}
exports.getConfig = getConfig;