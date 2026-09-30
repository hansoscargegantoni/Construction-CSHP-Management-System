/**
 * Form Modal Component
 * Add / Edit Contract with live conflict detection while typing
 */

import { ConflictEngine } from '../services/conflict-engine.js';
import { CSHP_CONFIG } from '../config.js';
import { toasts } from './toasts.js';

export class FormModal {
  constructor(modalId, options = {}) {
    this.modal = document.getElementById(modalId);
    this.onSave = options.onSave || (() => {});
    this.allContracts = [];
    this.editingId = null; // null if creating new
    this.init();
  }

  setContracts(contracts) {
    this.allContracts = contracts || [];
    this.updateDatalists();
  }

  init() {
    if (!this.modal) return;

    // Close button & backdrop click
    const closeBtn = this.modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const cancelBtn = this.modal.querySelector('.btn-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Form submit
    const form = this.modal.querySelector('#contract-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Live conflict checks on input
    const soInput = this.modal.querySelector('#form-so-name');
    const faInput = this.modal.querySelector('#form-fa-name');
    const statusSelect = this.modal.querySelector('#form-status');

    if (soInput) soInput.addEventListener('input', () => this.checkLiveConflicts());
    if (faInput) faInput.addEventListener('input', () => this.checkLiveConflicts());
    if (statusSelect) statusSelect.addEventListener('change', () => this.checkLiveConflicts());
  }

  updateDatalists() {
    const soList = document.getElementById('so-suggestions');
    const faList = document.getElementById('fa-suggestions');
    if (!soList || !faList) return;

    const matrix = ConflictEngine.getPersonnelMatrix(this.allContracts);

    soList.innerHTML = matrix.safetyOfficers.map(so => 
      `<option value="${this.escape(so.name)}">${so.level} • ${so.availability.label}</option>`
    ).join('');

    faList.innerHTML = matrix.firstAiders.map(fa => 
      `<option value="${this.escape(fa.name)}">${fa.availability.label}</option>`
    ).join('');
  }

  open(contractToEdit = null) {
    if (!this.modal) return;
    this.editingId = contractToEdit ? contractToEdit.id : null;

    const modalTitle = this.modal.querySelector('#modal-title');
    const form = this.modal.querySelector('#contract-form');
    const conflictBox = this.modal.querySelector('#live-conflict-banner');

    if (modalTitle) {
      modalTitle.textContent = contractToEdit ? `Edit Contract: ${contractToEdit.id}` : 'Create New CSHP Contract Record';
    }

    if (conflictBox) {
      conflictBox.style.display = 'none';
      conflictBox.innerHTML = '';
    }

    if (form) form.reset();

    // Populate SO Levels dropdown
    const soLevelSelect = this.modal.querySelector('#form-so-level');
    if (soLevelSelect) {
      soLevelSelect.innerHTML = CSHP_CONFIG.SO_LEVELS.map(l => 
        `<option value="${l.value}">${l.label}</option>`
      ).join('');
    }

    // Populate Status dropdown
    const statusSelect = this.modal.querySelector('#form-status');
    if (statusSelect) {
      statusSelect.innerHTML = CSHP_CONFIG.STATUS_OPTIONS.map(s => 
        `<option value="${s.value}">${s.label}</option>`
      ).join('');
    }

    // Populate PCAB category dropdown
    const pcabCatSelect = this.modal.querySelector('#form-pcab-category');
    if (pcabCatSelect) {
      pcabCatSelect.innerHTML = CSHP_CONFIG.PCAB_CATEGORIES.map(c => 
        `<option value="${c}">${c}</option>`
      ).join('');
    }

    if (contractToEdit) {
      this.populateForm(contractToEdit);
      this.checkLiveConflicts();
    } else {
      // Set defaults for new contract
      const statusEl = this.modal.querySelector('#form-status');
      if (statusEl) statusEl.value = 'Active';
      const idInput = this.modal.querySelector('#form-id');
      if (idInput) {
        idInput.removeAttribute('readonly');
      }
    }

    this.modal.classList.add('modal-open');
    document.body.classList.add('modal-active');
  }

  populateForm(contract) {
    const setVal = (id, val) => {
      const el = this.modal.querySelector(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('#form-id', contract.id);
    const idInput = this.modal.querySelector('#form-id');
    // Lock ID field if editing to prevent accidental corruption
    if (idInput) idInput.setAttribute('readonly', 'true');

    setVal('#form-name', contract.name);
    setVal('#form-location', contract.location);
    setVal('#form-contractor', contract.contractorName);
    setVal('#form-pcab-license', contract.pcabLicense);
    setVal('#form-pcab-category', contract.pcabCategory || 'Category A');
    
    setVal('#form-so-name', contract.safetyOfficer?.name);
    setVal('#form-so-level', contract.safetyOfficer?.level || 'SO2');
    setVal('#form-so-accreditation', contract.safetyOfficer?.accreditationNo);
    setVal('#form-so-contact', contract.safetyOfficer?.contact);

    setVal('#form-fa-name', contract.firstAider?.name);
    setVal('#form-fa-certificate', contract.firstAider?.certificateNo);
    setVal('#form-fa-contact', contract.firstAider?.contact);

    setVal('#form-start-date', contract.startDate);
    setVal('#form-completion-date', contract.targetCompletionDate);
    setVal('#form-workers', contract.estimatedWorkers);
    setVal('#form-status', contract.status || 'Active');
    setVal('#form-remarks', contract.remarks);
  }

  checkLiveConflicts() {
    const conflictBox = this.modal.querySelector('#live-conflict-banner');
    if (!conflictBox) return;

    const soName = this.modal.querySelector('#form-so-name')?.value || '';
    const faName = this.modal.querySelector('#form-fa-name')?.value || '';
    const status = this.modal.querySelector('#form-status')?.value || 'Active';

    const isActive = ConflictEngine.isStatusActive(status);
    if (!isActive) {
      conflictBox.style.display = 'none';
      return;
    }

    const currentId = this.editingId;
    const soConflicts = ConflictEngine.checkOfficerConflict(soName, currentId, this.allContracts);
    const faConflicts = ConflictEngine.checkFirstAiderConflict(faName, currentId, this.allContracts);

    // Cross-check dual role
    let dualRoleWarning = false;
    const soNorm = ConflictEngine.normalizeName(soName);
    const faNorm = ConflictEngine.normalizeName(faName);
    if (soNorm && faNorm && soNorm === faNorm) {
      dualRoleWarning = true;
    }

    if (soConflicts.length === 0 && faConflicts.length === 0 && !dualRoleWarning) {
      conflictBox.style.display = 'none';
      return;
    }

    // Build alert HTML
    let alertHtml = `
      <div class="conflict-alert-card">
        <div class="conflict-alert-header">
          <span class="alert-icon">⚠️</span>
          <h4>Live Personnel Double-Assignment Warning</h4>
        </div>
        <div class="conflict-alert-body">
    `;

    if (soConflicts.length > 0) {
      alertHtml += `
        <div class="conflict-item">
          <strong>Safety Officer "${this.escape(soName)}"</strong> is already actively assigned to:
          <ul>
            ${soConflicts.map(c => `<li><strong>${this.escape(c.id)}</strong>: ${this.escape(c.name)} (<em>${this.escape(c.contractorName)}</em>)</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (faConflicts.length > 0) {
      alertHtml += `
        <div class="conflict-item">
          <strong>First Aider "${this.escape(faName)}"</strong> is already actively assigned to:
          <ul>
            ${faConflicts.map(c => `<li><strong>${this.escape(c.id)}</strong>: ${this.escape(c.name)} (<em>${this.escape(c.contractorName)}</em>)</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (dualRoleWarning) {
      alertHtml += `
        <div class="conflict-item">
          <strong>Dual-Role Compliance Alert:</strong> The same person is designated as both Safety Officer and First Aider on this project. DOLE DO-13 requires distinct personnel.
        </div>
      `;
    }

    alertHtml += `
        </div>
        <div class="conflict-alert-footer">
          <small>💡 <em>You can still save this contract. It will be flagged with a conflict badge in the system, and you can generate a formal replacement notice to instruct the contractor to assign a replacement.</em></small>
        </div>
      </div>
    `;

    conflictBox.innerHTML = alertHtml;
    conflictBox.style.display = 'block';
  }

  async handleSubmit(e) {
    e.preventDefault();

    const getVal = (id) => this.modal.querySelector(id)?.value?.trim() || '';

    const id = getVal('#form-id');
    const name = getVal('#form-name');
    const contractor = getVal('#form-contractor');

    if (!id || !name || !contractor) {
      toasts.danger('Please fill out the required fields: Contract ID, Contract Name, and Contractor.');
      return;
    }

    const contractData = {
      id,
      name,
      location: getVal('#form-location'),
      contractorName: contractor,
      pcabLicense: getVal('#form-pcab-license'),
      pcabCategory: getVal('#form-pcab-category'),
      safetyOfficer: {
        name: getVal('#form-so-name'),
        level: getVal('#form-so-level'),
        accreditationNo: getVal('#form-so-accreditation'),
        contact: getVal('#form-so-contact')
      },
      firstAider: {
        name: getVal('#form-fa-name'),
        certificateNo: getVal('#form-fa-certificate'),
        contact: getVal('#form-fa-contact')
      },
      startDate: getVal('#form-start-date'),
      targetCompletionDate: getVal('#form-completion-date'),
      estimatedWorkers: parseInt(getVal('#form-workers'), 10) || 0,
      status: getVal('#form-status') || 'Active',
      remarks: getVal('#form-remarks')
    };

    try {
      await this.onSave(contractData, this.editingId);
      this.close();
    } catch (err) {
      toasts.danger(err.message || 'Failed to save contract.');
    }
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('modal-open');
    document.body.classList.remove('modal-active');
    this.editingId = null;
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
