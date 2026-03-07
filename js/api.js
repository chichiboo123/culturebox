/**
 * Digital Culture Box - Google Apps Script API Layer
 *
 * This module handles communication with Google Apps Script backend.
 * In development mode, it uses local DataStore.
 * In production, set API.GAS_URL to your deployed Apps Script web app URL.
 *
 * === Google Apps Script Deployment Guide ===
 *
 * 1. Create a Google Spreadsheet with these sheets:
 *    - Schools (columns: id, name_ko, name_en, name_ja, country, logo_url, created_at)
 *    - Users (columns: id, school_id, role, name, email, lang_pref, created_at)
 *    - Boxes (columns: id, title, title_en, title_ja, description, description_en, description_ja,
 *             from_school_id, to_school_id, status, cover_image_url, created_by, created_at, sent_at, opened_at)
 *    - Items (columns: id, box_id, type, title, title_en, title_ja, content, file_url, order, created_by, created_at)
 *    - Messages (columns: id, box_id, user_id, user_name, user_school, content, parent_id, status, created_at)
 *    - Reactions (columns: id, target_type, target_id, user_id, type, created_at)
 *
 * 2. Open Apps Script (Extensions > Apps Script) and paste the code from gas/Code.gs
 *
 * 3. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 *
 * 4. Set the deployment URL below:
 */

