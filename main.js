const { Plugin, MarkdownView, Notice, setIcon } = require('obsidian');

const STATUS_SYMBOLS = ['⚪️', '🐌', '🔄', '✅', '❌'];
const PRIORITY_SYMBOLS = ['🔴'];
const HIGH_PRIORITY_SYMBOL = '🔴';

module.exports = class BulletbarPlugin extends Plugin {
  async onload() {
    this.settings = { toolbarVisible: true };
    try {
      const data = await this.loadData();
      if (data && typeof data.toolbarVisible === 'boolean') {
        this.settings.toolbarVisible = data.toolbarVisible;
      }
    } catch (e) {}

    this.createToolbar();
    this.addRibbonIcon('list-checks', 'Show Bulletbar', () => {
      this.settings.toolbarVisible = true;
      this.saveSettings();
      this.toolbar.classList.remove('hidden');
      this.updateToggleButton();
      this.injectToolbar(true);
    });

    this.addCommand({
      id: 'bullet-bar-toggle',
      name: 'Toggle Bulletbar',
      callback: () => this.toggleToolbar()
    });
    this.addCommand({
      id: 'bullet-bar-show',
      name: 'Show Bulletbar',
      callback: () => {
        this.settings.toolbarVisible = true;
        this.saveSettings();
        this.toolbar.classList.remove('hidden');
        this.updateToggleButton();
        this.injectToolbar(true);
      }
    });
    this.addCommand({
      id: 'bullet-bar-hide',
      name: 'Hide Bulletbar',
      callback: () => {
        this.settings.toolbarVisible = false;
        this.saveSettings();
        this.toolbar.classList.add('hidden');
        this.updateToggleButton();
      }
    });
    [
      ['mark-todo', 'Mark current line as Todo', '⚪️'],
      ['mark-later', 'Mark current line as Later', '🐌'],
      ['mark-doing', 'Mark current line as Doing', '🔄'],
      ['mark-done', 'Mark current line as Done', '✅'],
      ['mark-cancel', 'Mark current line as Cancel', '❌'],
      ['toggle-high-priority', 'Toggle high priority', HIGH_PRIORITY_SYMBOL]
    ].forEach(([id, name, sym]) => {
      this.addCommand({
        id: `bullet-bar-${id}`,
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
    this.toolbar.className = 'bullet-bar';
    if (!this.settings.toolbarVisible) {
      this.toolbar.classList.add('hidden');
    }

    STATUS_SYMBOLS.forEach((sym, index) => {
      const titles = ['Todo', 'Later', 'Doing', 'Done', 'Cancel'];
      const btn = document.createElement('button');
      btn.className = 'bullet-bar-btn';
      btn.type = 'button';
      btn.setAttribute('data-sym', sym);
      btn.setAttribute('aria-label', titles[index]);
      btn.textContent = sym + ' ' + titles[index];
      btn.title = titles[index];
      btn.addEventListener('click', () => this.insertSymbol(sym));
      this.toolbar.appendChild(btn);
    });

    const sep = document.createElement('div');
    sep.className = 'bullet-bar-sep';
    this.toolbar.appendChild(sep);

    const priorityBtn = document.createElement('button');
    priorityBtn.className = 'bullet-bar-btn';
    priorityBtn.type = 'button';
    priorityBtn.setAttribute('data-sym', HIGH_PRIORITY_SYMBOL);
    priorityBtn.setAttribute('aria-label', 'High priority');
    priorityBtn.textContent = HIGH_PRIORITY_SYMBOL;
    priorityBtn.title = 'High priority';
    priorityBtn.addEventListener('click', () => this.insertSymbol(HIGH_PRIORITY_SYMBOL));
    this.toolbar.appendChild(priorityBtn);

    this.toolbar.appendChild(this.createSeparator());
    this.toolbar.appendChild(this.createIconButton('list-ordered', 'Ordered list', () => this.toggleList('ordered'), { listType: 'ordered' }));
    this.toolbar.appendChild(this.createIconButton('list', 'Unordered list', () => this.toggleList('bullet'), { listType: 'bullet' }));
    this.toolbar.appendChild(this.createIconButton('indent', 'Indent', () => this.indentLines()));
    this.toolbar.appendChild(this.createIconButton('outdent', 'Outdent', () => this.outdentLines()));

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'bullet-bar-btn bullet-bar-btn-icon bullet-bar-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Hide toolbar');
    toggleBtn.addEventListener('click', () => this.toggleToolbar());
    this.toolbar.appendChild(toggleBtn);
    this.updateToggleButton();
  }

  createSeparator() {
    const sep = document.createElement('div');
    sep.className = 'bullet-bar-sep';
    return sep;
  }

  createIconButton(icon, label, callback, options = {}) {
    const btn = document.createElement('button');
    btn.className = 'bullet-bar-btn bullet-bar-btn-icon';
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
      if (showNotice) new Notice('Bulletbar: Open a Markdown note first');
      return false;
    }

    if (!this.isEditableMarkdownView(markdownView)) {
      this.toolbar.remove();
      if (showNotice) new Notice('Bulletbar: Switch to editing mode');
      return false;
    }

    const host = this.findToolbarHost(markdownView);
    if (!host) {
      if (showNotice) new Notice('Bulletbar: Could not find a toolbar position');
      return false;
    }

    if (this.hasToolbar(host)) {
      this.registerCursorSyncEvents(host);
      if (showNotice) new Notice('Bulletbar is already visible');
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
    if (showNotice) new Notice('Bulletbar is visible');
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
    return Array.from(host.children).some(el => el.classList.contains('bullet-bar'));
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
    const toggleBtn = this.toolbar.querySelector('.bullet-bar-toggle');
    if (!toggleBtn) return;
    toggleBtn.textContent = '';
    setIcon(toggleBtn, this.settings.toolbarVisible ? 'x' : 'panel-top-open');
    toggleBtn.setAttribute('aria-label', this.settings.toolbarVisible ? 'Hide toolbar' : 'Show toolbar');
    toggleBtn.title = this.settings.toolbarVisible ? 'Hide toolbar' : 'Show toolbar';
  }

  getActiveEditor() {
    return this.getEditorFromMarkdownView(this.getActiveMarkdownView());
  }

  symPrefixLen(s) {
    const allSyms = [...STATUS_SYMBOLS, ...PRIORITY_SYMBOLS];
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
      document.querySelectorAll('.bullet-bar-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    if (!line) {
      document.querySelectorAll('.bullet-bar-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    const parsed = this.parseLine(line);
    const activeStatus = this.getLineStatus(parsed.content);
    const hasHigh = this.hasPriority(parsed.content, HIGH_PRIORITY_SYMBOL);
    const listType = this.getLineListType(line);

    document.querySelectorAll('.bullet-bar-btn').forEach(btn => {
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
      btn.classList.toggle('active', sym === activeStatus || (sym === HIGH_PRIORITY_SYMBOL && hasHigh));
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

    if (STATUS_SYMBOLS.includes(sym)) {
      const markers = this.extractLeadingMarkers(content);
      const nextStatus = markers.status === sym ? null : sym;

      if (parsed.checkbox) {
        parsed.checkbox = null;
        parsed.prefix = parsed.listPrefix;
      }

      content = this.formatMarkerContent(nextStatus, markers.priority, markers.content);
    } else if (PRIORITY_SYMBOLS.includes(sym)) {
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
    return this.extractLeadingMarkers(content).status;
  }

  hasPriority(content, sym) {
    return this.extractLeadingMarkers(content).priority === sym;
  }

  togglePriority(content, sym) {
    const markers = this.extractLeadingMarkers(content);
    const nextPriority = markers.priority === sym ? null : sym;
    return this.formatMarkerContent(markers.status, nextPriority, markers.content);
  }

  extractLeadingMarkers(content) {
    let rest = content.trimStart();
    let status = null;
    let priority = null;
    let changed = true;

    while (changed) {
      changed = false;
      const nextStatus = STATUS_SYMBOLS.find(sym => rest === sym || rest.startsWith(sym + ' '));
      if (nextStatus) {
        status = nextStatus;
        rest = rest.slice(nextStatus.length).trimStart();
        changed = true;
        continue;
      }

      const nextPriority = PRIORITY_SYMBOLS.find(sym => rest === sym || rest.startsWith(sym + ' '));
      if (nextPriority) {
        priority = nextPriority;
        rest = rest.slice(nextPriority.length).trimStart();
        changed = true;
      }
    }

    return { status, priority, content: rest };
  }

  formatMarkerContent(status, priority, content) {
    return [status, priority, content].filter(Boolean).join(' ');
  }

  contentPrefixLen(line) {
    const parsed = this.parseLine(line);
    return parsed.prefix.length + this.symPrefixLen(parsed.content);
  }
};
