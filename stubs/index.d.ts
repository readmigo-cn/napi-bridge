//
// stubs/index.d.ts
// Node.js / TypeScript 端类型声明，1:1 对齐 src/typesetting_napi.cpp 和
// src/badge_engine_napi.cpp 中 napi_define_properties 注册的导出。
//
// 实际运行时实现由 prebuildify 产出的 .node 加载（package.json:binary.module_name
// = "readmigo_napi_bridge"），本 .d.ts 不含运行时代码。
//
// 重要：
//   1. 修改 .cpp 中任何 NAPI 函数签名 → 必须同步更新本文件 + 同目录 index.ets.d.ts
//   2. 错误码（ErrorCode）来源于 src/common/napi_error.h，docs/CONTRACT.md 有完整表
//   3. Engine 句柄使用 branded type，避免业务层把任意 number 当 handle 传入
//

declare module "@readmigo-cn/napi-bridge/typesetting" {
    // -----------------------------------------------------------------------
    // Opaque handle：底层是 napi_external，TS 端用 branded 类型禁止业务侧伪造
    // -----------------------------------------------------------------------
    export type TypesettingHandle = object & { readonly __brand: "TypesettingHandle" };

    // -----------------------------------------------------------------------
    // 配置 / 入参 / 出参 interface
    // -----------------------------------------------------------------------

    /** createEngine 的可选平台配置；对应 src/typesetting_napi.cpp:228-251 */
    export interface CreateEngineOptions {
        /** 默认字号缩放因子，默认 1.0；HarmonyPlatformOptions.defaultFontScale */
        fontScale?: number;
        /** 默认行高倍数，默认 1.0；HarmonyPlatformOptions.defaultLineHeightMultiplier */
        lineHeightMultiplier?: number;
        /** 默认 BCP-47 locale，例如 "zh-CN" / "en-US" */
        locale?: string;
    }

    /** setLayoutProfile 入参（src/typesetting_napi.cpp:268-313） */
    export interface LayoutProfileInput {
        screenWidth: number;
        screenHeight: number;
        safeTop?: number;
        safeBottom?: number;
        safeLeft?: number;
        safeRight?: number;
        /** 覆盖 computeLayoutProfile 推荐的字号 */
        fontSize?: number;
        /** 覆盖 computeLayoutProfile 推荐的行高倍数 */
        lineHeight?: number;
    }

    /** setLayoutProfile / computeLayoutProfile 共用的部分返回字段 */
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

    /** computeLayoutProfile 比 setLayoutProfile 多 header/footer 字号字段 */
    export interface LayoutProfileFull extends LayoutProfile {
        headerFontSize: number;
        footerFontSize: number;
    }

    /** setTypography 入参（src/typesetting_napi.cpp:338-355） */
    export interface TypographyConfig {
        fontSize?: number;
        lineHeight?: number;
        fontFamily?: string;
        letterSpacing?: number;
    }

    /** 文本对齐方式 */
    export type TextAlignment = "left" | "center" | "right" | "justified";

    /**
     * ParseStyle（src/typesetting_napi.cpp:72-107）支持的所有 Style 字段。
     * layoutHtml / layoutHtmlWithCss / relayout 的 styleOverrides 入参格式。
     */
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

    /** ParsePageSize（src/typesetting_napi.cpp:109-115） */
    export interface PageSizeOverrides {
        width?: number;
        height?: number;
    }

    /** layoutHtml / layoutHtmlWithCss 返回（src/typesetting_napi.cpp:381-388） */
    export interface LayoutSummary {
        chapterId: string;
        pageCount: number;
        totalBlocks: number;
        warningCount: number;
    }

    /** relayout 返回（与 LayoutSummary 缺 warningCount，src/typesetting_napi.cpp:441-446） */
    export interface RelayoutSummary {
        chapterId: string;
        pageCount: number;
        totalBlocks: number;
    }

    /** getPageInfo 返回（src/typesetting_napi.cpp:521-528） */
    export interface PageInfo {
        chapterTitle: string;
        currentPage: number;
        totalPages: number;
        progress: number;
        firstBlockIndex: number;
        lastBlockIndex: number;
    }

    /**
     * renderPage 返回（src/typesetting_napi.cpp:501-510）。
     * 当前是"部分实现"——仅包含 PageInfo 字段 + partial=true 标记，
     * 完整 lines/runs/decorations 暂未暴露，等待 native 侧 Engine::getPage(...)。
     */
    export interface RenderedPagePartial extends PageInfo {
        pageIndex: number;
        partial: true;
    }

