/**
 * jQuery with the Bootstrap plugins the page uses: tabs, tooltips and dropdowns (transition animates them).
 */

import jQuery from 'jquery';
import './jquery-global';
import 'bootstrap/js/transition.js';
import 'bootstrap/js/tab.js';
import 'bootstrap/js/tooltip.js';
import 'bootstrap/js/dropdown.js';

// Untyped, as the code uses Bootstrap's plugins and loosely typed values
const $: any = jQuery;

export default $;
