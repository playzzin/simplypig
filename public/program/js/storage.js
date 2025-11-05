import { validateNote } from './utils/noteUtils.js';
import { showToast } from './utils.js';

const STORAGE_KEYS = {
  NOTES: 'stickyNotes',
  COLORS: 'stickyColors',
  VERSION: 'stickyNotesVersion',
  BACKUP: 'stickyNotesBackup',
  ERROR_LOG: 'stickyNotesErrors'
};

const CURRENT_VERSION = '1.0';
const MAX_BACKUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7일
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

class StorageManager {
  constructor() {
    this.retryCount = 0;
    this.backupInterval = null;
    this.setupAutoBackup();
  }

  setupAutoBackup() {
    // 4시간마다 자동 백업
    this.backupInterval = setInterval(() => {
      this.createBackup().catch(console.error);
    }, 4 * 60 * 60 * 1000);
  }

  async createBackup() {
    try {
      const notes = await this.loadNotes();
      const colors = await this.loadColors();
      const backup = {
        notes,
        colors,
        timestamp: Date.now(),
        version: CURRENT_VERSION
      };

      await this._safeWrite(STORAGE_KEYS.BACKUP, backup);
      
      // 오래된 백업 정리
      await this.cleanupOldBackups();
      
      console.log('Backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
      this.logError('backup_creation_failed', error);
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await this._safeRead(STORAGE_KEYS.BACKUP, []);
      const now = Date.now();
      
      // 오래된 백업 필터링
      const validBackups = Array.isArray(backups) 
        ? backups.filter(b => now - b.timestamp < MAX_BACKUP_AGE)
        : [];

      if (validBackups.length !== backups.length) {
        await this._safeWrite(STORAGE_KEYS.BACKUP, validBackups);
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }

  async recoverFromBackup() {
    try {
      const backup = await this._safeRead(STORAGE_KEYS.BACKUP);
      if (!backup || !backup.notes) {
        throw new Error('No valid backup found');
      }

      // 백업 데이터 검증
      const validatedNotes = backup.notes.map(validateNote);
      
      // 현재 데이터를 임시 저장
      const currentData = {
        notes: await this.loadNotes(),
        colors: await this.loadColors(),
        timestamp: Date.now()
      };

      // 백업 데이터 복원
      await this._safeWrite(STORAGE_KEYS.NOTES, validatedNotes);
      if (backup.colors) {
        await this._safeWrite(STORAGE_KEYS.COLORS, backup.colors);
      }

      // 복구 성공 알림
      showToast('백업에서 성공적으로 복구되었습니다.', 'success');
      
      return true;
    } catch (error) {
      console.error('Recovery failed:', error);
      this.logError('recovery_failed', error);
      showToast('복구에 실패했습니다: ' + error.message, 'error');
      return false;
    }
  }

  logError(type, error) {
    try {
      const errors = this._safeRead(STORAGE_KEYS.ERROR_LOG, []);
      errors.push({
        type,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      
      // 최대 100개의 에러만 보관
      if (errors.length > 100) {
        errors.shift();
      }
      
      this._safeWrite(STORAGE_KEYS.ERROR_LOG, errors);
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  async retryOperation(operation) {
    let lastError;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const result = await operation();
        this.retryCount = 0; // 성공 시 카운트 리셋
        return result;
      } catch (error) {
        lastError = error;
        this.retryCount++;
        
        if (i < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        }
      }
    }

    throw new Error(`Operation failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }
  constructor() {
    this.isAvailable = this._checkStorageAvailability();
    if (!this.isAvailable) {
      console.warn('localStorage is not available');
    }
  }

  _checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  _safeWrite(key, data) {
    if (!this.isAvailable) {
      throw new Error('localStorage is not available');
    }
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        showToast('저장 공간이 부족합니다. 일부 메모를 삭제해주세요.', 'error');
      }
      throw error;
    }
  }

  _safeRead(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return defaultValue;
    }
  }

  async saveNotes(notes) {
    try {
      const validNotes = notes.map(validateNote);
      await this._safeWrite(STORAGE_KEYS.NOTES, validNotes);
      this._safeWrite(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    } catch (error) {
      console.error('Failed to save notes:', error);
      showToast('메모 저장에 실패했습니다.', 'error');
      throw error;
    }
  }

  loadNotes() {
    try {
      const version = this._safeRead(STORAGE_KEYS.VERSION);
      const notes = this._safeRead(STORAGE_KEYS.NOTES, []);
      
      if (!version || version !== CURRENT_VERSION) {
        // 버전이 다르면 마이그레이션 로직 실행
        return this._migrateNotes(notes, version);
      }
      
      return notes.map(validateNote);
    } catch (error) {
      console.error('Failed to load notes:', error);
      showToast('메모를 불러오는데 실패했습니다.', 'error');
      return [];
    }
  }

  saveColors(colors) {
    try {
      this._safeWrite(STORAGE_KEYS.COLORS, colors);
    } catch (error) {
      console.error('Failed to save colors:', error);
      showToast('색상 설정 저장에 실패했습니다.', 'error');
      throw error;
    }
  }

  loadColors() {
    return this._safeRead(STORAGE_KEYS.COLORS);
  }

  _migrateNotes(notes, fromVersion) {
    // 버전별 마이그레이션 로직
    console.log(`Migrating notes from version ${fromVersion} to ${CURRENT_VERSION}`);
    return notes;
  }

  clearAll() {
    if (this.isAvailable) {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }
}

const storageManager = new StorageManager();

export const {
  saveNotes,
  loadNotes,
  saveColors,
  loadColors,
} = storageManager;
