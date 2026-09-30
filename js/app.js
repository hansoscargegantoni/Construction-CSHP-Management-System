/**
 * CSHP Main Application Controller
 * Bootstraps views, binds state, and coordinates real-time conflict evaluation
 */

import { storageService } from './services/storage.js';
import { ConflictEngine } from './services/conflict-engine.js';
import { TableView } from './ui/table-view.js';
import { FormModal } from './ui/form-modal.js';
import { DetailsModal } from './ui/details-modal.js';
import { RosterView } from './ui/roster-view.js';
import { toasts } from './ui/toasts.js';

class CSHPApp {
  constructor() {
    this.contracts = [];
    this.activeTab = 'contracts'; // 'contracts' or 'roster'

    // UI Instances
    this.tableView = null;
    this.formModal = null;
    this.detailsModal = null;
    this.rosterView = null;
  }

  async init() {
    this.initModalsAndViews();
    this.bindGlobalEvents();
    await this.loadData();
    toasts.info('CSHP SafetyHub initialized. DOLE DO-13 conflict engine active.', 2500);
  }

  initModalsAndViews() {
    // 1. Table View
    this.tableView = new TableView('contracts-table-container', {
      onView: (contract) => this.detailsModal.open(contract, 'details'),
      onEdit: (contract) => this.formModal.open(contract),
      onDelete: (contract) => this.handleDeleteContract(contract),
      onNoticeRequest: (contract) => this.detailsModal.open(contract, 'notice')
    });

    // 2. Form Modal (Add / Edit)
    this.formModal = new FormModal('modal-contract-form', {
      onSave: async (contractData, editingId) => {
        if (editingId) {
          await storageService.update(editingId, contractData);
          toasts.success(`Contract ${contractData.id} updated successfully.`);
        } else {
          await storageService.create(contractData);
          toasts.success(`New contract ${contractData.id} created successfully.`);
        }
        await this.loadData();
      }
    });

    // 3. Details Modal
    this.detailsModal = new DetailsModal('modal-contract-details', {
      onEdit: (contract) => this.formModal.open(contract)
    });

    // 4. Roster & Conflict Matrix View
    this.rosterView = new RosterView('roster-container', {
      onViewContract: (contract) => this.detailsModal.open(contract, 'details')
    });
  }

  async loadData() {
    this.contracts = await storageService.getAll();

    // Propagate data to all components
    this.tableView.setContracts(this.contracts);
    this.formModal.setContracts(this.contracts);
    this.detailsModal.setContracts(this.contracts);
    this.rosterView.setContracts(this.contracts);

    this.updateMetrics();
  }

  updateMetrics() {
    const totalCount = this.contracts.length;
    const activeCount = this.contracts.filter(c => ConflictEngine.isStatusActive(c.status)).length;
    
    // Check conflicts
    const conflictContracts = this.contracts.filter(c => ConflictEngine.analyzeContract(c, this.contracts).hasConflict);
    const conflictCount = conflictContracts.length;

    // Personnel matrix counts
    const matrix = ConflictEngine.getPersonnelMatrix(this.contracts);
    const soCount = matrix.safetyOfficers.length;
    const faCount = matrix.firstAiders.length;

    // Update DOM elements
    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('stat-total-contracts', totalCount);
    setEl('stat-active-projects', activeCount);
    setEl('stat-safety-officers', soCount);
    setEl('stat-first-aiders', faCount);
    setEl('stat-conflicts', conflictCount);

    // Conflict card highlight
    const conflictStatCard = document.getElementById('stat-card-conflicts');
    if (conflictStatCard) {
      if (conflictCount > 0) {
        conflictStatCard.classList.add('has-conflicts');
      } else {
        conflictStatCard.classList.remove('has-conflicts');
      }
    }
  }

  bindGlobalEvents() {
    // Tab switching (Contracts vs Roster)
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('data-view');
        this.switchTab(targetView);
      });
    });

    // Add New Contract Button
    const btnAdd = document.getElementById('btn-add-contract');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        this.formModal.open(null);
      });
    }

    // Search input
    const searchInput = document.getElementById('search-contracts');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.tableView.setSearchQuery(e.target.value);
      });
    }

    // Status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.tableView.setStatusFilter(e.target.value);
      });
    }

    // Conflict filter
    const conflictFilter = document.getElementById('filter-conflict');
    if (conflictFilter) {
      conflictFilter.addEventListener('change', (e) => {
        this.tableView.setConflictFilter(e.target.value);
      });
    }

    // Clicking Conflict Stat Card sets filter to show conflicts only
    const conflictCard = document.getElementById('stat-card-conflicts');
    if (conflictCard) {
      conflictCard.addEventListener('click', () => {
        this.switchTab('contracts');
        const cFilter = document.getElementById('filter-conflict');
        if (cFilter) {
          cFilter.value = 'CONFLICT_ONLY';
          this.tableView.setConflictFilter('CONFLICT_ONLY');
        }
        toasts.warning('Displaying contracts with active personnel conflicts.');
      });
    }

    // Export CSV
    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        const csvContent = storageService.exportCSV();
        if (!csvContent) {
          toasts.warning('No contracts available to export.');
          return;
        }
        this.downloadFile(csvContent, 'CSHP_Contracts_Registry.csv', 'text/csv;charset=utf-8;');
        toasts.success('Contracts exported to CSV successfully.');
      });
    }

    // Export Backup JSON
    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        const jsonContent = storageService.exportJSON();
        this.downloadFile(jsonContent, 'CSHP_Backup_Data.json', 'application/json');
        toasts.success('CSHP database backup exported as JSON.');
      });
    }

    // Import JSON
    const importFileInput = document.getElementById('import-file-input');
    const btnTriggerImport = document.getElementById('btn-trigger-import');
    if (btnTriggerImport && importFileInput) {
      btnTriggerImport.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          const content = evt.target.result;
          const res = storageService.importJSON(content);
          if (res.success) {
            toasts.success(`Successfully imported ${res.count} contracts!`);
            await this.loadData();
          } else {
            toasts.danger(`Import failed: ${res.error}`);
          }
          importFileInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Reset to Sample Data
    const btnResetData = document.getElementById('btn-reset-sample');
    if (btnResetData) {
      btnResetData.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset the system to the default sample contracts? Any custom edits will be replaced.')) {
          storageService.resetToSample();
          await this.loadData();
          toasts.info('System database restored to default CSHP sample records.');
        }
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(t => {
      if (t.getAttribute('data-view') === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const contractsSection = document.getElementById('view-contracts-section');
    const rosterSection = document.getElementById('view-roster-section');

    if (tabName === 'contracts') {
      if (contractsSection) contractsSection.style.display = 'block';
      if (rosterSection) rosterSection.style.display = 'none';
      this.tableView.render();
    } else {
      if (contractsSection) contractsSection.style.display = 'none';
      if (rosterSection) rosterSection.style.display = 'block';
      this.rosterView.render();
    }
  }

  async handleDeleteContract(contract) {
    const confirmed = confirm(`Are you sure you want to delete contract [${contract.id}] "${contract.name}"?\nThis action cannot be undone.`);
    if (!confirmed) return;

    await storageService.delete(contract.id);
    toasts.success(`Contract ${contract.id} removed.`);
    await this.loadData();
  }

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CSHPApp();
  app.init();
});
