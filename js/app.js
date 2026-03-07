/**
 * Digital Culture Box - Main Application v2
 */
const App = {
  currentPage: 'home',
  currentBox: null,
  currentFilter: 'all',
  createState: { step: 1, box: null, items: [] },
  currentItemType: null,
  unboxStep: 0, // 0=closed, 1=tape removed, 2=opened
  selectedRole: 'student',

  // Access codes for login validation
  ACCESS_CODES: {
    student: ['CULTURE2026', 'BOX2026', 'HELLO2026'],
    teacher: ['TEACHER2026', 'ADMIN2026']
  },

  // ===== Init =====
  async init() {
    I18N.init();
    this.buildLangMenu();
    this.updateLangButton();
    document.addEventListener('langchange', () => {
      this.updateLangButton();
      this.refreshCurrentPage();
    });
    this.loadStats();
    this.loadRecentBoxes();

    const savedUser = localStorage.getItem('dcb_user');
    if (savedUser) {
      try {
        DataStore.currentUser = JSON.parse(savedUser);
        this.updateUserUI();
      } catch (e) { /* ignore */ }
    }

    this.populateSchoolSelectors();
  },

  // ===== Navigation =====
  navigate(page, data) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    this.currentPage = page;

    switch (page) {
      case 'home': this.loadRecentBoxes(); break;
      case 'explore': this.loadExploreBoxes(); break;
      case 'boxdetail': if (data) this.openBoxDetail(data); break;
      case 'create': this.initCreateFlow(); break;
      case 'myboxes': this.loadMyBoxes(); break;
      case 'admin': this.loadAdmin(); break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('navLinks').classList.remove('open');
  },

  refreshCurrentPage() { this.navigate(this.currentPage); },

  // ===== Language (no flags) =====
  buildLangMenu() {
    const dropdown = document.getElementById('langDropdown');
    const langs = I18N.getAvailableLangs();
    dropdown.innerHTML = langs.map(l => `
      <button class="nav__lang-option ${l.code === I18N.getLang() ? 'active' : ''}"
              onclick="App.changeLang('${l.code}')">
        ${l.name}
      </button>
    `).join('');
  },

  changeLang(code) {
    I18N.setLang(code);
    this.buildLangMenu();
    this.toggleLangMenu();
  },

  updateLangButton() {
    const lang = I18N.getAvailableLangs().find(l => l.code === I18N.getLang());
    document.getElementById('langCurrent').textContent = lang ? lang.code.toUpperCase() : '';
  },

  toggleLangMenu() { document.getElementById('langToggle').classList.toggle('open'); },
  toggleMobileNav() { document.getElementById('navLinks').classList.toggle('open'); },

  // ===== Auth with access codes =====
  showLogin() {
    this.populateLoginSchools();
    this.selectedRole = 'student';
    this.selectRole('student');
    // Clear errors
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    document.getElementById('loginName').value = '';
    document.getElementById('loginCode').value = '';
    document.getElementById('loginTeacherCode').value = '';
    document.getElementById('loginModal').classList.add('active');
  },

  hideLogin() { document.getElementById('loginModal').classList.remove('active'); },

  selectRole(role) {
    this.selectedRole = role;
    document.querySelectorAll('.role-selector__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });
    document.getElementById('studentCodeGroup').classList.toggle('hidden', role !== 'student');
    document.getElementById('teacherCodeGroup').classList.toggle('hidden', role !== 'teacher');
  },

  populateLoginSchools() {
    const sel = document.getElementById('loginSchool');
    sel.innerHTML = DataStore.schools.map(s =>
      `<option value="${s.id}">${DataStore.getSchoolName(s.id)}</option>`
    ).join('');
  },

  login() {
    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));

    const name = document.getElementById('loginName').value.trim();
    if (!name) {
      document.getElementById('loginNameError').classList.add('show');
      document.getElementById('loginName').focus();
      return;
    }

    const school = document.getElementById('loginSchool').value;

    // Validate access code
    if (this.selectedRole === 'student') {
      const code = document.getElementById('loginCode').value.trim().toUpperCase();
      if (!this.ACCESS_CODES.student.includes(code)) {
        document.getElementById('loginCodeError').classList.add('show');
        document.getElementById('loginCode').focus();
        return;
      }
    } else {
      const code = document.getElementById('loginTeacherCode').value.trim().toUpperCase();
      if (!this.ACCESS_CODES.teacher.includes(code)) {
        document.getElementById('loginTeacherCodeError').classList.add('show');
        document.getElementById('loginTeacherCode').focus();
        return;
      }
    }

    DataStore.currentUser = {
      id: DataStore.generateId('usr'),
      name,
      school_id: school,
      role: this.selectedRole,
      lang_pref: I18N.getLang()
    };

    localStorage.setItem('dcb_user', JSON.stringify(DataStore.currentUser));
    this.updateUserUI();
    this.hideLogin();
    this.toast(`Welcome, ${name}!`);
  },

  logout() {
    DataStore.currentUser = null;
    localStorage.removeItem('dcb_user');
    this.updateUserUI();
    this.navigate('home');
  },

  updateUserUI() {
    const user = DataStore.currentUser;
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      logoutBtn.textContent = `${user.name}`;

      const adminLink = document.querySelector('[data-page="admin"]');
      if (adminLink) adminLink.parentElement.style.display = user.role === 'teacher' ? '' : 'none';
    } else {
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      const adminLink = document.querySelector('[data-page="admin"]');
      if (adminLink) adminLink.parentElement.style.display = 'none';
    }
  },

  // ===== Stats =====
  async loadStats() {
    const stats = await API.getStats();
    document.getElementById('statSchools').textContent = stats.schools;
    document.getElementById('statBoxes').textContent = stats.boxes;
    document.getElementById('statItems').textContent = stats.items;
  },

  populateSchoolSelectors() {
    const schools = DataStore.schools;
    ['boxFromSchool', 'boxToSchool'].forEach(selId => {
      const el = document.getElementById(selId);
      if (el) {
        el.innerHTML = schools.map(s =>
          `<option value="${s.id}">${DataStore.getSchoolName(s.id)}</option>`
        ).join('');
      }
    });
  },

  // ===== Box Card (reference design) =====
  renderBoxCard(box) {
    const fromSchool = DataStore.getSchool(box.from_school_id);
    const toSchool = DataStore.getSchool(box.to_school_id);
    const items = DataStore.getBoxItems(box.id);
    const msgs = DataStore.getBoxMessages(box.id);
    const statusKey = 'status.' + box.status;

    const coverBgs = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    const bgIdx = Math.abs(box.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % coverBgs.length;

    const isArrived = box.status === 'arrived' || box.status === 'sent';
    const actionCls = isArrived ? 'box-card__action-btn--open' : 'box-card__action-btn--revisit';
    const actionText = isArrived ? I18N.t('unbox.tap') : 'Revisit Box';

    return `
      <div class="box-card" onclick="App.navigate('boxdetail','${box.id}')">
        <div class="box-card__cover" style="background:${coverBgs[bgIdx]}">
          <span class="box-card__cover-placeholder">&#x1F4E6;</span>
          <span class="box-card__status box-card__status--${box.status}">${I18N.t(statusKey)}</span>
          <div class="box-card__cover-info">
            <div class="box-card__cover-from">${I18N.t('unbox.from')} ${fromSchool ? DataStore.getSchoolName(fromSchool.id) : ''}</div>
            <div class="box-card__cover-title">${this.escapeHtml(DataStore.getBoxTitle(box))}</div>
          </div>
        </div>
        <div class="box-card__body">
          <div class="box-card__meta">
            <span class="box-card__meta-item">&#x1F4E6; ${items.length} Items</span>
            <span class="box-card__meta-item">&#x1F4AC; ${msgs.length} Talks</span>
          </div>
          <button class="box-card__action-btn ${actionCls}">
            ${actionText} &rsaquo;
          </button>
        </div>
      </div>
    `;
  },

  // ===== Home =====
  async loadRecentBoxes() {
    const boxes = await API.getBoxes();
    const recent = boxes.filter(b => b.status !== 'draft').slice(0, 3);
    document.getElementById('recentBoxes').innerHTML = recent.map(b => this.renderBoxCard(b)).join('');
  },

  // ===== Explore =====
  async loadExploreBoxes() {
    const search = document.getElementById('exploreSearch')?.value || '';
    const boxes = await API.getBoxes({ status: this.currentFilter, search });
    const grid = document.getElementById('exploreGrid');

    const visible = this.currentFilter === 'all'
      ? boxes.filter(b => b.status !== 'draft')
      : boxes;

    if (visible.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">&#x1F4ED;</div><div class="empty-state__text">${I18N.t('common.empty')}</div></div>`;
      return;
    }
    grid.innerHTML = visible.map(b => this.renderBoxCard(b)).join('');
  },

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
    this.loadExploreBoxes();
  },

  filterBoxes() { this.loadExploreBoxes(); },

  // ===== 2-Step Unboxing =====
  async openBoxDetail(boxId) {
    const box = await API.getBox(boxId);
    if (!box) return;
    this.currentBox = box;
    this.unboxStep = 0;

    const fromSchool = DataStore.getSchool(box.from_school_id);

    document.getElementById('unboxingView').classList.remove('hidden');
    document.getElementById('boxDetailView').classList.add('hidden');

    document.getElementById('unboxTitle').textContent = DataStore.getBoxTitle(box);
    document.getElementById('unboxSchool').textContent = fromSchool ? DataStore.getSchoolName(fromSchool.id) : '';

    // Reset unbox UI
    const wrapper = document.getElementById('unboxClickArea');
    wrapper.classList.remove('opening');
    document.getElementById('unboxTape').classList.remove('removed');
    document.getElementById('unboxOpenBtn').classList.add('hidden');
    document.getElementById('unboxPrompt').textContent = I18N.t('unbox.tap');

    // Skip unboxing for already opened/draft
    if (box.status === 'opened' || box.status === 'draft') {
      this.showBoxContent(box);
    }
  },

  removeTape(e) {
    e.stopPropagation();
    if (this.unboxStep >= 1) return;
    this.unboxStep = 1;
    document.getElementById('unboxTape').classList.add('removed');
    document.getElementById('unboxPrompt').classList.add('hidden');
    document.getElementById('unboxOpenBtn').classList.remove('hidden');
  },

  async openBoxAnimation() {
    if (this.unboxStep >= 2) return;
    this.unboxStep = 2;

    const wrapper = document.getElementById('unboxClickArea');
    wrapper.classList.add('opening');

    if (this.currentBox.status === 'arrived' || this.currentBox.status === 'sent') {
      await API.openBox(this.currentBox.id);
      this.currentBox.status = 'opened';
    }

    this.launchConfetti();

    setTimeout(() => {
      this.showBoxContent(this.currentBox);
    }, 1200);
  },

  showBoxContent(box) {
    document.getElementById('unboxingView').classList.add('hidden');
    document.getElementById('boxDetailView').classList.remove('hidden');

    const fromSchool = DataStore.getSchool(box.from_school_id);
    const toSchool = DataStore.getSchool(box.to_school_id);
    const items = DataStore.getBoxItems(box.id);

    document.getElementById('boxDetailTitle').textContent = DataStore.getBoxTitle(box);
    document.getElementById('boxDetailDesc').textContent = DataStore.getBoxDesc(box);

    const badge = document.getElementById('boxDetailBadge');
    badge.className = `badge badge--${box.status}`;
    badge.textContent = I18N.t('status.' + box.status);

    document.getElementById('boxDetailMeta').innerHTML = `
      <div class="box-meta-item">
        <span class="box-meta-item__label">${I18N.t('unbox.from')}</span>
        <span class="box-meta-item__value">${fromSchool ? DataStore.getSchoolName(fromSchool.id) : ''}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">To</span>
        <span class="box-meta-item__value">${toSchool ? DataStore.getSchoolName(toSchool.id) : ''}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">${I18N.t('unbox.date')}</span>
        <span class="box-meta-item__value">${box.sent_at || '-'}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">Items</span>
        <span class="box-meta-item__value">${items.length}</span>
      </div>
    `;

    this.renderItems(items);
    this.loadBoxMessages(box.id);
    this.switchTab('items');
  },

  // ===== Items (reference card design) =====
  renderItems(items) {
    const grid = document.getElementById('itemsGrid');
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">&#x1F4ED;</div><div class="empty-state__text">${I18N.t('item.empty')}</div></div>`;
      return;
    }

    const typeIcons = {
      text: { icon: '&#x1F4DD;', cls: 'text' },
      image: { icon: '&#x1F5BC;&#xFE0F;', cls: 'image' },
      video: { icon: '&#x1F3AC;', cls: 'video' },
      youtube: { icon: '&#x25B6;&#xFE0F;', cls: 'youtube' },
      link: { icon: '&#x1F517;', cls: 'link' },
      pdf: { icon: '&#x1F4C4;', cls: 'pdf' },
      file: { icon: '&#x1F4CE;', cls: 'file' },
    };

    grid.innerHTML = items.map(item => {
      const ti = typeIcons[item.type] || typeIcons.file;
      const preview = item.content ? this.escapeHtml(item.content).substring(0, 120) + (item.content.length > 120 ? '...' : '') : '';
      return `
        <div class="item-card" onclick="App.showItemDetail('${item.id}')">
          <div class="item-card__header">
            <div class="item-card__icon item-card__icon--${ti.cls}">${ti.icon}</div>
          </div>
          <div class="item-card__title">${this.escapeHtml(DataStore.getItemTitle(item))}</div>
          ${preview ? `<div class="item-card__preview">${preview}</div>` : ''}
          <div class="item-card__footer">
            <span>${I18N.t('item.' + item.type)}</span>
            <span style="color:var(--color-text-tertiary);">Click to see more</span>
          </div>
        </div>
      `;
    }).join('');
  },

  showItemDetail(itemId) {
    const item = DataStore.items.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('itemModal');
    const content = document.getElementById('itemModalContent');

    let html = `<h2 style="font-size:1.25rem;font-weight:700;margin-bottom:16px;">${this.escapeHtml(DataStore.getItemTitle(item))}</h2>`;

    switch (item.type) {
      case 'text':
        html += `<div class="item-detail__content" style="white-space:pre-wrap;">${this.escapeHtml(item.content)}</div>`;
        break;
      case 'image':
        if (item.file_url) html += `<div class="item-detail__media"><img src="${this.escapeHtml(item.file_url)}" alt=""></div>`;
        if (item.content) html += `<div class="item-detail__content" style="margin-top:12px;">${this.escapeHtml(item.content)}</div>`;
        break;
      case 'youtube':
        if (item.file_url) {
          const vidId = this.extractYouTubeId(item.file_url);
          if (vidId) html += `<div class="item-detail__media"><iframe src="https://www.youtube.com/embed/${vidId}" allowfullscreen></iframe></div>`;
        }
        break;
      case 'video':
        if (item.file_url) html += `<div class="item-detail__media"><video controls src="${this.escapeHtml(item.file_url)}"></video></div>`;
        break;
      case 'link':
        html += `<div style="margin-bottom:12px;"><a href="${this.escapeHtml(item.file_url)}" target="_blank" rel="noopener" class="btn btn--secondary">&#x1F517; ${this.escapeHtml(item.file_url)}</a></div>`;
        if (item.content) html += `<div class="item-detail__content">${this.escapeHtml(item.content)}</div>`;
        break;
      case 'pdf':
        if (item.file_url) html += `<div><a href="${this.escapeHtml(item.file_url)}" target="_blank" rel="noopener" class="btn btn--secondary">&#x1F4C4; Open PDF</a></div>`;
        break;
      default:
        if (item.content) html += `<div class="item-detail__content">${this.escapeHtml(item.content)}</div>`;
    }

    html += `
      <div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border-light);">
        <button class="reaction-btn" onclick="App.reactToItem('${item.id}','heart')">&#x2764;&#xFE0F; ${I18N.t('react.heart')}</button>
        <button class="reaction-btn" onclick="App.reactToItem('${item.id}','star')">&#x2B50; ${I18N.t('react.star')}</button>
        <button class="reaction-btn" onclick="App.reactToItem('${item.id}','surprise')">&#x1F62E; ${I18N.t('react.surprise')}</button>
        <button class="reaction-btn" onclick="App.reactToItem('${item.id}','thanks')">&#x1F64F; ${I18N.t('react.thanks')}</button>
      </div>
    `;

    content.innerHTML = html;
    modal.classList.add('active');
  },

  closeItemModal() { document.getElementById('itemModal').classList.remove('active'); },
  reactToItem(id, type) { this.toast(`${I18N.t('react.' + type)}!`); },

  // ===== Tabs =====
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.toggle('active', tc.id === 'tab-' + tabName));
  },

  // ===== Thread-based Messages =====
  async loadBoxMessages(boxId) {
    const messages = await API.getMessages(boxId);
    const list = document.getElementById('messageList');

    if (messages.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#x1F4AC;</div><div class="empty-state__text">${I18N.t('msg.empty')}</div></div>`;
      return;
    }

    // Group into threads: parent messages + their replies
    const parents = messages.filter(m => !m.parent_id);
    const replies = messages.filter(m => m.parent_id);

    list.innerHTML = parents.map(msg => {
      const threadReplies = replies.filter(r => r.parent_id === msg.id);
      return this.renderThread(msg, threadReplies);
    }).join('');
  },

  renderThread(msg, replies) {
    const avatarColors = ['#D97706', '#3B82F6', '#10B981', '#EC4899', '#7C3AED', '#EF4444'];
    const getColor = (name) => avatarColors[Math.abs((name||'').split('').reduce((a,c) => a+c.charCodeAt(0), 0)) % avatarColors.length];
    const getInitial = (name) => (name || '?').charAt(0).toUpperCase();
    const school = DataStore.getSchool(msg.user_school);

    let replyHtml = '';
    if (replies.length > 0) {
      const replyItems = replies.map(r => {
        const rs = DataStore.getSchool(r.user_school);
        return `
          <div class="thread-reply">
            <div class="thread-reply__header">
              <div class="thread-reply__avatar" style="background:${getColor(r.user_name)}">${getInitial(r.user_name)}</div>
              <span class="thread-reply__name">${this.escapeHtml(r.user_name)}</span>
              <span style="font-size:10px;color:var(--color-text-tertiary);">${rs ? DataStore.getSchoolName(rs.id) : ''}</span>
              <span class="thread-reply__time">${this.formatDate(r.created_at)}</span>
            </div>
            <div class="thread-reply__content">${this.escapeHtml(r.content)}</div>
          </div>
        `;
      }).join('');

      // Mini avatars for toggle
      const miniAvatars = replies.slice(0, 3).map(r =>
        `<div class="thread-toggle__mini-avatar" style="background:${getColor(r.user_name)}">${getInitial(r.user_name)}</div>`
      ).join('');

      replyHtml = `
        <button class="thread-toggle" onclick="App.toggleThread('${msg.id}')">
          <span>${replies.length} ${I18N.t('msg.thread.count')}</span>
          <div class="thread-toggle__avatars">${miniAvatars}</div>
        </button>
        <div class="thread-replies" id="replies-${msg.id}">
          ${replyItems}
          <div class="thread-reply-input">
            <input type="text" id="reply-input-${msg.id}" data-i18n-placeholder="msg.reply.placeholder" placeholder="${I18N.t('msg.reply.placeholder')}"
                   onkeydown="if(event.key==='Enter')App.sendReply('${msg.id}')">
            <button class="btn btn--primary btn--sm" onclick="App.sendReply('${msg.id}')" data-i18n="msg.send">보내기</button>
          </div>
        </div>
      `;
    } else {
      replyHtml = `
        <button class="thread-toggle" onclick="App.toggleThread('${msg.id}')">
          <span data-i18n="msg.reply">답글</span>
        </button>
        <div class="thread-replies" id="replies-${msg.id}">
          <div class="thread-reply-input">
            <input type="text" id="reply-input-${msg.id}" data-i18n-placeholder="msg.reply.placeholder" placeholder="${I18N.t('msg.reply.placeholder')}"
                   onkeydown="if(event.key==='Enter')App.sendReply('${msg.id}')">
            <button class="btn btn--primary btn--sm" onclick="App.sendReply('${msg.id}')" data-i18n="msg.send">보내기</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="thread-item ${msg.status === 'pending' ? 'thread-item--pending' : ''}">
        <div class="thread-item__main">
          <div class="thread-item__header">
            <div class="thread-item__avatar" style="background:${getColor(msg.user_name)}">${getInitial(msg.user_name)}</div>
            <div class="thread-item__user-info">
              <div class="thread-item__name">${this.escapeHtml(msg.user_name)}</div>
              <div class="thread-item__school">${school ? DataStore.getSchoolName(school.id) : ''}</div>
            </div>
            <div class="thread-item__time">${this.formatDate(msg.created_at)}</div>
          </div>
          <div class="thread-item__content">${this.escapeHtml(msg.content)}</div>
          <div class="thread-item__actions">
            <button class="reaction-btn" onclick="App.reactToMessage('${msg.id}','heart')">&#x2764;&#xFE0F;</button>
            <button class="reaction-btn" onclick="App.reactToMessage('${msg.id}','star')">&#x2B50;</button>
            <button class="reaction-btn" onclick="App.reactToMessage('${msg.id}','thanks')">&#x1F64F;</button>
          </div>
        </div>
        ${replyHtml}
      </div>
    `;
  },

  toggleThread(msgId) {
    const el = document.getElementById('replies-' + msgId);
    if (el) el.classList.toggle('open');
  },

  async sendMessage() {
    if (!DataStore.currentUser) { this.showLogin(); return; }
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !this.currentBox) return;

    await API.addMessage({ box_id: this.currentBox.id, content: text, parent_id: null });
    input.value = '';
    this.loadBoxMessages(this.currentBox.id);
    this.toast(I18N.t('msg.send') + '!');
  },

  async sendReply(parentId) {
    if (!DataStore.currentUser) { this.showLogin(); return; }
    const input = document.getElementById('reply-input-' + parentId);
    const text = input.value.trim();
    if (!text || !this.currentBox) return;

    await API.addMessage({ box_id: this.currentBox.id, content: text, parent_id: parentId });
    input.value = '';
    this.loadBoxMessages(this.currentBox.id);
    // Reopen the thread
    setTimeout(() => {
      const el = document.getElementById('replies-' + parentId);
      if (el) el.classList.add('open');
    }, 100);
  },

  reactToMessage(id, type) { this.toast(`${I18N.t('react.' + type)}!`); },

  // ===== Create Box Flow =====
  initCreateFlow() {
    if (this.createState.box) return;
    this.createState = { step: 1, box: null, items: [] };
    this.createStep(1);
    this.populateSchoolSelectors();
  },

  createStep(step) {
    this.createState.step = step;
    document.querySelectorAll('.stepper__step').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === step);
      el.classList.toggle('completed', s < step);
    });
    for (let i = 1; i <= 4; i++) {
      document.getElementById('createStep' + i).classList.toggle('active', i === step);
    }
    if (step === 2) this.renderCreateItems();
    if (step === 3) this.initPackingStep();
    if (step === 4) {
      document.getElementById('sendProgressFill').style.width = '0%';
      document.getElementById('sendProgressText').textContent = '';
    }
  },

  addItemDialog(type) {
    this.currentItemType = type;
    document.getElementById('itemFormArea').classList.remove('hidden');
    document.getElementById('itemContentGroup').classList.remove('hidden');
    document.getElementById('itemUrlGroup').classList.add('hidden');
    document.getElementById('itemFileGroup').classList.add('hidden');
    if (type === 'youtube' || type === 'link') document.getElementById('itemUrlGroup').classList.remove('hidden');
    if (type === 'image' || type === 'video' || type === 'pdf' || type === 'file') document.getElementById('itemFileGroup').classList.remove('hidden');
    document.getElementById('itemTitleInput').value = '';
    document.getElementById('itemContentInput').value = '';
    document.getElementById('itemUrlInput').value = '';
    document.getElementById('itemTitleInput').focus();
  },

  cancelItemForm() {
    document.getElementById('itemFormArea').classList.add('hidden');
    this.currentItemType = null;
  },

  saveItem() {
    const title = document.getElementById('itemTitleInput').value.trim();
    if (!title) { this.toast(I18N.t('item.title') + '!'); return; }
    this.createState.items.push({
      id: DataStore.generateId('itm'),
      type: this.currentItemType,
      title,
      content: document.getElementById('itemContentInput').value.trim(),
      file_url: document.getElementById('itemUrlInput').value.trim(),
      order: this.createState.items.length + 1
    });
    this.cancelItemForm();
    this.renderCreateItems();
  },

  renderCreateItems() {
    const list = document.getElementById('createItemsList');
    if (this.createState.items.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#x1F4ED;</div><div class="empty-state__text">${I18N.t('item.empty')}</div></div>`;
      return;
    }
    const icons = { text:'&#x1F4DD;', image:'&#x1F5BC;&#xFE0F;', video:'&#x1F3AC;', youtube:'&#x25B6;&#xFE0F;', link:'&#x1F517;', pdf:'&#x1F4C4;', file:'&#x1F4CE;' };
    list.innerHTML = this.createState.items.map((item, idx) => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:8px;border:1px solid var(--color-border);">
        <span style="font-size:18px;">${icons[item.type] || icons.file}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;">${this.escapeHtml(item.title)}</div>
          <div style="font-size:12px;color:var(--color-text-tertiary);">${I18N.t('item.' + item.type)}</div>
        </div>
        <button class="btn btn--ghost btn--sm" onclick="App.removeCreateItem(${idx})" style="color:var(--color-accent-red);">&times;</button>
      </div>
    `).join('');
  },

  removeCreateItem(idx) { this.createState.items.splice(idx, 1); this.renderCreateItems(); },

  initPackingStep() {
    const toSchoolId = document.getElementById('boxToSchool').value;
    document.getElementById('packingLabelTo').textContent = DataStore.getSchoolName(toSchoolId);
    document.getElementById('packingScene').classList.remove('closing', 'taping', 'labeling');
  },

  runPackingAnimation() {
    const scene = document.getElementById('packingScene');
    scene.classList.add('closing');
    setTimeout(() => scene.classList.add('taping'), 800);
    setTimeout(() => { scene.classList.add('labeling'); this.toast('Packed!'); }, 1400);
  },

  async sendBox() {
    if (!DataStore.currentUser) { this.showLogin(); return; }
    const name = document.getElementById('boxNameInput').value.trim();
    if (!name) { this.toast(I18N.t('create.boxname') + '!'); this.createStep(1); return; }

    const btn = document.getElementById('sendBoxBtn');
    btn.disabled = true;

    const box = await API.createBox({
      title: name,
      description: document.getElementById('boxDescInput').value.trim(),
      from_school_id: document.getElementById('boxFromSchool').value,
      to_school_id: document.getElementById('boxToSchool').value,
      created_by: DataStore.currentUser.id
    });

    for (const item of this.createState.items) {
      await API.addItem({ ...item, box_id: box.id });
    }

    const fill = document.getElementById('sendProgressFill');
    const text = document.getElementById('sendProgressText');
    const steps = [
      { pct: 20, msg: 'Packing items...' },
      { pct: 50, msg: 'Adding labels...' },
      { pct: 75, msg: 'Sealing...' },
      { pct: 90, msg: 'Sending...' },
      { pct: 100, msg: 'Delivered!' },
    ];

    for (const s of steps) {
      await new Promise(r => setTimeout(r, 500));
      fill.style.width = s.pct + '%';
      text.textContent = s.msg;
    }

    await API.sendBox(box.id);
    this.launchConfetti();
    await new Promise(r => setTimeout(r, 800));
    btn.disabled = false;

    this.createState = { step: 1, box: null, items: [] };
    document.getElementById('boxNameInput').value = '';
    document.getElementById('boxDescInput').value = '';
    this.toast('Box sent!');
    setTimeout(() => this.navigate('explore'), 1200);
  },

  // ===== My Boxes =====
  async loadMyBoxes() {
    const grid = document.getElementById('myBoxesGrid');
    if (!DataStore.currentUser) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">&#x1F512;</div><div class="empty-state__text">${I18N.t('nav.login')}</div><button class="btn btn--primary" onclick="App.showLogin()">${I18N.t('nav.login')}</button></div>`;
      return;
    }
    const allBoxes = await API.getBoxes();
    const myBoxes = allBoxes.filter(b =>
      b.created_by === DataStore.currentUser.id ||
      b.from_school_id === DataStore.currentUser.school_id ||
      b.to_school_id === DataStore.currentUser.school_id
    );
    if (myBoxes.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">&#x1F4ED;</div><div class="empty-state__text">${I18N.t('common.empty')}</div><button class="btn btn--primary" onclick="App.navigate('create')">${I18N.t('nav.pack')}</button></div>`;
      return;
    }
    grid.innerHTML = myBoxes.map(b => this.renderBoxCard(b)).join('');
  },

  // ===== Admin =====
  currentAdminTab: 'schools',
  loadAdmin() { this.adminTab('schools'); },

  adminTab(tab) {
    this.currentAdminTab = tab;
    document.querySelectorAll('.admin-sidebar__item').forEach((item, idx) => {
      const tabs = ['schools','boxes','users','messages'];
      item.classList.toggle('active', tabs[idx] === tab);
    });
    const content = document.getElementById('adminContent');
    switch (tab) {
      case 'schools': content.innerHTML = this.renderAdminSchools(); break;
      case 'boxes': content.innerHTML = this.renderAdminBoxes(); break;
      case 'users': content.innerHTML = this.renderAdminUsers(); break;
      case 'messages': content.innerHTML = this.renderAdminMessages(); break;
    }
  },

  renderAdminSchools() {
    return `<div class="admin-table"><table><thead><tr><th>ID</th><th>Name</th><th>Country</th><th>Boxes</th></tr></thead><tbody>${DataStore.schools.map(s => {
      const bc = DataStore.boxes.filter(b => b.from_school_id === s.id || b.to_school_id === s.id).length;
      return `<tr><td><code>${s.id}</code></td><td>${DataStore.getSchoolName(s.id)}</td><td>${s.country}</td><td>${bc}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  },

  renderAdminBoxes() {
    return `<div class="admin-table"><table><thead><tr><th>Title</th><th>From</th><th>To</th><th>Status</th><th>Items</th><th>Actions</th></tr></thead><tbody>${DataStore.boxes.map(b => `
      <tr><td><strong>${this.escapeHtml(DataStore.getBoxTitle(b))}</strong></td><td>${DataStore.getSchoolName(b.from_school_id)}</td><td>${DataStore.getSchoolName(b.to_school_id)}</td><td><span class="badge badge--${b.status}">${I18N.t('status.'+b.status)}</span></td><td>${DataStore.getBoxItems(b.id).length}</td><td><button class="btn btn--ghost btn--sm" onclick="App.navigate('boxdetail','${b.id}')">View</button></td></tr>
    `).join('')}</tbody></table></div>`;
  },

  renderAdminUsers() {
    return `<div class="admin-table"><table><thead><tr><th>Name</th><th>School</th><th>Role</th></tr></thead><tbody><tr><td colspan="3" style="text-align:center;color:var(--color-text-tertiary);padding:32px;">Connects to Google Sheets in production.</td></tr></tbody></table></div>`;
  },

  renderAdminMessages() {
    return `<div class="admin-table"><table><thead><tr><th>User</th><th>Box</th><th>Content</th><th>Status</th><th>Actions</th></tr></thead><tbody>${DataStore.messages.map(m => {
      const box = DataStore.boxes.find(b => b.id === m.box_id);
      return `<tr><td>${this.escapeHtml(m.user_name)}</td><td>${box ? this.escapeHtml(DataStore.getBoxTitle(box)) : ''}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(m.content)}</td><td><span class="badge badge--${m.status==='approved'?'approved':'pending'}">${m.status}</span></td><td>${m.status==='pending'?`<button class="btn btn--ghost btn--sm" style="color:var(--color-secondary);" onclick="App.adminApproveMsg('${m.id}')">${I18N.t('admin.approve')}</button>`:''}<button class="btn btn--ghost btn--sm" style="color:var(--color-accent-red);" onclick="App.adminHideMsg('${m.id}')">${I18N.t('admin.hide')}</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  },

  async adminApproveMsg(id) { await API.updateMessageStatus(id, 'approved'); this.adminTab('messages'); },
  async adminHideMsg(id) { await API.updateMessageStatus(id, 'hidden'); this.adminTab('messages'); },

  // ===== Confetti =====
  launchConfetti() {
    const colors = ['#D97706', '#3B82F6', '#10B981', '#EC4899', '#7C3AED', '#FBBF24'];
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDelay = Math.random() * 0.5 + 's';
      el.style.animationDuration = (2 + Math.random() * 2) + 's';
      el.style.width = (6 + Math.random() * 8) + 'px';
      el.style.height = (6 + Math.random() * 8) + 'px';
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  },

  // ===== Toast =====
  toast(msg) {
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  },

  // ===== Utils =====
  escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  }
};

// Global event listeners
document.addEventListener('click', (e) => {
  const langBtn = document.getElementById('langToggle');
  if (langBtn && !langBtn.contains(e.target)) langBtn.classList.remove('open');
  if (e.target === document.getElementById('itemModal')) App.closeItemModal();
  if (e.target === document.getElementById('loginModal')) App.hideLogin();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { App.closeItemModal(); App.hideLogin(); }
});

document.addEventListener('DOMContentLoaded', () => App.init());