    /**
     * 完整页面数据（W3+ native 引擎暴露 getPage 后启用）。
     * RunToJs / LineToJs / PageToJs / DecorationToJs 已经写好序列化路径，
     * 一旦 Engine 暴露 getPage 即可填充。
     */
    export interface TextRun {
        text: string;
        x: number;
        y: number;
        width: number;
        fontFamily: string;
        fontSize: number;
        /** 对齐 ts::FontWeight 整数（100..900），来源 RunToJs */
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

    /** DecorationToJs（src/typesetting_napi.cpp:161-175） */
    export type DecorationType = "hr" | "image" | "table";
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

    /** PageToJs（src/typesetting_napi.cpp:177-195）—— 完整页面数据 */
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

    /** hitTest 返回（src/typesetting_napi.cpp:542-548） */
    export interface HitTestResult {
        found: boolean;
        blockIndex: number;
        lineIndex: number;
        runIndex: number;
        charOffset: number;
    }

    /** wordAtPoint 返回（WordRangeToJs，src/typesetting_napi.cpp:206-213） */
    export interface WordRange {
        blockIndex: number;
        charOffset: number;
        charLength: number;
        text: string;
    }

    /** getSentences / getAllSentences 单元素（SentenceRangeToJs:215-222） */
    export interface SentenceRange {
        blockIndex: number;
        charOffset: number;
        charLength: number;
        text: string;
    }

    /** getRectsForRange / getBlockRect 单元素（TextRectToJs:197-204） */
    export interface Rect {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    /** measureText 入参的字体描述（src/typesetting_napi.cpp:617-639） */
    export interface FontDescriptor {
        family?: string;
        size?: number;
        /** ts::FontWeight 整数（100..900） */
        weight?: number;
        italic?: boolean;
    }

    /** measureText 返回 */
    export interface MeasureResult {
        width: number;
        height: number;
    }

    /** getFontMetrics 返回（src/typesetting_napi.cpp:642-663） */
    export interface FontMetrics {
        ascent: number;
        descent: number;
        leading: number;
        xHeight: number;
        capHeight: number;
        lineHeight: number;
    }

    // -----------------------------------------------------------------------
    // 导出函数：按 src/typesetting_napi.cpp:697-746 Init 中 props 顺序
    // -----------------------------------------------------------------------

    /** 创建引擎句柄（src/typesetting_napi.cpp:228） */
    export function createEngine(options?: CreateEngineOptions): TypesettingHandle;

    /** 立即销毁引擎句柄；GC finalizer 会跳过 destroyed=true 的句柄（:253） */
    export function destroyEngine(handle: TypesettingHandle): void;

    /** 根据屏幕和安全区计算 LayoutProfile 并写入默认 Style（:268） */
    export function setLayoutProfile(
        handle: TypesettingHandle,
        config: LayoutProfileInput,
    ): LayoutProfile;

    /** 设置主题（day / night / sepia），目前仅影响 hyphenation（:317） */
    export function setTheme(
        handle: TypesettingHandle,
        theme: "day" | "night" | "sepia",
    ): void;

    /** 增量改字体/字号/行高，不重建 Engine（:338） */
    export function setTypography(
        handle: TypesettingHandle,
        config: TypographyConfig,
    ): void;

    /** 排版 HTML，得到页码摘要（:358） */
    export function layoutHtml(
        handle: TypesettingHandle,
        html: string,
        chapterId: string,
        styleOverrides?: StyleOverrides,
        pageSize?: PageSizeOverrides,
    ): LayoutSummary;

    /** 带 CSS 的排版（:393） */
    export function layoutHtmlWithCss(
        handle: TypesettingHandle,
        html: string,
        css: string,
        chapterId: string,
        styleOverrides?: StyleOverrides,
        pageSize?: PageSizeOverrides,
    ): LayoutSummary;

    /** 复用上次 blocks 重新排版（改字号常用，:425） */
    export function relayout(
        handle: TypesettingHandle,
        styleOverrides?: StyleOverrides,
        pageSize?: PageSizeOverrides,
    ): RelayoutSummary;

    /** 设置章节显示标题（:450） */
    export function setChapterTitle(
        handle: TypesettingHandle,
        chapterId: string,
        title: string,
    ): void;

    /** 移除某 chapter 的排版缓存（:461） */
    export function evictChapter(handle: TypesettingHandle, chapterId: string): void;

    /** 清空所有 chapter 缓存（:471） */
    export function evictAll(handle: TypesettingHandle): void;

