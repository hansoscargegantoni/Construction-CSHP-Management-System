/**
 * Contracts Table View Component
 * Manages rendering, sorting, searching, and filtering of CSHP contracts.
 */

import { ConflictEngine } from '../services/conflict-engine.js';
import { CSHP_CONFIG } from '../config.js';

export class TableView {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onEdit = options.onEdit || (() => {});
    this.onView = options.onView || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onNoticeRequest = options.onNoticeRequest || (() => {});

    this.contracts = [];
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.conflictFilter = 'ALL'; // ALL, CONFLICT_ONLY, CLEAN_ONLY
    this.sortField = 'id';
    this.sortDirection = 'asc'; // 'asc' or 'desc'
  }

  setContracts(contracts) {
    this.contracts = contracts || [];
    this.render();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.render();
  }

  setStatusFilter(status) {
    this.statusFilter = status;
    this.render();
  }

  setConflictFilter(conflictMode) {
    this.conflictFilter = conflictMode;
    this.render();
  }

  handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.render();
  }

  getFilteredAndSortedData() {
    let result = [...this.contracts];

    // Search query filter
    if (this.searchQuery) {
      result = result.filter(c => {
        const hay = [
          c.id,
          c.name,
          c.location,
          c.contractorName,
          c.pcabLicense,
          c.pcabCategory,
          c.safetyOfficer?.name,
          c.safetyOfficer?.accreditationNo,
          c.firstAider?.name,
          c.firstAider?.certificateNo,
          c.status
        ].map(v => (v || '').toLowerCase()).join(' ');

        return hay.includes(this.searchQuery);
      });
    }

    // Status filter
    if (this.statusFilter !== 'ALL') {
      result = result.filter(c => c.status.toLowerCase() === this.statusFilter.toLowerCase());
    }

    // Conflict filter
    if (this.conflictFilter !== 'ALL') {
      result = result.filter(c => {
        const analysis = ConflictEngine.analyzeContract(c, this.contracts);
        if (this.conflictFilter === 'CONFLICT_ONLY') {
          return analysis.hasConflict;
        } else if (this.conflictFilter === 'CLEAN_ONLY') {
          return !analysis.hasConflict;
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (this.sortField) {
        case 'id':
          valA = a.id || '';
          valB = b.id || '';
          break;
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
        case 'contractor':
          valA = a.contractorName || '';
          valB = b.contractorName || '';
          break;
        case 'officer':
          valA = a.safetyOfficer?.name || '';
          valB = b.safetyOfficer?.name || '';
          break;
        case 'firstAider':
          valA = a.firstAider?.name || '';
          valB = b.firstAider?.name || '';
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        case 'startDate':
          valA = a.startDate || '';
          valB = b.startDate || '';
          break;
        default:
          valA = a.id || '';
          valB = b.id || '';
      }

      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  render() {
    if (!this.container) return;

    const filteredData = this.getFilteredAndSortedData();
    const totalCount = this.contracts.length;
    const filteredCount = filteredData.length;

    // Check overall conflicts
    const conflictContractsCount = this.contracts.filter(c => ConflictEngine.analyzeContract(c, this.contracts).hasConflict).length;

    const getSortIcon = (field) => {
      if (this.sortField !== field) return '<span class="sort-icon inactive">↕</span>';
      return this.sortDirection === 'asc' 
        ? '<span class="sort-icon active">↑</span>' 
        : '<span class="sort-icon active">↓</span>';
    };

    let tableHtml = `
      <div class="table-responsive">
        <table class="cshp-table">
          <thead>
            <tr>
              <th class="th-sortable" data-sort="id">Contract ID ${getSortIcon('id')}</th>
              <th class="th-sortable" data-sort="name">Contract & Location ${getSortIcon('name')}</th>
              <th class="th-sortable" data-sort="contractor">Contractor & PCAB ${getSortIcon('contractor')}</th>
              <th class="th-sortable" data-sort="officer">Safety Officer ${getSortIcon('officer')}</th>
              <th class="th-sortable" data-sort="firstAider">First Aider ${getSortIcon('firstAider')}</th>
              <th class="th-sortable" data-sort="status">Project Status ${getSortIcon('status')}</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (filteredData.length === 0) {
      tableHtml += `
        <tr>
          <td colspan="7" class="table-empty-state">
            <div class="empty-state-content">
              <span class="empty-icon">📋</span>
              <h4>No contracts found matching your filters</h4>
              <p>Try clearing your search query or adjusting the status/conflict filter.</p>
              <button class="btn btn-secondary btn-sm" id="btn-clear-filters">Reset Filters</button>
            </div>
          </td>
        </tr>
      `;
    } else {
      filteredData.forEach(contract => {
        const analysis = ConflictEngine.analyzeContract(contract, this.contracts);
        const hasConflict = analysis.hasConflict;

        // Safety Officer Pill & Badge
        const so = contract.safetyOfficer || {};
        const soHasConflict = analysis.officerConflicts.length > 0;
        let soHtml = `
          <div class="personnel-cell">
            <div class="person-name">
              <span class="avatar-icon">👷</span>
              <strong>${this.escape(so.name || 'Not Designated')}</strong>
            </div>
            <div class="person-meta">
              <span class="badge-role badge-${(so.level || 'so2').toLowerCase()}">${so.level || 'SO2'}</span>
              ${so.accreditationNo ? `<span class="cert-no" title="Accreditation No">${this.escape(so.accreditationNo)}</span>` : ''}
            </div>
            ${soHasConflict ? `
              <div class="conflict-chip conflict-chip-danger" title="Active on: ${analysis.officerConflicts.map(c => c.id).join(', ')}">
                <span class="pulse-dot"></span>
                <strong>⚠️ Double-Booked</strong> (${analysis.officerConflicts.length} other active)
              </div>
            ` : ''}
          </div>
        `;

        // First Aider Pill & Badge
        const fa = contract.firstAider || {};
        const faHasConflict = analysis.firstAiderConflicts.length > 0;
        let faHtml = `
          <div class="personnel-cell">
            <div class="person-name">
              <span class="avatar-icon">🩹</span>
              <strong>${this.escape(fa.name || 'Not Designated')}</strong>
            </div>
            <div class="person-meta">
              <span class="badge-role badge-fa">First Aider</span>
              ${fa.certificateNo ? `<span class="cert-no" title="Certificate No">${this.escape(fa.certificateNo)}</span>` : ''}
            </div>
            ${faHasConflict ? `
              <div class="conflict-chip conflict-chip-danger" title="Active on: ${analysis.firstAiderConflicts.map(c => c.id).join(', ')}">
                <span class="pulse-dot"></span>
                <strong>⚠️ Double-Booked</strong> (${analysis.firstAiderConflicts.length} other active)
              </div>
            ` : ''}
          </div>
        `;

        // Status badge
        const statusConfig = CSHP_CONFIG.STATUS_OPTIONS.find(s => s.value.toLowerCase() === (contract.status || '').toLowerCase()) || {
          color: 'neutral',
          label: contract.status
        };

        const rowHighlightClass = hasConflict ? 'row-in-conflict' : '';

        tableHtml += `
          <tr class="${rowHighlightClass}" data-contract-id="${this.escape(contract.id)}">
            <td class="td-id">
              <div class="id-wrapper">
                <span class="contract-id-badge">${this.escape(contract.id)}</span>
                ${hasConflict ? `<span class="badge-alert-icon" title="Has personnel conflict">⚠️</span>` : ''}
              </div>
            </td>
            <td class="td-name">
              <div class="contract-name-title" title="${this.escape(contract.name)}">
                ${this.escape(contract.name)}
              </div>
              <div class="contract-location-sub">
                <span class="geo-icon">📍</span> ${this.escape(contract.location || 'Location not specified')}
              </div>
            </td>
            <td class="td-contractor">
              <div class="contractor-name">
                ${this.escape(contract.contractorName || 'N/A')}
              </div>
              <div class="pcab-info">
                <span class="pcab-badge" title="PCAB License">${this.escape(contract.pcabLicense || 'No PCAB')}</span>
                ${contract.pcabCategory ? `<span class="pcab-category-badge">${this.escape(contract.pcabCategory)}</span>` : ''}
              </div>
            </td>
            <td class="td-so">${soHtml}</td>
            <td class="td-fa">${faHtml}</td>
            <td class="td-status">
              <span class="status-pill status-${statusConfig.color}">
                <span class="status-dot"></span>
                ${this.escape(contract.status || 'Active')}
              </span>
              ${contract.estimatedWorkers ? `<div class="workers-count"><small>👥 ${contract.estimatedWorkers} Workers</small></div>` : ''}
            </td>
            <td class="td-actions">
              <div class="actions-group">
                <button class="btn-action btn-view" data-action="view" data-id="${this.escape(contract.id)}" title="View Full Contract & CSHP Notice">
                  👁️ View
                </button>
                <button class="btn-action btn-edit" data-action="edit" data-id="${this.escape(contract.id)}" title="Edit Contract Details">
                  ✏️ Edit
                </button>
                <button class="btn-action btn-delete" data-action="delete" data-id="${this.escape(contract.id)}" title="Delete Contract">
                  🗑️
                </button>
              </div>
              ${hasConflict ? `
                <button class="btn-action-notice" data-action="notice" data-id="${this.escape(contract.id)}" title="Generate replacement notice to contractor">
                  📢 Draft Notice
                </button>
              ` : ''}
            </td>
          </tr>
        `;
      });
    }

    tableHtml += `
          </tbody>
        </table>
      </div>
      <div class="table-footer-bar">
        <div class="table-counts">
          Showing <strong>${filteredCount}</strong> of <strong>${totalCount}</strong> contracts
          ${this.statusFilter !== 'ALL' ? ` (Filtered by: <em>${this.statusFilter}</em>)` : ''}
          ${this.conflictFilter === 'CONFLICT_ONLY' ? ` <span class="text-danger font-semibold">• Showing Conflicts Only (${filteredCount})</span>` : ''}
        </div>
        <div class="table-conflict-indicator">
          ${conflictContractsCount > 0 ? `
            <span class="warning-text">⚠️ <strong>${conflictContractsCount} contract(s)</strong> have personnel assignment conflicts.</span>
          ` : `
            <span class="success-text">✓ All active safety personnel assignments are unique & compliant.</span>
          `}
        </div>
      </div>
    `;

    this.container.innerHTML = tableHtml;
    this.attachEvents();
  }

  attachEvents() {
    // Sort headers
    const sortHeaders = this.container.querySelectorAll('.th-sortable');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (field) this.handleSort(field);
      });
    });

    // Action buttons
    const actionButtons = this.container.querySelectorAll('.btn-action, .btn-action-notice');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const contract = this.contracts.find(c => c.id.toLowerCase() === id.toLowerCase());

        if (!contract) return;

        if (action === 'view') {
          this.onView(contract);
        } else if (action === 'edit') {
          this.onEdit(contract);
        } else if (action === 'delete') {
          this.onDelete(contract);
        } else if (action === 'notice') {
          this.onNoticeRequest(contract);
        }
      });
    });

    // Reset filters button if empty state
    const clearBtn = this.container.querySelector('#btn-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('search-contracts');
        if (searchInput) searchInput.value = '';
        const statusSelect = document.getElementById('filter-status');
        if (statusSelect) statusSelect.value = 'ALL';
        const conflictSelect = document.getElementById('filter-conflict');
        if (conflictSelect) conflictSelect.value = 'ALL';

        this.searchQuery = '';
        this.statusFilter = 'ALL';
        this.conflictFilter = 'ALL';
        this.render();
      });
    }
  }

  escape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
