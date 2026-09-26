const { Plugin, MarkdownView, Notice, Platform, setIcon } = require('obsidian');

const STATUS_SYMBOLS = ['⚪️', '🐌', '🔄', '✅', '❌'];
const PRIORITY_SYMBOLS = ['🔴'];
const HIGH_PRIORITY_SYMBOL = '🔴';
const STATUS_LABEL_KEYS = ['todo', 'later', 'doing', 'done', 'cancel'];

const STRINGS = {
  en: {
    showBulletbar: 'Show Bulletbar',
    toggleBulletbar: 'Toggle Bulletbar',
    hideBulletbar: 'Hide Bulletbar',
    commandMarkTodo: 'Mark current line as Todo',
    commandMarkLater: 'Mark current line as Later',
    commandMarkDoing: 'Mark current line as Doing',
    commandMarkDone: 'Mark current line as Done',
    commandMarkCancel: 'Mark current line as Cancel',
    commandToggleHighPriority: 'Toggle high priority',
    todo: 'Todo',
    later: 'Later',
    doing: 'Doing',
    done: 'Done',
    cancel: 'Cancel',
    highPriority: 'High priority',
    orderedList: 'Ordered list',
    unorderedList: 'Unordered list',
    indent: 'Indent',
    outdent: 'Outdent',
    hideToolbar: 'Hide toolbar',
    showToolbar: 'Show toolbar',
    openMarkdownFirst: 'Bulletbar: Open a Markdown note first',
    switchToEditingMode: 'Bulletbar: Switch to editing mode',
    toolbarPositionMissing: 'Bulletbar: Could not find a toolbar position',
    alreadyVisible: 'Bulletbar is already visible',
    visible: 'Bulletbar is visible'
  },
  zh: {
    showBulletbar: '显示 Bulletbar',
    toggleBulletbar: '切换 Bulletbar',
    hideBulletbar: '隐藏 Bulletbar',
    commandMarkTodo: '标记当前行为待开始',
    commandMarkLater: '标记当前行为推迟',
    commandMarkDoing: '标记当前行为进行中',
    commandMarkDone: '标记当前行为完成',
    commandMarkCancel: '标记当前行为取消',
    commandToggleHighPriority: '切换高优先级',
    todo: '待开始',
    later: '推迟',
    doing: '进行中',
    done: '完成',
    cancel: '取消',
    highPriority: '高优先级',
    orderedList: '有序列表',
    unorderedList: '无序列表',
    indent: '缩进',
    outdent: '减少缩进',
    hideToolbar: '隐藏工具栏',
    showToolbar: '显示工具栏',
    openMarkdownFirst: 'Bulletbar：请先打开一个 Markdown 笔记',
    switchToEditingMode: 'Bulletbar：请切换到编辑模式',
    toolbarPositionMissing: 'Bulletbar：找不到可插入工具栏的位置',
    alreadyVisible: 'Bulletbar 已经显示',
    visible: 'Bulletbar 已显示'
  }
};