    /** 获取页（部分实现，:481）—— 返回 partial=true，详见 RenderedPagePartial */
    export function renderPage(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
    ): RenderedPagePartial;

    /** 获取页元信息（:514） */
    export function getPageInfo(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
    ): PageInfo;

    /** 命中测试，坐标为 page 像素坐标（:533） */
    export function hitTest(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        x: number,
        y: number,
    ): HitTestResult;

    /** 找点所在词（:552） */
    export function wordAtPoint(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        x: number,
        y: number,
    ): WordRange;

    /** 取页内全部句子（:565） */
    export function getSentences(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
    ): SentenceRange[];

    /** 取 chapter 内全部句子（:577） */
    export function getAllSentences(
        handle: TypesettingHandle,
        chapterId: string,
    ): SentenceRange[];

    /** 把 [blockIndex, charOffset..+charLength) 转成可绘制矩形（:588） */
    export function getRectsForRange(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        blockIndex: number,
        charOffset: number,
        charLength: number,
    ): Rect[];

    /** 获取整个 block 的外接矩形（:604） */
    export function getBlockRect(
        handle: TypesettingHandle,
        chapterId: string,
        pageIndex: number,
        blockIndex: number,
    ): Rect;

    /** 测量字符串渲染尺寸（:617） */
    export function measureText(
        handle: TypesettingHandle,
        text: string,
        font: FontDescriptor,
    ): MeasureResult;

    /** 解析字体度量（:642） */
    export function getFontMetrics(
        handle: TypesettingHandle,
        font: FontDescriptor,
    ): FontMetrics;

    /** 纯函数版本的 layoutProfile 计算（:668）—— 不需要 engine 句柄 */
    export function computeLayoutProfile(
        config: Omit<LayoutProfileInput, "fontSize" | "lineHeight">,
    ): LayoutProfileFull;
}

declare module "@readmigo-cn/napi-bridge/badge-engine" {
    // -----------------------------------------------------------------------
    // Opaque handle
    // -----------------------------------------------------------------------
    export type BadgeHandle = object & { readonly __brand: "BadgeHandle" };

    // -----------------------------------------------------------------------
    // 常量（src/badge_engine_napi.cpp:521-540 中的 "constants" 对象）
    // 用 namespace 而非 const enum：方便 ArkTS 同步一份等价代码
    // -----------------------------------------------------------------------
    export namespace constants {
        /** BadgeRenderMode.BADGE_RENDER_EMBEDDED */
        export const RENDER_EMBEDDED: number;
        /** BadgeRenderMode.BADGE_RENDER_FULLSCREEN */
        export const RENDER_FULLSCREEN: number;

        /** BadgeTouchType.BADGE_TOUCH_DOWN */
        export const TOUCH_DOWN: number;
        export const TOUCH_MOVE: number;
        export const TOUCH_UP: number;
        export const TOUCH_CANCEL: number;

        /** BadgeCeremonyType.BADGE_CEREMONY_UNLOCK */
        export const CEREMONY_UNLOCK: number;

        /** BadgeFaceIndex.BADGE_FACE_FRONT / ICON / BACK */
        export const FACE_FRONT: number;
        export const FACE_ICON: number;
        export const FACE_BACK: number;

        /** BadgeEventType.* */
        export const EVENT_CEREMONY_PHASE: number;
        export const EVENT_CEREMONY_DONE: number;
        export const EVENT_FLIP_TO_BACK: number;
        export const EVENT_FLIP_TO_FRONT: number;
        export const EVENT_HAPTIC: number;
        export const EVENT_SOUND: number;
        export const EVENT_READY: number;
    }

    /** Render mode 字面量联合（与 constants.RENDER_* 数值一致） */
    export type RenderMode = number;

    /** Touch type 字面量联合（与 constants.TOUCH_* 一致） */
    export type TouchType = number;

    /** Face index（与 constants.FACE_* 一致） */
    export type FaceIndex = number;

    /** Ceremony type（与 constants.CEREMONY_* 一致） */
    export type CeremonyType = number;

    /** Event type（与 constants.EVENT_* 一致） */
    export type EventType = number;

    // -----------------------------------------------------------------------
    // 入参 / 出参 interface
    // -----------------------------------------------------------------------

