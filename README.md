# Bulletbar

A minimalist toolbar for managing bullet list tasks, statuses, priorities, and hierarchy.

Bulletbar is inspired by the Bullet Journal method. It provides a simple toolbar for quickly managing tasks while editing notes.

## Features

* Change task status with one click
* Mark tasks as high priority
* Toggle ordered and unordered lists
* Indent and outdent list items to create task hierarchies
* Apply actions to multiple selected lines
* Automatically sync the toolbar with the current line
* Preserve the priority marker when changing task status

## Symbols

| Symbol | English       |
| ------ | ------------- |
| ⚪️     | Todo          |
| 🐌     | Later         |
| 🔄     | Doing         |
| ✅      | Done          |
| ❌      | Cancel        |
| 🔴     | High priority |

`⚪️`, `🐌`, `🔄`, `✅`, and `❌` are mutually exclusive statuses.

`🔴` is an independent priority marker and can be combined with any status.

The order is always:

`Status → 🔴 → Task`

Changing a task status preserves its priority marker.

For example:

```text
⚪️ Finish portfolio
    🔄 Edit homepage
    ⚪️ Organize project details
    🔄 🔴 Check interaction details
🐌 Learn Figma plugin development
    ⚪️ Read the documentation
    ✅ Complete the exercise
❌ Drop the old concept
```

## Installation

### Community Plugins

1. Open **Settings → Community plugins → Browse**
2. Search for **Bulletbar**
3. Install and enable the plugin

### Manual Installation

Copy the plugin files into:

```text
<Vault>/.obsidian/plugins/bulletlist-toolbar/
```

Then enable **Bulletbar** under **Settings → Community plugins**.

## Usage

Place the cursor on a list item and click a toolbar button to apply the corresponding action.

Select multiple lines to apply supported actions to multiple items.

Use the indent and outdent buttons to create and adjust task hierarchies.

Move the cursor to a task, and the toolbar automatically shows its current status and priority.

## License

MIT

---

# Bulletbar

一个用于管理任务状态、优先级和列表层级的极简工具栏。

Bulletbar 的设计灵感来自 Bullet Journal。它提供一个简单的工具栏，让你在编辑笔记时快速管理任务。

## 功能

* 一键切换任务状态
* 标记高优先级任务
* 切换有序列表和无序列表
* 缩进和减少缩进，用于建立任务与子任务的层级关系
* 支持多行选择和批量操作
* 根据当前行自动同步工具栏状态
* 切换任务状态时保留高优先级标记

## 符号

| 符号 | 中文   |
| -- | ---- |
| ⚪️ | 待开始  |
| 🐌 | 推迟   |
| 🔄 | 进行中  |
| ✅  | 完成   |
| ❌  | 取消   |
| 🔴 | 高优先级 |

`⚪️`、`🐌`、`🔄`、`✅`、`❌` 为互斥状态。

`🔴` 是独立的高优先级标记，可以与任意状态组合。

固定顺序：

`状态 → 🔴 → 任务内容`

切换任务状态时，高优先级标记会保留。

例如：

```text
⚪️ 完成作品集
    🔄 修改首页
    ⚪️ 整理项目说明
    🔄 🔴 检查交互细节
🐌 学习 Figma 插件开发
    ⚪️ 阅读文档
    ✅ 完成练习
❌ 放弃旧方案
```

## 安装

### 社区插件

1. 打开 **设置 → 社区插件 → 浏览**
2. 搜索 **Bulletbar**
3. 安装并启用插件

### 手动安装

将插件文件复制到：

```text
<Vault>/.obsidian/plugins/bulletlist-toolbar/
```

然后在 **设置 → 社区插件** 中启用 **Bulletbar**。

## 使用

将光标放在列表项中，点击工具栏中的按钮即可执行对应操作。

选择多行内容，可以对多个列表项执行支持的操作。

使用缩进和减少缩进按钮，可以建立和调整任务与子任务的层级关系。

将光标移动到不同任务上，工具栏会自动显示该任务当前的状态和优先级。

## License

MIT
