//
// stubs/index.ets.d.ts
// ArkTS（HarmonyOS NAPI）端类型声明，1:1 对齐 src/typesetting_napi.cpp 和
// src/badge_engine_napi.cpp 的 napi_module 注册。
//
// 与 Node.js 版本（stubs/index.d.ts）的差异：
//   1. ArkTS 不支持 branded type → handle 用 opaque 标记接口
//   2. ArkTS 不支持 const enum / function overloading 重载 → 用 const object
//      + 联合类型 + 可选参数
//   3. 模块名跟 native_api 注册的 nm_modname 对应：
//        - "typesetting"   → ArkTS:  import ts from 'libtypesetting.so'
//        - "badge_engine"  → ArkTS:  import badge from 'libbadge_engine.so'
//   4. 任何 .cpp 改动必须同步本文件，并跑 tsc parse 检查（README 写了一行）
//
// 同步源：本文件 = stubs/index.d.ts 的 ArkTS 等价物。
//

// ---------------------------------------------------------------------------
// typesetting 模块
// ---------------------------------------------------------------------------
declare module 'libtypesetting.so' {
    /** Opaque 句柄。ArkTS 把 napi_external 当成 object，业务侧请勿伪造 */
    export interface TypesettingHandle {
        readonly __opaque: 'typesetting';
    }

    export interface CreateEngineOptions {
        fontScale?: number;
        lineHeightMultiplier?: number;
        locale?: string;
    }

    export interface LayoutProfileInput {
        screenWidth: number;
        screenHeight: number;
        safeTop?: number;
        safeBottom?: number;
        safeLeft?: number;
        safeRight?: number;
        fontSize?: number;
        lineHeight?: number;
    }

    export interface LayoutProfile {
        marginTop: number;
        marginBottom: number;
        marginLeft: number;
        marginRight: number;
        headerY: number;
        footerY: number;
        suggestedFontSize: number;
        suggestedLineHeight: number;
    }

    /** computeLayoutProfile 返回，比 LayoutProfile 多 header/footer 字号 */
    export interface LayoutProfileFull {
        marginTop: number;
        marginBottom: number;
        marginLeft: number;
        marginRight: number;
        headerY: number;
        footerY: number;
        suggestedFontSize: number;
        suggestedLineHeight: number;
        headerFontSize: number;
        footerFontSize: number;
    }

    /** computeLayoutProfile 入参：不含 fontSize / lineHeight 覆盖 */
    export interface ComputeLayoutProfileInput {
        screenWidth: number;
        screenHeight: number;
        safeTop?: number;
        safeBottom?: number;
        safeLeft?: number;
        safeRight?: number;
    }

    export interface TypographyConfig {
        fontSize?: number;
        lineHeight?: number;
        fontFamily?: string;
        letterSpacing?: number;
    }

    export type TextAlignment = 'left' | 'center' | 'right' | 'justified';

    export interface StyleOverrides {
        fontFamily?: string;
        fontSize?: number;
        lineSpacingMultiplier?: number;
        letterSpacing?: number;
        wordSpacing?: number;
        paragraphSpacing?: number;
        textIndent?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        hyphenation?: boolean;
        locale?: string;
        alignment?: TextAlignment;
    }

    export interface PageSizeOverrides {
        width?: number;
        height?: number;
    }

    export interface LayoutSummary {
        chapterId: string;
        pageCount: number;
        totalBlocks: number;
        warningCount: number;
    }

    export interface RelayoutSummary {
        chapterId: string;
        pageCount: number;
        totalBlocks: number;
    }

    export interface PageInfo {
        chapterTitle: string;
        currentPage: number;
        totalPages: number;
        progress: number;
        firstBlockIndex: number;
        lastBlockIndex: number;
    }

    /** renderPage 当前是部分实现，仅含 PageInfo + pageIndex + partial=true */
    export interface RenderedPagePartial {
        pageIndex: number;
        chapterTitle: string;
        currentPage: number;
        totalPages: number;
        progress: number;
        firstBlockIndex: number;
        lastBlockIndex: number;
        partial: boolean;
    }

