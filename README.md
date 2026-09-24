# Bulletbar

Bulletbar is a compact toolbar for quickly adding task statuses, high-priority markers, list formatting, and indentation controls while editing Markdown lists.

## Features

- Switch a task between Todo, Later, Doing, Done, and Cancel.
- Toggle High priority independently from the current task status.
- Keep task markers ordered as `Status -> 🔴 -> content`.
- Toggle ordered and unordered lists.
- Indent and outdent list items.
- Apply actions to multiple selected lines.
- Sync the active toolbar button with the current line.

## Installation

### Community Plugin

Settings -> Community plugins -> Browse -> Search for Bulletbar -> Install -> Enable

### Manual Installation

Copy the plugin files into:

```text
<Vault>/.obsidian/plugins/bullet-bar/
```

Then reload plugins and enable Bulletbar in Community plugins.

## Usage

Open a Markdown note in editing mode, place the cursor on a task line, then click a toolbar button or run a Bulletbar command from the command palette.

Examples:

```markdown
- ⚪️ Plan the release
- 🐌 Revisit icon polish
- 🔄 🔴 Update the docs
- ✅ Ship the package
- ❌ Drop the old marker
```

`⚪️`, `🐌`, `🔄`, `✅`, and `❌` are mutually exclusive statuses. `🔴` is an independent high-priority marker and can be combined with any status.

## Symbols

| Symbol | English | 中文 |
| --- | --- | --- |
| `⚪️` | Todo | 待开始 |
| `🐌` | Later | 推迟 |
| `🔄` | Doing | 进行中 |
| `✅` | Done | 完成 |
| `❌` | Cancel | 取消 |
| `🔴` | High priority | 高优先级 |

## License

MIT

---

# Bulletbar 中文说明

Bulletbar 是一个紧凑的 Markdown 列表工具栏，用于快速添加任务状态、高优先级标记、列表格式和缩进控制。

## 功能

- 在待开始、推迟、进行中、完成、取消之间切换任务状态。
- 独立切换高优先级标记。
- 始终保持任务排列为 `状态 -> 🔴 -> 内容`。
- 切换有序列表和无序列表。
- 增加缩进和减少缩进。
- 支持多行选择操作。
- 根据当前行同步工具栏按钮激活状态。

## 安装方式

### 社区插件

设置 → 社区插件 → 浏览 → 搜索 Bulletbar → 安装 → 启用

### 手动安装

将插件文件复制到：

```text
<Vault>/.obsidian/plugins/bullet-bar/
```

然后重新加载插件，并在社区插件中启用 Bulletbar。

## 使用方法

在 Markdown 编辑模式中打开笔记，将光标放在任务行上，然后点击工具栏按钮，或从命令面板运行 Bulletbar 命令。

示例：

```markdown
- ⚪️ 规划发布
- 🐌 稍后优化图标
- 🔄 🔴 更新文档
- ✅ 打包发布
- ❌ 移除旧标记
```

`⚪️`、`🐌`、`🔄`、`✅`、`❌` 是互斥状态。`🔴` 是独立的高优先级标记，可以和任意状态组合。

## 符号说明

| 符号 | English | 中文 |
| --- | --- | --- |
| `⚪️` | Todo | 待开始 |
| `🐌` | Later | 推迟 |
| `🔄` | Doing | 进行中 |
| `✅` | Done | 完成 |
| `❌` | Cancel | 取消 |
| `🔴` | High priority | 高优先级 |

## License

MIT
