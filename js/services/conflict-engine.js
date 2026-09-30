/**
 * Conflict Engine
 * Analyzes contract personnel assignments to detect double-booking and active site conflicts
 * in accordance with DOLE DO-13 (Construction Safety Guidelines).
 */

import { CSHP_CONFIG } from '../config.js';

export class ConflictEngine {
  /**
   * Helper to normalize names for robust comparison (ignoring case, honorifics like Engr., Archt., etc.)
   */
  static normalizeName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/^(engr\.|archt\.|dr\.|rn|atty\.|mr\.|ms\.|mrs\.)\s+/gi, '')
      .replace(/,\s*(rn|pep|so\d|pme|cee|csp)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if a contract status counts as "Active/Occupied" for personnel assignment
   */
  static isStatusActive(status) {
    const found = CSHP_CONFIG.STATUS_OPTIONS.find(s => s.value.toLowerCase() === (status || '').toLowerCase());
    return found ? found.activeForConflict : (status === 'Active' || status === 'Under Review');
  }

  /**
   * Check if a Safety Officer has an active assignment conflict
   * @param {string} officerName - Name to test
   * @param {string} currentContractId - Current contract ID (excluded from check)
   * @param {Array} allContracts - Full list of contracts
   * @returns {Array} - Array of conflicting contract objects
   */
  static checkOfficerConflict(officerName, currentContractId, allContracts) {
    if (!officerName || !officerName.trim()) return [];
    const targetNorm = this.normalizeName(officerName);
    if (!targetNorm) return [];

    return allContracts.filter(c => {
      // Exclude self if updating
      if (currentContractId && c.id.toLowerCase() === currentContractId.toLowerCase()) {
        return false;
      }
      // Must be an active / under-review project
      if (!this.isStatusActive(c.status)) {
        return false;
      }
      const existingNorm = this.normalizeName(c.safetyOfficer?.name);
      return existingNorm && (existingNorm === targetNorm || existingNorm.includes(targetNorm) || targetNorm.includes(existingNorm));
    });
  }

  /**
   * Check if a First Aider has an active assignment conflict
   * @param {string} firstAiderName - Name to test
   * @param {string} currentContractId - Current contract ID (excluded from check)
   * @param {Array} allContracts - Full list of contracts
   * @returns {Array} - Array of conflicting contract objects
   */
  static checkFirstAiderConflict(firstAiderName, currentContractId, allContracts) {
    if (!firstAiderName || !firstAiderName.trim()) return [];
    const targetNorm = this.normalizeName(firstAiderName);
    if (!targetNorm) return [];

    return allContracts.filter(c => {
      if (currentContractId && c.id.toLowerCase() === currentContractId.toLowerCase()) {
        return false;
      }
      if (!this.isStatusActive(c.status)) {
        return false;
      }
      const existingNorm = this.normalizeName(c.firstAider?.name);
      return existingNorm && (existingNorm === targetNorm || existingNorm.includes(targetNorm) || targetNorm.includes(existingNorm));
    });
  }

  /**
   * Check if a single contract has any personnel conflicts
   * @param {Object} contract 
   * @param {Array} allContracts 
   * @returns {Object} { hasConflict, officerConflicts, firstAiderConflicts, dualRoleConflict }
   */
  static analyzeContract(contract, allContracts) {
    const isThisActive = this.isStatusActive(contract.status);
    
    // If this project is completed or suspended, it does not impose active conflicts on itself
    if (!isThisActive) {
      return {
        hasConflict: false,
        officerConflicts: [],
        firstAiderConflicts: [],
        dualRoleConflict: null,
        totalConflicts: 0
      };
    }

    const officerConflicts = this.checkOfficerConflict(contract.safetyOfficer?.name, contract.id, allContracts);
    const firstAiderConflicts = this.checkFirstAiderConflict(contract.firstAider?.name, contract.id, allContracts);
    
    // Check if the same person is set as both Safety Officer and First Aider on this project
    let dualRoleConflict = null;
    const soNorm = this.normalizeName(contract.safetyOfficer?.name);
    const faNorm = this.normalizeName(contract.firstAider?.name);
    if (soNorm && faNorm && soNorm === faNorm) {
      dualRoleConflict = {
        name: contract.safetyOfficer?.name,
        message: 'Same individual is assigned as both Safety Officer and First Aider. DOLE DO-13 requires distinct qualified safety personnel for non-trivial projects.'
      };
    }

    const totalConflicts = officerConflicts.length + firstAiderConflicts.length + (dualRoleConflict ? 1 : 0);

    return {
      hasConflict: totalConflicts > 0,
      officerConflicts,
      firstAiderConflicts,
      dualRoleConflict,
      totalConflicts
    };
  }

  /**
   * Build complete personnel roster matrix
   * Aggregates all registered Safety Officers and First Aiders across all projects
   * @param {Array} allContracts 
   * @returns {Object} { safetyOfficers: Array, firstAiders: Array }
   */
  static getPersonnelMatrix(allContracts) {
    const soMap = new Map();
    const faMap = new Map();

    allContracts.forEach(contract => {
      // Process Safety Officer
      if (contract.safetyOfficer?.name && contract.safetyOfficer.name.trim()) {
        const rawName = contract.safetyOfficer.name.trim();
        const norm = this.normalizeName(rawName);
        if (!soMap.has(norm)) {
          soMap.set(norm, {
            name: rawName,
            role: 'Safety Officer',
            level: contract.safetyOfficer.level || 'SO2',
            accreditationNo: contract.safetyOfficer.accreditationNo || 'N/A',
            contact: contract.safetyOfficer.contact || 'N/A',
            activeAssignments: [],
            historicalAssignments: []
          });
        }
        const record = soMap.get(norm);
        const assignmentItem = {
          contractId: contract.id,
          contractName: contract.name,
          contractor: contract.contractorName,
          status: contract.status,
          location: contract.location
        };

        if (this.isStatusActive(contract.status)) {
          record.activeAssignments.push(assignmentItem);
        } else {
          record.historicalAssignments.push(assignmentItem);
        }
      }

      // Process First Aider
      if (contract.firstAider?.name && contract.firstAider.name.trim()) {
        const rawName = contract.firstAider.name.trim();
        const norm = this.normalizeName(rawName);
        if (!faMap.has(norm)) {
          faMap.set(norm, {
            name: rawName,
            role: 'First Aider',
            certificateNo: contract.firstAider.certificateNo || 'N/A',
            contact: contract.firstAider.contact || 'N/A',
            activeAssignments: [],
            historicalAssignments: []
          });
        }
        const record = faMap.get(norm);
        const assignmentItem = {
          contractId: contract.id,
          contractName: contract.name,
          contractor: contract.contractorName,
          status: contract.status,
          location: contract.location
        };

        if (this.isStatusActive(contract.status)) {
          record.activeAssignments.push(assignmentItem);
        } else {
          record.historicalAssignments.push(assignmentItem);
        }
      }
    });

    // Compute status flags for each
    const computeStatus = (person) => {
      const activeCount = person.activeAssignments.length;
      if (activeCount > 1) return { status: 'Conflict', badgeClass: 'badge-conflict', label: `In Conflict (${activeCount} Active Projects)` };
      if (activeCount === 1) return { status: 'Assigned', badgeClass: 'badge-assigned', label: 'Assigned (1 Project)' };
      return { status: 'Available', badgeClass: 'badge-available', label: 'Available (0 Active Projects)' };
    };

    const safetyOfficers = Array.from(soMap.values()).map(p => ({
      ...p,
      availability: computeStatus(p)
    }));

    const firstAiders = Array.from(faMap.values()).map(p => ({
      ...p,
      availability: computeStatus(p)
    }));

    return { safetyOfficers, firstAiders };
  }

  /**
   * Generates a formal Contractor Replacement / CSHP Notice text
   * Useful for evaluators to copy and email or issue to the contractor
   */
  static generateContractorNotice(contract, analysis) {
    const lines = [];
    lines.push(`NOTICE OF CSHP PERSONNEL REPLACEMENT REQUIREMENT`);
    lines.push(`Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    lines.push(`To: ${contract.contractorName || 'The General Contractor'}`);
    lines.push(`PCAB License: ${contract.pcabLicense || 'N/A'}`);
    lines.push(`Project Reference: [${contract.id}] ${contract.name}`);
    lines.push(`Location: ${contract.location || 'N/A'}`);
    lines.push(`----------------------------------------------------------------------`);
    lines.push(`Upon official evaluation of your Construction Health and Safety Program (CSHP)`);
    lines.push(`submission pursuant to DOLE DO-13, the following personnel double-assignment`);
    lines.push(`conflicts were flagged in the safety monitoring registry:`);
    lines.push(``);

    if (analysis.officerConflicts.length > 0) {
      lines.push(`[SAFETY OFFICER CONFLICT DETECTED]`);
      lines.push(`Nominated Officer: ${contract.safetyOfficer?.name || 'N/A'} (${contract.safetyOfficer?.level || 'SO2'})`);
      lines.push(`Conflict: The above Safety Officer is currently actively deployed to:`);
      analysis.officerConflicts.forEach((c, idx) => {
        lines.push(`  ${idx + 1}. Contract ID: ${c.id}`);
        lines.push(`     Project: ${c.name}`);
        lines.push(`     Contractor: ${c.contractorName}`);
        lines.push(`     Status: ${c.status}`);
      });
      lines.push(`Action Required: Please submit an accredited replacement Safety Officer`);
      lines.push(`who is not currently dedicated to another ongoing construction project.`);
      lines.push(``);
    }

    if (analysis.firstAiderConflicts.length > 0) {
      lines.push(`[FIRST AIDER CONFLICT DETECTED]`);
      lines.push(`Nominated First Aider: ${contract.firstAider?.name || 'N/A'}`);
      lines.push(`Conflict: The above certified First Aider is currently deployed to:`);
      analysis.firstAiderConflicts.forEach((c, idx) => {
        lines.push(`  ${idx + 1}. Contract ID: ${c.id}`);
        lines.push(`     Project: ${c.name}`);
        lines.push(`     Contractor: ${c.contractorName}`);
        lines.push(`     Status: ${c.status}`);
      });
      lines.push(`Action Required: Please assign an alternative certified First Aider.`);
      lines.push(``);
    }

    if (analysis.dualRoleConflict) {
      lines.push(`[DUAL ROLE VIOLATION]`);
      lines.push(`Details: ${analysis.dualRoleConflict.message}`);
      lines.push(`Action Required: Safety Officer and First Aider duties must be assigned to separate personnel.`);
      lines.push(``);
    }

    lines.push(`----------------------------------------------------------------------`);
    lines.push(`Please furnish the revised CSHP personnel roster along with valid certifications`);
    lines.push(`within five (5) working days to avoid delays in CSHP concurrence/endorsement.`);
    lines.push(`Evaluated by: Safety & Health Program Oversight Officer`);

    return lines.join('\n');
  }
}
