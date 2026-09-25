# Bulletbar

A minimalist toolbar for managing bullet list tasks, statuses, priorities, and hierarchy in Obsidian.

Bulletbar is inspired by the Bullet Journal method. It helps you quickly mark task status, highlight priority, and adjust list structure while editing notes.

## Features

* Change task status with one click
* Mark tasks as high priority
* Preserve the priority marker when changing task status
* Apply actions to multiple selected lines
* Automatically sync the desktop toolbar with the current line
* Toggle ordered and unordered lists on desktop
* Indent and outdent list items on desktop
* Use a compact Bulletbar toolbar on phone and tablet

## Symbols

| Symbol | Meaning       |
| ------ | ------------- |
| ⚪️     | Todo          |
| 🐌     | Later         |
| 🔄     | Doing         |
| ✅     | Done          |
| ❌     | Cancel        |
| 🔴     | High priority |

`⚪️`, `🐌`, `🔄`, `✅`, and `❌` are mutually exclusive statuses.

`🔴` is an independent priority marker and can be combined with any status.

The order is always:

```text
Status -> 🔴 -> Task
```

Changing a task status preserves its priority marker.

For example:

```text
⚪️ Finish portfolio
  🔄 Edit homepage
  ⚪️ Organize project details
  🔄 🔴 Check interaction details
🐌 Learn plugin development
  ⚪️ Read the documentation
  ✅ Complete the exercise
❌ Drop the old concept
```

## Desktop Usage

On desktop, Bulletbar shows its own custom toolbar above the editor.

The desktop toolbar includes:

* Todo
* Later
* Doing
* Done
* Cancel
* High priority
* Ordered list
* Unordered list
* Indent
* Outdent

Place the cursor on a task line and click a toolbar button to apply the corresponding action.

Select multiple lines to apply supported actions to multiple tasks at once.

Move the cursor to another task, and the toolbar automatically shows the current status and priority for that line.

## Mobile Usage

On phone and tablet, Bulletbar shows its own compact toolbar near the bottom of the editing area instead of showing the desktop toolbar.

The mobile toolbar shows only these 6 task actions:

| Command       | Task marker |
| ------------- | ----------- |
| Todo          | ⚪️          |
| Later         | 🐌          |
| Doing         | 🔄          |
| Done          | ✅          |
| Cancel        | ❌          |
| High priority | 🔴          |

List and indentation controls are not duplicated on mobile. The native Obsidian Mobile Toolbar remains independent.

The mobile buttons display the same emoji symbols used in your notes.

## Installation

### Community Plugins

1. Open **Settings -> Community plugins -> Browse**
2. Search for **Bulletbar**
3. Install and enable the plugin

### Manual Installation

Copy the plugin files into:

```text
<Vault>/.obsidian/plugins/bulletlist-toolbar/
```

Then enable **Bulletbar** under **Settings -> Community plugins**.

## License

MIT

---

# Bulletbar

一个用于在 Obsidian 中管理列表任务状态、优先级和层级的极简工具栏。

Bulletbar 的设计灵感来自 Bullet Journal。它可以帮助你在编辑笔记时快速标记任务状态、突出高优先级任务，并调整列表结构。

## 功能

* 一键切换任务状态
* 标记高优先级任务
* 切换任务状态时保留高优先级标记
* 支持多行选择后的批量操作
* 桌面端工具栏会自动同步当前行状态
* 桌面端支持切换有序列表和无序列表
* 桌面端支持缩进和减少缩进
* 手机和平板端使用 Bulletbar 自己的紧凑工具栏

## 符号

| 符号 | 含义 |
| ---- | ---- |
| ⚪️ | 待开始 |
| 🐌 | 推迟 |
| 🔄 | 进行中 |
| ✅ | 完成 |
| ❌ | 取消 |
| 🔴 | 高优先级 |

`⚪️`、`🐌`、`🔄`、`✅`、`❌` 是互斥状态，同一个任务只能有一个状态。

`🔴` 是独立的高优先级标记，可以和任意状态组合。

固定顺序始终是：

```text
状态 -> 🔴 -> 任务内容
```

切换任务状态时，会保留高优先级标记。

例如：

```text
⚪️ 完成作品集
  🔄 修改首页
  ⚪️ 整理项目说明
  🔄 🔴 检查交互细节
🐌 学习插件开发
  ⚪️ 阅读文档
  ✅ 完成练习
❌ 放弃旧方案
```

## 桌面端使用

在桌面端，Bulletbar 会在编辑器上方显示自己的自定义工具栏。

桌面端工具栏包含：

* 待开始
* 推迟
* 进行中
* 完成
* 取消
* 高优先级
* 有序列表
* 无序列表
* 缩进
* 减少缩进

将光标放在任务行上，点击工具栏按钮即可执行对应操作。

选择多行内容后，可以对多个任务批量执行支持的操作。

移动光标到不同任务时，工具栏会自动显示当前行的状态和优先级。

## 移动端使用

在手机和平板端，Bulletbar 使用自己独立的紧凑工具栏，不显示桌面端的自定义工具栏。

移动端工具栏只显示以下 6 个任务操作：

| 命令 | 任务标记 |
| ---- | -------- |
| 待开始 | ⚪️ |
| 推迟 | 🐌 |
| 进行中 | 🔄 |
| 完成 | ✅ |
| 取消 | ❌ |
| 高优先级 | 🔴 |

移动端不会重复提供列表和缩进按钮，Obsidian 原生 Mobile Toolbar 仍然独立存在。

移动端按钮直接显示笔记中使用的同一组 emoji，不会改变任务文本格式。

## 安装

### 社区插件

1. 打开 **设置 -> 第三方插件 -> 浏览**
2. 搜索 **Bulletbar**
3. 安装并启用插件

### 手动安装

将插件文件复制到：

```text
<Vault>/.obsidian/plugins/bulletlist-toolbar/
```

然后在 **设置 -> 第三方插件** 中启用 **Bulletbar**。

## License

MIT