    /** createEngine 配置（src/badge_engine_napi.cpp:181-205） */
    export interface BadgeEngineConfig {
        /** 像素宽度（uint32） */
        width: number;
        /** 像素高度（uint32） */
        height: number;
        /** 默认 BADGE_RENDER_EMBEDDED；见 constants.RENDER_* */
        renderMode?: RenderMode;
        /** 本地 presets 配置目录（绝对路径） */
        presetsPath?: string;
    }

    /** onTouch 入参事件（src/badge_engine_napi.cpp:341-357） */
    export interface TouchEvent {
        /** constants.TOUCH_* */
        type: TouchType;
        x: number;
        y: number;
        /** 默认 1；多指手势时填实际指数 */
        pointerCount?: number;
        /** 第二根手指 x（pinch / rotate 用） */
        x2?: number;
        y2?: number;
    }

    /**
     * setEventCallback 注册的回调参数（src/badge_engine_napi.cpp:121-125）。
     * dataStr 在大多数 event 是空字符串；EVENT_SOUND 这类事件会带资源标识。
     */
    export interface BadgeEvent {
        /** constants.EVENT_* */
        type: EventType;
        data: number;
        dataStr: string;
    }
    export type BadgeEventCallback = (event: BadgeEvent) => void;

    // -----------------------------------------------------------------------
    // 导出函数：按 src/badge_engine_napi.cpp:483-517 Init 中 props 顺序
    // -----------------------------------------------------------------------

    /** 创建 badge 引擎（src/badge_engine_napi.cpp:181） */
    export function createEngine(config: BadgeEngineConfig): BadgeHandle;

    /** 立即销毁；同步释放 native engine + tsfn（:208） */
    export function destroyEngine(handle: BadgeHandle): void;

    /**
     * 绑定渲染 surface。surfaceId 是 ArkTS XComponent
     * .getXComponentSurfaceId() 返回的字符串化 uint64（:222）。
     */
    export function setSurface(
        handle: BadgeHandle,
        surfaceId: string,
        width: number,
        height: number,
    ): void;

    /** 从文件路径加载 badge 资源（异步，:255） */
    export function loadBadge(handle: BadgeHandle, path: string): Promise<number>;

    /** 从 ArrayBuffer 加载模型数据（异步，:280） */
    export function loadModelData(
        handle: BadgeHandle,
        data: ArrayBuffer,
    ): Promise<number>;

    /** 释放当前 badge 资源但保留 engine（:308） */
    export function unloadBadge(handle: BadgeHandle): void;

    /** 切换 EMBEDDED / FULLSCREEN（:317） */
    export function setRenderMode(handle: BadgeHandle, mode: RenderMode): void;

    /** 陀螺仪三轴角速度更新（:328） */
    export function updateGyro(
        handle: BadgeHandle,
        x: number,
        y: number,
        z: number,
    ): void;

    /** 喂入触摸事件（:341） */
    export function onTouch(handle: BadgeHandle, event: TouchEvent): void;

    /** 触发解锁等仪式动画（:359） */
    export function playCeremony(handle: BadgeHandle, type: CeremonyType): void;

    /** 直接设置朝向（rx, ry, rz, scale），跳过陀螺仪（:370） */
    export function setOrientation(
        handle: BadgeHandle,
        rx: number,
        ry: number,
        rz: number,
        scale: number,
    ): void;

    /** 渲染一帧到已绑定的 surface（:383） */
    export function renderFrame(handle: BadgeHandle): void;

    /**
     * 截图为 RGBA ArrayBuffer（width*height*4 字节，:392）。
     * NAPI 直接在 ArrayBuffer 后端 buffer 上写，少 1 次 memcpy。
     */
    export function snapshot(
        handle: BadgeHandle,
        width: number,
        height: number,
    ): ArrayBuffer;

    /**
     * 替换某 face 的纹理。data 必须是 width*height*4 字节的 RGBA 缓冲（:417）。
     * face 取值见 constants.FACE_*。
     */
    export function setFaceTexture(
        handle: BadgeHandle,
        face: FaceIndex,
        data: ArrayBuffer,
        width: number,
        height: number,
    ): void;

    /** 设置 face 的材质（JSON 字符串，由 badge-engine 内部解析，:436） */
    export function setFaceMaterial(
        handle: BadgeHandle,
        face: FaceIndex,
        materialJson: string,
    ): void;

    /**
     * 注册事件回调。底层用 napi_threadsafe_function 把 native 线程的事件
     * 路由回 JS 主线程（:452）。同一 handle 调用多次会替换上一个 callback。
     */
    export function setEventCallback(
        handle: BadgeHandle,
        callback: BadgeEventCallback,
    ): void;
}
