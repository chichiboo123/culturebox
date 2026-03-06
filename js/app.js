/**
 * Digital Culture Box - Main Application
 */
const App = {
  currentPage: 'home',
  currentBox: null,
  currentFilter: 'all',
  createState: {
    step: 1,
    box: null,
    items: []
  },
  currentItemType: null,

  // ===== Initialization =====
  async init() {
    I18N.init();
    this.buildLangMenu();
    this.updateLangButton();

    // Listen for language changes
    document.addEventListener('langchange', () => {
      this.updateLangButton();
      this.refreshCurrentPage();
    });

    // Load stats
    this.loadStats();

    // Load recent boxes on home
    this.loadRecentBoxes();

    // Check saved session
    const savedUser = localStorage.getItem('dcb_user');
    if (savedUser) {
      try {
        DataStore.currentUser = JSON.parse(savedUser);
        this.updateUserUI();
      } catch (e) { /* ignore */ }
    }

    // Populate school selectors
    this.populateSchoolSelectors();
  },

  // ===== Navigation =====
  navigate(page, data) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    this.currentPage = page;

    // Page-specific initialization
    switch (page) {
      case 'home':
        this.loadRecentBoxes();
        break;
      case 'explore':
        this.loadExploreBoxes();
        break;
      case 'boxdetail':
        if (data) this.openBoxDetail(data);
        break;
      case 'create':
        this.initCreateFlow();
        break;
      case 'myboxes':
        this.loadMyBoxes();
        break;
      case 'admin':
        this.loadAdmin();
        break;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile nav
    document.getElementById('navLinks').classList.remove('open');
  },

  refreshCurrentPage() {
    this.navigate(this.currentPage);
  },

  // ===== Language =====
  buildLangMenu() {
    const dropdown = document.getElementById('langDropdown');
    const langs = I18N.getAvailableLangs();
    dropdown.innerHTML = langs.map(l => `
      <button class="nav__lang-option ${l.code === I18N.getLang() ? 'active' : ''}"
              onclick="App.changeLang('${l.code}')">
        ${l.flag} ${l.name}
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
    document.getElementById('langCurrent').textContent = lang ? `${lang.flag} ${lang.name}` : '';
  },

  toggleLangMenu() {
    document.getElementById('langToggle').classList.toggle('open');
  },

  toggleMobileNav() {
    document.getElementById('navLinks').classList.toggle('open');
  },

  // ===== Auth =====
  showLogin() {
    this.populateLoginSchools();
    document.getElementById('loginModal').classList.add('active');
  },

  hideLogin() {
    document.getElementById('loginModal').classList.remove('active');
  },

  async populateLoginSchools() {
    const schools = DataStore.schools;
    const sel = document.getElementById('loginSchool');
    sel.innerHTML = schools.map(s =>
      `<option value="${s.id}">${DataStore.getSchoolName(s.id)}</option>`
    ).join('');
  },

  login() {
    const name = document.getElementById('loginName').value.trim();
    const school = document.getElementById('loginSchool').value;
    const role = document.getElementById('loginRole').value;

    if (!name) {
      this.toast(I18N.t('login.name') + '!');
      return;
    }

    DataStore.currentUser = {
      id: DataStore.generateId('usr'),
      name,
      school_id: school,
      role,
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
      logoutBtn.textContent = `${user.name} (${I18N.t('nav.logout')})`;

      // Show/hide admin based on role
      const adminLink = document.querySelector('[data-page="admin"]');
      if (adminLink) {
        adminLink.parentElement.style.display = user.role === 'teacher' ? '' : 'none';
      }
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

  // ===== School Selectors =====
  populateSchoolSelectors() {
    const schools = DataStore.schools;
    const selectors = ['boxFromSchool', 'boxToSchool'];
    selectors.forEach(selId => {
      const el = document.getElementById(selId);
      if (el) {
        el.innerHTML = schools.map(s =>
          `<option value="${s.id}">${DataStore.getCountryFlag(s.country)} ${DataStore.getSchoolName(s.id)}</option>`
        ).join('');
      }
    });
  },

  // ===== Box Rendering =====
  renderBoxCard(box) {
    const fromSchool = DataStore.getSchool(box.from_school_id);
    const toSchool = DataStore.getSchool(box.to_school_id);
    const items = DataStore.getBoxItems(box.id);
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

    return `
      <div class="box-card" onclick="App.navigate('boxdetail', '${box.id}')">
        <div class="box-card__cover" style="background:${coverBgs[bgIdx]}">
          <span class="box-card__cover-placeholder" style="font-size:56px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.2));">&#x1F4E6;</span>
          <span class="box-card__status box-card__status--${box.status}">${I18N.t(statusKey)}</span>
        </div>
        <div class="box-card__body">
          <h3 class="box-card__title">${this.escapeHtml(DataStore.getBoxTitle(box))}</h3>
          <p class="box-card__desc">${this.escapeHtml(DataStore.getBoxDesc(box))}</p>
          <div class="box-card__meta">
            <div class="box-card__route">
              <span>${fromSchool ? DataStore.getCountryFlag(fromSchool.country) : ''} ${fromSchool ? DataStore.getSchoolName(fromSchool.id) : ''}</span>
              <span class="box-card__arrow">&#x2192;</span>
              <span>${toSchool ? DataStore.getCountryFlag(toSchool.country) : ''} ${toSchool ? DataStore.getSchoolName(toSchool.id) : ''}</span>
            </div>
            <div class="box-card__items-count">
              &#x1F4E6; ${items.length}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ===== Home: Recent Boxes =====
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

    if (boxes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">&#x1F4ED;</div>
          <div class="empty-state__text">${I18N.t('common.empty')}</div>
        </div>
      `;
      return;
    }

    const visible = this.currentFilter === 'all'
      ? boxes.filter(b => b.status !== 'draft')
      : boxes;

    grid.innerHTML = visible.map(b => this.renderBoxCard(b)).join('');
  },

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === filter);
    });
    this.loadExploreBoxes();
  },

  filterBoxes() {
    this.loadExploreBoxes();
  },

  // ===== Box Detail & Unboxing =====
  async openBoxDetail(boxId) {
    const box = await API.getBox(boxId);
    if (!box) return;

    this.currentBox = box;
    const fromSchool = DataStore.getSchool(box.from_school_id);

    // Reset views
    document.getElementById('unboxingView').classList.remove('hidden');
    document.getElementById('boxDetailView').classList.add('hidden');
    document.getElementById('unboxClickArea').classList.remove('opening', 'opened');

    // Set label info
    document.getElementById('unboxFrom').textContent = I18N.t('unbox.from');
    document.getElementById('unboxSchool').textContent = fromSchool ? DataStore.getSchoolName(fromSchool.id) : '';
    document.getElementById('unboxPrompt').textContent = I18N.t('unbox.tap');

    // If already opened, skip to detail
    if (box.status === 'opened' || box.status === 'draft') {
      this.showBoxContent(box);
      return;
    }
  },

  async startUnboxing() {
    if (!this.currentBox) return;

    const wrapper = document.getElementById('unboxClickArea');
    const prompt = document.getElementById('unboxPrompt');

    // Already opening/opened
    if (wrapper.classList.contains('opening') || wrapper.classList.contains('opened')) return;

    wrapper.classList.add('opening');
    prompt.textContent = I18N.t('unbox.opening');

    // Mark as opened
    if (this.currentBox.status === 'arrived' || this.currentBox.status === 'sent') {
      await API.openBox(this.currentBox.id);
      this.currentBox.status = 'opened';
    }

    // Confetti!
    this.launchConfetti();

    // After animation, show content
    setTimeout(() => {
      wrapper.classList.remove('opening');
      wrapper.classList.add('opened');

      setTimeout(() => {
        this.showBoxContent(this.currentBox);
      }, 600);
    }, 1000);
  },

  showBoxContent(box) {
    document.getElementById('unboxingView').classList.add('hidden');
    document.getElementById('boxDetailView').classList.remove('hidden');

    const fromSchool = DataStore.getSchool(box.from_school_id);
    const toSchool = DataStore.getSchool(box.to_school_id);
    const items = DataStore.getBoxItems(box.id);

    // Cover
    const coverBgs = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    const bgIdx = Math.abs(box.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % coverBgs.length;

    document.getElementById('boxDetailCover').innerHTML = `
      <div style="width:100%;height:100%;background:${coverBgs[bgIdx]};display:flex;align-items:center;justify-content:center;font-size:72px;">&#x1F4E6;</div>
    `;

    document.getElementById('boxDetailTitle').textContent = DataStore.getBoxTitle(box);
    document.getElementById('boxDetailDesc').textContent = DataStore.getBoxDesc(box);

    document.getElementById('boxDetailMeta').innerHTML = `
      <div class="box-meta-item">
        <span class="box-meta-item__label">${I18N.t('unbox.from')}</span>
        <span class="box-meta-item__value">${fromSchool ? DataStore.getCountryFlag(fromSchool.country) + ' ' + DataStore.getSchoolName(fromSchool.id) : ''}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">To</span>
        <span class="box-meta-item__value">${toSchool ? DataStore.getCountryFlag(toSchool.country) + ' ' + DataStore.getSchoolName(toSchool.id) : ''}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">${I18N.t('unbox.date')}</span>
        <span class="box-meta-item__value">${box.sent_at || '-'}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">Status</span>
        <span class="badge badge--${box.status}">${I18N.t('status.' + box.status)}</span>
      </div>
      <div class="box-meta-item">
        <span class="box-meta-item__label">Items</span>
        <span class="box-meta-item__value">${items.length} ${I18N.t('unbox.items')}</span>
      </div>
    `;

    // Render items
    this.renderItems(items);

    // Render messages
    this.loadBoxMessages(box.id);

    // Switch to items tab
    this.switchTab('items');
  },

  renderItems(items) {
    const grid = document.getElementById('itemsGrid');
    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">&#x1F4ED;</div>
          <div class="empty-state__text">${I18N.t('item.empty')}</div>
        </div>
      `;
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
      return `
        <div class="item-card" onclick="App.showItemDetail('${item.id}')">
          <div class="item-card__icon item-card__icon--${ti.cls}">${ti.icon}</div>
          <div class="item-card__title">${this.escapeHtml(DataStore.getItemTitle(item))}</div>
          <div class="item-card__type">${I18N.t('item.' + item.type)}</div>
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
        if (item.file_url) {
          html += `<div class="item-detail__media"><img src="${this.escapeHtml(item.file_url)}" alt="${this.escapeHtml(item.title)}"></div>`;
        }
        if (item.content) {
          html += `<div class="item-detail__content" style="margin-top:12px;">${this.escapeHtml(item.content)}</div>`;
        }
        break;
      case 'youtube':
        if (item.file_url) {
          const vidId = this.extractYouTubeId(item.file_url);
          if (vidId) {
            html += `<div class="item-detail__media"><iframe src="https://www.youtube.com/embed/${vidId}" allowfullscreen></iframe></div>`;
          }
        }
        break;
      case 'video':
        if (item.file_url) {
          html += `<div class="item-detail__media"><video controls src="${this.escapeHtml(item.file_url)}"></video></div>`;
        }
        break;
      case 'link':
        html += `<div style="margin-bottom:12px;"><a href="${this.escapeHtml(item.file_url)}" target="_blank" rel="noopener" class="btn btn--secondary">&#x1F517; ${this.escapeHtml(item.file_url)}</a></div>`;
        if (item.content) {
          html += `<div class="item-detail__content">${this.escapeHtml(item.content)}</div>`;
        }
        break;
      case 'pdf':
        if (item.file_url) {
          html += `<div style="margin-bottom:12px;"><a href="${this.escapeHtml(item.file_url)}" target="_blank" rel="noopener" class="btn btn--secondary">&#x1F4C4; Open PDF</a></div>`;
        }
        break;
      default:
        if (item.content) {
          html += `<div class="item-detail__content">${this.escapeHtml(item.content)}</div>`;
        }
    }

    // Reactions
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

  closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
  },

  reactToItem(itemId, type) {
    this.toast(`${I18N.t('react.' + type)}!`);
    // In production, save reaction via API
  },

  // ===== Tabs =====
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(tc => {
      tc.classList.toggle('active', tc.id === 'tab-' + tabName);
    });
  },

  // ===== Messages =====
  async loadBoxMessages(boxId) {
    const messages = await API.getMessages(boxId);
    const list = document.getElementById('messageList');

    if (messages.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">&#x1F4AC;</div>
          <div class="empty-state__text">${I18N.t('msg.empty')}</div>
        </div>
      `;
      return;
    }

    list.innerHTML = messages.map(msg => {
      const school = DataStore.getSchool(msg.user_school);
      const initials = (msg.user_name || '?').charAt(0).toUpperCase();
      const avatarColors = ['#4A6CF7', '#FF8C42', '#2ED47A', '#FF6B9D', '#A855F7'];
      const colorIdx = Math.abs((msg.user_name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarColors.length;

      return `
        <div class="message-item ${msg.status === 'pending' ? 'message-item--pending' : ''}">
          <div class="message-item__header">
            <div class="message-item__avatar" style="background:${avatarColors[colorIdx]}">${initials}</div>
            <div>
              <div class="message-item__name">${this.escapeHtml(msg.user_name)}</div>
              <div class="message-item__school">${school ? DataStore.getSchoolName(school.id) : ''}</div>
            </div>
            <div class="message-item__time">${this.formatDate(msg.created_at)}</div>
          </div>
          <div class="message-item__content">${this.escapeHtml(msg.content)}</div>
          <div class="message-item__actions">
            <button class="reaction-btn" onclick="App.reactToMessage('${msg.id}','heart')">&#x2764;&#xFE0F;</button>
            <button class="reaction-btn" onclick="App.reactToMessage('${msg.id}','star')">&#x2B50;</button>
            <button class="reaction-btn" onclick="App.reactToMessage('${msg.id}','thanks')">&#x1F64F;</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async sendMessage() {
    if (!DataStore.currentUser) {
      this.showLogin();
      return;
    }

    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !this.currentBox) return;

    await API.addMessage({
      box_id: this.currentBox.id,
      content: text,
      parent_id: null
    });

    input.value = '';
    this.loadBoxMessages(this.currentBox.id);
    this.toast(I18N.t('msg.send') + '!');
  },

  reactToMessage(msgId, type) {
    this.toast(`${I18N.t('react.' + type)}!`);
  },

  // ===== Create Box Flow =====
  initCreateFlow() {
    if (this.createState.box) return; // Already in progress
    this.createState = { step: 1, box: null, items: [] };
    this.createStep(1);
    this.populateSchoolSelectors();
  },

  createStep(step) {
    this.createState.step = step;

    // Update stepper
    document.querySelectorAll('.stepper__step').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === step);
      el.classList.toggle('completed', s < step);
    });

    // Show panel
    for (let i = 1; i <= 4; i++) {
      const panel = document.getElementById('createStep' + i);
      panel.classList.toggle('active', i === step);
    }

    // Step-specific init
    if (step === 2) {
      this.renderCreateItems();
    }
    if (step === 3) {
      this.initPackingStep();
    }
    if (step === 4) {
      document.getElementById('sendProgressFill').style.width = '0%';
      document.getElementById('sendProgressText').textContent = '';
    }
  },

  // Item management in create flow
  addItemDialog(type) {
    this.currentItemType = type;
    const area = document.getElementById('itemFormArea');
    area.classList.remove('hidden');

    // Show/hide fields based on type
    const contentGroup = document.getElementById('itemContentGroup');
    const urlGroup = document.getElementById('itemUrlGroup');
    const fileGroup = document.getElementById('itemFileGroup');

    contentGroup.classList.remove('hidden');
    urlGroup.classList.add('hidden');
    fileGroup.classList.add('hidden');

    if (type === 'youtube' || type === 'link') {
      urlGroup.classList.remove('hidden');
    }
    if (type === 'image' || type === 'video' || type === 'pdf' || type === 'file') {
      fileGroup.classList.remove('hidden');
    }
    if (type === 'image' || type === 'video') {
      contentGroup.querySelector('.form-label').textContent = I18N.t('item.content') + ' (' + I18N.t('create.desc') + ')';
    }

    // Clear inputs
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
    const content = document.getElementById('itemContentInput').value.trim();
    const url = document.getElementById('itemUrlInput').value.trim();

    if (!title) {
      this.toast(I18N.t('item.title') + '!');
      return;
    }

    const newItem = {
      id: DataStore.generateId('itm'),
      type: this.currentItemType,
      title: title,
      content: content,
      file_url: url,
      order: this.createState.items.length + 1
    };

    this.createState.items.push(newItem);
    this.cancelItemForm();
    this.renderCreateItems();
    this.toast(I18N.t('item.add') + '!');
  },

  renderCreateItems() {
    const list = document.getElementById('createItemsList');
    if (this.createState.items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">&#x1F4ED;</div>
          <div class="empty-state__text">${I18N.t('item.empty')}</div>
        </div>
      `;
      return;
    }

    const typeIcons = {
      text: '&#x1F4DD;', image: '&#x1F5BC;&#xFE0F;', video: '&#x1F3AC;',
      youtube: '&#x25B6;&#xFE0F;', link: '&#x1F517;', pdf: '&#x1F4C4;', file: '&#x1F4CE;'
    };

    list.innerHTML = this.createState.items.map((item, idx) => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:8px;box-shadow:var(--shadow-sm);">
        <span style="font-size:20px;">${typeIcons[item.type] || '&#x1F4CE;'}</span>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${this.escapeHtml(item.title)}</div>
          <div style="font-size:12px;color:var(--color-text-tertiary);">${I18N.t('item.' + item.type)}</div>
        </div>
        <button class="btn btn--ghost btn--sm" onclick="App.removeCreateItem(${idx})" style="color:var(--color-accent-pink);">&times;</button>
      </div>
    `).join('');
  },

  removeCreateItem(idx) {
    this.createState.items.splice(idx, 1);
    this.renderCreateItems();
  },

  // Packing step
  initPackingStep() {
    const toSchoolId = document.getElementById('boxToSchool').value;
    document.getElementById('packingLabelTo').textContent = DataStore.getSchoolName(toSchoolId);

    // Reset animation classes
    const scene = document.getElementById('packingScene');
    scene.classList.remove('closing', 'taping', 'labeling');
  },

  runPackingAnimation() {
    const scene = document.getElementById('packingScene');

    // Step 1: Close lid
    scene.classList.add('closing');

    // Step 2: Add tape
    setTimeout(() => scene.classList.add('taping'), 800);

    // Step 3: Add label
    setTimeout(() => {
      scene.classList.add('labeling');
      this.toast('&#x1F4E6; Packed!');
    }, 1400);
  },

  // Send box
  async sendBox() {
    if (!DataStore.currentUser) {
      this.showLogin();
      return;
    }

    const name = document.getElementById('boxNameInput').value.trim();
    if (!name) {
      this.toast(I18N.t('create.boxname') + '!');
      this.createStep(1);
      return;
    }

    const btn = document.getElementById('sendBoxBtn');
    btn.disabled = true;

    // Create box
    const box = await API.createBox({
      title: name,
      description: document.getElementById('boxDescInput').value.trim(),
      from_school_id: document.getElementById('boxFromSchool').value,
      to_school_id: document.getElementById('boxToSchool').value,
      created_by: DataStore.currentUser.id
    });

    // Add items
    for (const item of this.createState.items) {
      await API.addItem({ ...item, box_id: box.id });
    }

    // Sending animation
    const fill = document.getElementById('sendProgressFill');
    const text = document.getElementById('sendProgressText');

    const steps = [
      { pct: 20, msg: '&#x1F4E6; Packing items...' },
      { pct: 50, msg: '&#x1F3F7;&#xFE0F; Adding labels...' },
      { pct: 75, msg: '&#x2709;&#xFE0F; Sealing the box...' },
      { pct: 90, msg: '&#x1F69A; Sending...' },
      { pct: 100, msg: '&#x2705; Delivered!' },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      fill.style.width = steps[i].pct + '%';
      text.innerHTML = steps[i].msg;
    }

    // Mark as sent
    await API.sendBox(box.id);

    // Confetti!
    this.launchConfetti();

    await new Promise(r => setTimeout(r, 1000));
    btn.disabled = false;

    // Reset create state
    this.createState = { step: 1, box: null, items: [] };
    document.getElementById('boxNameInput').value = '';
    document.getElementById('boxDescInput').value = '';

    this.toast('&#x1F389; Box sent successfully!');

    // Go to explore
    setTimeout(() => this.navigate('explore'), 1500);
  },

  // ===== My Boxes =====
  async loadMyBoxes() {
    const grid = document.getElementById('myBoxesGrid');
    if (!DataStore.currentUser) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">&#x1F512;</div>
          <div class="empty-state__text">${I18N.t('nav.login')}</div>
          <button class="btn btn--primary" onclick="App.showLogin()">${I18N.t('nav.login')}</button>
        </div>
      `;
      return;
    }

    const allBoxes = await API.getBoxes();
    const myBoxes = allBoxes.filter(b =>
      b.created_by === DataStore.currentUser.id ||
      b.from_school_id === DataStore.currentUser.school_id ||
      b.to_school_id === DataStore.currentUser.school_id
    );

    if (myBoxes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">&#x1F4ED;</div>
          <div class="empty-state__text">${I18N.t('common.empty')}</div>
          <button class="btn btn--primary" onclick="App.navigate('create')">${I18N.t('nav.pack')}</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = myBoxes.map(b => this.renderBoxCard(b)).join('');
  },

  // ===== Admin =====
  currentAdminTab: 'schools',

  loadAdmin() {
    this.adminTab('schools');
  },

  adminTab(tab) {
    this.currentAdminTab = tab;

    // Update sidebar
    document.querySelectorAll('.admin-sidebar__item').forEach(item => {
      item.classList.toggle('active', item.textContent.includes(I18N.t('admin.' + tab)));
    });

    const content = document.getElementById('adminContent');

    switch (tab) {
      case 'schools':
        content.innerHTML = this.renderAdminSchools();
        break;
      case 'boxes':
        content.innerHTML = this.renderAdminBoxes();
        break;
      case 'users':
        content.innerHTML = this.renderAdminUsers();
        break;
      case 'messages':
        content.innerHTML = this.renderAdminMessages();
        break;
    }
  },

  renderAdminSchools() {
    return `
      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Country</th>
              <th>Boxes</th>
            </tr>
          </thead>
          <tbody>
            ${DataStore.schools.map(s => {
              const boxCount = DataStore.boxes.filter(b => b.from_school_id === s.id || b.to_school_id === s.id).length;
              return `
                <tr>
                  <td><code>${s.id}</code></td>
                  <td>${DataStore.getCountryFlag(s.country)} ${DataStore.getSchoolName(s.id)}</td>
                  <td>${s.country}</td>
                  <td>${boxCount}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAdminBoxes() {
    return `
      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DataStore.boxes.map(b => `
              <tr>
                <td><strong>${this.escapeHtml(DataStore.getBoxTitle(b))}</strong></td>
                <td>${DataStore.getSchoolName(b.from_school_id)}</td>
                <td>${DataStore.getSchoolName(b.to_school_id)}</td>
                <td><span class="badge badge--${b.status}">${I18N.t('status.' + b.status)}</span></td>
                <td>${DataStore.getBoxItems(b.id).length}</td>
                <td>
                  <button class="btn btn--ghost btn--sm" onclick="App.navigate('boxdetail','${b.id}')">View</button>
                  <button class="btn btn--ghost btn--sm" style="color:var(--color-accent-pink);" onclick="App.adminDeleteBox('${b.id}')">&#x1F5D1;</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAdminUsers() {
    return `
      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>School</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="3" style="text-align:center;color:var(--color-text-tertiary);padding:32px;">
                User management connects to Google Sheets in production.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  renderAdminMessages() {
    const allMsgs = DataStore.messages;
    return `
      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Box</th>
              <th>Content</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allMsgs.map(m => {
              const box = DataStore.boxes.find(b => b.id === m.box_id);
              return `
                <tr>
                  <td>${this.escapeHtml(m.user_name)}</td>
                  <td>${box ? this.escapeHtml(DataStore.getBoxTitle(box)) : m.box_id}</td>
                  <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(m.content)}</td>
                  <td><span class="badge badge--${m.status === 'approved' ? 'approved' : 'pending'}">${m.status}</span></td>
                  <td>
                    ${m.status === 'pending' ? `<button class="btn btn--ghost btn--sm" style="color:var(--color-accent-green);" onclick="App.adminApproveMsg('${m.id}')">${I18N.t('admin.approve')}</button>` : ''}
                    <button class="btn btn--ghost btn--sm" style="color:var(--color-accent-pink);" onclick="App.adminHideMsg('${m.id}')">${I18N.t('admin.hide')}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async adminApproveMsg(id) {
    await API.updateMessageStatus(id, 'approved');
    this.adminTab('messages');
    this.toast(I18N.t('admin.approve') + '!');
  },

  async adminHideMsg(id) {
    await API.updateMessageStatus(id, 'hidden');
    this.adminTab('messages');
    this.toast(I18N.t('admin.hide') + '!');
  },

  adminDeleteBox(id) {
    if (confirm('Delete this box?')) {
      const idx = DataStore.boxes.findIndex(b => b.id === id);
      if (idx >= 0) DataStore.boxes.splice(idx, 1);
      this.adminTab('boxes');
      this.toast(I18N.t('admin.delete') + '!');
    }
  },

  // ===== Confetti =====
  launchConfetti() {
    const colors = ['#4A6CF7', '#FF8C42', '#2ED47A', '#FF6B9D', '#A855F7', '#FBBF24'];
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
    const toast = document.getElementById('toast');
    toast.innerHTML = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },

  // ===== Utilities =====
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }
};

// Click outside to close dropdowns/modals
document.addEventListener('click', (e) => {
  // Close lang dropdown
  const langBtn = document.getElementById('langToggle');
  if (langBtn && !langBtn.contains(e.target)) {
    langBtn.classList.remove('open');
  }

  // Close item modal on overlay click
  const itemModal = document.getElementById('itemModal');
  if (e.target === itemModal) {
    App.closeItemModal();
  }

  // Close login modal on overlay click
  const loginModal = document.getElementById('loginModal');
  if (e.target === loginModal) {
    App.hideLogin();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    App.closeItemModal();
    App.hideLogin();
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => App.init());
