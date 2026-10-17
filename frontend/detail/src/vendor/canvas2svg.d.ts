// Canvas 2D context drawing into an SVG document, used for the SVG export
export const C2S: new (width: number, height: number) => CanvasRenderingContext2D & {
    getSvg(): SVGSVGElement;
    getSerializedSvg(fixNamedEntities?: boolean): string;
};
