/**
 * Bootstrap's components used by the page. Tabs and dropdowns work through their data-bs-toggle attributes.
 */

import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/tab';
import Tooltip from 'bootstrap/js/dist/tooltip';

/** Shows the title of the matching elements as a tooltip, placed by their data-bs-placement */
export function initTooltips(selector: string, options: Partial<Tooltip.Options> = {}) {
    document.querySelectorAll(selector).forEach((element) => Tooltip.getOrCreateInstance(element, options));
}
