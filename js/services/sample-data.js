/**
 * Realistic Sample Data for Construction Health & Safety Program (CSHP)
 * Demonstrating clean assignments, multiple active contracts, and intentional
 * personnel assignment conflicts for evaluators to test.
 */

export const INITIAL_CONTRACTS = [
  {
    id: "24-INFRA-0104",
    name: "Construction of 4-Storey Disaster Evacuation Center & Multi-Purpose Facility",
    location: "Brgy. Dela Paz, Pasig City, Metro Manila",
    contractorName: "PrimeAsia Builders & Infrastructure Corp.",
    pcabLicense: "38912-AAAA",
    pcabCategory: "AAAA (Quadruple A)",
    safetyOfficer: {
      name: "Engr. Ricardo Mendoza",
      level: "SO3",
      accreditationNo: "DOLE-NCR-OSH-2023-7721",
      contact: "0917-555-0192"
    },
    firstAider: {
      name: "Ma. Elena D. Bautista, RN",
      certificateNo: "PRC-FA-2023-8819",
      contact: "0920-555-4321"
    },
    startDate: "2026-02-01",
    targetCompletionDate: "2026-12-15",
    estimatedWorkers: 85,
    status: "Active",
    remarks: "CSHP approved with DOLE-NCR Concurrence. Standard monthly safety reporting active."
  },
  {
    id: "24-BLDG-0218",
    name: "Expansion and Structural Retrofitting of East Medical Center Wing B",
    location: "Ortigas Avenue Extension, Cainta, Rizal",
    contractorName: "MegaSummit Engineering & Development",
    pcabLicense: "42109-AAA",
    pcabCategory: "AAA (Triple A)",
    safetyOfficer: {
      name: "Engr. Ricardo Mendoza", // INTENTIONAL CONFLICT: Already assigned to 24-INFRA-0104
      level: "SO3",
      accreditationNo: "DOLE-NCR-OSH-2023-7721",
      contact: "0917-555-0192"
    },
    firstAider: {
      name: "Jonald P. Cortez",
      certificateNo: "PRC-FA-2024-3104",
      contact: "0927-444-8833"
    },
    startDate: "2026-03-10",
    targetCompletionDate: "2026-10-30",
    estimatedWorkers: 60,
    status: "Under Review",
    remarks: "CSHP pending approval. Contractor needs to address Safety Officer double-assignment notice."
  },
  {
    id: "24-RD-0055",
    name: "Widening and Drainage Improvement of Bypass Highway Section 3",
    location: "City of San Fernando, Pampanga",
    contractorName: "Archway Horizon Constructors Inc.",
    pcabLicense: "29871-A",
    pcabCategory: "Category A",
    safetyOfficer: {
      name: "Archt. Fernando Gomez",
      level: "SO2",
      accreditationNo: "DOLE-RO3-COSH-2024-1102",
      contact: "0918-333-2211"
    },
    firstAider: {
      name: "Ma. Elena D. Bautista, RN", // INTENTIONAL CONFLICT: Already assigned to 24-INFRA-0104
      certificateNo: "PRC-FA-2023-8819",
      contact: "0920-555-4321"
    },
    startDate: "2026-01-15",
    targetCompletionDate: "2026-08-30",
    estimatedWorkers: 40,
    status: "Active",
    remarks: "First Aider is concurrently deployed to another active site. Replacement requested."
  },
  {
    id: "24-SCH-0312",
    name: "Construction of 2-Storey 8-Classroom Public Integrated High School",
    location: "Brgy. Santa Cruz, Antipolo City, Rizal",
    contractorName: "Vanguard Built Environment Partners",
    pcabLicense: "51230-B",
    pcabCategory: "Category B",
    safetyOfficer: {
      name: "Mark Anthony Villanueva",
      level: "SO2",
      accreditationNo: "DOLE-RO4A-2022-9014",
      contact: "0915-777-9900"
    },
    firstAider: {
      name: "Sarah Jane Perez",
      certificateNo: "PRC-FA-2024-5591",
      contact: "0922-888-1234"
    },
    startDate: "2026-02-20",
    targetCompletionDate: "2026-09-15",
    estimatedWorkers: 32,
    status: "Active",
    remarks: "Clean deployment. Site safety committee established and compliant."
  },
  {
    id: "23-FL-0881",
    name: "Slope Protection and Riverbank Revetment Project Phase 1",
    location: "Marikina Riverbank, Marikina City",
    contractorName: "PrimeAsia Builders & Infrastructure Corp.",
    pcabLicense: "38912-AAAA",
    pcabCategory: "AAAA (Quadruple A)",
    safetyOfficer: {
      name: "Engr. Ricardo Mendoza", // NOT A CONFLICT because this contract is Completed!
      level: "SO3",
      accreditationNo: "DOLE-NCR-OSH-2023-7721",
      contact: "0917-555-0192"
    },
    firstAider: {
      name: "Carlo Magno Cruz",
      certificateNo: "PRC-FA-2021-4412",
      contact: "0919-222-3344"
    },
    startDate: "2025-04-01",
    targetCompletionDate: "2025-11-28",
    estimatedWorkers: 50,
    status: "Completed",
    remarks: "Project finalized and safety close-out report submitted without lost-time incidents."
  }
];
