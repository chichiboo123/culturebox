/**
 * Digital Culture Box - Data Store v3 (Synchronization Version)
 * * 고정된 데모 데이터를 삭제하고, API를 통해 데이터를 동적으로 로드하도록 수정되었습니다.
 */
const DataStore = {
  // 스프레드시트에서 불러온 데이터를 저장할 공간 (초기값은 빈 배열)
  schools: [],
  boxes: [],
  items: [],
  messages: [],
  reactions: [],
  itemComments: [],

  // 현재 로그인한 사용자 정보
  currentUser: null,

  /**
   * [중요] 스프레드시트 데이터와 동기화하는 함수
   * 앱 실행 시 API.getSchools(), API.getBoxes() 등을 호출한 결과값을 여기에 담아줍니다.
   */
  async syncWithAPI() {
    try {
      console.log("스프레드시트 데이터 동기화 시작...");
      this.schools = await API.getSchools() || [];
      this.boxes = await API.getBoxes() || [];
      const stats = await API.getStats();
      console.log("동기화 완료:", stats);
    } catch (error) {
      console.error("데이터 동기화 중 오류 발생:", error);
    }
  },

  // ===== Managed Users (관리자 생성 계정 - 로컬 스토리지 유지) =====
  getManagedUsers() {
    try {
      return JSON.parse(localStorage.getItem('dcb_managed_users') || '[]');
    } catch(e) { return []; }
  },
  saveManagedUsers(users) {
    localStorage.setItem('dcb_managed_users', JSON.stringify(users));
  },
  createManagedUser(data) {
    const users = this.getManagedUsers();
    const user = {
      id: this.generateId('mu'),
      name: data.name,
      school_id: data.school_id,
      role: data.role,
      code: data.code.toUpperCase(),
      created_at: new Date().toISOString()
    };
    users.push(user);
    this.saveManagedUsers(users);
    return user;
  },
  deleteManagedUser(id) {
    const users = this.getManagedUsers().filter(u => u.id !== id);
    this.saveManagedUsers(users);
  },

  // ===== Helper Methods (데이터 표시 로직 - 유지) =====
  getSchool(id) { return this.schools.find(s => s.id === id); },

  getSchoolName(id) {
    const school = this.getSchool(id);
    if (!school) return '?';
    const lang = I18N.getLang();
    // 스프레드시트의 열 이름(name_ko, name_en, name_ja)과 매칭됩니다.
    if (lang === 'ko') return school.name_ko;
    if (lang === 'ja') return school.name_ja || school.name_ko; // 일본어 명칭 없을 시 한국어 표시
    return school.name_en || school.name_ko;
  },

  getBoxTitle(box) {
    const lang = I18N.getLang();
    if (lang === 'ko' && box.title) return box.title;
    if (lang === 'ja' && box.title_ja) return box.title_ja;
    if (lang === 'en' && box.title_en) return box.title_en;
    return box.title || box.title_en || '';
  },

  getBoxDesc(box) {
    const lang = I18N.getLang();
    if (lang === 'ko' && box.description) return box.description;
    if (lang === 'ja' && box.description_ja) return box.description_ja;
    if (lang === 'en' && box.description_en) return box.description_en;
    return box.description || box.description_en || '';
  },

  getItemTitle(item) {
    const lang = I18N.getLang();
    if (lang === 'ko' && item.title) return item.title;
    if (lang === 'ja' && item.title_ja) return item.title_ja;
    if (lang === 'en' && item.title_en) return item.title_en;
    return item.title || item.title_en || '';
  },

  getBoxItems(boxId) {
    return this.items.filter(i => i.box_id === boxId).sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getItemComments(itemId) {
    return (this.itemComments || []).filter(c => c.item_id === itemId);
  },

  getBoxMessages(boxId) {
    return this.messages.filter(m => m.box_id === boxId && m.status === 'approved')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  getCountryFlag(countryCode) {
    const flags = { KR: '🇰🇷', JP: '🇯🇵', US: '🇺🇸' };
    return flags[countryCode] || '🌍';
  },

  generateId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  },

  save() {
    try {
      localStorage.setItem('dcb_messages', JSON.stringify(this.messages));
      localStorage.setItem('dcb_item_comments', JSON.stringify(this.itemComments));
    } catch(e) { console.warn('DataStore.save failed', e); }
  },

  loadSaved() {
    try {
      const msgs = localStorage.getItem('dcb_messages');
      if (msgs) {
        const parsed = JSON.parse(msgs);
        parsed.forEach(m => { if (!this.messages.find(x => x.id === m.id)) this.messages.push(m); });
      }
      const cmts = localStorage.getItem('dcb_item_comments');
      if (cmts) this.itemComments = JSON.parse(cmts);
    } catch(e) { console.warn('DataStore.loadSaved failed', e); }
  }
};
