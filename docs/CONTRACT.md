# NAPI Bridge 契约（CONTRACT）

本文件描述 `@readmigo-cn/napi-bridge` 模块对外暴露的稳定契约：版本策略、错误码、生命周期、线程模型、内存所有权、演进规则。

任何对契约的破坏性变更（破坏 ABI / 改函数签名 / 删函数）必须：

1. 同步更新本文档；
2. 在 `package.json` 升 **major** 版本；
3. 在引用方 `apps/harmony-app` 走升级回归。

---

## 1. ABI 版本策略

模块按 SemVer (`MAJOR.MINOR.PATCH`) 演进：

| 变更类型 | 版本号 | 示例 |
|---|---|---|
| 新增导出函数 / 新增可选 interface 字段 | MINOR + 1 | `0.1.0` → `0.2.0` |
| 修改/删除导出函数、改函数签名、改 required 字段 | MAJOR + 1 | `0.2.0` → `1.0.0` |
| 修复内部 bug、不影响 ABI 的实现优化 | PATCH + 1 | `0.2.0` → `0.2.1` |

### 与 native 引擎兼容矩阵

`napi-bridge` 仅是薄绑定层，真正的功能在 `native/typesetting` 与 `native/badge-engine`。

| napi-bridge | native/typesetting | native/badge-engine | 备注 |
|---|---|---|---|
| `0.1.x` | `>= 0.1.0` | `>= 0.1.0` | 当前主线 |

每次升级 bridge 时，必须把对应的 native 引擎也升到不低于矩阵列出的最低兼容版本，否则编译失败或运行时 ABI 不匹配。

---

## 2. 错误码表

错误码定义来源：`src/common/napi_error.h::ErrorCode`（枚举），值映射来自 `src/common/napi_error.cpp::ErrorCodeToString`。

JS 端通过 `Error.code`（字符串化的数值）或 `MakeErrorObject` 返回的 `{ code, codeName, message }` 对象拿到错误码：

| 数值 | `codeName` | 适用场景 |
|---|---|---|
| `0` | `OK` | 占位，不会作为异常抛出 |
| `1001` | `INVALID_ARG` | 参数类型 / 必填字段缺失 / 数值越界（如 surfaceId 不是数字串） |
| `1002` | `NOT_INITIALIZED` | engine handle 已被销毁或从未创建 |
| `1003` | `IO` | 文件读写失败（如 `loadBadge` 路径不存在、`setFaceTexture` 文件读取失败） |
| `1004` | `PARSE` | HTML / CSS / GLB / 材质 JSON 解析失败 |
| `1005` | `LAYOUT` | 排版失败（chapter 不存在、`renderPage` 在未 layout 时调用） |
| `1006` | `RENDER` | 渲染失败 / surface 未绑定 / `OH_NativeWindow_GetNativeWindowFromSurfaceId` 返回 null |
| `1007` | `OUT_OF_RANGE` | `pageIndex` / `blockIndex` 越界 |
| `1008` | `NOT_SUPPORTED` | 当前平台或配置不支持（保留） |
| `1099` | `INTERNAL` | 兜底错误，通常是 C++ 异常未被 catch 到具体分支 |

### 错误抛出形式

- 大多数同步函数通过 `napi_throw_error(env, "<code>", "<message>")` 抛出 JS `Error`。`Error.code` 是十进制字符串（如 `"1001"`），`Error.message` 为人类可读描述。
- TypeError / RangeError 分别走 `napi_throw_type_error` / `napi_throw_range_error`，`code` 字段是对应数值的字符串。
- 异步函数（`loadBadge` / `loadModelData`）失败时通过 `napi_reject_deferred` 派发结构化对象 `{ code, codeName, message }`（见 `MakeErrorObject`）。

### 错误码演进规则

- **不允许复用已删除的数值**。新错误码继续往上加：`1009`, `1010`, ...
- 重命名 `codeName` 等价于 ABI 变更（业务侧可能 switch on 字符串），按 MAJOR 处理。

---

## 3. 生命周期约定

### Engine handle

- 每个 `createEngine(...)` 必须配对 `destroyEngine(handle)`。
- 即使忘了显式 destroy，napi finalizer（`TypesettingFinalize` / `BadgeFinalize`）也会在 GC 时兜底释放 native 资源。但 GC 时机不可预测，**强烈推荐显式 destroy**，尤其是 badge-engine（持有 GL surface / threadsafe function）。
- handle 销毁后再调用任何函数会抛 `NOT_INITIALIZED (1002)`。

### chapter 缓存（仅 typesetting）

- `layoutHtml` / `layoutHtmlWithCss` 把页面数据缓存在 Engine 内部的 `ChapterState` 中，按 `chapterId` 索引。
- 调 `relayout(...)` 复用上次的 blocks 重排，不需要重新解析 HTML。
- 想释放某 chapter：`evictChapter(handle, chapterId)`；想全清：`evictAll(handle)`。
- chapter 缓存策略由 native 引擎决定（如 LRU），bridge 层不做替换决策。

### 多线程使用

- **typesetting** handle 内部用 `std::mutex` 保护 `defaultStyle` / `defaultPageSize` 读写。布局 / 查询接口本身依赖 native Engine 的线程安全（默认假设 ArkTS 调用都在主线程，Worker 调用查询接口是安全的，但写接口需要主线程串行）。
- **badge-engine** handle 仅在创建它的 NAPI env 所在线程（通常是 ArkTS 主线程）上调用。事件回调通过 `napi_threadsafe_function` 从 render 线程路由回主线程，业务无需自己加锁。
- **禁止跨 worker 共享同一个 handle**：handle 是 `napi_external`，只能在其原 env 上 unwrap。