module.exports = class BulletbarPlugin extends Plugin {
  async onload() {
    this.settings = { toolbarVisible: true };
    try {
      const data = await this.loadData();
      if (data && typeof data.toolbarVisible === 'boolean') {
        this.settings.toolbarVisible = data.toolbarVisible;
      }
    } catch (e) {}

    const isMobile = this.isMobileEnvironment();

    if (isMobile) {
      this.createMobileToolbar();
      this.registerMobileToolbarEvents();
    } else {
      this.createToolbar();
      this.addRibbonIcon('list-checks', this.t('showBulletbar'), () => {
        this.settings.toolbarVisible = true;
        this.saveSettings();
        this.toolbar.classList.remove('hidden');
        this.updateToggleButton();
        this.injectToolbar(true);
      });

      this.addCommand({
        id: 'toggle',
        name: this.t('toggleBulletbar'),
        callback: () => this.toggleToolbar()
      });
      this.addCommand({
        id: 'show',
        name: this.t('showBulletbar'),
        callback: () => {
          this.settings.toolbarVisible = true;
          this.saveSettings();
          this.toolbar.classList.remove('hidden');
          this.updateToggleButton();
          this.injectToolbar(true);
        }
      });
      this.addCommand({
        id: 'hide',
        name: this.t('hideBulletbar'),
        callback: () => {
          this.settings.toolbarVisible = false;
          this.saveSettings();
          this.toolbar.classList.add('hidden');
          this.updateToggleButton();
        }
      });
    }

    [
      ['mark-todo', this.t('commandMarkTodo'), STATUS_SYMBOLS[0]],
      ['mark-later', this.t('commandMarkLater'), STATUS_SYMBOLS[1]],
      ['mark-doing', this.t('commandMarkDoing'), STATUS_SYMBOLS[2]],
      ['mark-done', this.t('commandMarkDone'), STATUS_SYMBOLS[3]],
      ['mark-cancel', this.t('commandMarkCancel'), STATUS_SYMBOLS[4]],
      ['toggle-high-priority', this.t('commandToggleHighPriority'), HIGH_PRIORITY_SYMBOL]
    ].forEach(([id, name, symbol]) => {
      this.addCommand({
        id: id,
        name,
        editorCallback: () => this.insertSymbol(symbol)
      });
    });

    if (!isMobile) {
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
  }

  isMobileEnvironment() {
    return !!(Platform && (Platform.isMobile || Platform.isMobileApp || Platform.isPhone || Platform.isTablet));
  }

  getLocale() {
    const language = this.app && this.app.vault && typeof this.app.vault.getConfig === 'function'
      ? this.app.vault.getConfig('language')
      : null;
    const documentLang = typeof document !== 'undefined' && document.documentElement
      ? document.documentElement.getAttribute('lang')
      : null;
    const momentLang = typeof moment !== 'undefined' && moment && typeof moment.locale === 'function'
      ? moment.locale()
      : null;
    const navigatorLang = typeof navigator !== 'undefined'
      ? navigator.language
      : null;
    const lang = String(language || documentLang || momentLang || navigatorLang || 'en').toLowerCase();
    return lang.startsWith('zh') ? 'zh' : 'en';
  }

  t(key) {
    const locale = this.getLocale();
    return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || key;
  }

  async onunload() {
    if (this.toolbar) {
      this.toolbar.remove();
    }
    if (this.mobileToolbar) {
      this.mobileToolbar.remove();
    }
    this.restoreMobileEditorPadding();
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
      const titles = STATUS_LABEL_KEYS.map(key => this.t(key));
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
    priorityBtn.setAttribute('aria-label', this.t('highPriority'));
    priorityBtn.textContent = HIGH_PRIORITY_SYMBOL;
    priorityBtn.title = this.t('highPriority');
    priorityBtn.addEventListener('click', () => this.insertSymbol(HIGH_PRIORITY_SYMBOL));
    this.toolbar.appendChild(priorityBtn);

    this.toolbar.appendChild(this.createSeparator());
    this.toolbar.appendChild(this.createIconButton('list-ordered', this.t('orderedList'), () => this.toggleList('ordered'), { listType: 'ordered' }));
    this.toolbar.appendChild(this.createIconButton('list', this.t('unorderedList'), () => this.toggleList('bullet'), { listType: 'bullet' }));
    this.toolbar.appendChild(this.createIconButton('indent', this.t('indent'), () => this.indentLines()));
    this.toolbar.appendChild(this.createIconButton('outdent', this.t('outdent'), () => this.outdentLines()));

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'bullet-bar-btn bullet-bar-btn-icon bullet-bar-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', this.t('hideToolbar'));
    toggleBtn.addEventListener('click', () => this.toggleToolbar());
    this.toolbar.appendChild(toggleBtn);
    this.updateToggleButton();
  }

  createMobileToolbar() {
    this.mobileToolbar = document.createElement('div');
    this.mobileToolbar.className = 'bullet-bar-mobile';
    this.mobileToolbar.setAttribute('role', 'toolbar');
    this.mobileToolbar.setAttribute('aria-label', 'Bulletbar');

    STATUS_SYMBOLS.forEach((symbol, index) => {
      this.createMobileSymbolButton(symbol, this.t(STATUS_LABEL_KEYS[index]));
    });
    this.createMobileSymbolButton(HIGH_PRIORITY_SYMBOL, this.t('highPriority'));
  }

  createMobileSymbolButton(symbol, label) {
    const button = document.createElement('button');
    button.className = 'bullet-bar-mobile-btn';
    button.type = 'button';
    button.textContent = symbol;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('data-sym', symbol);
    button.addEventListener('click', () => this.insertSymbol(symbol));
    this.mobileToolbar.appendChild(button);
  }

  registerMobileToolbarEvents() {
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.updateMobileToolbar()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.updateMobileToolbar()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.updateMobileToolbar()));
    this.registerEvent(this.app.workspace.on('editor-change', () => this.syncToolbar()));
    this.registerDomEvent(document, 'selectionchange', () => this.scheduleSyncToolbar());
    this.registerDomEvent(window, 'resize', () => this.updateMobileToolbar());
    this.registerDomEvent(window, 'orientationchange', () => this.updateMobileToolbar());

    this.app.workspace.onLayoutReady(() => this.updateMobileToolbar());
    this.updateMobileToolbar();
  }

  updateMobileToolbar() {
    if (!this.mobileToolbar) return;
    const markdownView = this.getActiveMarkdownView();
    const host = markdownView && this.findToolbarHost(markdownView);
    if (!host || !this.isEditableMarkdownView(markdownView)) {
      this.mobileToolbar.remove();
      this.restoreMobileEditorPadding();
      return;
    }

    if (this.mobileToolbar.parentElement !== host) {
      host.appendChild(this.mobileToolbar);
    }

    const hostTop = Math.max(0, host.getBoundingClientRect().top);
    this.mobileToolbar.style.setProperty('--bullet-bar-mobile-top', `${hostTop}px`);

    const editor = this.getEditorFromMarkdownView(markdownView);
    const editorScroller = editor && editor.getScrollerElement
      ? editor.getScrollerElement()
      : host.querySelector('.cm-scroller');
    this.setMobileEditorPadding(editorScroller);
    this.syncToolbar();
  }

  setMobileEditorPadding(editorScroller) {
    if (!editorScroller) return;
    if (this.mobileEditorScroller && this.mobileEditorScroller !== editorScroller) {
      this.restoreMobileEditorPadding();
    }
    this.mobileEditorScroller = editorScroller;
    editorScroller.classList.add('bullet-bar-mobile-editor');
    const toolbarHeight = this.mobileToolbar.getBoundingClientRect().height;
    const gap = 8;
    const padding = toolbarHeight + gap;
    editorScroller.style.setProperty('--bullet-bar-mobile-editor-padding', `${padding}px`);
  }

  restoreMobileEditorPadding() {
    if (!this.mobileEditorScroller) return;
    this.mobileEditorScroller.classList.remove('bullet-bar-mobile-editor');
    this.mobileEditorScroller.style.removeProperty('--bullet-bar-mobile-editor-padding');
    this.mobileEditorScroller = null;
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
      if (showNotice) new Notice(this.t('openMarkdownFirst'));
      return false;
    }

    if (!this.isEditableMarkdownView(markdownView)) {
      this.toolbar.remove();
      if (showNotice) new Notice(this.t('switchToEditingMode'));
      return false;
    }

    const host = this.findToolbarHost(markdownView);
    if (!host) {
      if (showNotice) new Notice(this.t('toolbarPositionMissing'));
      return false;
    }

    if (this.hasToolbar(host)) {
      this.registerCursorSyncEvents(host);
      if (showNotice) new Notice(this.t('alreadyVisible'));
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
    if (showNotice) new Notice(this.t('visible'));
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
    toggleBtn.setAttribute('aria-label', this.settings.toolbarVisible ? this.t('hideToolbar') : this.t('showToolbar'));
    toggleBtn.title = this.settings.toolbarVisible ? this.t('hideToolbar') : this.t('showToolbar');
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
      document.querySelectorAll('.bullet-bar-btn, .bullet-bar-mobile-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    if (!line) {
      document.querySelectorAll('.bullet-bar-btn, .bullet-bar-mobile-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    const parsed = this.parseLine(line);
    const activeStatus = this.getLineStatus(parsed.content);
    const hasHigh = this.hasPriority(parsed.content, HIGH_PRIORITY_SYMBOL);
    const listType = this.getLineListType(line);

    document.querySelectorAll('.bullet-bar-btn, .bullet-bar-mobile-btn').forEach(btn => {
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
