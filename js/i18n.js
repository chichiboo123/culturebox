/**
 * Digital Culture Box - Internationalization System
 * Supports: ko (Korean), en (English), ja (Japanese)
 */
const I18N = {
  _currentLang: 'ko',
  _translations: {
    ko: {
      // Navigation
      'nav.home': '홈',
      'nav.explore': '박스 탐색',
      'nav.pack': '박스 만들기',
      'nav.myboxes': '내 박스',
      'nav.messages': '소통',
      'nav.admin': '관리',
      'nav.lang': '언어',
      'nav.login': '로그인',
      'nav.logout': '로그아웃',

      // Landing
      'landing.title': 'Digital Culture Box',
      'landing.subtitle': '문화를 상자에 담아, 세계로 보내보세요',
      'landing.desc': '우리 학교의 이야기를 상자에 담아 교류학교에 보내고,\n상대 학교의 문화 상자를 열어보는 특별한 경험',
      'landing.cta.explore': '박스 구경하기',
      'landing.cta.create': '박스 만들기',
      'landing.stats.schools': '참여 학교',
      'landing.stats.boxes': '교환된 박스',
      'landing.stats.items': '담긴 아이템',

      // How it works
      'how.title': '어떻게 사용하나요?',
      'how.step1.title': '상자 만들기',
      'how.step1.desc': '우리 학교와 문화를 소개할 상자를 만들어요',
      'how.step2.title': '아이템 담기',
      'how.step2.desc': '사진, 영상, 글, 링크 등 다양한 내용물을 담아요',
      'how.step3.title': '포장 & 발송',
      'how.step3.desc': '라벨을 붙이고 교류학교로 보내요',
      'how.step4.title': '개봉 & 소통',
      'how.step4.desc': '도착한 상자를 열어보고 서로 이야기를 나눠요',

      // Box status
      'status.draft': '작성 중',
      'status.packed': '포장 완료',
      'status.sent': '발송됨',
      'status.arrived': '도착!',
      'status.opened': '개봉됨',

      // Box creation
      'create.title': '새 컬쳐 박스 만들기',
      'create.step1': '기본 정보',
      'create.step2': '아이템 담기',
      'create.step3': '포장하기',
      'create.step4': '발송하기',
      'create.boxname': '상자 이름',
      'create.boxname.placeholder': '예: 우리 학교 급식 대탐험',
      'create.desc': '상자 설명',
      'create.desc.placeholder': '이 상자에는 어떤 것들이 담겨 있나요?',
      'create.from': '보내는 학교',
      'create.to': '받는 학교',
      'create.cover': '커버 이미지',
      'create.next': '다음',
      'create.prev': '이전',
      'create.send': '발송하기',
      'create.save': '임시 저장',

      // Items
      'item.add': '아이템 추가',
      'item.text': '텍스트',
      'item.image': '이미지',
      'item.video': '영상',
      'item.youtube': '유튜브',
      'item.link': '링크',
      'item.pdf': 'PDF',
      'item.file': '파일',
      'item.title': '제목',
      'item.title.placeholder': '아이템 제목을 입력하세요',
      'item.content': '내용',
      'item.content.placeholder': '내용을 입력하세요...',
      'item.url': 'URL',
      'item.url.placeholder': 'https://...',
      'item.upload': '파일 업로드',
      'item.empty': '아직 아이템이 없어요. 상자에 무언가를 담아볼까요?',

      // Unboxing
      'unbox.tap': '상자를 탭하여 개봉하세요!',
      'unbox.opening': '개봉 중...',
      'unbox.items': '개의 아이템이 들어있어요!',
      'unbox.from': '보낸 학교',
      'unbox.date': '발송일',

      // Messages
      'msg.title': '메시지 보드',
      'msg.placeholder': '메시지를 남겨주세요...',
      'msg.send': '보내기',
      'msg.empty': '아직 메시지가 없어요. 첫 메시지를 남겨보세요!',
      'msg.pending': '승인 대기 중',
      'msg.reply': '답글',

      // Reactions
      'react.heart': '좋아요',
      'react.star': '멋져요',
      'react.surprise': '놀라워요',
      'react.thanks': '고마워요',

      // Admin
      'admin.title': '관리 패널',
      'admin.schools': '학교 관리',
      'admin.boxes': '박스 관리',
      'admin.users': '사용자 관리',
      'admin.messages': '메시지 관리',
      'admin.approve': '승인',
      'admin.hide': '숨기기',
      'admin.delete': '삭제',

      // Common
      'common.loading': '불러오는 중...',
      'common.error': '오류가 발생했습니다',
      'common.save': '저장',
      'common.cancel': '취소',
      'common.confirm': '확인',
      'common.close': '닫기',
      'common.search': '검색',
      'common.filter': '필터',
      'common.all': '전체',
      'common.empty': '항목이 없습니다',

      // Login
      'login.title': '로그인',
      'login.email': '이메일',
      'login.name': '이름',
      'login.school': '학교',
      'login.role': '역할',
      'login.student': '학생',
      'login.teacher': '교사',
      'login.submit': '시작하기',
      'login.code': '참여 코드',
      'login.code.placeholder': '선생님이 알려준 코드를 입력하세요',
      'login.code.invalid': '올바른 참여 코드를 입력해주세요.',
      'login.name.required': '이름을 입력해주세요.',
      'login.code.desc': '참여 코드는 선생님에게 받을 수 있어요.',
      'login.teacher.code': '교사 코드',
      'login.teacher.code.placeholder': '교사 인증 코드를 입력하세요',

      // Thread messages
      'msg.thread': '답글 보기',
      'msg.thread.count': '개의 답글',
      'msg.reply.placeholder': '답글을 입력하세요...',
      'msg.write': '메시지 작성',
    },
    en: {
      'nav.home': 'Home',
      'nav.explore': 'Explore',
      'nav.pack': 'Create Box',
      'nav.myboxes': 'My Boxes',
      'nav.messages': 'Messages',
      'nav.admin': 'Admin',
      'nav.lang': 'Language',
      'nav.login': 'Login',
      'nav.logout': 'Logout',

      'landing.title': 'Digital Culture Box',
      'landing.subtitle': 'Pack your culture in a box, send it to the world',
      'landing.desc': 'Share your school\'s story in a box and send it to partner schools.\nOpen their culture boxes and discover something new.',
      'landing.cta.explore': 'Explore Boxes',
      'landing.cta.create': 'Create a Box',
      'landing.stats.schools': 'Schools',
      'landing.stats.boxes': 'Boxes Exchanged',
      'landing.stats.items': 'Items Shared',

      'how.title': 'How does it work?',
      'how.step1.title': 'Create a Box',
      'how.step1.desc': 'Make a box to introduce your school and culture',
      'how.step2.title': 'Add Items',
      'how.step2.desc': 'Fill it with photos, videos, texts, and links',
      'how.step3.title': 'Pack & Send',
      'how.step3.desc': 'Add a label and send it to your partner school',
      'how.step4.title': 'Unbox & Connect',
      'how.step4.desc': 'Open the arrived box and start a conversation',

      'status.draft': 'Draft',
      'status.packed': 'Packed',
      'status.sent': 'Sent',
      'status.arrived': 'Arrived!',
      'status.opened': 'Opened',

      'create.title': 'Create New Culture Box',
      'create.step1': 'Basic Info',
      'create.step2': 'Add Items',
      'create.step3': 'Pack It',
      'create.step4': 'Send It',
      'create.boxname': 'Box Name',
      'create.boxname.placeholder': 'e.g., Our School Lunch Adventure',
      'create.desc': 'Description',
      'create.desc.placeholder': 'What\'s inside this box?',
      'create.from': 'From School',
      'create.to': 'To School',
      'create.cover': 'Cover Image',
      'create.next': 'Next',
      'create.prev': 'Back',
      'create.send': 'Send Box',
      'create.save': 'Save Draft',

      'item.add': 'Add Item',
      'item.text': 'Text',
      'item.image': 'Image',
      'item.video': 'Video',
      'item.youtube': 'YouTube',
      'item.link': 'Link',
      'item.pdf': 'PDF',
      'item.file': 'File',
      'item.title': 'Title',
      'item.title.placeholder': 'Enter item title',
      'item.content': 'Content',
      'item.content.placeholder': 'Enter content...',
      'item.url': 'URL',
      'item.url.placeholder': 'https://...',
      'item.upload': 'Upload File',
      'item.empty': 'No items yet. Let\'s add something to the box!',

      'unbox.tap': 'Tap the box to open it!',
      'unbox.opening': 'Opening...',
      'unbox.items': 'items inside!',
      'unbox.from': 'From',
      'unbox.date': 'Sent on',

      'msg.title': 'Message Board',
      'msg.placeholder': 'Leave a message...',
      'msg.send': 'Send',
      'msg.empty': 'No messages yet. Be the first to say hello!',
      'msg.pending': 'Pending approval',
      'msg.reply': 'Reply',

      'react.heart': 'Love',
      'react.star': 'Amazing',
      'react.surprise': 'Wow',
      'react.thanks': 'Thanks',

      'admin.title': 'Admin Panel',
      'admin.schools': 'Schools',
      'admin.boxes': 'Boxes',
      'admin.users': 'Users',
      'admin.messages': 'Messages',
      'admin.approve': 'Approve',
      'admin.hide': 'Hide',
      'admin.delete': 'Delete',

      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.confirm': 'OK',
      'common.close': 'Close',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.all': 'All',
      'common.empty': 'No items found',

      'login.title': 'Login',
      'login.email': 'Email',
      'login.name': 'Name',
      'login.school': 'School',
      'login.role': 'Role',
      'login.student': 'Student',
      'login.teacher': 'Teacher',
      'login.submit': 'Get Started',
      'login.code': 'Access Code',
      'login.code.placeholder': 'Enter the code from your teacher',
      'login.code.invalid': 'Please enter a valid access code.',
      'login.name.required': 'Please enter your name.',
      'login.code.desc': 'Ask your teacher for the access code.',
      'login.teacher.code': 'Teacher Code',
      'login.teacher.code.placeholder': 'Enter teacher verification code',

      'msg.thread': 'View replies',
      'msg.thread.count': 'replies',
      'msg.reply.placeholder': 'Write a reply...',
      'msg.write': 'Write a message',
    },
    ja: {
      'nav.home': 'ホーム',
      'nav.explore': 'ボックス探索',
      'nav.pack': 'ボックス作成',
      'nav.myboxes': 'マイボックス',
      'nav.messages': 'メッセージ',
      'nav.admin': '管理',
      'nav.lang': '言語',
      'nav.login': 'ログイン',
      'nav.logout': 'ログアウト',

      'landing.title': 'Digital Culture Box',
      'landing.subtitle': '文化を箱に詰めて、世界に届けよう',
      'landing.desc': '学校の物語を箱に詰めて交流校に送り、\n相手の文化ボックスを開けてみる特別な体験',
      'landing.cta.explore': 'ボックスを見る',
      'landing.cta.create': 'ボックスを作る',
      'landing.stats.schools': '参加校',
      'landing.stats.boxes': '交換されたボックス',
      'landing.stats.items': '共有アイテム',

      'how.title': '使い方',
      'how.step1.title': 'ボックスを作る',
      'how.step1.desc': '学校と文化を紹介するボックスを作ります',
      'how.step2.title': 'アイテムを入れる',
      'how.step2.desc': '写真、動画、テキスト、リンクなどを入れます',
      'how.step3.title': '梱包して送る',
      'how.step3.desc': 'ラベルを貼って交流校に送ります',
      'how.step4.title': '開封して交流',
      'how.step4.desc': '届いたボックスを開けて会話を始めましょう',

      'status.draft': '下書き',
      'status.packed': '梱包済み',
      'status.sent': '発送済み',
      'status.arrived': '到着！',
      'status.opened': '開封済み',

      'create.title': '新しいカルチャーボックスを作る',
      'create.step1': '基本情報',
      'create.step2': 'アイテム追加',
      'create.step3': '梱包する',
      'create.step4': '送る',
      'create.boxname': 'ボックス名',
      'create.boxname.placeholder': '例：私たちの学校給食大冒険',
      'create.desc': '説明',
      'create.desc.placeholder': 'このボックスには何が入っていますか？',
      'create.from': '送り元の学校',
      'create.to': '送り先の学校',
      'create.cover': 'カバー画像',
      'create.next': '次へ',
      'create.prev': '戻る',
      'create.send': '送る',
      'create.save': '下書き保存',

      'item.add': 'アイテム追加',
      'item.text': 'テキスト',
      'item.image': '画像',
      'item.video': '動画',
      'item.youtube': 'YouTube',
      'item.link': 'リンク',
      'item.pdf': 'PDF',
      'item.file': 'ファイル',
      'item.title': 'タイトル',
      'item.title.placeholder': 'アイテムのタイトルを入力',
      'item.content': '内容',
      'item.content.placeholder': '内容を入力...',
      'item.url': 'URL',
      'item.url.placeholder': 'https://...',
      'item.upload': 'ファイルアップロード',
      'item.empty': 'まだアイテムがありません。何か入れてみましょう！',

      'unbox.tap': 'ボックスをタップして開封！',
      'unbox.opening': '開封中...',
      'unbox.items': 'つのアイテムが入っています！',
      'unbox.from': '送り元',
      'unbox.date': '発送日',

      'msg.title': 'メッセージボード',
      'msg.placeholder': 'メッセージを残してください...',
      'msg.send': '送信',
      'msg.empty': 'まだメッセージがありません。最初のメッセージを送ってみましょう！',
      'msg.pending': '承認待ち',
      'msg.reply': '返信',

      'react.heart': 'いいね',
      'react.star': 'すごい',
      'react.surprise': 'びっくり',
      'react.thanks': 'ありがとう',

      'admin.title': '管理パネル',
      'admin.schools': '学校管理',
      'admin.boxes': 'ボックス管理',
      'admin.users': 'ユーザー管理',
      'admin.messages': 'メッセージ管理',
      'admin.approve': '承認',
      'admin.hide': '非表示',
      'admin.delete': '削除',

      'common.loading': '読み込み中...',
      'common.error': 'エラーが発生しました',
      'common.save': '保存',
      'common.cancel': 'キャンセル',
      'common.confirm': '確認',
      'common.close': '閉じる',
      'common.search': '検索',
      'common.filter': 'フィルター',
      'common.all': 'すべて',
      'common.empty': 'アイテムがありません',

      'login.title': 'ログイン',
      'login.email': 'メールアドレス',
      'login.name': '名前',
      'login.school': '学校',
      'login.role': '役割',
      'login.student': '生徒',
      'login.teacher': '先生',
      'login.submit': 'はじめる',
      'login.code': '参加コード',
      'login.code.placeholder': '先生から教えてもらったコードを入力',
      'login.code.invalid': '正しい参加コードを入力してください。',
      'login.name.required': '名前を入力してください。',
      'login.code.desc': '参加コードは先生に聞いてください。',
      'login.teacher.code': '先生コード',
      'login.teacher.code.placeholder': '先生認証コードを入力',

      'msg.thread': '返信を見る',
      'msg.thread.count': '件の返信',
      'msg.reply.placeholder': '返信を入力...',
      'msg.write': 'メッセージを書く',
    }
  },

  init() {
    const saved = localStorage.getItem('dcb_lang');
    if (saved && this._translations[saved]) {
      this._currentLang = saved;
    }
    this.applyAll();
    document.documentElement.lang = this._currentLang;
  },

  setLang(lang) {
    if (!this._translations[lang]) return;
    this._currentLang = lang;
    localStorage.setItem('dcb_lang', lang);
    document.documentElement.lang = lang;
    this.applyAll();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  },

  t(key) {
    return this._translations[this._currentLang]?.[key]
      || this._translations['en']?.[key]
      || key;
  },

  applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  },

  getLang() {
    return this._currentLang;
  },

  getAvailableLangs() {
    return [
      { code: 'ko', name: '한국어' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' }
    ];
  }
};
