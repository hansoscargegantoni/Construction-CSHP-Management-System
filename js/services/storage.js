/**
 * Storage Service
 * Manages CSHP contract persistence with localStorage, providing an async interface
 * designed for seamless drop-in replacement with a REST or GraphQL backend later.
 */

import { CSHP_CONFIG } from '../config.js';
import { INITIAL_CONTRACTS } from './sample-data.js';

class StorageService {
  constructor() {
    this.storageKey = CSHP_CONFIG.STORAGE_KEY;
    this._init();
  }

  _init() {
    if (!localStorage.getItem(this.storageKey)) {
      this.resetToSample();
    }
  }

  _readRaw() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse storage data:', e);
      return [];
    }
  }

  _writeRaw(contracts) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(contracts));
      return true;
    } catch (e) {
      console.error('Failed to save to storage:', e);
      return false;
    }
  }

  /**
   * Fetch all contracts
   * @returns {Promise<Array>}
   */
  async getAll() {
    return new Promise((resolve) => {
      // Async simulation for seamless future backend replacement
      const contracts = this._readRaw();
      resolve([...contracts]);
    });
  }

  /**
   * Fetch a single contract by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    return new Promise((resolve) => {
      const contracts = this._readRaw();
      const match = contracts.find(c => c.id.toLowerCase() === id.toLowerCase());
      resolve(match ? { ...match } : null);
    });
  }

  /**
   * Create a new contract
   * @param {Object} contract 
   * @returns {Promise<Object>}
   */
  async create(contract) {
    return new Promise((resolve, reject) => {
      const contracts = this._readRaw();
      
      // Prevent duplicate Contract ID
      const exists = contracts.some(c => c.id.trim().toLowerCase() === contract.id.trim().toLowerCase());
      if (exists) {
        return reject(new Error(`Contract ID "${contract.id}" already exists. Each contract must have a unique ID.`));
      }

      const newContract = {
        ...contract,
        id: contract.id.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      contracts.unshift(newContract);
      this._writeRaw(contracts);
      resolve(newContract);
    });
  }

  /**
   * Update an existing contract
   * @param {string} originalId 
   * @param {Object} updatedContract 
   * @returns {Promise<Object>}
   */
  async update(originalId, updatedContract) {
    return new Promise((resolve, reject) => {
      const contracts = this._readRaw();
      const index = contracts.findIndex(c => c.id.toLowerCase() === originalId.toLowerCase());
      
      if (index === -1) {
        return reject(new Error(`Contract with ID "${originalId}" not found.`));
      }

      // If ID changed, ensure new ID is not taken by another record
      const targetId = updatedContract.id.trim();
      if (targetId.toLowerCase() !== originalId.toLowerCase()) {
        const idTaken = contracts.some(c => c.id.toLowerCase() === targetId.toLowerCase());
        if (idTaken) {
          return reject(new Error(`Contract ID "${targetId}" is already taken by another record.`));
        }
      }

      const merged = {
        ...contracts[index],
        ...updatedContract,
        id: targetId,
        updatedAt: new Date().toISOString()
      };

      contracts[index] = merged;
      this._writeRaw(contracts);
      resolve(merged);
    });
  }

  /**
   * Delete a contract
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return new Promise((resolve) => {
      const contracts = this._readRaw();
      const filtered = contracts.filter(c => c.id.toLowerCase() !== id.toLowerCase());
      this._writeRaw(filtered);
      resolve(true);
    });
  }

  /**
   * Reset data to initial sample set
   */
  resetToSample() {
    this._writeRaw(INITIAL_CONTRACTS);
    return [...INITIAL_CONTRACTS];
  }

  /**
   * Export database as formatted JSON string
   */
  exportJSON() {
    const contracts = this._readRaw();
    return JSON.stringify(contracts, null, 2);
  }

  /**
   * Export database as CSV file string
   */
  exportCSV() {
    const contracts = this._readRaw();
    if (!contracts.length) return '';

    const headers = [
      'Contract ID',
      'Contract Name',
      'Location',
      'Contractor Name',
      'PCAB License',
      'PCAB Category',
      'Safety Officer Name',
      'Safety Officer Level',
      'Safety Officer Accreditation',
      'Safety Officer Contact',
      'First Aider Name',
      'First Aider Certificate',
      'First Aider Contact',
      'Start Date',
      'Target Completion Date',
      'Estimated Workers',
      'Status',
      'Remarks'
    ];

    const escape = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = contracts.map(c => [
      escape(c.id),
      escape(c.name),
      escape(c.location),
      escape(c.contractorName),
      escape(c.pcabLicense),
      escape(c.pcabCategory),
      escape(c.safetyOfficer?.name),
      escape(c.safetyOfficer?.level),
      escape(c.safetyOfficer?.accreditationNo),
      escape(c.safetyOfficer?.contact),
      escape(c.firstAider?.name),
      escape(c.firstAider?.certificateNo),
      escape(c.firstAider?.contact),
      escape(c.startDate),
      escape(c.targetCompletionDate),
      escape(c.estimatedWorkers),
      escape(c.status),
      escape(c.remarks)
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Import contracts from parsed JSON array
   * @param {string} jsonString 
   */
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported data must be an array of contract objects.');
      }
      // Basic validation
      for (const item of parsed) {
        if (!item.id || !item.name) {
          throw new Error('Each record must contain at least an "id" and "name".');
        }
      }
      this._writeRaw(parsed);
      return { success: true, count: parsed.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const storageService = new StorageService();
