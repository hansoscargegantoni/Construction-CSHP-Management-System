/**
 * Personnel Roster & Conflict Matrix View Component
 * Provides a dedicated directory of all Safety Officers and First Aiders,
 * showing real-time availability, active workloads, and double-booking flags.
 */

import { ConflictEngine } from '../services/conflict-engine.js';

export class RosterView {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onViewContract = options.onViewContract || (() => {});
    this.allContracts = [];
    this.activeRoleTab = 'ALL'; // 'ALL', 'SO', 'FA'
    this.searchQuery = '';
    this.availabilityFilter = 'ALL'; // 'ALL', 'CONFLICT', 'ASSIGNED', 'AVAILABLE'
  }

  setContracts(contracts) {
    this.allContracts = contracts || [];
    this.render();
  }

  setRoleTab(role) {
    this.activeRoleTab = role;
    this.render();
  }

  setSearchQuery(q) {
    this.searchQuery = (q || '').toLowerCase().trim();
    this.render();
  }

  setAvailabilityFilter(filter) {
    this.availabilityFilter = filter;
    this.render();
  }

  render() {
    if (!this.container) return;

    const matrix = ConflictEngine.getPersonnelMatrix(this.allContracts);
    let allPersonnel = [];

    if (this.activeRoleTab === 'ALL' || this.activeRoleTab === 'SO') {
      allPersonnel.push(...matrix.safetyOfficers);
    }
    if (this.activeRoleTab === 'ALL' || this.activeRoleTab === 'FA') {
      allPersonnel.push(...matrix.firstAiders);
    }

    // Filter by search
    if (this.searchQuery) {
      allPersonnel = allPersonnel.filter(p => {
        const text = [
          p.name,
          p.role,
          p.level || '',
          p.accreditationNo || p.certificateNo || '',
          p.contact || '',
          ...p.activeAssignments.map(a => `${a.contractId} ${a.contractName} ${a.contractor}`)
        ].join(' ').toLowerCase();

        return text.includes(this.searchQuery);
      });
    }

    // Filter by availability
    if (this.availabilityFilter !== 'ALL') {
      allPersonnel = allPersonnel.filter(p => {
        if (this.availabilityFilter === 'CONFLICT') return p.availability.status === 'Conflict';
        if (this.availabilityFilter === 'ASSIGNED') return p.availability.status === 'Assigned';
        if (this.availabilityFilter === 'AVAILABLE') return p.availability.status === 'Available';
        return true;
      });
    }

    // Sort: Conflicts first, then assigned, then available
    allPersonnel.sort((a, b) => {
      const order = { 'Conflict': 1, 'Assigned': 2, 'Available': 3 };
      const diff = order[a.availability.status] - order[b.availability.status];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

    const totalSO = matrix.safetyOfficers.length;
    const totalFA = matrix.firstAiders.length;
    const soConflicts = matrix.safetyOfficers.filter(s => s.availability.status === 'Conflict').length;
    const faConflicts = matrix.firstAiders.filter(f => f.availability.status === 'Conflict').length;

    let html = `
      <div class="roster-header-bar">
        <div class="roster-metrics">
          <div class="roster-metric-chip ${this.activeRoleTab === 'ALL' ? 'active' : ''}" data-role="ALL">
            <strong>All Personnel</strong> (${totalSO + totalFA})
          </div>
          <div class="roster-metric-chip ${this.activeRoleTab === 'SO' ? 'active' : ''}" data-role="SO">
            👷 <strong>Safety Officers</strong> (${totalSO})
            ${soConflicts > 0 ? `<span class="chip-alert">${soConflicts} in conflict</span>` : ''}
          </div>
          <div class="roster-metric-chip ${this.activeRoleTab === 'FA' ? 'active' : ''}" data-role="FA">
            🩹 <strong>First Aiders</strong> (${totalFA})
            ${faConflicts > 0 ? `<span class="chip-alert">${faConflicts} in conflict</span>` : ''}
          </div>
        </div>

        <div class="roster-controls">
          <div class="search-input-group">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="roster-search" 
              class="form-control" 
              placeholder="Search personnel, certification, or project..." 
              value="${this.escape(this.searchQuery)}"
            />
          </div>
          <div class="filter-select-group">
            <select id="roster-avail-filter" class="form-control">
              <option value="ALL" ${this.availabilityFilter === 'ALL' ? 'selected' : ''}>Status: All Personnel</option>
              <option value="CONFLICT" ${this.availabilityFilter === 'CONFLICT' ? 'selected' : ''}>⚠️ Double-Booked / Conflict Only</option>
              <option value="ASSIGNED" ${this.availabilityFilter === 'ASSIGNED' ? 'selected' : ''}>Assigned (1 Active Project)</option>
              <option value="AVAILABLE" ${this.availabilityFilter === 'AVAILABLE' ? 'selected' : ''}>Available (0 Active Projects)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="roster-grid">
    `;

    if (allPersonnel.length === 0) {
      html += `
        <div class="roster-empty-state">
          <span class="empty-icon">👷‍♂️</span>
          <h4>No personnel match your search or filter</h4>
          <p>Try resetting the availability filter or entering a different search term.</p>
        </div>
      `;
    } else {
      allPersonnel.forEach(person => {
        const isConflict = person.availability.status === 'Conflict';
        const cardClass = isConflict ? 'roster-card card-conflict-border' : 'roster-card';
        const isSO = person.role === 'Safety Officer';

        html += `
          <div class="${cardClass}">
            <div class="rc-header">
              <div class="rc-profile">
                <span class="rc-avatar">${isSO ? '👷' : '🩹'}</span>
                <div>
                  <h4 class="rc-name">${this.escape(person.name)}</h4>
                  <div class="rc-tags">
                    <span class="badge-role ${isSO ? `badge-${(person.level || 'so2').toLowerCase()}` : 'badge-fa'}">
                      ${this.escape(isSO ? `${person.level || 'SO2'}` : 'First Aider')}
                    </span>
                    <span class="rc-cert">${this.escape(person.accreditationNo || person.certificateNo || 'No Cert No')}</span>
                  </div>
                </div>
              </div>
              <div class="rc-status">
                <span class="status-pill ${isConflict ? 'status-danger' : (person.availability.status === 'Assigned' ? 'status-info' : 'status-success')}">
                  <span class="status-dot"></span>
                  ${this.escape(person.availability.label)}
                </span>
              </div>
            </div>

            <div class="rc-body">
              <div class="rc-info-row">
                <span class="rc-label">📞 Contact:</span>
                <span class="rc-val">${this.escape(person.contact || 'N/A')}</span>
              </div>

              <!-- Active Assignments -->
              <div class="rc-assignments-section">
                <div class="rc-section-title">
                  <span>Active Project Assignments (${person.activeAssignments.length})</span>
                  ${isConflict ? `<span class="conflict-tag-mini">⚠️ CONFLICT</span>` : ''}
                </div>
                ${person.activeAssignments.length === 0 ? `
                  <div class="rc-no-assignments">No active projects currently assigned. Fully available for new CSHP nominations.</div>
                ` : `
                  <ul class="rc-assignment-list">
                    ${person.activeAssignments.map(a => `
                      <li class="rc-assignment-item">
                        <div class="rc-proj-info">
                          <button class="btn-link-proj" data-proj-id="${this.escape(a.contractId)}">
                            <strong>${this.escape(a.contractId)}</strong>
                          </button>
                          <span class="rc-proj-name" title="${this.escape(a.contractName)}">${this.escape(a.contractName)}</span>
                        </div>
                        <div class="rc-proj-meta">
                          <small>🏢 ${this.escape(a.contractor)} • 📍 ${this.escape(a.location)}</small>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>

              ${person.historicalAssignments.length > 0 ? `
                <div class="rc-history-summary">
                  <small>✓ Past completed projects: ${person.historicalAssignments.length} site(s)</small>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    // Role filter tabs
    const roleChips = this.container.querySelectorAll('.roster-metric-chip');
    roleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const role = chip.getAttribute('data-role');
        this.setRoleTab(role);
      });
    });

    // Search input
    const searchInput = this.container.querySelector('#roster-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        // Restore focus to input
        const reInput = this.container.querySelector('#roster-search');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      });
    }

    // Availability dropdown
    const availSelect = this.container.querySelector('#roster-avail-filter');
    if (availSelect) {
      availSelect.addEventListener('change', (e) => {
        this.availabilityFilter = e.target.value;
        this.render();
      });
    }

    // Project links to view contract details
    const projLinks = this.container.querySelectorAll('.btn-link-proj');
    projLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const projId = link.getAttribute('data-proj-id');
        const contract = this.allContracts.find(c => c.id.toLowerCase() === projId.toLowerCase());
        if (contract) {
          this.onViewContract(contract);
        }
      });
    });
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