const API = {
  // Set this to your Google Apps Script deployment URL
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzFjDT3WUncXROqm2-SJ01Lg1L1K17b9Yvgx9W7BJEbmfCzultQxL0Er5zTkZgx8LI-/exec',

  // Whether to use local data (true) or GAS backend (false)
  get isLocal() {
    return !this.GAS_URL;
  },

  // Generic fetch wrapper for GAS
  async _fetch(action, params = {}) {
    if (this.isLocal) {
      return this._localHandler(action, params);
    }

    try {
      const url = new URL(this.GAS_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
        }
      });

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.error) throw new Error(data.error);
      return data.result;
    } catch (err) {
      console.error(`API error (${action}):`, err);
      throw err;
    }
  },

  async _post(action, body = {}) {
    if (this.isLocal) {
      return this._localHandler(action, body);
    }

    try {
      const response = await fetch(this.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...body })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.result;
    } catch (err) {
      console.error(`API POST error (${action}):`, err);
      throw err;
    }
  },

  // Local data handlers (prototype mode)
  _localHandler(action, params) {
    switch (action) {
      case 'getSchools':
        return Promise.resolve(DataStore.schools);

      case 'createSchool': {
        const s = {
          id: DataStore.generateId('sch'),
          name_ko: params.name_ko || '',
          name_en: params.name_en || '',
          name_ja: params.name_ja || '',
          country: params.country || '',
          logo_url: params.logo_url || '',
          created_at: new Date().toISOString()
        };
        DataStore.schools.push(s);
        return Promise.resolve(s);
      }

      case 'deleteSchool': {
        DataStore.schools = DataStore.schools.filter(s => s.id !== params.id);
        return Promise.resolve(true);
      }

      case 'getBoxes':
        let boxes = [...DataStore.boxes];
        if (params.status && params.status !== 'all') {
          boxes = boxes.filter(b => b.status === params.status);
        }
        if (params.school_id) {
          boxes = boxes.filter(b => b.from_school_id === params.school_id || b.to_school_id === params.school_id);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          boxes = boxes.filter(b =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.title_en || '').toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q)
          );
        }
        return Promise.resolve(boxes);

      case 'getBox':
        return Promise.resolve(DataStore.boxes.find(b => b.id === params.id));

      case 'getItems':
        return Promise.resolve(DataStore.getBoxItems(params.box_id));

      case 'getMessages':
        return Promise.resolve(DataStore.getBoxMessages(params.box_id));

      case 'createBox': {
        const newBox = {
          id: DataStore.generateId('box'),
          ...params,
          status: 'draft',
          created_at: new Date().toISOString().split('T')[0],
          sent_at: null,
          opened_at: null
        };
        DataStore.boxes.push(newBox);
        return Promise.resolve(newBox);
      }

      case 'updateBox': {
        const idx = DataStore.boxes.findIndex(b => b.id === params.id);
        if (idx >= 0) {
          DataStore.boxes[idx] = { ...DataStore.boxes[idx], ...params };
          return Promise.resolve(DataStore.boxes[idx]);
        }
        return Promise.reject(new Error('Box not found'));
      }

      case 'addItem': {
        const newItem = {
          id: DataStore.generateId('itm'),
          ...params,
          created_by: DataStore.currentUser?.id || 'unknown'
        };
        DataStore.items.push(newItem);
        return Promise.resolve(newItem);
      }

      case 'removeItem': {
        const iIdx = DataStore.items.findIndex(i => i.id === params.id);
        if (iIdx >= 0) DataStore.items.splice(iIdx, 1);
        return Promise.resolve(true);
      }

      case 'addMessage': {
        const newMsg = {
          id: DataStore.generateId('msg'),
          ...params,
          user_id: DataStore.currentUser?.id || 'unknown',
          user_name: params.user_name_override || DataStore.currentUser?.name || 'Anonymous',
          user_school: DataStore.currentUser?.school_id || '',
          status: 'approved',
          created_at: new Date().toISOString()
        };
        DataStore.messages.push(newMsg);
        DataStore.save();
        return Promise.resolve(newMsg);
      }

      case 'deleteBox': {
        const bid = params.id;
        DataStore.boxes = DataStore.boxes.filter(b => b.id !== bid);
        DataStore.items = DataStore.items.filter(i => i.box_id !== bid);
        DataStore.messages = DataStore.messages.filter(m => m.box_id !== bid);
        DataStore.save();
        return Promise.resolve(true);
      }

      case 'updateMessage': {
        const mIdx = DataStore.messages.findIndex(m => m.id === params.id);
        if (mIdx >= 0) { DataStore.messages[mIdx].content = params.content; DataStore.save(); }
        return Promise.resolve(true);
      }

      case 'deleteMessage': {
        DataStore.messages = DataStore.messages.filter(m => m.id !== params.id);
        DataStore.save();
        return Promise.resolve(true);
      }

      case 'updateMessageStatus': {
        const mIdx = DataStore.messages.findIndex(m => m.id === params.id);
        if (mIdx >= 0) {
          DataStore.messages[mIdx].status = params.status;
          return Promise.resolve(true);
        }
        return Promise.reject(new Error('Message not found'));
      }

      case 'sendBox': {
        const bIdx = DataStore.boxes.findIndex(b => b.id === params.id);
        if (bIdx >= 0) {
          DataStore.boxes[bIdx].status = 'sent';
          DataStore.boxes[bIdx].sent_at = new Date().toISOString().split('T')[0];
          // Simulate arrival after "sending"
          setTimeout(() => {
            DataStore.boxes[bIdx].status = 'arrived';
          }, 2000);
          return Promise.resolve(DataStore.boxes[bIdx]);
        }
        return Promise.reject(new Error('Box not found'));
      }

      case 'openBox': {
        const oIdx = DataStore.boxes.findIndex(b => b.id === params.id);
        if (oIdx >= 0) {
          DataStore.boxes[oIdx].status = 'opened';
          DataStore.boxes[oIdx].opened_at = new Date().toISOString().split('T')[0];
          return Promise.resolve(DataStore.boxes[oIdx]);
        }
        return Promise.reject(new Error('Box not found'));
      }

      case 'getStats':
        return Promise.resolve({
          schools: DataStore.schools.length,
          boxes: DataStore.boxes.filter(b => b.status !== 'draft').length,
          items: DataStore.items.length
        });

      default:
        return Promise.reject(new Error('Unknown action: ' + action));
    }
  },

  // Public API methods
  getSchools: () => API._fetch('getSchools'),
  createSchool: (data) => API._post('createSchool', data),
  deleteSchool: (id) => API._post('deleteSchool', { id }),
  getBoxes: (filters = {}) => API._fetch('getBoxes', filters),
  getBox: (id) => API._fetch('getBox', { id }),
  getItems: (boxId) => API._fetch('getItems', { box_id: boxId }),
  getMessages: (boxId) => API._fetch('getMessages', { box_id: boxId }),
  createBox: (data) => API._post('createBox', data),
  updateBox: (data) => API._post('updateBox', data),
  addItem: (data) => API._post('addItem', data),
  removeItem: (id) => API._post('removeItem', { id }),
  addMessage: (data) => API._post('addMessage', data),
  updateMessageStatus: (id, status) => API._post('updateMessageStatus', { id, status }),
  sendBox: (id) => API._post('sendBox', { id }),
  openBox: (id) => API._post('openBox', { id }),
  deleteBox: (id) => API._post('deleteBox', { id }),
  updateMessage: (id, content) => API._post('updateMessage', { id, content }),
  deleteMessage: (id) => API._post('deleteMessage', { id }),
  getStats: () => API._fetch('getStats'),
};
