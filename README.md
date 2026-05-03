# napi-bridge

> HarmonyOS NEXT NAPI bridge：C++ ↔ ArkTS 边界层
> Gitee: https://gitee.com/readmigo/napi-bridge
> 上游被引用方：[`apps/harmony-app`](https://gitee.com/readmigo/readmigo-cn-repos)
> 下游引擎：[`typesetting`](https://gitee.com/readmigo/typesetting) · [`badge-engine`](https://gitee.com/readmigo/badge-engine)

W23 从 monorepo `gitee.com/readmigo/readmigo-cn-repos` 拆出（filter-repo subdirectory）。

## 定位

把 C++ 引擎（typesetting / badge-engine）暴露给鸿蒙 ArkTS 业务层，纯桥接，无业务逻辑：

| 边界 | 文件 |
|---|---|
| C/C++ 头文件 | `include/` |
| NAPI 桥接实现 | `src/` |
| ArkTS stub（编辑器智能提示用） | `stubs/` |
| 调用示例 | `example-usage.ets` |
| 构建脚本 | `CMakeLists.txt` |

## 设计原则

- 原生引擎先暴露稳定的 `C / C++` 边界，NAPI 只负责参数解包、生命周期管理、结果组装
- 不把排版或勋章引擎的业务逻辑直接塞进 NAPI 文件
- 引擎升级（typesetting / badge-engine 新版本）→ 只动 `src/` 桥接，不动 ArkTS 调用方

## 当前状态

- 已建立 `typesetting` 的最小桥接骨架
- 已建立 Harmony NAPI 模块注册骨架
- `layoutHtml` 当前只返回布局摘要，未返回完整页面树

## 下一步（W24-W30）

1. 扩展 `layoutHtml` 返回页级数据
2. 增加 `relayout` / `hitTest` / `getSentences`
3. 视 badge-engine 的 Harmony 渲染方案补对应桥接

## 构建

```bash
mkdir -p build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=$OHOS_NDK/build/cmake/ohos.toolchain.cmake \
         -DOHOS_ARCH=arm64-v8a
cmake --build . -j
```

输出 `.so` 在 `build/`，由 `apps/harmony-app` 通过 `oh-package.json5` 引用。

## 与 monorepo 的关系

| 来源 | 内容 |
|---|---|
| `readmigo-cn-repos@pre-napi-bridge-split` | W23 拆分前的最后快照（含完整 monorepo） |
| `napi-bridge@napi-bridge-v0.1.0` | 拆分后首个 tag |

ArkTS 业务侧引用方式（占位，待 W24 落地）：

```
oh-package.json5:
  dependencies:
    "@readmigo-cn/napi-bridge": "file:../../napi-bridge"
```

## License

私有项目，未公开。