    export interface TextRun {
        text: string;
        x: number;
        y: number;
        width: number;
        fontFamily: string;
        fontSize: number;
        fontWeight: number;
        italic: boolean;
        blockIndex: number;
        inlineIndex: number;
        charOffset: number;
        charLength: number;
        isLink: boolean;
        href: string;
        isSuperscript: boolean;
        isSubscript: boolean;
        smallCaps: boolean;
    }

    export interface Line {
        x: number;
        y: number;
        width: number;
        height: number;
        ascent: number;
        descent: number;
        isLastLineOfParagraph: boolean;
        endsWithHyphen: boolean;
        runs: TextRun[];
    }

    export type DecorationType = 'hr' | 'image' | 'table';
    export interface Decoration {
        type: DecorationType;
        x: number;
        y: number;
        width: number;
        height: number;
        imageSrc: string;
        imageAlt: string;
        borderWidth: number;
    }

    export interface RenderedPage {
        pageIndex: number;
        width: number;
        height: number;
        contentX: number;
        contentY: number;
        contentWidth: number;
        contentHeight: number;
        firstBlockIndex: number;
        lastBlockIndex: number;
        lines: Line[];
        decorations: Decoration[];
    }

    export interface HitTestResult {
        found: boolean;
        blockIndex: number;
        lineIndex: number;
        runIndex: number;
        charOffset: number;
    }

    export interface WordRange {
        blockIndex: number;
        charOffset: number;
        charLength: number;
        text: string;
    }

    export interface SentenceRange {
        blockIndex: number;
        charOffset: number;
        charLength: number;
        text: string;
    }

    export interface Rect {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    export interface FontDescriptor {
        family?: string;
        size?: number;
        weight?: number;
        italic?: boolean;
    }

    export interface MeasureResult {
        width: number;
        height: number;
    }

    export interface FontMetrics {
        ascent: number;
        descent: number;
        leading: number;
        xHeight: number;
        capHeight: number;
        lineHeight: number;
    }

    // -------------------------------------------------------------------
    // 函数：与 src/typesetting_napi.cpp:697 注册顺序一致
    // ArkTS 不支持重载 → 多 arity 用可选参数表达
    // -------------------------------------------------------------------
    export function createEngine(options?: CreateEngineOptions): TypesettingHandle;
    export function destroyEngine(handle: TypesettingHandle): void;

    export function setLayoutProfile(
        handle: TypesettingHandle,
        config: LayoutProfileInput,
    ): LayoutProfile;

    export function setTheme(handle: TypesettingHandle, theme: string): void;

    export function setTypography(
        handle: TypesettingHandle,
        config: TypographyConfig,
    ): void;

    export function layoutHtml(
        handle: TypesettingHandle,
        html: string,
        chapterId: string,
        styleOverrides?: StyleOverrides,
        pageSize?: PageSizeOverrides,
    ): LayoutSummary;

    export function layoutHtmlWithCss(
        handle: TypesettingHandle,
        html: string,
        css: string,
        chapterId: string,
        styleOverrides?: StyleOverrides,
        pageSize?: PageSizeOverrides,
    ): LayoutSummary;

    export function relayout(
        handle: TypesettingHandle,
        styleOverrides?: StyleOverrides,
        pageSize?: PageSizeOverrides,
    ): RelayoutSummary;

    export function setChapterTitle(
        handle: TypesettingHandle,
        chapterId: string,
        title: string,
    ): void;

    export function evictChapter(handle: TypesettingHandle, chapterId: string): void;
    export function evictAll(handle: TypesettingHandle): void;

    export function renderPage(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
    ): RenderedPagePartial;

    export function getPageInfo(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
    ): PageInfo;

    export function hitTest(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        x: number,
        y: number,
    ): HitTestResult;

    export function wordAtPoint(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        x: number,
        y: number,
    ): WordRange;

    export function getSentences(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
    ): SentenceRange[];

    export function getAllSentences(
        handle: TypesettingHandle,
        chapterId: string,
    ): SentenceRange[];

    export function getRectsForRange(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        blockIndex: number,
        charOffset: number,
        charLength: number,
    ): Rect[];

