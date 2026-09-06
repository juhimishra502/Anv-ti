import type { PropertyRecord } from "./types";

// Synthetic ward used for the "Load sample ward" demo. Fictional addresses.
// Seeded with a realistic spread: clean properties + several material leaks
// (under-declared floors/area, usage misclassification, stale assessments,
// active buildings with no tax record).
export const SAMPLE_WARD_NAME = "Ward 17, Shivaji Nagar (demo)";

export const sampleWard: PropertyRecord[] = [
  // --- Clean / correctly assessed ---
  { id: "P-1001", address: "12 Tilak Marg", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1400, annualValueDeclared: 96000, taxPaidLastYear: 14400, yearsSinceAssessment: 2, floorsObserved: 2, builtUpAreaObservedSqft: 1400, usageObserved: "Residential" },
  { id: "P-1002", address: "7 Nehru Lane", usageDeclared: "Residential", floorsDeclared: 1, builtUpAreaDeclaredSqft: 850, annualValueDeclared: 54000, taxPaidLastYear: 8100, yearsSinceAssessment: 3, floorsObserved: 1, builtUpAreaObservedSqft: 850, usageObserved: "Residential" },
  { id: "P-1003", address: "22 Gandhi Chowk", usageDeclared: "Commercial", floorsDeclared: 3, builtUpAreaDeclaredSqft: 3200, annualValueDeclared: 420000, taxPaidLastYear: 84000, yearsSinceAssessment: 1, floorsObserved: 3, builtUpAreaObservedSqft: 3200, usageObserved: "Commercial" },
  { id: "P-1004", address: "5 Rose Villa, Park Road", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1650, annualValueDeclared: 108000, taxPaidLastYear: 16200, yearsSinceAssessment: 2, floorsObserved: 2, builtUpAreaObservedSqft: 1650, usageObserved: "Residential" },
  { id: "P-1005", address: "31 Station Road", usageDeclared: "Mixed", floorsDeclared: 3, builtUpAreaDeclaredSqft: 2800, annualValueDeclared: 240000, taxPaidLastYear: 43200, yearsSinceAssessment: 2, floorsObserved: 3, builtUpAreaObservedSqft: 2800, usageObserved: "Mixed" },

  // --- Under-declared floors (vertical growth not reassessed) ---
  { id: "P-1006", address: "48 Market Street", usageDeclared: "Commercial", floorsDeclared: 2, builtUpAreaDeclaredSqft: 2000, annualValueDeclared: 260000, taxPaidLastYear: 52000, yearsSinceAssessment: 6, floorsObserved: 4, builtUpAreaObservedSqft: 4100, usageObserved: "Commercial", observationNote: "Imagery shows 4 storeys; two upper floors let out to offices." },
  { id: "P-1007", address: "9 Green Enclave", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1500, annualValueDeclared: 102000, taxPaidLastYear: 15300, yearsSinceAssessment: 7, floorsObserved: 3, builtUpAreaObservedSqft: 2300, usageObserved: "Residential", observationNote: "Third floor added ~2021; separate electricity meter." },
  { id: "P-1008", address: "60 Old Mill Road", usageDeclared: "Mixed", floorsDeclared: 3, builtUpAreaDeclaredSqft: 3000, annualValueDeclared: 300000, taxPaidLastYear: 54000, yearsSinceAssessment: 8, floorsObserved: 5, builtUpAreaObservedSqft: 5400, usageObserved: "Mixed", observationNote: "Two floors added; upper floors residential rentals." },

  // --- Usage misclassification (residential rate on commercial use) ---
  { id: "P-1009", address: "3 Banyan Cross", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1800, annualValueDeclared: 120000, taxPaidLastYear: 18000, yearsSinceAssessment: 4, floorsObserved: 2, builtUpAreaObservedSqft: 1800, usageObserved: "Commercial", observationNote: "Ground floor is a running coaching centre; signage and footfall observed." },
  { id: "P-1010", address: "17 Lake View", usageDeclared: "Residential", floorsDeclared: 3, builtUpAreaDeclaredSqft: 2400, annualValueDeclared: 150000, taxPaidLastYear: 22500, yearsSinceAssessment: 5, floorsObserved: 3, builtUpAreaObservedSqft: 2400, usageObserved: "Mixed", observationNote: "Two floors converted to a guest house / short-stay." },
  { id: "P-1011", address: "88 Temple Road", usageDeclared: "Residential", floorsDeclared: 1, builtUpAreaDeclaredSqft: 1100, annualValueDeclared: 66000, taxPaidLastYear: 9900, yearsSinceAssessment: 6, floorsObserved: 2, builtUpAreaObservedSqft: 2200, usageObserved: "Commercial", observationNote: "Now a wholesale godown; heavy vehicle access." },

  // --- Stale assessment (long unrevised, value far below block norm) ---
  { id: "P-1012", address: "14 Fort Lane", usageDeclared: "Commercial", floorsDeclared: 2, builtUpAreaDeclaredSqft: 2100, annualValueDeclared: 90000, taxPaidLastYear: 18000, yearsSinceAssessment: 14, floorsObserved: 2, builtUpAreaObservedSqft: 2100, usageObserved: "Commercial", observationNote: "Prime market frontage; annual value unrevised since 2011." },
  { id: "P-1013", address: "26 Civil Lines", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 2000, annualValueDeclared: 60000, taxPaidLastYear: 9000, yearsSinceAssessment: 15, floorsObserved: 2, builtUpAreaObservedSqft: 2000, usageObserved: "Residential", observationNote: "Assessment predates the ring-road corridor uplift." },
  { id: "P-1014", address: "41 College Road", usageDeclared: "Commercial", floorsDeclared: 3, builtUpAreaDeclaredSqft: 3300, annualValueDeclared: 180000, taxPaidLastYear: 36000, yearsSinceAssessment: 12, floorsObserved: 3, builtUpAreaObservedSqft: 3300, usageObserved: "Commercial", observationNote: "Rents in this block roughly tripled since last revision." },

  // --- Active building, no / near-zero tax record ---
  { id: "P-1015", address: "2 Riverside Plot", usageDeclared: "Commercial", floorsDeclared: 3, builtUpAreaDeclaredSqft: 5000, annualValueDeclared: 600000, taxPaidLastYear: 0, yearsSinceAssessment: 3, floorsObserved: 3, builtUpAreaObservedSqft: 5000, usageObserved: "Commercial", observationNote: "Occupied showroom; assessed but zero collection recorded." },
  { id: "P-1016", address: "19 Industrial Estate", usageDeclared: "Industrial", floorsDeclared: 1, builtUpAreaDeclaredSqft: 8000, annualValueDeclared: 540000, taxPaidLastYear: 0, yearsSinceAssessment: 4, floorsObserved: 1, builtUpAreaObservedSqft: 8000, usageObserved: "Industrial", observationNote: "Running unit, high power load; no payment on record." },

  // --- Under-declared area only (extensions / setback encroachment) ---
  { id: "P-1017", address: "33 Ashok Nagar", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1400, annualValueDeclared: 90000, taxPaidLastYear: 13500, yearsSinceAssessment: 5, floorsObserved: 2, builtUpAreaObservedSqft: 2100, usageObserved: "Residential", observationNote: "Rear + setback extension; footprint ~50% larger than roll." },
  { id: "P-1018", address: "71 Sunrise Colony", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1600, annualValueDeclared: 96000, taxPaidLastYear: 14400, yearsSinceAssessment: 4, floorsObserved: 2, builtUpAreaObservedSqft: 2000, usageObserved: "Residential", observationNote: "Covered terrace + garage room added." },

  // --- More clean records (so the model must discriminate, not flag everything) ---
  { id: "P-1019", address: "6 Jasmine Court", usageDeclared: "Residential", floorsDeclared: 1, builtUpAreaDeclaredSqft: 900, annualValueDeclared: 60000, taxPaidLastYear: 9000, yearsSinceAssessment: 1, floorsObserved: 1, builtUpAreaObservedSqft: 900, usageObserved: "Residential" },
  { id: "P-1020", address: "50 Model Town", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1500, annualValueDeclared: 99000, taxPaidLastYear: 14850, yearsSinceAssessment: 2, floorsObserved: 2, builtUpAreaObservedSqft: 1500, usageObserved: "Residential" },
  { id: "P-1021", address: "8 Orchid Residency", usageDeclared: "Residential", floorsDeclared: 3, builtUpAreaDeclaredSqft: 2600, annualValueDeclared: 168000, taxPaidLastYear: 25200, yearsSinceAssessment: 3, floorsObserved: 3, builtUpAreaObservedSqft: 2600, usageObserved: "Residential" },
  { id: "P-1022", address: "44 Bazaar Road", usageDeclared: "Commercial", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1800, annualValueDeclared: 234000, taxPaidLastYear: 46800, yearsSinceAssessment: 2, floorsObserved: 2, builtUpAreaObservedSqft: 1800, usageObserved: "Commercial" },
  { id: "P-1023", address: "11 Maple Drive", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 1700, annualValueDeclared: 111000, taxPaidLastYear: 16650, yearsSinceAssessment: 1, floorsObserved: 2, builtUpAreaObservedSqft: 1700, usageObserved: "Residential" },
  { id: "P-1024", address: "27 Kamla Nehru Marg", usageDeclared: "Mixed", floorsDeclared: 4, builtUpAreaDeclaredSqft: 4200, annualValueDeclared: 420000, taxPaidLastYear: 75600, yearsSinceAssessment: 2, floorsObserved: 4, builtUpAreaObservedSqft: 4200, usageObserved: "Mixed" },
  { id: "P-1025", address: "63 Shanti Path", usageDeclared: "Residential", floorsDeclared: 1, builtUpAreaDeclaredSqft: 1000, annualValueDeclared: 66000, taxPaidLastYear: 9900, yearsSinceAssessment: 3, floorsObserved: 1, builtUpAreaObservedSqft: 1000, usageObserved: "Residential" },

  // --- Combined leak: under-declared floors AND usage shift (high value) ---
  { id: "P-1026", address: "1 Grand Junction", usageDeclared: "Residential", floorsDeclared: 2, builtUpAreaDeclaredSqft: 2000, annualValueDeclared: 132000, taxPaidLastYear: 19800, yearsSinceAssessment: 9, floorsObserved: 5, builtUpAreaObservedSqft: 6800, usageObserved: "Commercial", observationNote: "Now a 5-storey commercial complex with retail + offices; roll still shows a 2-storey house." },

  // --- Small stale residential (low recoverable — should rank low) ---
  { id: "P-1027", address: "38 Rani Bagh", usageDeclared: "Residential", floorsDeclared: 1, builtUpAreaDeclaredSqft: 800, annualValueDeclared: 45000, taxPaidLastYear: 6750, yearsSinceAssessment: 11, floorsObserved: 1, builtUpAreaObservedSqft: 800, usageObserved: "Residential", observationNote: "Modest single-floor home; assessment old but property small." },

  // --- Clean institutional (exempt-ish; should not be flagged as revenue leak) ---
  { id: "P-1028", address: "100 Vidya Marg", usageDeclared: "Institutional", floorsDeclared: 3, builtUpAreaDeclaredSqft: 6000, annualValueDeclared: 0, taxPaidLastYear: 0, yearsSinceAssessment: 4, floorsObserved: 3, builtUpAreaObservedSqft: 6000, usageObserved: "Institutional", observationNote: "Aided school; exempt category." },
];
