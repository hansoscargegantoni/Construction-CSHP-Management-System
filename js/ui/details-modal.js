/**
 * Details Modal & Contractor Notice Generator Component
 * Displays comprehensive contract view and ready-to-issue CSHP Compliance Notices
 */

import { ConflictEngine } from '../services/conflict-engine.js';
import { CSHP_CONFIG } from '../config.js';
import { toasts } from './toasts.js';

export class DetailsModal {
  constructor(modalId, options = {}) {
    this.modal = document.getElementById(modalId);
    this.onEdit = options.onEdit || (() => {});
    this.currentContract = null;
    this.allContracts = [];
    this.init();
  }

  setContracts(contracts) {
    this.allContracts = contracts || [];
  }

  init() {
    if (!this.modal) return;

    const closeBtn = this.modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(contract, defaultTab = 'details') {
    if (!this.modal || !contract) return;
    this.currentContract = contract;

    const analysis = ConflictEngine.analyzeContract(contract, this.allContracts);
    this.renderContent(contract, analysis, defaultTab);

    this.modal.classList.add('modal-open');
    document.body.classList.add('modal-active');
  }

  renderContent(contract, analysis, activeTab = 'details') {
    const container = this.modal.querySelector('.modal-body-dynamic');
    if (!container) return;

    const so = contract.safetyOfficer || {};
    const fa = contract.firstAider || {};

    const statusConfig = CSHP_CONFIG.STATUS_OPTIONS.find(s => s.value.toLowerCase() === (contract.status || '').toLowerCase()) || {
      color: 'neutral',
      label: contract.status
    };

    const noticeText = ConflictEngine.generateContractorNotice(contract, analysis);

    container.innerHTML = `
      <div class="details-header-strip">
        <div class="dh-left">
          <span class="dh-id-tag">${this.escape(contract.id)}</span>
          <h3 class="dh-title">${this.escape(contract.name)}</h3>
          <p class="dh-location">📍 ${this.escape(contract.location || 'Location Not Specified')}</p>
        </div>
        <div class="dh-right">
          <span class="status-pill status-${statusConfig.color}">
            <span class="status-dot"></span>
            ${this.escape(contract.status)}
          </span>
          ${analysis.hasConflict ? `
            <div class="conflict-badge-banner">
              ⚠️ <strong>${analysis.totalConflicts} Conflict(s) Flagged</strong>
            </div>
          ` : `
            <div class="clean-badge-banner">
              ✓ Personnel Assignments Compliant
            </div>
          `}
        </div>
      </div>

      <div class="details-tab-nav">
        <button class="dtab-btn ${activeTab === 'details' ? 'active' : ''}" data-tab="details">
          📋 Contract & Personnel Specs
        </button>
        <button class="dtab-btn ${activeTab === 'notice' ? 'active' : ''}" data-tab="notice">
          📢 Contractor Replacement Notice ${analysis.hasConflict ? `<span class="badge-mini-conflict">!</span>` : ''}
        </button>
      </div>

      <div class="dtab-content dtab-details ${activeTab === 'details' ? 'active' : ''}" id="tab-pane-details">
        <div class="details-grid">
          <!-- Contractor Section -->
          <div class="detail-card">
            <h4>🏢 Contractor Information</h4>
            <div class="detail-row">
              <span class="d-label">General Contractor:</span>
              <span class="d-val font-semibold">${this.escape(contract.contractorName || 'N/A')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">PCAB License No:</span>
              <span class="d-val"><span class="badge-code">${this.escape(contract.pcabLicense || 'N/A')}</span></span>
            </div>
            <div class="detail-row">
              <span class="d-label">PCAB Category:</span>
              <span class="d-val">${this.escape(contract.pcabCategory || 'N/A')}</span>
            </div>
          </div>

          <!-- Schedule & Scope -->
          <div class="detail-card">
            <h4>📅 Schedule & Workforce</h4>
            <div class="detail-row">
              <span class="d-label">Project Start Date:</span>
              <span class="d-val">${this.escape(contract.startDate || 'N/A')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">Target Completion:</span>
              <span class="d-val">${this.escape(contract.targetCompletionDate || 'N/A')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">Estimated Peak Workers:</span>
              <span class="d-val font-semibold">${contract.estimatedWorkers ? `${contract.estimatedWorkers} Personnel` : 'N/A'}</span>
            </div>
          </div>

          <!-- Safety Officer Details -->
          <div class="detail-card ${analysis.officerConflicts.length > 0 ? 'card-conflict-border' : ''}">
            <div class="card-header-flex">
              <h4>👷 Safety Officer Designation</h4>
              ${analysis.officerConflicts.length > 0 ? `<span class="tag-conflict">Conflict Detected</span>` : `<span class="tag-clean">Compliant</span>`}
            </div>
            <div class="detail-row">
              <span class="d-label">Assigned Officer:</span>
              <span class="d-val font-bold">${this.escape(so.name || 'Not Designated')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">OSH Level / Category:</span>
              <span class="d-val"><span class="badge-role badge-${(so.level || 'so2').toLowerCase()}">${this.escape(so.level || 'SO2')}</span></span>
            </div>
            <div class="detail-row">
              <span class="d-label">DOLE Accreditation No:</span>
              <span class="d-val">${this.escape(so.accreditationNo || 'N/A')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">Contact Details:</span>
              <span class="d-val">${this.escape(so.contact || 'N/A')}</span>
            </div>

            ${analysis.officerConflicts.length > 0 ? `
              <div class="conflict-sublist">
                <span class="cs-title">⚠️ Currently active on other projects:</span>
                <ul>
                  ${analysis.officerConflicts.map(c => `
                    <li>
                      <strong>${this.escape(c.id)}</strong>: ${this.escape(c.name)}<br>
                      <small>Contractor: ${this.escape(c.contractorName)} • Status: ${this.escape(c.status)}</small>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- First Aider Details -->
          <div class="detail-card ${analysis.firstAiderConflicts.length > 0 ? 'card-conflict-border' : ''}">
            <div class="card-header-flex">
              <h4>🩹 Certified First Aider</h4>
              ${analysis.firstAiderConflicts.length > 0 ? `<span class="tag-conflict">Conflict Detected</span>` : `<span class="tag-clean">Compliant</span>`}
            </div>
            <div class="detail-row">
              <span class="d-label">Assigned First Aider:</span>
              <span class="d-val font-bold">${this.escape(fa.name || 'Not Designated')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">PRC / Red Cross Cert No:</span>
              <span class="d-val">${this.escape(fa.certificateNo || 'N/A')}</span>
            </div>
            <div class="detail-row">
              <span class="d-label">Contact Details:</span>
              <span class="d-val">${this.escape(fa.contact || 'N/A')}</span>
            </div>

            ${analysis.firstAiderConflicts.length > 0 ? `
              <div class="conflict-sublist">
                <span class="cs-title">⚠️ Currently active on other projects:</span>
                <ul>
                  ${analysis.firstAiderConflicts.map(c => `
                    <li>
                      <strong>${this.escape(c.id)}</strong>: ${this.escape(c.name)}<br>
                      <small>Contractor: ${this.escape(c.contractorName)} • Status: ${this.escape(c.status)}</small>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Remarks -->
        <div class="detail-card full-width-card mt-3">
          <h4>📝 CSHP Evaluator Remarks & Notes</h4>
          <p class="remarks-text">${this.escape(contract.remarks || 'No specific remarks recorded for this contract.')}</p>
        </div>
      </div>

      <div class="dtab-content dtab-notice ${activeTab === 'notice' ? 'active' : ''}" id="tab-pane-notice">
        <div class="notice-container">
          <div class="notice-meta-bar">
            <div>
              <strong>Contractor Notice Preview</strong>
              <p class="text-muted"><small>Ready-to-issue official notice informing the contractor to replace conflicting personnel.</small></p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-copy-notice">
              📋 Copy Notice to Clipboard
            </button>
          </div>
          <pre class="notice-textarea" id="notice-text-content">${this.escape(noticeText)}</pre>
        </div>
      </div>

      <div class="modal-footer-custom">
        <button class="btn btn-secondary" id="btn-close-details">Close</button>
        <button class="btn btn-primary" id="btn-edit-from-details">✏️ Edit Contract</button>
      </div>
    `;

    // Tab buttons
    const tabBtns = container.querySelectorAll('.dtab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const panes = container.querySelectorAll('.dtab-content');
        panes.forEach(p => p.classList.remove('active'));

        const targetPane = container.querySelector(`#tab-pane-${tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Copy notice button
    const copyBtn = container.querySelector('#btn-copy-notice');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(noticeText).then(() => {
          toasts.success('Contractor Replacement Notice copied to clipboard!');
        }).catch(() => {
          toasts.warning('Could not auto-copy. You can select and copy the text manually.');
        });
      });
    }

    // Close button in footer
    const closeFooterBtn = container.querySelector('#btn-close-details');
    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', () => this.close());
    }

    // Edit button in footer
    const editFooterBtn = container.querySelector('#btn-edit-from-details');
    if (editFooterBtn) {
      editFooterBtn.addEventListener('click', () => {
        const c = this.currentContract;
        this.close();
        this.onEdit(c);
      });
    }
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('modal-open');
    document.body.classList.remove('modal-active');
    this.currentContract = null;
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
