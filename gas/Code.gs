/**
 * Digital Culture Box - Google Apps Script Backend
 *
 * Setup Instructions:
 * 1. Create a Google Spreadsheet
 * 2. Create the following sheets with headers in row 1:
 *
 * Sheet "Schools":
 * id | name_ko | name_en | name_ja | country | logo_url | created_at
 *
 * Sheet "Users":
 * id | school_id | role | name | email | lang_pref | created_at
 *
 * Sheet "Boxes":
 * id | title | title_en | title_ja | description | description_en | description_ja |
 * from_school_id | to_school_id | status | cover_image_url | created_by | created_at | sent_at | opened_at
 *
 * Sheet "Items":
 * id | box_id | type | title | title_en | title_ja | content | content_en | content_ja | file_url | order | created_by | created_at
 * (content_en / content_ja: can be filled via =GOOGLETRANSLATE(G2,"ko","en") in Sheets)
 *
 * Sheet "Messages":
 * id | box_id | user_id | user_name | user_school | content | type | media_url | parent_id | status | created_at
 * (type: text/image/youtube/video/link  |  media_url: attached URL)
 *
 * Sheet "Reactions":
 * id | target_type | target_id | user_id | type | created_at
 *
 * 3. Go to Extensions > Apps Script
 * 4. Paste this code into Code.gs
 * 5. Set the SPREADSHEET_ID below
 * 6. Deploy > New Deployment > Web App
 * - Execute as: Me
 * - Who has access: Anyone
 * 7. Copy the deployment URL and set it in js/api.js as API.GAS_URL
 */

// ====== CONFIGURATION ======
// ✅ 제공해주신 시트 ID가 적용되었습니다.
const SPREADSHEET_ID = '1eLN5rHcPntDsSL1E5qzthXQHFjmUCH065bfhoWyMdxM'; 

// ====== HELPERS ======

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function sheetToArray(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
  return obj;
}

function updateRow(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      Object.entries(updates).forEach(([key, value]) => {
        const col = headers.indexOf(key);
        if (col >= 0) {
          sheet.getRange(i + 1, col + 1).setValue(value);
        }
      });
      return { id, ...updates };
    }
  }
  return null;
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return false;

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function generateId(prefix) {
  return prefix + '_' + new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 4);
}

