const { Plugin, MarkdownView, Notice, setIcon } = require('obsidian');

const statusSyms = ['○', '🔄', '✅', '❌', '➡️'];
const prioritySyms = ['🔴'];

module.exports = class BulletlistToolbarPlugin extends Plugin {
  async onload() {
    this.settings = { toolbarVisible: true };
    try {
      const data = await this.loadData();
      if (data && typeof data.toolbarVisible === 'boolean') {
        this.settings.toolbarVisible = data.toolbarVisible;
      }
    } catch (e) {}

    this.createToolbar();
    this.addRibbonIcon('list-checks', 'Show Bulletlist Toolbar', () => {
      this.settings.toolbarVisible = true;
      this.saveSettings();
      this.toolbar.classList.remove('hidden');
      this.updateToggleButton();
      this.injectToolbar(true);
    });

    this.addCommand({
      id: 'bulletlist-toolbar-toggle',
      name: 'Toggle Bulletlist Toolbar',
      callback: () => this.toggleToolbar()
    });
    this.addCommand({
      id: 'bulletlist-toolbar-show',
      name: 'Show Bulletlist Toolbar',
      callback: () => {
        this.settings.toolbarVisible = true;
        this.saveSettings();
        this.toolbar.classList.remove('hidden');
        this.updateToggleButton();
        this.injectToolbar(true);
      }
    });
    this.addCommand({
      id: 'bulletlist-toolbar-hide',
      name: 'Hide Bulletlist Toolbar',
      callback: () => {
        this.settings.toolbarVisible = false;
        this.saveSettings();
        this.toolbar.classList.add('hidden');
        this.updateToggleButton();
      }
    });
    [
      ['mark-todo', 'Mark current line as Todo', '○'],
      ['mark-in-progress', 'Mark current line as In Progress', '🔄'],
      ['mark-done', 'Mark current line as Done', '✅'],
      ['mark-canceled', 'Mark current line as Canceled', '❌'],
      ['mark-deferred', 'Mark current line as Deferred', '➡️'],
      ['toggle-high-priority', 'Toggle High Priority', '🔴']
    ].forEach(([id, name, sym]) => {
      this.addCommand({
        id: `bulletlist-toolbar-${id}`,
        name,
        editorCallback: () => this.insertSymbol(sym)
      });
    });

    this.registerEvent(this.app.workspace.on('editor-change', () => this.syncToolbar()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.handleLeafChange()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.scheduleInjectToolbar()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.scheduleInjectToolbar()));
    this.registerDomEvent(document, 'selectionchange', () => this.scheduleSyncToolbar());

    this.app.workspace.onLayoutReady(() => this.scheduleInjectToolbar());
    [100, 500, 1000, 2000].forEach(delay => {
      setTimeout(() => this.injectToolbar(), delay);
    });
  }

  async onunload() {
    if (this.toolbar) {
      this.toolbar.remove();
    }
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings);
    } catch (e) {}
  }

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'bulletlist-toolbar';
    if (!this.settings.toolbarVisible) {
      this.toolbar.classList.add('hidden');
    }

    statusSyms.forEach((sym, index) => {
      const titles = ['待办', '进行中', '完成', '取消', '延后'];
      const btn = document.createElement('button');
      btn.className = 'bulletlist-toolbar-btn';
      btn.type = 'button';
      btn.setAttribute('data-sym', sym);
      btn.setAttribute('aria-label', titles[index]);
      btn.textContent = sym + ' ' + titles[index];
      btn.title = titles[index];
      btn.addEventListener('click', () => this.insertSymbol(sym));
      this.toolbar.appendChild(btn);
    });

    const sep = document.createElement('div');
    sep.className = 'bulletlist-toolbar-sep';
    this.toolbar.appendChild(sep);

    const priorityBtn = document.createElement('button');
    priorityBtn.className = 'bulletlist-toolbar-btn';
    priorityBtn.type = 'button';
    priorityBtn.setAttribute('data-sym', '🔴');
    priorityBtn.setAttribute('aria-label', '高优先');
    priorityBtn.textContent = '🔴';
    priorityBtn.title = '高优先';
    priorityBtn.addEventListener('click', () => this.insertSymbol('🔴'));
    this.toolbar.appendChild(priorityBtn);

    this.toolbar.appendChild(this.createSeparator());
    this.toolbar.appendChild(this.createIconButton('list-ordered', '有序列表', () => this.toggleList('ordered'), { listType: 'ordered' }));
    this.toolbar.appendChild(this.createIconButton('list', '无序列表', () => this.toggleList('bullet'), { listType: 'bullet' }));
    this.toolbar.appendChild(this.createIconButton('indent', '缩进', () => this.indentLines()));
    this.toolbar.appendChild(this.createIconButton('outdent', '取消缩进', () => this.outdentLines()));

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'bulletlist-toolbar-btn bulletlist-toolbar-btn-icon bulletlist-toolbar-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', '隐藏工具栏');
    toggleBtn.addEventListener('click', () => this.toggleToolbar());
    this.toolbar.appendChild(toggleBtn);
    this.updateToggleButton();
  }

  createSeparator() {
    const sep = document.createElement('div');
    sep.className = 'bulletlist-toolbar-sep';
    return sep;
  }

  createIconButton(icon, label, callback, options = {}) {
    const btn = document.createElement('button');
    btn.className = 'bulletlist-toolbar-btn bulletlist-toolbar-btn-icon';
    btn.type = 'button';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    if (options.listType) btn.setAttribute('data-list-type', options.listType);
    setIcon(btn, icon);
    btn.addEventListener('click', callback);
    return btn;
  }

  scheduleInjectToolbar() {
    setTimeout(() => {
      this.injectToolbar(false);
      this.syncToolbar();
    }, 100);
  }

  scheduleSyncToolbar() {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.syncToolbar(), 30);
  }

  injectToolbar(showNotice = false) {
    const markdownView = this.getActiveMarkdownView();
    if (!markdownView) {
      this.toolbar.remove();
      if (showNotice) new Notice('Bulletlist Toolbar: 请先打开一个 Markdown 笔记');
      return false;
    }

    if (!this.isEditableMarkdownView(markdownView)) {
      this.toolbar.remove();
      if (showNotice) new Notice('Bulletlist Toolbar: 请切换到编辑模式');
      return false;
    }

    const host = this.findToolbarHost(markdownView);
    if (!host) {
      if (showNotice) new Notice('Bulletlist Toolbar: 找不到可插入工具栏的位置');
      return false;
    }

    if (this.hasToolbar(host)) {
      this.registerCursorSyncEvents(host);
      if (showNotice) new Notice('Bulletlist Toolbar 已经显示');
      return true;
    }

    this.toolbar.remove();
    const cmEditor = this.findDirectChild(host, ['cm-editor', 'markdown-source-view']);
    if (cmEditor) {
      host.insertBefore(this.toolbar, cmEditor);
    } else {
      host.prepend(this.toolbar);
    }
    this.registerCursorSyncEvents(host);
    if (showNotice) new Notice('Bulletlist Toolbar 已显示');
    return true;
  }

  registerCursorSyncEvents(host) {
    if (this.cursorSyncHost === host) return;
    this.cursorSyncHost = host;
    ['mouseup', 'keyup', 'touchend', 'focusin'].forEach(eventName => {
      this.registerDomEvent(host, eventName, () => this.scheduleSyncToolbar());
    });
  }

  hasToolbar(host) {
    return Array.from(host.children).some(el => el.classList.contains('bulletlist-toolbar'));
  }

  findDirectChild(host, classNames) {
    return Array.from(host.children).find(el => classNames.some(className => el.classList.contains(className))) || null;
  }

  findToolbarHost(markdownView) {
    const activeLeaf = this.app.workspace.activeLeaf;
    const activeContainer = activeLeaf && activeLeaf.view && activeLeaf.view.containerEl;
    const candidates = [
      markdownView.containerEl && markdownView.containerEl.querySelector('.view-content'),
      activeContainer && activeContainer.querySelector('.view-content'),
      markdownView.contentEl,
      markdownView.containerEl && markdownView.containerEl.querySelector('.markdown-source-view'),
      activeContainer && activeContainer.querySelector('.markdown-source-view'),
      activeContainer,
      markdownView.containerEl
    ];
    return candidates.find(el => el && el.isConnected) || null;
  }

  handleLeafChange() {
    if (this.toolbar) {
      this.toolbar.remove();
    }

    setTimeout(() => {
      this.injectToolbar(false);
    }, 100);

    this.syncToolbar();
  }

  getActiveMarkdownView() {
    const activeLeaf = this.app.workspace.activeLeaf;
    const activeView = activeLeaf && activeLeaf.view;
    if (activeView instanceof MarkdownView) return activeView;
    return null;
  }

  isEditableMarkdownView(markdownView) {
    if (typeof markdownView.getMode === 'function' && markdownView.getMode() !== 'source') return false;
    return !!this.getEditorFromMarkdownView(markdownView);
  }

  getEditorFromMarkdownView(markdownView) {
    if (!markdownView) return null;
    if (markdownView.editor) return markdownView.editor;
    if (markdownView.sourceMode && markdownView.sourceMode.editor) return markdownView.sourceMode.editor;
    return null;
  }

  toggleToolbar() {
    this.settings.toolbarVisible = !this.settings.toolbarVisible;
    this.saveSettings();
    this.toolbar.classList.toggle('hidden', !this.settings.toolbarVisible);

    this.updateToggleButton();
  }

  updateToggleButton() {
    if (!this.toolbar) return;
    const toggleBtn = this.toolbar.querySelector('.bulletlist-toolbar-toggle');
    if (!toggleBtn) return;
    toggleBtn.textContent = '';
    setIcon(toggleBtn, this.settings.toolbarVisible ? 'x' : 'panel-top-open');
    toggleBtn.setAttribute('aria-label', this.settings.toolbarVisible ? '隐藏工具栏' : '显示工具栏');
    toggleBtn.title = this.settings.toolbarVisible ? '隐藏工具栏' : '显示工具栏';
  }

  getActiveEditor() {
    return this.getEditorFromMarkdownView(this.getActiveMarkdownView());
  }

  symPrefixLen(s) {
    const allSyms = ['🔄', '➡️', '🔴', '✅', '❌', '○'];
    let i = 0;
    while (i < s.length) {
      if (s[i] === ' ') { i++; continue; }
      let found = false;
      for (let k = 0; k < allSyms.length; k++) {
        if (s.indexOf(allSyms[k], i) === i) { i += allSyms[k].length; found = true; break; }
      }
      if (!found) break;
    }
    return i;
  }

  syncToolbar() {
    const editor = this.getActiveEditor();
    if (!editor) {
      document.querySelectorAll('.bulletlist-toolbar-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    if (!line) {
      document.querySelectorAll('.bulletlist-toolbar-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    const parsed = this.parseLine(line);
    const activeStatus = this.getLineStatus(parsed.content);
    const hasHigh = this.hasPriority(parsed.content, '🔴');
    const listType = this.getLineListType(line);

    document.querySelectorAll('.bulletlist-toolbar-btn').forEach(btn => {
      const sym = btn.getAttribute('data-sym');
      const buttonListType = btn.getAttribute('data-list-type');
      if (buttonListType) {
        btn.classList.toggle('active', buttonListType === listType);
        return;
      }
      if (!sym) {
        btn.classList.remove('active');
        return;
      }
      btn.classList.toggle('active', sym === activeStatus || (sym === '🔴' && hasHigh));
    });
  }

  insertSymbol(sym) {
    const editor = this.getActiveEditor();
    if (!editor) return;

    const cursor = editor.getCursor();
    const range = this.getTargetLineRange(editor);

    for (let lineNo = range.to; lineNo >= range.from; lineNo--) {
      const line = editor.getLine(lineNo);
      if (!line || !line.trim()) continue;
      const newLine = this.applySymbolToLine(line, sym);
      editor.replaceRange(newLine, { line: lineNo, ch: 0 }, { line: lineNo, ch: line.length });
    }

    if (range.from === range.to) {
      const newLine = editor.getLine(cursor.line);
      editor.setCursor({ line: cursor.line, ch: this.contentPrefixLen(newLine) });
    }
    editor.focus();
    this.syncToolbar();
  }

  toggleList(type) {
    const editor = this.getActiveEditor();
    if (!editor) return;

    const range = this.getTargetLineRange(editor);
    let itemNumber = 1;

    for (let lineNo = range.from; lineNo <= range.to; lineNo++) {
      const line = editor.getLine(lineNo);
      if (!line || !line.trim()) continue;
      const newLine = type === 'ordered'
        ? this.applyOrderedList(line, itemNumber++)
        : this.applyBulletList(line);
      editor.replaceRange(newLine, { line: lineNo, ch: 0 }, { line: lineNo, ch: line.length });
    }

    editor.focus();
    this.syncToolbar();
  }

  applyBulletList(line) {
    const match = line.match(/^(\s*)((?:[-*+]|\d+[.)])\s+)(.*)$/);
    if (match && /^[-*+]\s+$/.test(match[2])) return match[1] + match[3];
    if (match) return `${match[1]}- ${match[3]}`;

    const indentMatch = line.match(/^(\s*)(.*)$/);
    return `${indentMatch[1]}- ${indentMatch[2]}`;
  }

  applyOrderedList(line, itemNumber) {
    const match = line.match(/^(\s*)((?:[-*+]|\d+[.)])\s+)(.*)$/);
    if (match && /^\d+[.)]\s+$/.test(match[2])) return match[1] + match[3];
    if (match) return `${match[1]}${itemNumber}. ${match[3]}`;

    const indentMatch = line.match(/^(\s*)(.*)$/);
    return `${indentMatch[1]}${itemNumber}. ${indentMatch[2]}`;
  }

  getLineListType(line) {
    if (/^\s*\d+[.)]\s+/.test(line)) return 'ordered';
    if (/^\s*[-*+]\s+/.test(line)) return 'bullet';
    return null;
  }

  indentLines() {
    this.shiftLines(line => `  ${line}`);
  }

  outdentLines() {
    this.shiftLines(line => line.replace(/^(?: {1,2}|\t)/, ''));
  }

  shiftLines(transform) {
    const editor = this.getActiveEditor();
    if (!editor) return;

    const range = this.getTargetLineRange(editor);
    for (let lineNo = range.to; lineNo >= range.from; lineNo--) {
      const line = editor.getLine(lineNo);
      editor.replaceRange(transform(line), { line: lineNo, ch: 0 }, { line: lineNo, ch: line.length });
    }

    editor.focus();
    this.syncToolbar();
  }

  getTargetLineRange(editor) {
    if (typeof editor.somethingSelected === 'function' && editor.somethingSelected()) {
      const selections = typeof editor.listSelections === 'function' ? editor.listSelections() : [];
      if (selections.length > 0) {
        const lines = selections.flatMap(selection => {
          const range = this.normalizeSelectionRange(selection);
          return [range.from, range.to];
        });
        return { from: Math.min(...lines), to: Math.max(...lines) };
      }
      const cursor = editor.getCursor();
      return { from: cursor.line, to: cursor.line };
    }

    const cursor = editor.getCursor();
    return { from: cursor.line, to: cursor.line };
  }

  normalizeSelectionRange(selection) {
    const points = [selection.anchor, selection.head].sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
      return a.ch - b.ch;
    });
    const start = points[0];
    const end = points[1];
    const to = end.ch === 0 && end.line > start.line ? end.line - 1 : end.line;
    return { from: start.line, to };
  }

  applySymbolToLine(line, sym) {
    const parsed = this.parseLine(line);
    let content = parsed.content.trimStart();

    if (statusSyms.includes(sym)) {
      const currentStatus = this.getLineStatus(content);
      content = this.removeLeadingStatuses(content);

      if (parsed.checkbox) {
        parsed.checkbox = null;
        parsed.prefix = parsed.listPrefix;
      }

      if (currentStatus !== sym) content = `${sym} ${content}`;
    } else if (prioritySyms.includes(sym)) {
      content = this.togglePriority(content, sym);
    }

    return this.formatLine(parsed, content);
  }

  parseLine(line) {
    const taskMatch = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+)\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      return {
        prefix: `${taskMatch[1]}[${taskMatch[2]}] `,
        listPrefix: taskMatch[1],
        checkbox: { checked: taskMatch[2].toLowerCase() === 'x' },
        content: taskMatch[3]
      };
    }

    const listMatch = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+)(.*)$/);
    if (listMatch) return { prefix: listMatch[1], content: listMatch[2] };

    const indentMatch = line.match(/^(\s*)(.*)$/);
    return { prefix: indentMatch[1], content: indentMatch[2] };
  }

  formatLine(parsed, content) {
    if (parsed.checkbox) {
      const checkbox = parsed.checkbox.checked ? '[x]' : '[ ]';
      return `${parsed.listPrefix}${checkbox} ${content}`;
    }

    return parsed.prefix + content;
  }

  getLineStatus(content) {
    return statusSyms.find(sym => content.trimStart().startsWith(sym)) || null;
  }

  removeLeadingStatuses(content) {
    let result = content.trimStart();
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < statusSyms.length; i++) {
        const sym = statusSyms[i];
        if (result === sym || result.startsWith(sym + ' ')) {
          result = result.slice(sym.length).trimStart();
          changed = true;
          break;
        }
      }
    }
    return result;
  }

  hasPriority(content, sym) {
    return content.split(/\s+/).includes(sym);
  }

  togglePriority(content, sym) {
    const leading = this.getLineStatus(content);
    let rest = content.trimStart();

    if (leading) rest = rest.slice(leading.length).trimStart();
    const parts = rest.split(/\s+/).filter(Boolean);
    const hasPriority = parts.includes(sym);
    const nextParts = hasPriority ? parts.filter(part => part !== sym) : [sym, ...parts];
    const nextContent = nextParts.join(' ');

    return leading ? `${leading}${nextContent ? ' ' + nextContent : ''}` : nextContent;
  }

  contentPrefixLen(line) {
    const parsed = this.parseLine(line);
    return parsed.prefix.length + this.symPrefixLen(parsed.content);
  }
};