---

## 4. 回调签名

### `badge.setEventCallback(handle, callback)`

`callback` 签名见 `stubs/index.d.ts: BadgeEventCallback`：

```text
(event: { type: number; data: number; dataStr: string }) => void
```

派发由 native 线程触发，最终在创建 handle 的 JS 线程上调用 callback。

- `event.type` 取值见 `constants.EVENT_*`：
  - `EVENT_CEREMONY_PHASE` / `EVENT_CEREMONY_DONE`：仪式动画相位推进与完成
  - `EVENT_FLIP_TO_BACK` / `EVENT_FLIP_TO_FRONT`：徽章正反面翻转
  - `EVENT_HAPTIC`：建议触发 HarmonyOS Haptic 反馈，`data` 是 native 自定义的强度等级
  - `EVENT_SOUND`：建议播放某音效，`dataStr` 可能携带资源名
  - `EVENT_READY`：badge 资源加载完毕、可开始渲染
- `event.data` 是 native 端定义的副参数（强度 / phase index 等），具体语义由 `badge-engine` 文档约束。
- `event.dataStr` 在不需要字符串时为空 `""`，不会为 `null`。

### 回调注册的重复行为

- 同一 handle 上多次 `setEventCallback` 会**替换**前一个回调（`napi_release_threadsafe_function` 释放老 tsfn，再绑定新 tsfn）。
- `destroyEngine` / GC finalizer 自动解绑回调并释放 tsfn，不需要业务手动反注册。

---

## 5. 内存与所有权

| 入参类型 | 所有权 | 说明 |
|---|---|---|
| `string` | JS 拷贝到 C++ `std::string` | 函数返回后 JS 原串可释放 |
| `ArrayBuffer`（同步函数，例如 `setFaceTexture`） | borrow，仅在函数执行期间可访问 | NAPI 拿到的是 GC-managed 内存，禁止逃逸 |
| `ArrayBuffer`（异步函数，例如 `loadModelData`） | copy 到 `std::vector<uint8_t>` | 异步线程读取的是拷贝副本，原 buffer 可立即被 JS 释放 |
| `object`（如 `LayoutProfileInput`） | 同步读字段、不持有引用 | NAPI 在调用栈内调 `GetProp` 取值，返回前完成 |

| 出参类型 | 所有权 | 说明 |
|---|---|---|
| `string` / 普通对象 | JS GC | 标准 napi_create_* 路径 |
| `ArrayBuffer`（如 `snapshot`） | JS GC | NAPI 直接在 ArrayBuffer 后端 buffer 上写，零拷贝交给 JS |
| `handle`（external） | JS GC + 显式 destroy | finalizer 会兜底 |

### 阻塞 vs 异步

- 同步函数（绝大多数）会阻塞 JS 线程直到完成。`layoutHtml` 这类重负载函数建议在 ArkTS Worker 里调用，避免卡 UI。
- 异步函数仅以下两个：`loadBadge` / `loadModelData`，二者返回 `Promise<number>`，在 libuv worker 上完成。

---

## 6. 演进策略

### 新增函数

1. 在 `src/*.cpp` 写实现，注册到 `Init` 中的 `napi_property_descriptor[]`
2. 同步更新 `stubs/index.d.ts` 和 `stubs/index.ets.d.ts`（顺序必须与 `Init` 一致）
3. 在 `docs/01-bridge-design.md` 的对应表格添加一行，标 ✅
4. 升 MINOR 版本

### 改签名 / 改语义

1. 优先用"新增 v2 函数 + deprecate 老函数"的策略，给业务一个 deprecation cycle
2. deprecation 期内（至少一个 MINOR 版本）保留老函数 + 在 .d.ts 加 `@deprecated` JSDoc
3. 真正删除老函数时升 MAJOR

### 删函数

1. 先用 1 个 MINOR 版本标 `@deprecated` 并在 CHANGELOG 公告
2. 下一个 MAJOR 才真正删
3. 删除即升 MAJOR，并在本文档"错误码"和"导出表"中划掉对应条目（不留空位）

### 改 interface 字段

| 操作 | 版本 |
|---|---|
| 新增可选字段 | MINOR |
| 新增必填字段 | MAJOR |
| 删除字段 | MAJOR |
| 把可选变必填 | MAJOR |
| 把必填变可选 | MINOR |
| 改字段类型 | MAJOR |

### 改错误码

- 新增错误码：MINOR。
- 改 `codeName` 字符串 / 改数值：MAJOR（业务可能在 switch 中硬编码）。
- 删错误码：MAJOR，且不允许复用旧数值。

---

## 附录 A：契约一致性自检命令

```bash
# 1. .cpp 中的导出函数名集合
grep -oE '\{"[a-zA-Z]+", nullptr,' src/typesetting_napi.cpp src/badge_engine_napi.cpp \
  | grep -oE '"[a-zA-Z]+"' | sort -u

# 2. .d.ts 中的导出函数名集合
grep -oE 'export function [a-zA-Z]+' stubs/index.d.ts | sort -u

# 3. ArkTS .d.ts 与 Node .d.ts 应一致
diff \
  <(grep -oE 'export function [a-zA-Z]+' stubs/index.d.ts | sort -u) \
  <(grep -oE 'export function [a-zA-Z]+' stubs/index.ets.d.ts | sort -u)

# 4. tsc strict 检查
npx tsc stubs/index.d.ts stubs/index.ets.d.ts --noEmit --strict \
  --target es2022 --module esnext --moduleResolution bundler
```

三类列表必须完全一致；任意不一致 = 契约违反，必须先修齐再发版。
