/**
 * Digital Culture Box - Main Application v4
 * Features: Themes, school login, social feed, item comments, admin user management
 */
const App = {
  currentPage: 'home',
  currentBox: null,
  currentFilter: 'all',
  createState: { step: 1, box: null, items: [] },
  currentItemType: null,
  unboxStep: 0,
  selectedRole: 'student',
  isAdmin: false,
  pendingNav: null,
  currentTheme: 'default',
  currentSocialType: 'text',
  currentItemModal: null,

  ACCESS_CODES: {
    student: ['CULTURE2026', 'BOX2026', 'HELLO2026'],
    teacher: ['TEACHER2026', 'EDU2026']
  },

  // Admin credentials check (obfuscated)
  _ck(u, p) {
    const d = a => a.map(n => String.fromCharCode(n)).join('');
    return u === d([109,97,115,116,101,114]) && p === d([50,56,54,53]);
  },

  // ===== Theme =====
  themes: [
    { id: 'default', label: () => I18N.t('theme.default'), color: '#D97706' },
    { id: 'blue',    label: () => I18N.t('theme.blue'),    color: '#60A5FA' },
    { id: 'green',   label: () => I18N.t('theme.green'),   color: '#34D399' },
    { id: 'pink',    label: () => I18N.t('theme.pink'),    color: '#F472B6' },
  ],

  setTheme(t) {
    this.currentTheme = t;
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    if (t !== 'default') document.body.classList.add('theme-' + t);
    localStorage.setItem('dcb_theme', t);
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === t);
    });
  },

  loadTheme() {
    const t = localStorage.getItem('dcb_theme') || 'default';
    this.setTheme(t);
  },

  toggleThemePicker() {
    document.getElementById('themePicker').classList.toggle('open');
  },

  // ===== Init =====
  async init() {
    DataStore.loadSaved();
    I18N.init();
    this.loadTheme();
    this.buildLangMenu();
    this.updateLangButton();

    document.addEventListener('langchange', () => {
      this.updateLangButton();
      this.refreshCurrentPage();
    });

    const savedUser = localStorage.getItem('dcb_user');
    if (savedUser) {
      try { DataStore.currentUser = JSON.parse(savedUser); }
      catch(e) { localStorage.removeItem('dcb_user'); }
    }

    if (localStorage.getItem('dcb_admin_session') === 'active') {
      this.isAdmin = true;
    }

    this.updateUserUI();
    this.loadStats();
    this.loadRecentBoxes();
    this.populateSchoolSelectors();
  },

  // ===== Navigation =====
  navigate(page, data) {
    if (page === 'admin' && !this.isAdmin) {
      this.showAdminLogin();
      return;
    }

    const loginPages = ['explore', 'boxdetail', 'create', 'myboxes'];
    if (loginPages.includes(page) && !DataStore.currentUser && !this.isAdmin) {
      this.pendingNav = { page, data };
      this.showLogin();
      return;
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    this.currentPage = page;

    switch (page) {
      case 'home':      this.loadRecentBoxes(); break;
      case 'explore':   this.loadExploreBoxes(); break;
      case 'boxdetail': if (data) this.openBoxDetail(data); break;
      case 'create':    this.initCreateFlow(); break;
      case 'myboxes':   this.loadMyBoxes(); break;
      case 'admin':     this.loadAdmin(); break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('navLinks').classList.remove('open');
  },

  refreshCurrentPage() { this.navigate(this.currentPage); },

  // ===== Language =====
  buildLangMenu() {
    const dropdown = document.getElementById('langDropdown');
    const langs = I18N.getAvailableLangs();
    dropdown.innerHTML = langs.map(l => `
      <button class="nav__lang-option ${l.code === I18N.getLang() ? 'active' : ''}"
              onclick="App.changeLang('${l.code}')">${l.name}</button>
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

  // ===== Regular Login =====
  showLogin() {
    this.populateLoginSchools();
    this.selectedRole = 'student';
    this.selectRole('student');
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    document.getElementById('loginName').value = '';
    document.getElementById('loginCode').value = '';
    document.getElementById('loginTeacherCode').value = '';
    document.getElementById('loginModal').classList.add('active');
  },

  hideLogin() {
    document.getElementById('loginModal').classList.remove('active');
    this.pendingNav = null;
  },

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
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    const name = document.getElementById('loginName').value.trim();
    if (!name) {
      document.getElementById('loginNameError').classList.add('show');
      document.getElementById('loginName').focus();
      return;
    }

    const school = document.getElementById('loginSchool').value;

    // Check managed users first
    const managed = DataStore.getManagedUsers();
    let validByManaged = false;
    if (managed.length > 0) {
      const inputCode = this.selectedRole === 'student'
        ? document.getElementById('loginCode').value.trim().toUpperCase()
        : document.getElementById('loginTeacherCode').value.trim().toUpperCase();
      const match = managed.find(u => u.code === inputCode && u.role === this.selectedRole);
      if (match) validByManaged = true;
    }

    if (!validByManaged) {
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
    this.toast(`🎉 ${I18N.t('login.welcome') || '환영해요'}, ${name}!`);

    if (this.pendingNav) {
      const { page, data } = this.pendingNav;
      this.pendingNav = null;
      setTimeout(() => this.navigate(page, data), 100);
    }
  },

  logout() {
    DataStore.currentUser = null;
    localStorage.removeItem('dcb_user');
    this.updateUserUI();
    this.navigate('home');
    this.toast(I18N.t('nav.logout') + '!');
  },

  updateUserUI() {
    const user = DataStore.currentUser;
    const loginBtn  = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userChip  = document.getElementById('userChip');
    const adminChip = document.getElementById('adminChip');
    const navAdmin  = document.getElementById('navAdminItem');

    if (this.isAdmin) {
      loginBtn.classList.add('hidden');
      logoutBtn.classList.add('hidden');
      if (userChip)  userChip.classList.add('hidden');
      if (adminChip) adminChip.classList.remove('hidden');
      if (navAdmin)  navAdmin.classList.remove('hidden');
    } else if (user) {
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      if (adminChip) adminChip.classList.add('hidden');
      if (navAdmin)  navAdmin.classList.add('hidden');
      if (userChip) {
        userChip.classList.remove('hidden');
        const school = DataStore.getSchool(user.school_id);
        document.getElementById('userChipName').textContent = user.name;
        document.getElementById('userChipSchool').textContent = school ? DataStore.getSchoolName(school.id) : '';
      }
    } else {
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      if (userChip)  userChip.classList.add('hidden');
      if (adminChip) adminChip.classList.add('hidden');
      if (navAdmin)  navAdmin.classList.add('hidden');
    }

    // Home page login prompt
    const loginPrompt = document.getElementById('homeLoginPrompt');
    const homeContent = document.getElementById('homeLoggedContent');
    if (loginPrompt) loginPrompt.classList.toggle('hidden', !!(user || this.isAdmin));
    if (homeContent) homeContent.classList.toggle('hidden', !(user || this.isAdmin));
  },

  // ===== Admin Login =====
  showAdminLogin() {
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginError').classList.remove('show');
    document.getElementById('adminLoginModal').classList.add('active');
  },

  hideAdminLogin() {
    document.getElementById('adminLoginModal').classList.remove('active');
  },

  adminLogin() {
    const u = document.getElementById('adminUsername').value.trim();
    const p = document.getElementById('adminPassword').value;
    if (this._ck(u, p)) {
      this.isAdmin = true;
      localStorage.setItem('dcb_admin_session', 'active');
      this.hideAdminLogin();
      this.updateUserUI();
      this.toast('🔑 Admin mode');
      this.navigate('admin');
    } else {
      document.getElementById('adminLoginError').classList.add('show');
      document.getElementById('adminPassword').value = '';
      document.getElementById('adminPassword').focus();
    }
  },

  adminLogout() {
    this.isAdmin = false;
    localStorage.removeItem('dcb_admin_session');
    this.updateUserUI();
    this.navigate('home');
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

  // ===== Box Card =====
  renderBoxCard(box) {
    const fromSchool = DataStore.getSchool(box.from_school_id);
    const items = DataStore.getBoxItems(box.id);
    const msgs = DataStore.getBoxMessages(box.id);

    const coverBgs = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    const bgIdx = Math.abs(box.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % coverBgs.length;

    return `
      <div class="box-card" onclick="App.navigate('boxdetail','${box.id}')">
        <div class="box-card__cover" style="background:${coverBgs[bgIdx]}">
          <span class="box-card__cover-placeholder">📦</span>
          <span class="box-card__status box-card__status--${box.status}">${I18N.t('status.' + box.status)}</span>
          <div class="box-card__cover-info">
            <div class="box-card__cover-from">${I18N.t('unbox.from')} ${fromSchool ? DataStore.getSchoolName(fromSchool.id) : ''}</div>
            <div class="box-card__cover-title">${this.escapeHtml(DataStore.getBoxTitle(box))}</div>
          </div>
        </div>
        <div class="box-card__body">
          <div class="box-card__meta">
            <span class="box-card__meta-item">📦 ${items.length} ${I18N.t('item.add') || 'Items'}</span>
            <span class="box-card__meta-item">💬 ${msgs.length}</span>
          </div>
          <button class="box-card__action-btn">${I18N.t('unbox.tap')} ›</button>
        </div>
      </div>
    `;
  },

  // ===== Home =====
  async loadRecentBoxes() {
    const boxes = await API.getBoxes();
    const recent = boxes.filter(b => b.status !== 'draft').slice(0, 3);
    const el = document.getElementById('recentBoxes');
    if (el) el.innerHTML = recent.length
      ? recent.map(b => this.renderBoxCard(b)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><div class="empty-state__text">${I18N.t('common.empty')}</div></div>`;
  },

  // ===== Explore =====
  async loadExploreBoxes() {
    const banner = document.getElementById('exploreBanner');
    if (banner) {
      if (!this.isAdmin && DataStore.currentUser) {
        const school = DataStore.getSchool(DataStore.currentUser.school_id);
        banner.innerHTML = `🏫 <strong>${school ? DataStore.getSchoolName(school.id) : ''}</strong>`;
      } else if (this.isAdmin) {
        banner.innerHTML = '⚙️ Admin — All boxes';
      } else {
        banner.innerHTML = '';
      }
    }

    const search = document.getElementById('exploreSearch')?.value || '';
    const boxes = await API.getBoxes({ status: this.currentFilter, search });
    const grid = document.getElementById('exploreGrid');

    let visible = this.currentFilter === 'all'
      ? boxes.filter(b => b.status !== 'draft')
      : boxes;

    if (!this.isAdmin && DataStore.currentUser) {
      const sid = DataStore.currentUser.school_id;
      visible = visible.filter(b => b.from_school_id === sid || b.to_school_id === sid);
    }

    if (visible.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">📭</div>
        <div class="empty-state__text">${I18N.t('common.empty')}</div>
      </div>`;
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

  // ===== Unboxing =====
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

    const wrapper = document.getElementById('unboxClickArea');
    wrapper.classList.remove('opening');
    document.getElementById('unboxTape').classList.remove('removed');
    document.getElementById('unboxOpenBtn').classList.add('hidden');
    document.getElementById('unboxPrompt').textContent = I18N.t('unbox.tap');

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
    document.getElementById('unboxClickArea').classList.add('opening');
    if (this.currentBox.status === 'arrived' || this.currentBox.status === 'sent') {
      await API.openBox(this.currentBox.id);
      this.currentBox.status = 'opened';
    }
    this.launchConfetti();
    setTimeout(() => this.showBoxContent(this.currentBox), 1200);
  },

  showBoxContent(box) {
    document.getElementById('unboxingView').classList.add('hidden');
    document.getElementById('boxDetailView').classList.remove('hidden');

    const fromSchool = DataStore.getSchool(box.from_school_id);
    const toSchool   = DataStore.getSchool(box.to_school_id);
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
    this.loadSocialFeed(box.id);
    this.switchTab('items');
    // Pre-fill name in social compose
    setTimeout(() => this.prefillSocialName(), 100);
  },

  // ===== Items with comment counts =====
  renderItems(items) {
    const grid = document.getElementById('itemsGrid');
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><div class="empty-state__text">${I18N.t('item.empty')}</div></div>`;
      return;
    }

    const typeIcons = {
      text: { icon: '📝', cls: 'text' }, image: { icon: '🖼️', cls: 'image' },
      video: { icon: '🎬', cls: 'video' }, youtube: { icon: '▶️', cls: 'youtube' },
      link: { icon: '🔗', cls: 'link' }, pdf: { icon: '📄', cls: 'pdf' }, file: { icon: '📎', cls: 'file' },
    };

    grid.innerHTML = items.map(item => {
      const ti = typeIcons[item.type] || typeIcons.file;
      const preview = item.content ? this.escapeHtml(item.content).substring(0, 100) + (item.content.length > 100 ? '...' : '') : '';
      const cmtCount = DataStore.getItemComments(item.id).length;
      return `
        <div class="item-card" onclick="App.showItemDetail('${item.id}')">
          <div class="item-card__header">
            <div class="item-card__icon item-card__icon--${ti.cls}">${ti.icon}</div>
          </div>
          <div class="item-card__title">${this.escapeHtml(DataStore.getItemTitle(item))}</div>
          ${preview ? `<div class="item-card__preview">${preview}</div>` : ''}
          <div class="item-card__footer">
            <span>${I18N.t('item.' + item.type)}</span>
            <span>💬 ${cmtCount} ${I18N.t('item.comments')}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  currentItemLang: 'orig',

  // Render the translatable content body of an item
  // lang: 'orig' = show original content as-is
  //       'ko'/'en'/'ja' = show from trans_ko/trans_en/trans_ja Sheets columns (fallback: fetch via GAS)
  renderItemContentBody(item, lang) {
    let title, text, needsFetch;
    if (lang === 'orig') {
      title = item.title || '';
      text = item.content || '';
      needsFetch = false;
    } else {
      const transKey = `trans_${lang}`;
      title = item.title || '';
      text = item[transKey] || '';
      needsFetch = !text;
    }

    const fetchBtn = needsFetch
      ? `<button class="btn btn--secondary btn--sm" style="margin-top:12px;" onclick="App.fetchItemTranslation('${item.id}','${lang}')">🌐 ${I18N.t('translate.btn')}</button>`
      : '';

    let mediaHtml = '';
    switch (item.type) {
      case 'text':
        mediaHtml = `<div class="item-detail__content" style="white-space:pre-wrap;">${this.escapeHtml(text)}</div>`;
        break;
      case 'image':
        if (item.file_url) mediaHtml += `<div class="item-detail__media"><img src="${this.escapeHtml(item.file_url)}" alt=""></div>`;
        if (text) mediaHtml += `<div class="item-detail__content" style="margin-top:12px;">${this.escapeHtml(text)}</div>`;
        break;
      case 'youtube':
        if (item.file_url) {
          const vid = this.extractYouTubeId(item.file_url);
          if (vid) mediaHtml = `<div class="item-detail__media"><iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen></iframe></div>`;
        }
        if (text) mediaHtml += `<div class="item-detail__content" style="margin-top:8px;">${this.escapeHtml(text)}</div>`;
        break;
      case 'video':
        if (item.file_url) mediaHtml = `<div class="item-detail__media"><video controls src="${this.escapeHtml(item.file_url)}"></video></div>`;
        break;
      case 'link': {
        const ytId = item.file_url ? this.extractYouTubeId(item.file_url) : null;
        if (ytId) {
          mediaHtml = `<div class="item-detail__media"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>`;
        } else if (item.file_url) {
          mediaHtml = `<div style="margin-bottom:12px;"><a href="${this.escapeHtml(item.file_url)}" target="_blank" rel="noopener" class="btn btn--secondary">🔗 ${this.escapeHtml(item.file_url)}</a></div>`;
        }
        if (text) mediaHtml += `<div class="item-detail__content">${this.escapeHtml(text)}</div>`;
        break;
      }
      case 'pdf':
        if (item.file_url) mediaHtml = `<div><a href="${this.escapeHtml(item.file_url)}" target="_blank" rel="noopener" class="btn btn--secondary">📄 PDF</a></div>`;
        break;
      default:
        if (text) mediaHtml = `<div class="item-detail__content">${this.escapeHtml(text)}</div>`;
    }
    return `<h2 style="font-size:1.2rem;font-weight:700;margin-bottom:16px;">${this.escapeHtml(title)}</h2>${mediaHtml}${fetchBtn}`;
  },

  showItemDetail(itemId) {
    const item = DataStore.items.find(i => i.id === itemId);
    if (!item) return;
    this.currentItemModal = itemId;
    this.currentItemLang = 'orig';

    const modal = document.getElementById('itemModal');
    const content = document.getElementById('itemModalContent');

    const langs = [
      { code: 'orig', label: '원본' },
      { code: 'ko', label: '한' },
      { code: 'en', label: 'EN' },
      { code: 'ja', label: '日' },
    ];
    const langBtns = langs.map(l =>
      `<button class="item-lang-btn${l.code === this.currentItemLang ? ' active' : ''}" onclick="App.setItemLang('${l.code}','${itemId}')">${l.label}</button>`
    ).join('');

    content.innerHTML = `
      <div class="item-modal-header-row">
        <div class="item-modal-tabs" style="flex:1;">
          <button class="item-modal-tab active" onclick="App.switchItemTab('content','${itemId}')">📄 ${I18N.t('item.view.content')}</button>
          <button class="item-modal-tab" id="itemCommentTabBtn" onclick="App.switchItemTab('comments','${itemId}')">💬 ${I18N.t('item.comments')}</button>
        </div>
        <div class="item-lang-toggle">${langBtns}</div>
      </div>
      <div id="itemTabContent" class="item-tab-panel active">
        <div id="itemContentBody">${this.renderItemContentBody(item, this.currentItemLang)}</div>
        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
          <button class="reaction-btn" onclick="App.reactToItem('${item.id}','heart')">❤️ ${I18N.t('react.heart')}</button>
          <button class="reaction-btn" onclick="App.reactToItem('${item.id}','star')">⭐ ${I18N.t('react.star')}</button>
          <button class="reaction-btn" onclick="App.reactToItem('${item.id}','surprise')">😮 ${I18N.t('react.surprise')}</button>
          <button class="reaction-btn" onclick="App.reactToItem('${item.id}','thanks')">🙏 ${I18N.t('react.thanks')}</button>
        </div>
      </div>
      <div id="itemTabComments" class="item-tab-panel" style="display:none;">
        <div id="itemCommentsList"></div>
        <div class="item-comment-compose">
          <input class="item-comment-name-input" id="itemCommentName" placeholder="${I18N.t('compose.name.placeholder')}" value="${DataStore.currentUser ? DataStore.currentUser.name : (this.isAdmin ? 'Admin' : '')}">
          <input class="form-input" id="itemCommentInput" placeholder="${I18N.t('item.comment.placeholder')}" style="font-size:14px;padding:10px 14px;flex:1;"
                 onkeydown="if(event.key==='Enter')App.postItemComment('${itemId}')">
          <button class="btn btn--primary btn--sm" onclick="App.postItemComment('${itemId}')">💬</button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  setItemLang(lang, itemId) {
    this.currentItemLang = lang;
    const labelMap = { orig: '원본', ko: '한', en: 'EN', ja: '日' };
    document.querySelectorAll('.item-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === labelMap[lang]);
    });
    const item = DataStore.items.find(i => i.id === itemId);
    const body = document.getElementById('itemContentBody');
    if (item && body) body.innerHTML = this.renderItemContentBody(item, lang);
  },

  async fetchItemTranslation(itemId, lang) {
    const item = DataStore.items.find(i => i.id === itemId);
    if (!item) return;
    const srcText = item.content || item.title || '';
    if (!srcText) return;
    const btn = event.target;
    btn.textContent = '⏳';
    btn.disabled = true;
    const translated = await this.translateText(srcText, lang);
    btn.disabled = false;
    if (translated) {
      item[`trans_${lang}`] = translated;
      const body = document.getElementById('itemContentBody');
      if (body) body.innerHTML = this.renderItemContentBody(item, lang);
    } else {
      btn.textContent = '🌐 ' + I18N.t('translate.btn');
      this.toast(I18N.t('translate.unavailable'));
    }
  },

  switchItemTab(tab, itemId) {
    const contentPanel = document.getElementById('itemTabContent');
    const commentsPanel = document.getElementById('itemTabComments');
    document.querySelectorAll('.item-modal-tab').forEach((btn, i) => {
      btn.classList.toggle('active', (tab === 'content' && i === 0) || (tab === 'comments' && i === 1));
    });
    if (tab === 'content') {
      contentPanel.style.display = 'block';
      commentsPanel.style.display = 'none';
    } else {
      contentPanel.style.display = 'none';
      commentsPanel.style.display = 'block';
      this.renderItemComments(itemId);
    }
  },

  renderItemComments(itemId) {
    const list = document.getElementById('itemCommentsList');
    if (!list) return;
    const comments = DataStore.getItemComments(itemId);
    const avatarColors = ['#D97706','#3B82F6','#10B981','#EC4899','#7C3AED'];
    const gc = n => avatarColors[Math.abs((n||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % avatarColors.length];
    const gi = n => (n||'?').charAt(0).toUpperCase();

    if (comments.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:24px 0;"><div class="empty-state__icon" style="font-size:32px;opacity:0.3;">💬</div><div class="empty-state__text" style="font-size:13px;">${I18N.t('item.comments.empty')}</div></div>`;
      return;
    }

    const parents = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    const userName = this.isAdmin ? 'Admin' : (DataStore.currentUser ? DataStore.currentUser.name : '');

    list.innerHTML = parents.map(c => {
      const childReplies = replies.filter(r => r.parent_id === c.id);
      const school = DataStore.getSchool(c.user_school);
      const isCommentOwner = this.isAdmin || (userName && userName === c.user_name);

      const repliesHtml = childReplies.map(r => {
        const rs = DataStore.getSchool(r.user_school);
        const isReplyOwner = this.isAdmin || (userName && userName === r.user_name);
        const replyOwnerBtns = isReplyOwner
          ? `<span class="social-post__owner-actions" style="display:inline-flex;margin-left:6px;">
              <button class="social-owner-btn" onclick="App.editItemReply('${r.id}','${itemId}')">✏️</button>
              <button class="social-owner-btn" onclick="App.deleteItemReply('${r.id}','${itemId}')">🗑️</button>
             </span>`
          : '';
        return `<div class="item-comment-reply" id="ic-wrap-${r.id}">
          <div class="item-comment-reply__avatar" style="background:${gc(r.user_name)}">${gi(r.user_name)}</div>
          <div style="flex:1;">
            <div class="item-comment__name">${this.escapeHtml(r.user_name)} <span style="font-weight:400;color:var(--color-text-tertiary);font-size:11px;">${rs ? DataStore.getSchoolName(rs.id) : ''}</span>${replyOwnerBtns}</div>
            <div class="item-comment__text" id="ic-text-${r.id}">${this.escapeHtml(r.content)}</div>
            <button class="item-comment__translate" onclick="App.toggleTranslation('ic-${r.id}','${this.escapeHtml(r.content).replace(/'/g,"\\'")}',this)">🌐</button>
            <div id="translated-ic-${r.id}" class="item-comment__translated" style="display:none;"></div>
          </div>
        </div>`;
      }).join('');

      const commentOwnerBtns = isCommentOwner
        ? `<span class="social-post__owner-actions" style="display:inline-flex;margin-left:6px;">
            <button class="social-owner-btn" onclick="App.editItemComment('${c.id}','${itemId}')">✏️</button>
            <button class="social-owner-btn" onclick="App.deleteItemComment('${c.id}','${itemId}')">🗑️</button>
           </span>`
        : '';

      return `<div class="item-comment" id="ic-wrap-${c.id}">
        <div class="item-comment__avatar" style="background:${gc(c.user_name)}">${gi(c.user_name)}</div>
        <div class="item-comment__body">
          <div class="item-comment__name">${this.escapeHtml(c.user_name)} <span style="font-weight:400;color:var(--color-text-tertiary);font-size:11px;">${school ? DataStore.getSchoolName(school.id) : ''} · ${this.formatDate(c.created_at)}</span>${commentOwnerBtns}</div>
          <div class="item-comment__text" id="ic-text-${c.id}">${this.escapeHtml(c.content)}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="item-comment__reply-btn" onclick="App.toggleItemReply('${c.id}')">↩ ${I18N.t('msg.reply')}</button>
            <button class="item-comment__translate" onclick="App.toggleTranslation('ic-${c.id}','${this.escapeHtml(c.content).replace(/'/g,"\\'")}',this)">🌐</button>
          </div>
          <div id="translated-ic-${c.id}" class="item-comment__translated" style="display:none;"></div>
          <div id="item-reply-${c.id}" class="item-comment-reply-input" style="display:none;">
            <input class="item-comment-name-input" id="item-reply-name-${c.id}" placeholder="${I18N.t('compose.name.placeholder')}" value="${this.escapeHtml(userName)}">
            <input class="form-input" id="item-reply-input-${c.id}" placeholder="${I18N.t('social.reply.placeholder')}" style="font-size:13px;padding:8px 12px;"
                   onkeydown="if(event.key==='Enter')App.postItemReply('${itemId}','${c.id}')">
            <button class="btn btn--primary btn--sm" onclick="App.postItemReply('${itemId}','${c.id}')">↩</button>
          </div>
          ${repliesHtml}
        </div>
      </div>`;
    }).join('');
  },

  toggleItemReply(commentId) {
    const el = document.getElementById('item-reply-' + commentId);
    if (el) { el.style.display = el.style.display === 'none' ? 'flex' : 'none'; }
  },

  postItemComment(itemId) {
    if (!DataStore.currentUser && !this.isAdmin) { this.toast('로그인이 필요합니다.'); return; }
    const input = document.getElementById('itemCommentInput');
    const nameInput = document.getElementById('itemCommentName');
    const text = input.value.trim();
    const name = (nameInput ? nameInput.value.trim() : '') || (DataStore.currentUser ? DataStore.currentUser.name : 'Admin');
    if (!text) return;
    const user = DataStore.currentUser;
    DataStore.itemComments.push({
      id: DataStore.generateId('ic'),
      item_id: itemId,
      user_name: name,
      user_school: user ? user.school_id : '',
      content: text,
      parent_id: null,
      created_at: new Date().toISOString()
    });
    input.value = '';
    this.renderItemComments(itemId);
    this.toast('💬 ' + I18N.t('msg.send') + '!');
  },

  postItemReply(itemId, parentId) {
    if (!DataStore.currentUser && !this.isAdmin) { this.toast('로그인이 필요합니다.'); return; }
    const input = document.getElementById('item-reply-input-' + parentId);
    const nameInput = document.getElementById('item-reply-name-' + parentId);
    const text = input.value.trim();
    const name = (nameInput ? nameInput.value.trim() : '') || (DataStore.currentUser ? DataStore.currentUser.name : 'Admin');
    if (!text) return;
    const user = DataStore.currentUser;
    DataStore.itemComments.push({
      id: DataStore.generateId('ic'),
      item_id: itemId,
      user_name: name,
      user_school: user ? user.school_id : '',
      content: text,
      parent_id: parentId,
      created_at: new Date().toISOString()
    });
    input.value = '';
    this.renderItemComments(itemId);
    this.toast('↩ ' + I18N.t('msg.send') + '!');
  },

  // ===== Item Comment Edit / Delete =====
  editItemComment(commentId, itemId) {
    const c = DataStore.itemComments.find(x => x.id === commentId);
    if (!c) return;
    const textEl = document.getElementById('ic-text-' + commentId);
    if (!textEl) return;
    textEl.innerHTML = `<div style="display:flex;gap:6px;margin-top:4px;">
      <textarea class="form-input" id="ic-edit-${commentId}" rows="2" style="font-size:13px;flex:1;">${this.escapeHtml(c.content)}</textarea>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="btn btn--primary btn--sm" onclick="App.saveItemCommentEdit('${commentId}','${itemId}')">저장</button>
        <button class="btn btn--secondary btn--sm" onclick="App.renderItemComments('${itemId}')">취소</button>
      </div>
    </div>`;
  },

  saveItemCommentEdit(commentId, itemId) {
    const ta = document.getElementById('ic-edit-' + commentId);
    if (!ta) return;
    const newText = ta.value.trim();
    if (!newText) return;
    const c = DataStore.itemComments.find(x => x.id === commentId);
    if (c) { c.content = newText; DataStore.save(); }
    this.renderItemComments(itemId);
  },

  deleteItemComment(commentId, itemId) {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    DataStore.itemComments = DataStore.itemComments.filter(x => x.id !== commentId && x.parent_id !== commentId);
    DataStore.save();
    this.renderItemComments(itemId);
  },

  editItemReply(replyId, itemId) {
    const r = DataStore.itemComments.find(x => x.id === replyId);
    if (!r) return;
    const textEl = document.getElementById('ic-text-' + replyId);
    if (!textEl) return;
    textEl.innerHTML = `<div style="display:flex;gap:6px;margin-top:4px;">
      <textarea class="form-input" id="ic-edit-${replyId}" rows="2" style="font-size:13px;flex:1;">${this.escapeHtml(r.content)}</textarea>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="btn btn--primary btn--sm" onclick="App.saveItemReplyEdit('${replyId}','${itemId}')">저장</button>
        <button class="btn btn--secondary btn--sm" onclick="App.renderItemComments('${itemId}')">취소</button>
      </div>
    </div>`;
  },

  saveItemReplyEdit(replyId, itemId) {
    const ta = document.getElementById('ic-edit-' + replyId);
    if (!ta) return;
    const newText = ta.value.trim();
    if (!newText) return;
    const r = DataStore.itemComments.find(x => x.id === replyId);
    if (r) { r.content = newText; DataStore.save(); }
    this.renderItemComments(itemId);
  },

  deleteItemReply(replyId, itemId) {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    DataStore.itemComments = DataStore.itemComments.filter(x => x.id !== replyId);
    DataStore.save();
    this.renderItemComments(itemId);
  },

  closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
    this.currentItemModal = null;
    // Refresh items to update comment counts
    if (this.currentBox) this.renderItems(DataStore.getBoxItems(this.currentBox.id));
  },

  reactToItem(id, type) { this.toast(`${I18N.t('react.' + type)}!`); },

  // ===== Tabs =====
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.toggle('active', tc.id === 'tab-' + tabName));
  },

  // ===== Social Feed (Instagram-like) =====
  // Detect media type from URL
  detectMediaType(url) {
    if (!url) return 'text';
    const u = url.toLowerCase();
    if (u.includes('youtube.com/') || u.includes('youtu.be/')) return 'youtube';
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/.test(u)) return 'image';
    if (/\.(mp4|webm|ogg|mov)(\?|$)/.test(u)) return 'video';
    return 'link';
  },

  socialAttachmentData: null, // { type: 'image'|'file', data: dataURL|null, name: string, mediaType: string }

  // File selected via input or drag
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this.processAttachmentFile(file);
    event.target.value = '';
  },

  processAttachmentFile(file) {
    const preview = document.getElementById('socialMediaPreview');
    const urlInput = document.getElementById('socialMediaUrl');
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.socialAttachmentData = { type: file.type.startsWith('image/') ? 'image' : 'video', data: e.target.result, name: file.name, mediaType: file.type };
        if (preview) {
          preview.classList.remove('hidden');
          if (file.type.startsWith('image/')) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-height:120px;border-radius:8px;"> <span style="font-size:11px;color:var(--color-text-tertiary);">${this.escapeHtml(file.name)}</span> <button style="margin-left:auto;font-size:18px;background:none;border:none;cursor:pointer;line-height:1;" onclick="App.clearAttachment()">×</button>`;
          } else {
            preview.innerHTML = `🎬 <span>${this.escapeHtml(file.name)}</span> <button style="margin-left:auto;font-size:18px;background:none;border:none;cursor:pointer;" onclick="App.clearAttachment()">×</button>`;
          }
        }
        if (urlInput) urlInput.value = '';
      };
      reader.readAsDataURL(file);
    } else {
      // Non-media file: show as attachment badge
      this.socialAttachmentData = { type: 'link', data: null, name: file.name, mediaType: file.type };
      if (preview) {
        preview.classList.remove('hidden');
        preview.innerHTML = `📎 <span>${this.escapeHtml(file.name)}</span> <span style="font-size:10px;color:var(--color-text-tertiary);">(파일은 URL로 첨부해주세요)</span> <button style="margin-left:auto;font-size:18px;background:none;border:none;cursor:pointer;" onclick="App.clearAttachment()">×</button>`;
      }
    }
  },

  clearAttachment() {
    this.socialAttachmentData = null;
    const preview = document.getElementById('socialMediaPreview');
    if (preview) { preview.innerHTML = ''; preview.classList.add('hidden'); }
  },

  // Handle paste event on social textarea (images from clipboard)
  handleSocialPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) this.processAttachmentFile(file);
        return;
      }
    }
  },

  // Prefill social name input from logged-in user
  prefillSocialName() {
    const inp = document.getElementById('socialNameInput');
    if (!inp) return;
    const user = DataStore.currentUser;
    if (user && !inp.value) inp.value = user.name;
    else if (this.isAdmin && !inp.value) inp.value = 'Admin';
  },

  async loadSocialFeed(boxId) {
    const messages = await API.getMessages(boxId);
    const feed = document.getElementById('socialFeed');
    if (!feed) return;

    const posts = messages.filter(m => !m.parent_id).reverse();
    const replies = messages.filter(m => m.parent_id);

    if (posts.length === 0) {
      feed.innerHTML = `<div class="empty-state"><div class="empty-state__icon">💬</div><div class="empty-state__text">${I18N.t('social.empty')}</div></div>`;
      return;
    }

    const avatarColors = ['#D97706','#3B82F6','#10B981','#EC4899','#7C3AED','#EF4444'];
    const gc = n => avatarColors[Math.abs((n||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % avatarColors.length];
    const gi = n => (n||'?').charAt(0).toUpperCase();

    feed.innerHTML = posts.map(post => {
      const school = DataStore.getSchool(post.user_school);
      const postReplies = replies.filter(r => r.parent_id === post.id);

      let mediaHtml = '';
      const ptype = post.type || (post.media_url ? this.detectMediaType(post.media_url) : 'text');
      if ((ptype === 'image') && post.media_url) {
        mediaHtml = `<div class="social-post__media"><img src="${this.escapeHtml(post.media_url)}" alt="" loading="lazy"></div>`;
      } else if (ptype === 'youtube' && post.media_url) {
        const vid = this.extractYouTubeId(post.media_url);
        if (vid) mediaHtml = `<div class="social-post__media"><iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen></iframe></div>`;
      } else if (ptype === 'video' && post.media_url) {
        mediaHtml = `<div class="social-post__media"><video src="${this.escapeHtml(post.media_url)}" controls style="width:100%;"></video></div>`;
      } else if (ptype === 'link' && post.media_url) {
        mediaHtml = `<div style="padding:0 var(--space-lg) var(--space-sm);"><a href="${this.escapeHtml(post.media_url)}" target="_blank" rel="noopener" class="btn btn--secondary btn--sm" style="display:inline-flex;">🔗 ${this.escapeHtml(post.media_url).substring(0,50)}${post.media_url.length > 50 ? '…' : ''}</a></div>`;
      }

      const userName = this.isAdmin ? 'Admin' : (DataStore.currentUser ? DataStore.currentUser.name : '');
      const isPostOwner = this.isAdmin || (userName && userName === post.user_name);

      const repliesHtml = postReplies.map(r => {
        const rs = DataStore.getSchool(r.user_school);
        const isReplyOwner = this.isAdmin || (userName && userName === r.user_name);
        const replyOwnerBtns = isReplyOwner
          ? `<span class="social-post__owner-actions">
              <button class="social-owner-btn" onclick="App.editSocialComment('${r.id}','${post.id}')">✏️</button>
              <button class="social-owner-btn" onclick="App.deleteSocialComment('${r.id}','${post.id}')">🗑️</button>
             </span>`
          : '';
        return `<div class="social-comment" id="sc-wrap-${r.id}">
          <div class="social-comment__avatar" style="background:${gc(r.user_name)}">${gi(r.user_name)}</div>
          <div class="social-comment__body">
            <span class="social-comment__name">${this.escapeHtml(r.user_name)}</span>
            <span class="social-comment__school">${rs ? DataStore.getSchoolName(rs.id) : ''}</span>
            ${replyOwnerBtns}
            <div class="social-comment__text" id="sc-text-${r.id}">${this.escapeHtml(r.content)}</div>
            <button class="item-comment__translate" onclick="App.toggleTranslation('sc-${r.id}','${this.escapeHtml(r.content).replace(/'/g,"\\'")}',this)">🌐</button>
            <div id="translated-sc-${r.id}" class="item-comment__translated" style="display:none;"></div>
          </div>
        </div>`;
      }).join('');

      const postContentEsc = post.content.replace(/'/g,"\\'").replace(/\n/g,' ');
      const postOwnerBtns = isPostOwner
        ? `<div class="social-post__owner-actions">
            <button class="social-owner-btn" onclick="App.editSocialPost('${post.id}')">✏️</button>
            <button class="social-owner-btn" onclick="App.deleteSocialPost('${post.id}')">🗑️</button>
           </div>`
        : '';
      return `<div class="social-post" id="sp-${post.id}">
        <div class="social-post__header">
          <div class="social-post__avatar" style="background:${gc(post.user_name)}">${gi(post.user_name)}</div>
          <div class="social-post__user">
            <div class="social-post__name">${this.escapeHtml(post.user_name)}</div>
            <div class="social-post__meta">${school ? DataStore.getSchoolName(school.id) : ''} · ${this.formatDate(post.created_at)}</div>
          </div>
          ${postOwnerBtns}
        </div>
        <div class="social-post__content" id="sp-text-${post.id}">${this.escapeHtml(post.content)}</div>
        <div id="translated-${post.id}" class="social-post__translated" style="display:none;"></div>
        ${mediaHtml}
        <div class="social-post__actions">
          <button class="social-action-btn" onclick="App.likePost('${post.id}')">❤️ ${I18N.t('social.like')}</button>
          <button class="social-action-btn" onclick="App.toggleComments('${post.id}')">💬 ${postReplies.length} ${I18N.t('social.comment.count')}</button>
          <button class="social-action-btn translate-btn" id="translate-btn-${post.id}" onclick="App.toggleTranslation('${post.id}','${postContentEsc}',this)">🌐 ${I18N.t('translate.btn')}</button>
        </div>
        <div class="social-comments" id="comments-${post.id}" style="display:none;">
          ${repliesHtml}
          <div class="social-comment-input">
            <input class="social-comment-name-input" id="comment-name-${post.id}" placeholder="${I18N.t('compose.name.placeholder')}" value="${this.escapeHtml(userName)}">
            <input class="social-comment-input__field" id="comment-input-${post.id}"
                   placeholder="${I18N.t('social.comment.placeholder')}"
                   onkeydown="if(event.key==='Enter')App.postComment('${post.id}')">
            <button class="btn btn--primary btn--sm" onclick="App.postComment('${post.id}')">↩</button>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  toggleComments(postId) {
    const el = document.getElementById('comments-' + postId);
    if (el) {
      const open = el.style.display === 'none';
      el.style.display = open ? 'block' : 'none';
      if (open) {
        const input = document.getElementById('comment-input-' + postId);
        if (input) input.focus();
      }
    }
  },

  likePost(postId) { this.toast(`❤️ ${I18N.t('react.heart')}!`); },

  async postComment(postId) {
    if (!DataStore.currentUser && !this.isAdmin) { this.showLogin(); return; }
    const input = document.getElementById('comment-input-' + postId);
    const nameInput = document.getElementById('comment-name-' + postId);
    const text = input.value.trim();
    const name = (nameInput ? nameInput.value.trim() : '') || (DataStore.currentUser ? DataStore.currentUser.name : 'Admin');
    if (!text || !this.currentBox) return;

    await API.addMessage({
      box_id: this.currentBox.id,
      content: text,
      parent_id: postId,
      type: 'text',
      user_name_override: name
    });
    input.value = '';
    this.loadSocialFeed(this.currentBox.id);
  },

  async postSocialMessage() {
    if (!DataStore.currentUser && !this.isAdmin) { this.showLogin(); return; }
    const textarea = document.getElementById('socialTextarea');
    const mediaUrlInput = document.getElementById('socialMediaUrl');
    const nameInput = document.getElementById('socialNameInput');
    const text = textarea ? textarea.value.trim() : '';
    const name = (nameInput ? nameInput.value.trim() : '') || (DataStore.currentUser ? DataStore.currentUser.name : 'Admin');
    if (!text || !this.currentBox) return;

    let mediaUrl = mediaUrlInput ? mediaUrlInput.value.trim() : '';
    let msgType = 'text';

    // Prioritise file attachment over URL input
    if (this.socialAttachmentData && this.socialAttachmentData.data) {
      mediaUrl = this.socialAttachmentData.data; // base64 data URL
      msgType = this.socialAttachmentData.type;
    } else if (mediaUrl) {
      msgType = this.detectMediaType(mediaUrl);
    }

    await API.addMessage({
      box_id: this.currentBox.id,
      content: text,
      parent_id: null,
      type: msgType,
      media_url: mediaUrl,
      user_name_override: name
    });
    textarea.value = '';
    if (mediaUrlInput) mediaUrlInput.value = '';
    this.clearAttachment();
    this.loadSocialFeed(this.currentBox.id);
    this.toast('📢 ' + I18N.t('social.post.btn') + '!');
  },

  reactToMessage(id, type) { this.toast(`${I18N.t('react.' + type)}!`); },

  // ===== Social Post Edit / Delete =====
  editSocialPost(postId) {
    const msg = DataStore.messages.find(m => m.id === postId);
    if (!msg) return;
    const textEl = document.getElementById('sp-text-' + postId);
    if (!textEl) return;
    textEl.innerHTML = `<div class="social-post__edit-area">
      <textarea class="form-input" id="sp-edit-${postId}" rows="3" style="font-size:14px;">${this.escapeHtml(msg.content)}</textarea>
      <div style="display:flex;gap:8px;margin-top:6px;">
        <button class="btn btn--primary btn--sm" onclick="App.saveSocialPostEdit('${postId}')">저장</button>
        <button class="btn btn--secondary btn--sm" onclick="App.loadSocialFeed('${this.currentBox ? this.currentBox.id : ''}')">취소</button>
      </div>
    </div>`;
  },

  async saveSocialPostEdit(postId) {
    const ta = document.getElementById('sp-edit-' + postId);
    if (!ta) return;
    const newText = ta.value.trim();
    if (!newText) return;
    await API.updateMessage(postId, newText);
    const msg = DataStore.messages.find(m => m.id === postId);
    if (msg) { msg.content = newText; DataStore.save(); }
    if (this.currentBox) this.loadSocialFeed(this.currentBox.id);
  },

  async deleteSocialPost(postId) {
    if (!confirm('이 게시글을 삭제할까요?')) return;
    await API.deleteMessage(postId);
    // Also delete replies
    const replyIds = DataStore.messages.filter(m => m.parent_id === postId).map(m => m.id);
    for (const rid of replyIds) await API.deleteMessage(rid);
    DataStore.messages = DataStore.messages.filter(m => m.id !== postId && m.parent_id !== postId);
    DataStore.save();
    if (this.currentBox) this.loadSocialFeed(this.currentBox.id);
  },

  editSocialComment(replyId, postId) {
    const msg = DataStore.messages.find(m => m.id === replyId);
    if (!msg) return;
    const textEl = document.getElementById('sc-text-' + replyId);
    if (!textEl) return;
    textEl.innerHTML = `<div class="social-post__edit-area">
      <textarea class="form-input" id="sc-edit-${replyId}" rows="2" style="font-size:13px;">${this.escapeHtml(msg.content)}</textarea>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn btn--primary btn--sm" onclick="App.saveSocialCommentEdit('${replyId}','${postId}')">저장</button>
        <button class="btn btn--secondary btn--sm" onclick="App.loadSocialFeed('${this.currentBox ? this.currentBox.id : ''}')">취소</button>
      </div>
    </div>`;
  },

  async saveSocialCommentEdit(replyId, postId) {
    const ta = document.getElementById('sc-edit-' + replyId);
    if (!ta) return;
    const newText = ta.value.trim();
    if (!newText) return;
    await API.updateMessage(replyId, newText);
    const msg = DataStore.messages.find(m => m.id === replyId);
    if (msg) { msg.content = newText; DataStore.save(); }
    if (this.currentBox) this.loadSocialFeed(this.currentBox.id);
  },

  async deleteSocialComment(replyId, postId) {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    await API.deleteMessage(replyId);
    DataStore.messages = DataStore.messages.filter(m => m.id !== replyId);
    DataStore.save();
    if (this.currentBox) this.loadSocialFeed(this.currentBox.id);
  },

  // ===== Translation =====
  async translateText(text, targetLang) {
    try {
      const gasUrl = API.GAS_URL;
      if (!gasUrl || gasUrl.includes('YOUR_')) return null;
      const url = `${gasUrl}?action=translate&text=${encodeURIComponent(text)}&to=${targetLang}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.result || null;
    } catch(e) { return null; }
  },

  async toggleTranslation(id, text, btnEl) {
    const div = document.getElementById('translated-' + id);
    if (!div) return;
    if (div.textContent && div.style.display !== 'none') {
      div.style.display = 'none';
      btnEl.textContent = '🌐';
      return;
    }
    const currentLang = I18N.getLang();
    const targetLang = currentLang === 'ko' ? 'en' : currentLang === 'en' ? 'ja' : 'ko';
    btnEl.textContent = '⏳';
    const translated = await this.translateText(text, targetLang);
    if (translated) {
      div.textContent = translated;
      div.style.display = 'block';
      btnEl.textContent = '🌐✕';
    } else {
      btnEl.textContent = '🌐';
      this.toast(I18N.t('translate.unavailable'));
    }
  },

  // ===== Create Box =====
  initCreateFlow() {
    if (this.createState.box) return;
    this.createState = { step: 1, box: null, items: [] };
    this.createStep(1);
    this.populateSchoolSelectors();
    if (DataStore.currentUser) {
      const fromSel = document.getElementById('boxFromSchool');
      if (fromSel) fromSel.value = DataStore.currentUser.school_id;
    }
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
      type: this.currentItemType, title,
      content: document.getElementById('itemContentInput').value.trim(),
      file_url: document.getElementById('itemUrlInput').value.trim(),
      order: this.createState.items.length + 1
    });
    this.cancelItemForm();
    this.renderCreateItems();
    this.toast('✅ ' + I18N.t('common.save') + '!');
  },

  renderCreateItems() {
    const list = document.getElementById('createItemsList');
    if (this.createState.items.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__text">${I18N.t('item.empty')}</div></div>`;
      return;
    }
    const icons = { text:'📝', image:'🖼️', video:'🎬', youtube:'▶️', link:'🔗', pdf:'📄', file:'📎' };
    list.innerHTML = this.createState.items.map((item, idx) => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:8px;border:1px solid var(--color-border);">
        <span style="font-size:18px;">${icons[item.type]||icons.file}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;">${this.escapeHtml(item.title)}</div>
          <div style="font-size:12px;color:var(--color-text-tertiary);">${I18N.t('item.'+item.type)}</div>
        </div>
        <button class="btn btn--ghost btn--sm" onclick="App.removeCreateItem(${idx})" style="color:var(--color-accent-red);">✕</button>
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
    setTimeout(() => { scene.classList.add('labeling'); this.toast('📦 Packed!'); }, 1400);
  },

  async sendBox() {
    if (!DataStore.currentUser && !this.isAdmin) { this.showLogin(); return; }
    const name = document.getElementById('boxNameInput').value.trim();
    if (!name) { this.toast(I18N.t('create.boxname') + '!'); this.createStep(1); return; }

    const btn = document.getElementById('sendBoxBtn');
    btn.disabled = true;

    const box = await API.createBox({
      title: name,
      description: document.getElementById('boxDescInput').value.trim(),
      from_school_id: document.getElementById('boxFromSchool').value,
      to_school_id: document.getElementById('boxToSchool').value,
      created_by: DataStore.currentUser ? DataStore.currentUser.id : 'admin'
    });

    for (const item of this.createState.items) await API.addItem({ ...item, box_id: box.id });

    const fill = document.getElementById('sendProgressFill');
    const text = document.getElementById('sendProgressText');
    const steps = [
      { pct: 20, msg: '📦 Packing...' }, { pct: 50, msg: '🏷️ Labeling...' },
      { pct: 75, msg: '📮 Sealing...' }, { pct: 90, msg: '✈️ Sending...' }, { pct: 100, msg: '🎉 Done!' },
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
    this.toast('🎉 ' + I18N.t('create.send') + '!');
    setTimeout(() => this.navigate('explore'), 1200);
  },

  // ===== My Boxes =====
  async loadMyBoxes() {
    const grid = document.getElementById('myBoxesGrid');
    if (!DataStore.currentUser && !this.isAdmin) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔒</div><div class="empty-state__text">${I18N.t('nav.login')}</div><button class="btn btn--primary" onclick="App.showLogin()">${I18N.t('nav.login')}</button></div>`;
      return;
    }
    const allBoxes = await API.getBoxes();
    let myBoxes = this.isAdmin ? allBoxes : allBoxes.filter(b =>
      b.created_by === DataStore.currentUser.id ||
      b.from_school_id === DataStore.currentUser.school_id ||
      b.to_school_id === DataStore.currentUser.school_id
    );
    if (myBoxes.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><div class="empty-state__text">${I18N.t('common.empty')}</div><button class="btn btn--primary" onclick="App.navigate('create')">${I18N.t('myboxes.empty.btn')}</button></div>`;
      return;
    }
    grid.innerHTML = myBoxes.map(b => this.renderMyBoxCard(b)).join('');
  },

  renderMyBoxCard(box) {
    const isOwner = this.isAdmin ||
      (DataStore.currentUser && (
        box.created_by === DataStore.currentUser.id ||
        box.from_school_id === DataStore.currentUser.school_id
      ));
    const fromSchool = DataStore.getSchool(box.from_school_id);
    const items = DataStore.getBoxItems(box.id);
    const msgs = DataStore.getBoxMessages(box.id);
    const coverBgs = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    const bgIdx = Math.abs(box.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % coverBgs.length;

    return `
      <div class="box-card mybox-card">
        <div class="box-card__cover" style="background:${coverBgs[bgIdx]}" onclick="App.navigate('boxdetail','${box.id}')">
          <span class="box-card__cover-placeholder">📦</span>
          <span class="box-card__status box-card__status--${box.status}">${I18N.t('status.' + box.status)}</span>
          <div class="box-card__cover-info">
            <div class="box-card__cover-from">${I18N.t('unbox.from')} ${fromSchool ? DataStore.getSchoolName(fromSchool.id) : ''}</div>
            <div class="box-card__cover-title">${this.escapeHtml(DataStore.getBoxTitle(box))}</div>
          </div>
        </div>
        <div class="box-card__body">
          <div class="box-card__meta">
            <span class="box-card__meta-item">📦 ${items.length}</span>
            <span class="box-card__meta-item">💬 ${msgs.length}</span>
          </div>
          ${isOwner ? `
          <div class="mybox-actions">
            <button class="btn btn--secondary btn--sm" onclick="App.editBox('${box.id}')">✏️ ${I18N.t('common.edit') || '수정'}</button>
            <button class="btn btn--sm" style="background:#FEE2E2;color:#EF4444;" onclick="App.deleteBox('${box.id}')">🗑️ ${I18N.t('admin.delete')}</button>
          </div>` : `<button class="box-card__action-btn" onclick="App.navigate('boxdetail','${box.id}')">${I18N.t('unbox.tap')} ›</button>`}
        </div>
      </div>
    `;
  },

  editBox(boxId) {
    const box = DataStore.boxes.find(b => b.id === boxId);
    if (!box) return;
    document.getElementById('editBoxId').value = boxId;
    document.getElementById('editBoxTitle').value = box.title || '';
    document.getElementById('editBoxDesc').value = box.description || '';
    document.getElementById('editBoxCover').value = box.cover_image_url || '';
    document.getElementById('editBoxStatus').value = box.status || 'draft';
    document.getElementById('boxEditModal').classList.add('active');
  },

  closeBoxEdit() {
    document.getElementById('boxEditModal').classList.remove('active');
  },

  async saveBoxEdit() {
    const boxId = document.getElementById('editBoxId').value;
    const title = document.getElementById('editBoxTitle').value.trim();
    const description = document.getElementById('editBoxDesc').value.trim();
    const cover = document.getElementById('editBoxCover').value.trim();
    const status = document.getElementById('editBoxStatus').value;
    if (!title) { this.toast('박스 이름을 입력해주세요.'); return; }

    const box = DataStore.boxes.find(b => b.id === boxId);
    if (box) {
      box.title = title;
      box.description = description;
      box.cover_image_url = cover;
      box.status = status;
      DataStore.save();
      await API.updateBox({ id: boxId, title, description, cover_image_url: cover, status });
    }
    this.closeBoxEdit();
    this.loadMyBoxes();
    this.toast('✅ 박스가 수정되었습니다.');
  },

  async deleteBox(boxId) {
    if (!confirm('정말로 이 박스를 삭제하시겠습니까?')) return;
    await API.deleteBox(boxId);
    // Update local store
    DataStore.boxes = DataStore.boxes.filter(b => b.id !== boxId);
    DataStore.items = DataStore.items.filter(i => i.box_id !== boxId);
    DataStore.messages = DataStore.messages.filter(m => m.box_id !== boxId);
    DataStore.save();
    this.loadMyBoxes();
    this.toast('🗑️ 박스가 삭제되었습니다.');
  },

  // ===== Admin Panel =====
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
      case 'schools':  content.innerHTML = this.renderAdminSchools(); break;
      case 'boxes':    content.innerHTML = this.renderAdminBoxes(); break;
      case 'users':    content.innerHTML = this.renderAdminUsers(); break;
      case 'messages': content.innerHTML = this.renderAdminMessages(); break;
    }
  },

  renderAdminSchools() {
    const rows = DataStore.schools.map(s => {
      const bc = DataStore.boxes.filter(b => b.from_school_id === s.id || b.to_school_id === s.id).length;
      return `<tr><td><code>${s.id}</code></td><td><strong>${DataStore.getSchoolName(s.id)}</strong></td><td>${DataStore.getCountryFlag(s.country)} ${s.country}</td><td><span class="badge badge--sent">${bc}</span></td></tr>`;
    }).join('');
    return `<div class="admin-section-title">🏫 ${I18N.t('admin.schools')}</div>
      <div class="admin-table"><table><thead><tr><th>ID</th><th>${I18N.t('admin.users.name')}</th><th>Country</th><th>Boxes</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  renderAdminBoxes() {
    const rows = DataStore.boxes.map(b => `
      <tr><td><strong>${this.escapeHtml(DataStore.getBoxTitle(b))}</strong></td>
      <td>${DataStore.getSchoolName(b.from_school_id)}</td>
      <td>${DataStore.getSchoolName(b.to_school_id)}</td>
      <td><span class="badge badge--${b.status}">${I18N.t('status.'+b.status)}</span></td>
      <td>${DataStore.getBoxItems(b.id).length}</td>
      <td>
        <button class="btn btn--ghost btn--sm" onclick="App.navigate('boxdetail','${b.id}')">View</button>
        <button class="btn btn--ghost btn--sm" style="color:var(--color-accent-red);" onclick="App.adminDeleteBox('${b.id}')">${I18N.t('admin.delete')}</button>
      </td></tr>
    `).join('');
    return `<div class="admin-section-title">📦 ${I18N.t('admin.boxes')}</div>
      <div class="admin-table"><table><thead><tr><th>Title</th><th>From</th><th>To</th><th>Status</th><th>Items</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  renderAdminUsers() {
    const managed = DataStore.getManagedUsers();

    const renderSchoolOpts = () => DataStore.schools.map(s =>
      `<option value="${s.id}">${DataStore.getSchoolName(s.id)}</option>`
    ).join('');

    const rows = managed.map(u => {
      const school = DataStore.getSchool(u.school_id);
      return `<tr>
        <td><strong>${this.escapeHtml(u.name)}</strong></td>
        <td>${school ? DataStore.getSchoolName(school.id) : '-'}</td>
        <td><span class="badge badge--${u.role === 'teacher' ? 'sent' : 'opened'}">${u.role === 'teacher' ? I18N.t('login.teacher') : I18N.t('login.student')}</span></td>
        <td><code style="font-size:12px;background:var(--color-bg-warm);padding:2px 8px;border-radius:4px;">${this.escapeHtml(u.code)}</code></td>
        <td>
          <button class="btn btn--ghost btn--sm" style="color:var(--color-accent-red);" onclick="App.adminDeleteUser('${u.id}')">${I18N.t('admin.delete')}</button>
        </td>
      </tr>`;
    }).join('');

    return `<div class="admin-section-title">👤 ${I18N.t('admin.users')}</div>
      <div class="admin-user-form">
        <h4 style="font-weight:700;margin-bottom:12px;">➕ ${I18N.t('admin.users.add')}</h4>
        <div class="admin-user-form__grid">
          <input class="form-input" id="newUserName" placeholder="${I18N.t('admin.users.name')}">
          <select class="form-select" id="newUserSchool">${renderSchoolOpts()}</select>
          <select class="form-select" id="newUserRole">
            <option value="student">${I18N.t('login.student')}</option>
            <option value="teacher">${I18N.t('login.teacher')}</option>
          </select>
          <input class="form-input" id="newUserCode" placeholder="${I18N.t('admin.users.code')} (e.g. MYCODE2026)" style="text-transform:uppercase;">
          <button class="btn btn--primary" onclick="App.adminCreateUser()">➕ ${I18N.t('admin.users.add')}</button>
        </div>
        <div class="form-error" id="newUserError" style="margin-top:8px;">모든 필드를 입력해주세요.</div>
      </div>
      ${managed.length > 0 ? `<div class="admin-table" style="margin-top:16px;"><table><thead><tr><th>${I18N.t('admin.users.name')}</th><th>${I18N.t('admin.users.school')}</th><th>${I18N.t('admin.users.role')}</th><th>${I18N.t('admin.users.code')}</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div style="margin-top:16px;padding:16px;background:var(--color-bg-warm);border-radius:var(--radius-md);font-size:13px;color:var(--color-text-secondary);">생성된 계정이 없습니다. 위에서 새 계정을 추가하세요.</div>`}
      <div style="margin-top:12px;padding:12px 16px;background:var(--color-surface-warm);border-radius:var(--radius-md);font-size:12px;color:var(--color-text-tertiary);">
        💡 기본 참여 코드: 학생 — CULTURE2026, BOX2026, HELLO2026 / 교사 — TEACHER2026, EDU2026
      </div>`;
  },

  adminCreateUser() {
    const name = document.getElementById('newUserName').value.trim();
    const school_id = document.getElementById('newUserSchool').value;
    const role = document.getElementById('newUserRole').value;
    const code = document.getElementById('newUserCode').value.trim();
    const errEl = document.getElementById('newUserError');

    if (!name || !code) {
      errEl.classList.add('show');
      return;
    }
    errEl.classList.remove('show');

    DataStore.createManagedUser({ name, school_id, role, code });
    this.adminTab('users');
    this.toast('✅ 계정이 생성되었습니다.');
  },

  adminDeleteUser(id) {
    if (!confirm('이 계정을 삭제하시겠습니까?')) return;
    DataStore.deleteManagedUser(id);
    this.adminTab('users');
    this.toast('🗑️ 계정이 삭제되었습니다.');
  },

  renderAdminMessages() {
    const rows = DataStore.messages.map(m => {
      const box = DataStore.boxes.find(b => b.id === m.box_id);
      return `<tr>
        <td>${this.escapeHtml(m.user_name)}</td>
        <td style="font-size:12px;">${box ? this.escapeHtml(DataStore.getBoxTitle(box)) : '-'}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(m.content)}</td>
        <td><span class="badge badge--${m.status==='approved'?'opened':'pending'}">${m.status}</span></td>
        <td style="white-space:nowrap;">
          ${m.status==='pending'?`<button class="btn btn--ghost btn--sm" style="color:var(--color-secondary);" onclick="App.adminApproveMsg('${m.id}')">✅</button>`:''}
          <button class="btn btn--ghost btn--sm" style="color:var(--color-accent-red);" onclick="App.adminDeleteMsg('${m.id}')">🗑️</button>
        </td>
      </tr>`;
    }).join('');
    return `<div class="admin-section-title">💬 ${I18N.t('admin.messages')}</div>
      <div class="admin-table"><table><thead><tr><th>Author</th><th>Box</th><th>Content</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows||'<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--color-text-tertiary);">No messages</td></tr>'}</tbody></table></div>`;
  },

  async adminApproveMsg(id) {
    await API.updateMessageStatus(id, 'approved');
    this.adminTab('messages');
    this.toast('✅ Approved');
  },
  adminDeleteMsg(id) {
    if (!confirm('Delete this message?')) return;
    DataStore.messages = DataStore.messages.filter(m => m.id !== id);
    this.adminTab('messages');
    this.toast('🗑️ Deleted');
  },
  adminDeleteBox(id) {
    if (!confirm('Delete this box and all its content?')) return;
    DataStore.boxes    = DataStore.boxes.filter(b => b.id !== id);
    DataStore.items    = DataStore.items.filter(i => i.box_id !== id);
    DataStore.messages = DataStore.messages.filter(m => m.box_id !== id);
    this.adminTab('boxes');
    this.toast('🗑️ Deleted');
  },

  // ===== Confetti =====
  launchConfetti() {
    const colors = ['#D97706','#3B82F6','#10B981','#EC4899','#7C3AED','#FBBF24','#F472B6','#34D399'];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*0.5}s;animation-duration:${2+Math.random()*2}s;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;border-radius:${Math.random()>0.5?'50%':'2px'}`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  },

  // ===== Toast =====
  toast(msg) {
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
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
    const lang = I18N.getLang();
    if (mins < 1) return lang === 'en' ? 'just now' : lang === 'ja' ? 'たった今' : '방금 전';
    if (mins < 60) return lang === 'en' ? `${mins}m` : lang === 'ja' ? `${mins}分前` : `${mins}분 전`;
    if (hours < 24) return lang === 'en' ? `${hours}h` : lang === 'ja' ? `${hours}時間前` : `${hours}시간 전`;
    if (days < 7) return lang === 'en' ? `${days}d` : lang === 'ja' ? `${days}日前` : `${days}일 전`;
    return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US');
  }
};

// Global event listeners
document.addEventListener('click', (e) => {
  const langBtn = document.getElementById('langToggle');
  if (langBtn && !langBtn.contains(e.target)) langBtn.classList.remove('open');
  const themePicker = document.getElementById('themePicker');
  if (themePicker && !themePicker.contains(e.target)) themePicker.classList.remove('open');
  if (e.target === document.getElementById('itemModal')) App.closeItemModal();
  if (e.target === document.getElementById('loginModal')) App.hideLogin();
  if (e.target === document.getElementById('adminLoginModal')) App.hideAdminLogin();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { App.closeItemModal(); App.hideLogin(); App.hideAdminLogin(); }
});

document.addEventListener('DOMContentLoaded', () => App.init());