function jsonResponse(result) {
  return ContentService.createTextOutput(JSON.stringify({ result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====== WEB APP HANDLERS ======

function doGet(e) {
  const action = e.parameter.action;

  try {
    switch (action) {
      case 'getSchools':
        return jsonResponse(sheetToArray('Schools'));

      case 'getBoxes': {
        let boxes = sheetToArray('Boxes');
        if (e.parameter.status && e.parameter.status !== 'all') {
          boxes = boxes.filter(b => b.status === e.parameter.status);
        }
        if (e.parameter.school_id) {
          const sid = e.parameter.school_id;
          boxes = boxes.filter(b => b.from_school_id === sid || b.to_school_id === sid);
        }
        if (e.parameter.search) {
          const q = e.parameter.search.toLowerCase();
          boxes = boxes.filter(b =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.title_en || '').toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q)
          );
        }
        return jsonResponse(boxes);
      }

      case 'getBox': {
        const boxes = sheetToArray('Boxes');
        const box = boxes.find(b => b.id === e.parameter.id);
        return jsonResponse(box || null);
      }

      case 'getItems': {
        const items = sheetToArray('Items');
        const filtered = items
          .filter(i => i.box_id === e.parameter.box_id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        return jsonResponse(filtered);
      }

      case 'getMessages': {
        const msgs = sheetToArray('Messages');
        const filtered = msgs
          .filter(m => m.box_id === e.parameter.box_id && m.status === 'approved')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return jsonResponse(filtered);
      }

      case 'translate': {
        const text = e.parameter.text;
        const to = e.parameter.to || 'en';
        if (!text) return jsonResponse('');
        try {
          const translated = LanguageApp.translate(text, '', to);
          return jsonResponse(translated);
        } catch (err) {
          return errorResponse('Translation failed: ' + err.toString());
        }
      }

      case 'getStats': {
        const schools = sheetToArray('Schools');
        const boxes = sheetToArray('Boxes').filter(b => b.status !== 'draft');
        const items = sheetToArray('Items');
        return jsonResponse({
          schools: schools.length,
          boxes: boxes.length,
          items: items.length
        });
      }

      default:
        return errorResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return errorResponse(err.toString());
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'createBox': {
        const id = generateId('box');
        const box = {
          id,
          title: body.title || '',
          title_en: body.title_en || '',
          title_ja: body.title_ja || '',
          description: body.description || '',
          description_en: body.description_en || '',
          description_ja: body.description_ja || '',
          from_school_id: body.from_school_id || '',
          to_school_id: body.to_school_id || '',
          status: 'draft',
          cover_image_url: body.cover_image_url || '',
          created_by: body.created_by || '',
          created_at: new Date().toISOString().split('T')[0],
          sent_at: '',
          opened_at: ''
        };
        appendRow('Boxes', box);
        return jsonResponse(box);
      }

      case 'updateBox': {
        const result = updateRow('Boxes', body.id, body);
        return jsonResponse(result);
      }

      case 'addItem': {
        const id = generateId('itm');
        const item = {
          id,
          box_id: body.box_id || '',
          type: body.type || 'text',
          title: body.title || '',
          title_en: body.title_en || '',
          title_ja: body.title_ja || '',
          content: body.content || '',
          content_en: body.content_en || '',
          content_ja: body.content_ja || '',
          file_url: body.file_url || '',
          order: body.order || 0,
          created_by: body.created_by || '',
          created_at: new Date().toISOString()
        };
        appendRow('Items', item);
        return jsonResponse(item);
      }

      case 'removeItem': {
        const result = deleteRow('Items', body.id);
        return jsonResponse(result);
      }

      case 'addMessage': {
        const id = generateId('msg');
        const msg = {
          id,
          box_id: body.box_id || '',
          user_id: body.user_id || '',
          user_name: body.user_name || '',
          user_school: body.user_school || '',
          content: body.content || '',
          type: body.type || 'text',
          media_url: body.media_url || '',
          parent_id: body.parent_id || '',
          status: body.status || 'pending',
          created_at: new Date().toISOString()
        };
        appendRow('Messages', msg);
        return jsonResponse(msg);
      }

      case 'updateMessageStatus': {
        const result = updateRow('Messages', body.id, { status: body.status });
        return jsonResponse(result);
      }

      case 'sendBox': {
        const result = updateRow('Boxes', body.id, {
          status: 'sent',
          sent_at: new Date().toISOString().split('T')[0]
        });
        return jsonResponse(result);
      }

      case 'openBox': {
        const result = updateRow('Boxes', body.id, {
          status: 'opened',
          opened_at: new Date().toISOString().split('T')[0]
        });
        return jsonResponse(result);
      }

      case 'addReaction': {
        const id = generateId('rct');
        const reaction = {
          id,
          target_type: body.target_type || '',
          target_id: body.target_id || '',
          user_id: body.user_id || '',
          type: body.type || 'heart',
          created_at: new Date().toISOString()
        };
        appendRow('Reactions', reaction);
        return jsonResponse(reaction);
      }

      default:
        return errorResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return errorResponse(err.toString());
  }
}

// ====== UTILITY: Setup Sheets ======
// Run this function once to create all sheets with headers

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schemas = {
    'Schools': ['id', 'name_ko', 'name_en', 'name_ja', 'country', 'logo_url', 'created_at'],
    'Users': ['id', 'school_id', 'role', 'name', 'email', 'lang_pref', 'created_at'],
    'Boxes': ['id', 'title', 'title_en', 'title_ja', 'description', 'description_en', 'description_ja', 'from_school_id', 'to_school_id', 'status', 'cover_image_url', 'created_by', 'created_at', 'sent_at', 'opened_at'],
    'Items': ['id', 'box_id', 'type', 'title', 'title_en', 'title_ja', 'content', 'content_en', 'content_ja', 'file_url', 'order', 'created_by', 'created_at'],
    'Messages': ['id', 'box_id', 'user_id', 'user_name', 'user_school', 'content', 'type', 'media_url', 'parent_id', 'status', 'created_at'],
    'Reactions': ['id', 'target_type', 'target_id', 'user_id', 'type', 'created_at']
  };

  Object.entries(schemas).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A6CF7');
    headerRange.setFontColor('#FFFFFF');

    // Auto-resize columns
    headers.forEach((_, i) => sheet.autoResizeColumn(i + 1));

    // Freeze header row
    sheet.setFrozenRows(1);
  });

  // Add sample school data
  const schoolsSheet = ss.getSheetByName('Schools');
  if (schoolsSheet.getLastRow() < 2) {
    const sampleSchools = [
      ['sch_01', '서울 하늘초등학교', 'Seoul Sky Elementary', 'ソウルスカイ小学校', 'KR', '', new Date().toISOString()],
      ['sch_02', '도쿄 사쿠라 초등학교', 'Tokyo Sakura Elementary', '東京さくら小学校', 'JP', '', new Date().toISOString()],
      ['sch_03', '뉴욕 브루클린 초등학교', 'Brooklyn Elementary', 'ブルック린小学校', 'US', '', new Date().toISOString()],
      ['sch_04', '부산 바다초등학교', 'Busan Ocean Elementary', '釜山オーシャン小学校', 'KR', '', new Date().toISOString()],
    ];
    sampleSchools.forEach(row => schoolsSheet.appendRow(row));
  }

  SpreadsheetApp.getUi().alert('Setup complete! All sheets created with headers and sample data.');
}