    export function getBlockRect(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        blockIndex: number,
    ): Rect;

    export function measureText(
        handle: TypesettingHandle,
        text: string,
        font: FontDescriptor,
    ): MeasureResult;

    export function getFontMetrics(
        handle: TypesettingHandle,
        font: FontDescriptor,
    ): FontMetrics;

    export function computeLayoutProfile(
        config: ComputeLayoutProfileInput,
    ): LayoutProfileFull;
}

// ---------------------------------------------------------------------------
// badge_engine 模块
// ---------------------------------------------------------------------------
declare module 'libbadge_engine.so' {
    export interface BadgeHandle {
        readonly __opaque: 'badge_engine';
    }

    /**
     * 常量集合（src/badge_engine_napi.cpp:521-540 "constants" 对象）。
     * ArkTS 不支持 const enum，用 const 对象表达，数值对应 native 端 enum。
     */
    export const constants: {
        readonly RENDER_EMBEDDED: number;
        readonly RENDER_FULLSCREEN: number;

        readonly TOUCH_DOWN: number;
        readonly TOUCH_MOVE: number;
        readonly TOUCH_UP: number;
        readonly TOUCH_CANCEL: number;

        readonly CEREMONY_UNLOCK: number;

        readonly FACE_FRONT: number;
        readonly FACE_ICON: number;
        readonly FACE_BACK: number;

        readonly EVENT_CEREMONY_PHASE: number;
        readonly EVENT_CEREMONY_DONE: number;
        readonly EVENT_FLIP_TO_BACK: number;
        readonly EVENT_FLIP_TO_FRONT: number;
        readonly EVENT_HAPTIC: number;
        readonly EVENT_SOUND: number;
        readonly EVENT_READY: number;
    };

    export type RenderMode = number;
    export type TouchType = number;
    export type FaceIndex = number;
    export type CeremonyType = number;
    export type EventType = number;

    export interface BadgeEngineConfig {
        width: number;
        height: number;
        renderMode?: RenderMode;
        presetsPath?: string;
    }

    export interface TouchEvent {
        type: TouchType;
        x: number;
        y: number;
        pointerCount?: number;
        x2?: number;
        y2?: number;
    }

    export interface BadgeEvent {
        type: EventType;
        data: number;
        dataStr: string;
    }

    export type BadgeEventCallback = (event: BadgeEvent) => void;

    // -------------------------------------------------------------------
    // 函数：与 src/badge_engine_napi.cpp:483 注册顺序一致
    // -------------------------------------------------------------------
    export function createEngine(config: BadgeEngineConfig): BadgeHandle;
    export function destroyEngine(handle: BadgeHandle): void;

    export function setSurface(
        handle: BadgeHandle,
        surfaceId: string,
        width: number,
        height: number,
    ): void;

    export function loadBadge(handle: BadgeHandle, path: string): Promise<number>;
    export function loadModelData(
        handle: BadgeHandle,
        data: ArrayBuffer,
    ): Promise<number>;

    export function unloadBadge(handle: BadgeHandle): void;
    export function setRenderMode(handle: BadgeHandle, mode: RenderMode): void;

    export function updateGyro(
        handle: BadgeHandle,
        x: number,
        y: number,
        z: number,
    ): void;

    export function onTouch(handle: BadgeHandle, event: TouchEvent): void;
    export function playCeremony(handle: BadgeHandle, type: CeremonyType): void;

    export function setOrientation(
        handle: BadgeHandle,
        rx: number,
        ry: number,
        rz: number,
        scale: number,
    ): void;

    export function renderFrame(handle: BadgeHandle): void;

    export function snapshot(
        handle: BadgeHandle,
        width: number,
        height: number,
    ): ArrayBuffer;

    export function setFaceTexture(
        handle: BadgeHandle,
        face: FaceIndex,
        data: ArrayBuffer,
        width: number,
        height: number,
    ): void;

    export function setFaceMaterial(
        handle: BadgeHandle,
        face: FaceIndex,
        materialJson: string,
    ): void;

    export function setEventCallback(
        handle: BadgeHandle,
        callback: BadgeEventCallback,
    ): void;
}
