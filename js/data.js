/**
 * Digital Culture Box - Demo Data & Data Store v3
 */
const DataStore = {
  schools: [
    { id: 'sch_01', name_ko: '서울 하늘초등학교', name_en: 'Seoul Sky Elementary', name_ja: 'ソウルスカイ小学校', country: 'KR', logo_url: '' },
    { id: 'sch_02', name_ko: '도쿄 사쿠라 초등학교', name_en: 'Tokyo Sakura Elementary', name_ja: '東京さくら小学校', country: 'JP', logo_url: '' },
    { id: 'sch_03', name_ko: '뉴욕 브루클린 초등학교', name_en: 'Brooklyn Elementary', name_ja: 'ブルックリン小学校', country: 'US', logo_url: '' },
    { id: 'sch_04', name_ko: '부산 바다초등학교', name_en: 'Busan Ocean Elementary', name_ja: '釜山オーシャン小学校', country: 'KR', logo_url: '' },
  ],

  // Current user (set on login)
  currentUser: null,

  boxes: [
    { id: 'box_01', title: '우리 학교 급식 대탐험', title_en: 'Our School Lunch Adventure', title_ja: '私たちの給食大冒険', description: '한국 학교 급식의 다양한 메뉴들을 소개합니다! 김치, 비빔밥, 떡볶이까지!', description_en: 'Introducing the diverse menus of Korean school lunches! From kimchi to bibimbap!', description_ja: '韓国の給食メニューを紹介します！', from_school_id: 'sch_01', to_school_id: 'sch_02', status: 'arrived', cover_image_url: '', created_by: 'user_01', created_at: '2026-02-20', sent_at: '2026-02-25', opened_at: null },
    { id: 'box_02', title: 'Tokyo Street Fashion', title_en: 'Tokyo Street Fashion', title_ja: '東京ストリートファッション', description: '東京の学生たちのファッションを紹介します。制服からカジュアルまで！', description_en: 'Introducing Tokyo student fashion! From uniforms to casual styles!', description_ja: '東京の学生たちのファッション！', from_school_id: 'sch_02', to_school_id: 'sch_01', status: 'arrived', cover_image_url: '', created_by: 'user_02', created_at: '2026-02-18', sent_at: '2026-02-22', opened_at: null },
    { id: 'box_03', title: 'Brooklyn Art & Music', title_en: 'Brooklyn Art & Music', title_ja: 'ブルックリンアート＆ミュージック', description: 'Discover the vibrant art and music scene at our school!', description_en: 'Discover the vibrant art and music scene at our school!', description_ja: '私たちの学校のアートと音楽！', from_school_id: 'sch_03', to_school_id: 'sch_04', status: 'sent', cover_image_url: '', created_by: 'user_03', created_at: '2026-03-01', sent_at: '2026-03-04', opened_at: null },
    { id: 'box_04', title: '부산의 바다와 축제', title_en: 'Busan: Ocean & Festivals', title_ja: '釜山の海と祭り', description: '부산 해운대 해수욕장, 자갈치 시장, 그리고 학교 축제를 소개합니다!', description_en: 'Introducing Haeundae Beach, Jagalchi Market, and our school festival!', description_ja: '海雲台ビーチ、チャガルチ市場、学校祭りを紹介！', from_school_id: 'sch_04', to_school_id: 'sch_03', status: 'opened', cover_image_url: '', created_by: 'user_04', created_at: '2026-02-10', sent_at: '2026-02-15', opened_at: '2026-02-20' },
    { id: 'box_05', title: '한국의 전통 놀이', title_en: 'Korean Traditional Games', title_ja: '韓国の伝統的な遊び', description: '윷놀이, 제기차기, 팽이치기 등 한국의 전통 놀이를 알려드려요.', description_en: 'Learn about Korean traditional games like Yutnori and Jegichagi!', description_ja: 'ユンノリやチェギチャギなど韓国の伝統遊びを紹介！', from_school_id: 'sch_01', to_school_id: 'sch_03', status: 'draft', cover_image_url: '', created_by: 'user_01', created_at: '2026-03-05', sent_at: null, opened_at: null },
  ],

  items: [
    { id: 'itm_01', box_id: 'box_01', type: 'text', title: '한국 급식의 역사', title_en: 'History of Korean School Lunch', title_ja: '韓国給食の歴史', content: '한국의 학교 급식은 1953년부터 시작되었습니다. 처음에는 유니세프의 지원으로 분유와 빵이 제공되었어요. 지금은 매일 다른 메뉴가 나오고, 항상 김치가 포함됩니다!', file_url: '', order: 1, created_by: 'user_01' },
    { id: 'itm_02', box_id: 'box_01', type: 'image', title: '오늘의 급식 사진', title_en: "Today's Lunch Photo", title_ja: '今日の給食写真', content: '비빔밥, 미역국, 김치, 귤이 나왔어요!', file_url: '', order: 2, created_by: 'user_01' },
    { id: 'itm_03', box_id: 'box_01', type: 'youtube', title: '급식 먹방 영상', title_en: 'School Lunch Mukbang', title_ja: '給食モッパン動画', content: '', file_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', order: 3, created_by: 'user_01' },
    { id: 'itm_04', box_id: 'box_01', type: 'text', title: '인기 메뉴 투표 결과', title_en: 'Popular Menu Poll Results', title_ja: '人気メニュー投票結果', content: '1위: 치킨 (32표)\n2위: 떡볶이 (28표)\n3위: 비빔밥 (21표)\n4위: 카레 (18표)\n5위: 짜장밥 (15표)', file_url: '', order: 4, created_by: 'user_01' },
    { id: 'itm_05', box_id: 'box_01', type: 'link', title: '한국 급식 뉴스 기사', title_en: 'Korean School Lunch News', title_ja: '韓国給食ニュース', content: '세계가 놀란 한국 학교 급식의 비밀', file_url: 'https://example.com/korean-lunch', order: 5, created_by: 'user_01' },
    { id: 'itm_06', box_id: 'box_02', type: 'text', title: '日本の制服文化', title_en: 'Japanese Uniform Culture', title_ja: '日本の制服文化', content: '日本の学校では制服を着ることが一般的です。セーラー服やブレザーなど、学校によってデザインが異なります。', file_url: '', order: 1, created_by: 'user_02' },
    { id: 'itm_07', box_id: 'box_02', type: 'image', title: '原宿ストリート', title_en: 'Harajuku Street', title_ja: '原宿ストリート', content: '放課後の原宿で見かけたおしゃれな学生たち', file_url: '', order: 2, created_by: 'user_02' },
    { id: 'itm_08', box_id: 'box_02', type: 'text', title: 'おすすめコーデ', title_en: 'Recommended Outfits', title_ja: 'おすすめコーデ', content: '東京の学生に人気のコーディネートを紹介します！\n1. カジュアルストリート\n2. キレイめカジュアル\n3. スポーツミックス', file_url: '', order: 3, created_by: 'user_02' },
    { id: 'itm_09', box_id: 'box_04', type: 'text', title: '해운대 소개', title_en: 'About Haeundae', title_ja: '海雲台について', content: '해운대는 부산에서 가장 유명한 해수욕장이에요! 여름이면 수많은 사람들이 놀러 와요.', file_url: '', order: 1, created_by: 'user_04' },
    { id: 'itm_10', box_id: 'box_04', type: 'youtube', title: '부산 축제 영상', title_en: 'Busan Festival Video', title_ja: '釜山祭り動画', content: '', file_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', order: 2, created_by: 'user_04' },
    { id: 'itm_11', box_id: 'box_04', type: 'text', title: '자갈치 시장 탐방', title_en: 'Jagalchi Market Tour', title_ja: 'チャガルチ市場探訪', content: '자갈치 시장은 한국 최대의 수산시장입니다. 싱싱한 회와 다양한 해산물을 맛볼 수 있어요!', file_url: '', order: 3, created_by: 'user_04' },
  ],

  // Social posts (Instagram-like feed per box) - type field added
  messages: [
    { id: 'msg_01', box_id: 'box_01', user_id: 'user_02', user_name: 'Tanaka Yuki', user_school: 'sch_02', type: 'text', content: 'すごい！韓国の給食はとても美味しそうですね！日本の給食と比べてみたいです。', media_url: '', parent_id: null, status: 'approved', created_at: '2026-02-26T10:30:00' },
    { id: 'msg_02', box_id: 'box_01', user_id: 'user_01', user_name: '김민지', user_school: 'sch_01', type: 'text', content: '고마워요! 일본 급식도 궁금해요. 특히 카레가 유명하다고 들었어요!', media_url: '', parent_id: 'msg_01', status: 'approved', created_at: '2026-02-26T11:15:00' },
    { id: 'msg_03', box_id: 'box_01', user_id: 'user_02', user_name: 'Nakamura Haruto', user_school: 'sch_02', type: 'text', content: 'The chicken looks amazing! Do you eat it every day?', media_url: '', parent_id: null, status: 'approved', created_at: '2026-02-27T09:00:00' },
    { id: 'msg_04', box_id: 'box_04', user_id: 'user_03', user_name: 'Emma Johnson', user_school: 'sch_03', type: 'text', content: 'Busan looks beautiful! I want to visit Haeundae beach someday!', media_url: '', parent_id: null, status: 'approved', created_at: '2026-02-21T14:00:00' },
    { id: 'msg_05', box_id: 'box_04', user_id: 'user_04', user_name: '이서연', user_school: 'sch_04', type: 'text', content: 'Thank you Emma! You should come in summer, it\'s the best season!', media_url: '', parent_id: 'msg_04', status: 'approved', created_at: '2026-02-21T15:30:00' },
  ],

  // Comments on individual items
  itemComments: [],

  reactions: [
    { id: 'rct_01', target_type: 'item', target_id: 'itm_01', user_id: 'user_02', type: 'star' },
    { id: 'rct_02', target_type: 'item', target_id: 'itm_02', user_id: 'user_02', type: 'heart' },
  ],

  // ===== Managed Users (admin-created accounts) =====
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

  // ===== Helper Methods =====
  getSchool(id) { return this.schools.find(s => s.id === id); },

  getSchoolName(id) {
    const school = this.getSchool(id);
    if (!school) return '?';
    const lang = I18N.getLang();
    if (lang === 'ko') return school.name_ko;
    if (lang === 'ja') return school.name_ja;
    return school.name_en;
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
    return this.items.filter(i => i.box_id === boxId).sort((a, b) => a.order - b.order);
  },

  getBoxMessages(boxId) {
    return this.messages.filter(m => m.box_id === boxId && m.status === 'approved')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  getItemComments(itemId) {
    return this.itemComments.filter(c => c.item_id === itemId)
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
