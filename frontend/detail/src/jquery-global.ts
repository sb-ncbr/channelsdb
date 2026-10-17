// Bootstrap 3's plugins extend the global jQuery, so it has to be set before they are imported (see jquery.ts)
import jQuery from 'jquery';

(window as any).jQuery = jQuery;
