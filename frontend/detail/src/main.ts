/**
 * Entry point: loads the styles, then starts the application.
 */

import '../css/AglomeredParameters.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/ChannelsDescriptions.css';
import '../css/datagrid.css';
import '../css/DownloadReport.css';
import '../css/LayerVizualizerStyles.css';
import '../css/lining-residues.css';
import '../css/PDBID.css';
import '../css/style.css';
import '../css/tooltips.css';

// Renders the application when imported
import './App';
import { initLayout } from './CommonUtils/Layout';

initLayout();
