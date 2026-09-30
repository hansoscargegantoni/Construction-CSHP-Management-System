/**
 * CSHP System Configuration & Standards
 * Construction Health and Safety Program (DOLE DO-13 Standards)
 */

export const CSHP_CONFIG = {
  APP_NAME: 'CSHP SafetyHub',
  APP_TAGLINE: 'Construction Health & Safety Program Management & Conflict Detection System',
  STORAGE_KEY: 'cshp_contracts_data_v1',
  
  // Project Statuses
  STATUS_OPTIONS: [
    { value: 'Active', label: 'Active / Ongoing', color: 'success', activeForConflict: true },
    { value: 'Under Review', label: 'Under Review / Pending', color: 'warning', activeForConflict: true },
    { value: 'Completed', label: 'Completed', color: 'neutral', activeForConflict: false },
    { value: 'Suspended', label: 'Suspended / On-Hold', color: 'danger', activeForConflict: false }
  ],

  // Safety Officer Accreditations (DOLE OSH Standards)
  SO_LEVELS: [
    { value: 'SO1', label: 'Safety Officer 1 (SO1 - Low Risk / BOSH)' },
    { value: 'SO2', label: 'Safety Officer 2 (SO2 - Medium Risk / BOSH+COSH)' },
    { value: 'SO3', label: 'Safety Officer 3 (SO3 - High Risk / Accredited OSH Practitioner)' },
    { value: 'SO4', label: 'Safety Officer 4 (SO4 - OSH Consultant / Master)' }
  ],

  // PCAB License Categories
  PCAB_CATEGORIES: [
    'AAAA (Quadruple A)',
    'AAA (Triple A)',
    'AA (Double A)',
    'Category A',
    'Category B',
    'Category C',
    'Category D',
    'Trade / Small B'
  ]
};
