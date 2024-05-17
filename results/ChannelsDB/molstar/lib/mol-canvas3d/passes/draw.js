/**
 * Copyright (c) 2019-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author Áron Samuel Kovács <aron.kovacs@mail.muni.cz>
 * @author Gianluca Tomasello <giagitom@gmail.com>
 */
import { createNullRenderTarget } from '../../mol-gl/webgl/render-target';
import { ValueCell } from '../../mol-util';
import { Vec2 } from '../../mol-math/linear-algebra';
import { StereoCamera } from '../camera/stereo';
import { WboitPass } from './wboit';
import { DpoitPass } from './dpoit';
import { AntialiasingPass, PostprocessingPass } from './postprocessing';
import { MarkingPass } from './marking';
import { createCopyRenderable } from '../../mol-gl/compute/util';
import { isDebugMode, isTimingMode } from '../../mol-util/debug';
export class DrawPass {
    setTransparency(transparency) {
        if (transparency === 'wboit') {
            this.transparencyMode = this.wboit.supported ? 'wboit' : 'blended';
            if (isDebugMode && !this.wboit.supported) {
                console.log('Missing "wboit" support, falling back to "blended".');
            }
        }
        else if (transparency === 'dpoit') {
            this.transparencyMode = this.dpoit.supported ? 'dpoit' : 'blended';
            if (isDebugMode && !this.dpoit.supported) {
                console.log('Missing "dpoit" support, falling back to "blended".');
            }
        }
        else {
            this.transparencyMode = 'blended';
        }
        this.depthTextureOpaque.detachFramebuffer(this.postprocessing.target.framebuffer, 'depth');
    }
    get transparency() {
        return this.transparencyMode;
    }
    constructor(webgl, assetManager, width, height, transparency) {
        this.webgl = webgl;
        this.transparencyMode = 'blended';
        const { extensions, resources, isWebGL2 } = webgl;
        this.drawTarget = createNullRenderTarget(webgl.gl);
        this.colorTarget = webgl.createRenderTarget(width, height, true, 'uint8', 'linear');
        this.packedDepth = !extensions.depthTexture;
        this.depthTargetTransparent = webgl.createRenderTarget(width, height);
        this.depthTextureTransparent = this.depthTargetTransparent.texture;
        this.depthTargetOpaque = this.packedDepth ? webgl.createRenderTarget(width, height) : null;
        this.depthTextureOpaque = this.depthTargetOpaque ? this.depthTargetOpaque.texture : resources.texture('image-depth', 'depth', isWebGL2 ? 'float' : 'ushort', 'nearest');
        if (!this.packedDepth) {
            this.depthTextureOpaque.define(width, height);
        }
        this.wboit = new WboitPass(webgl, width, height);
        this.dpoit = new DpoitPass(webgl, width, height);
        this.marking = new MarkingPass(webgl, width, height);
        this.postprocessing = new PostprocessingPass(webgl, assetManager, this);
        this.antialiasing = new AntialiasingPass(webgl, this);
        this.copyFboTarget = createCopyRenderable(webgl, this.colorTarget.texture);
        this.copyFboPostprocessing = createCopyRenderable(webgl, this.postprocessing.target.texture);
        this.setTransparency(transparency);
    }
    reset() {
        this.wboit.reset();
        this.dpoit.reset();
    }
    setSize(width, height) {
        const w = this.colorTarget.getWidth();
        const h = this.colorTarget.getHeight();
        if (width !== w || height !== h) {
            this.colorTarget.setSize(width, height);
            this.depthTargetTransparent.setSize(width, height);
            if (this.depthTargetOpaque) {
                this.depthTargetOpaque.setSize(width, height);
            }
            else {
                this.depthTextureOpaque.define(width, height);
            }
            ValueCell.update(this.copyFboTarget.values.uTexSize, Vec2.set(this.copyFboTarget.values.uTexSize.ref.value, width, height));
            ValueCell.update(this.copyFboPostprocessing.values.uTexSize, Vec2.set(this.copyFboPostprocessing.values.uTexSize.ref.value, width, height));
        }
        if (this.wboit.supported) {
            this.wboit.setSize(width, height);
        }
        if (this.dpoit.supported) {
            this.dpoit.setSize(width, height);
        }
        this.marking.setSize(width, height);
        this.postprocessing.setSize(width, height);
        this.antialiasing.setSize(width, height);
    }
    _renderDpoit(renderer, camera, scene, iterations, transparentBackground, postprocessingProps) {
        if (!this.dpoit.supported)
            throw new Error('expected dpoit to be supported');
        this.depthTextureOpaque.attachFramebuffer(this.colorTarget.framebuffer, 'depth');
        renderer.clear(true);
        // render opaque primitives
        if (scene.hasOpaque) {
            renderer.renderDpoitOpaque(scene.primitives, camera, null);
        }
        if (PostprocessingPass.isEnabled(postprocessingProps)) {
            if (PostprocessingPass.isTransparentOutlineEnabled(postprocessingProps)) {
                this.depthTargetTransparent.bind();
                renderer.clearDepth(true);
                if (scene.opacityAverage < 1) {
                    renderer.renderDepthTransparent(scene.primitives, camera, this.depthTextureOpaque);
                }
            }
            this.postprocessing.render(camera, false, transparentBackground, renderer.props.backgroundColor, postprocessingProps, renderer.light);
        }
        this.depthTextureOpaque.detachFramebuffer(this.colorTarget.framebuffer, 'depth');
        // render transparent primitives
        if (scene.opacityAverage < 1) {
            const target = PostprocessingPass.isEnabled(postprocessingProps)
                ? this.postprocessing.target : this.colorTarget;
            const dpoitTextures = this.dpoit.bind();
            renderer.renderDpoitTransparent(scene.primitives, camera, this.depthTextureOpaque, dpoitTextures);
            for (let i = 0; i < iterations; i++) {
                if (isTimingMode)
                    this.webgl.timer.mark('DpoitPass.layer');
                const dpoitTextures = this.dpoit.bindDualDepthPeeling();
                renderer.renderDpoitTransparent(scene.primitives, camera, this.depthTextureOpaque, dpoitTextures);
                target.bind();
                this.dpoit.renderBlendBack();
                if (isTimingMode)
                    this.webgl.timer.markEnd('DpoitPass.layer');
            }
            // evaluate dpoit
            target.bind();
            this.dpoit.render();
        }
        // render transparent volumes
        if (scene.volumes.renderables.length > 0) {
            renderer.renderDpoitVolume(scene.volumes, camera, this.depthTextureOpaque);
        }
    }
    _renderWboit(renderer, camera, scene, transparentBackground, postprocessingProps) {
        if (!this.wboit.supported)
            throw new Error('expected wboit to be supported');
        this.depthTextureOpaque.attachFramebuffer(this.colorTarget.framebuffer, 'depth');
        renderer.clear(true);
        // render opaque primitives
        if (scene.hasOpaque) {
            renderer.renderWboitOpaque(scene.primitives, camera, null);
        }
        if (PostprocessingPass.isEnabled(postprocessingProps)) {
            if (PostprocessingPass.isTransparentOutlineEnabled(postprocessingProps)) {
                this.depthTargetTransparent.bind();
                renderer.clearDepth(true);
                if (scene.opacityAverage < 1) {
                    renderer.renderDepthTransparent(scene.primitives, camera, this.depthTextureOpaque);
                }
            }
            this.postprocessing.render(camera, false, transparentBackground, renderer.props.backgroundColor, postprocessingProps, renderer.light);
        }
        // render transparent primitives and volumes
        if (scene.opacityAverage < 1 || scene.volumes.renderables.length > 0) {
            this.wboit.bind();
            if (scene.opacityAverage < 1) {
                renderer.renderWboitTransparent(scene.primitives, camera, this.depthTextureOpaque);
            }
            if (scene.volumes.renderables.length > 0) {
                renderer.renderWboitTransparent(scene.volumes, camera, this.depthTextureOpaque);
            }
            // evaluate wboit
            if (PostprocessingPass.isEnabled(postprocessingProps)) {
                this.postprocessing.target.bind();
            }
            else {
                this.colorTarget.bind();
            }
            this.wboit.render();
        }
    }
    _renderBlended(renderer, camera, scene, toDrawingBuffer, transparentBackground, postprocessingProps) {
        var _a, _b, _c, _d;
        if (toDrawingBuffer) {
            this.drawTarget.bind();
        }
        else {
            if (!this.packedDepth) {
                this.depthTextureOpaque.attachFramebuffer(this.colorTarget.framebuffer, 'depth');
            }
            else {
                this.colorTarget.bind();
            }
        }
        renderer.clear(true);
        if (scene.hasOpaque) {
            renderer.renderBlendedOpaque(scene.primitives, camera, null);
        }
        if (!toDrawingBuffer) {
            // do a depth pass if not rendering to drawing buffer and
            // extensions.depthTexture is unsupported (i.e. depthTarget is set)
            if (this.depthTargetOpaque) {
                this.depthTargetOpaque.bind();
                renderer.clearDepth(true);
                renderer.renderDepthOpaque(scene.primitives, camera, null);
                this.colorTarget.bind();
            }
            if (PostprocessingPass.isEnabled(postprocessingProps)) {
                if (!this.packedDepth) {
                    this.depthTextureOpaque.detachFramebuffer(this.postprocessing.target.framebuffer, 'depth');
                }
                else {
                    (_a = this.colorTarget.depthRenderbuffer) === null || _a === void 0 ? void 0 : _a.detachFramebuffer(this.postprocessing.target.framebuffer);
                }
                if (PostprocessingPass.isTransparentOutlineEnabled(postprocessingProps)) {
                    this.depthTargetTransparent.bind();
                    renderer.clearDepth(true);
                    if (scene.opacityAverage < 1) {
                        renderer.renderDepthTransparent(scene.primitives, camera, this.depthTextureOpaque);
                    }
                }
                this.postprocessing.render(camera, false, transparentBackground, renderer.props.backgroundColor, postprocessingProps, renderer.light);
                if (!this.packedDepth) {
                    this.depthTextureOpaque.attachFramebuffer(this.postprocessing.target.framebuffer, 'depth');
                }
                else {
                    (_b = this.colorTarget.depthRenderbuffer) === null || _b === void 0 ? void 0 : _b.attachFramebuffer(this.postprocessing.target.framebuffer);
                }
            }
            if (scene.volumes.renderables.length > 0) {
                const target = PostprocessingPass.isEnabled(postprocessingProps)
                    ? this.postprocessing.target : this.colorTarget;
                if (!this.packedDepth) {
                    this.depthTextureOpaque.detachFramebuffer(target.framebuffer, 'depth');
                }
                else {
                    (_c = this.colorTarget.depthRenderbuffer) === null || _c === void 0 ? void 0 : _c.detachFramebuffer(target.framebuffer);
                }
                target.bind();
                renderer.renderBlendedVolume(scene.volumes, camera, this.depthTextureOpaque);
                if (!this.packedDepth) {
                    this.depthTextureOpaque.attachFramebuffer(target.framebuffer, 'depth');
                }
                else {
                    (_d = this.colorTarget.depthRenderbuffer) === null || _d === void 0 ? void 0 : _d.attachFramebuffer(target.framebuffer);
                }
                target.bind();
            }
        }
        if (scene.opacityAverage < 1) {
            renderer.renderBlendedTransparent(scene.primitives, camera, null);
        }
    }
    _render(renderer, camera, scene, helper, toDrawingBuffer, transparentBackground, props) {
        const volumeRendering = scene.volumes.renderables.length > 0;
        const postprocessingEnabled = PostprocessingPass.isEnabled(props.postprocessing);
        const antialiasingEnabled = AntialiasingPass.isEnabled(props.postprocessing);
        const markingEnabled = MarkingPass.isEnabled(props.marking);
        const { x, y, width, height } = camera.viewport;
        renderer.setViewport(x, y, width, height);
        renderer.update(camera, scene);
        if (transparentBackground && !antialiasingEnabled && toDrawingBuffer) {
            this.drawTarget.bind();
            renderer.clear(false);
        }
        let oitEnabled = false;
        if (this.transparencyMode === 'wboit' && this.wboit.supported) {
            this._renderWboit(renderer, camera, scene, transparentBackground, props.postprocessing);
            oitEnabled = true;
        }
        else if (this.transparencyMode === 'dpoit' && this.dpoit.supported) {
            this._renderDpoit(renderer, camera, scene, props.dpoitIterations, transparentBackground, props.postprocessing);
            oitEnabled = true;
        }
        else {
            this._renderBlended(renderer, camera, scene, !volumeRendering && !postprocessingEnabled && !antialiasingEnabled && toDrawingBuffer, transparentBackground, props.postprocessing);
        }
        const target = postprocessingEnabled
            ? this.postprocessing.target
            : !toDrawingBuffer || volumeRendering || oitEnabled
                ? this.colorTarget
                : this.drawTarget;
        if (markingEnabled && scene.markerAverage > 0) {
            const markingDepthTest = props.marking.ghostEdgeStrength < 1;
            if (markingDepthTest && scene.markerAverage !== 1) {
                this.marking.depthTarget.bind();
                renderer.clear(false, true);
                renderer.renderMarkingDepth(scene.primitives, camera, null);
            }
            this.marking.maskTarget.bind();
            renderer.clear(false, true);
            renderer.renderMarkingMask(scene.primitives, camera, markingDepthTest ? this.marking.depthTarget.texture : null);
            this.marking.update(props.marking);
            this.marking.render(camera.viewport, target);
        }
        else {
            target.bind();
        }
        if (helper.debug.isEnabled) {
            helper.debug.syncVisibility();
            renderer.renderBlended(helper.debug.scene, camera);
        }
        if (helper.handle.isEnabled) {
            renderer.renderBlended(helper.handle.scene, camera);
        }
        if (helper.camera.isEnabled) {
            helper.camera.update(camera);
            renderer.update(helper.camera.camera, helper.camera.scene);
            renderer.renderBlended(helper.camera.scene, helper.camera.camera);
        }
        if (antialiasingEnabled) {
            this.antialiasing.render(camera, toDrawingBuffer, props.postprocessing);
        }
        else if (toDrawingBuffer) {
            this.drawTarget.bind();
            this.webgl.state.disable(this.webgl.gl.DEPTH_TEST);
            if (postprocessingEnabled) {
                this.copyFboPostprocessing.render();
            }
            else if (volumeRendering || oitEnabled) {
                this.copyFboTarget.render();
            }
        }
        this.webgl.gl.flush();
    }
    render(ctx, props, toDrawingBuffer) {
        if (isTimingMode)
            this.webgl.timer.mark('DrawPass.render');
        const { renderer, camera, scene, helper } = ctx;
        this.postprocessing.setTransparentBackground(props.transparentBackground);
        const transparentBackground = props.transparentBackground || this.postprocessing.background.isEnabled(props.postprocessing.background);
        renderer.setTransparentBackground(transparentBackground);
        renderer.setDrawingBufferSize(this.colorTarget.getWidth(), this.colorTarget.getHeight());
        renderer.setPixelRatio(this.webgl.pixelRatio);
        if (StereoCamera.is(camera)) {
            if (isTimingMode)
                this.webgl.timer.mark('StereoCamera.left');
            this._render(renderer, camera.left, scene, helper, toDrawingBuffer, transparentBackground, props);
            if (isTimingMode)
                this.webgl.timer.markEnd('StereoCamera.left');
            if (isTimingMode)
                this.webgl.timer.mark('StereoCamera.right');
            this._render(renderer, camera.right, scene, helper, toDrawingBuffer, transparentBackground, props);
            if (isTimingMode)
                this.webgl.timer.markEnd('StereoCamera.right');
        }
        else {
            this._render(renderer, camera, scene, helper, toDrawingBuffer, transparentBackground, props);
        }
        if (isTimingMode)
            this.webgl.timer.markEnd('DrawPass.render');
    }
    getColorTarget(postprocessingProps) {
        if (AntialiasingPass.isEnabled(postprocessingProps)) {
            return this.antialiasing.target;
        }
        else if (PostprocessingPass.isEnabled(postprocessingProps)) {
            return this.postprocessing.target;
        }
        return this.colorTarget;
    }
}