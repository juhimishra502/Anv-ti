// Per-asset-type sub-questionnaires (the asset wizard). Data-driven: each intake key
// (keyed to a service via lib/guidance/services.ts) lists its fields. A field's
// `target` says where its answer is persisted:
//   col:<name>  -> a typed assets column the engine reads (nominee_status, holding_mode,
//                  record_type, authority, scheme, institution)
//   loc:<name>  -> an asset_locations column (property location)
//   inst        -> the database-selected institution id (assets.institution_id)
//   (default)   -> assets.details_json (everything else the wizard collects)
//
// Labels are inline English (assistant/voice translate at runtime).

export type AFieldType =
  | "text" | "number" | "date" | "yesno" | "choice" | "value_band"
  | "state" | "district" | "subdistrict" | "institution";

export interface AChoice { value: string; label: string }

export interface AField {
  id: string;
  label: string;
  type: AFieldType;
  choices?: AChoice[];
  help?: string;
  /** Persistence target; omitted = details_json. */
  target?: string;
  /** For institution fields: the regulator category to search. */
  institutionCategory?: string;
  /** Parent state field id for a district/subdistrict field. */
  parentId?: string;
  showIf?: (a: Record<string, string | null | undefined>) => boolean;
}

const YES_NO: AChoice[] = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
const VALUE_BANDS: AChoice[] = [
  { value: "under_1l", label: "Under ₹1 lakh" },
  { value: "1l_5l", label: "₹1–5 lakh" },
  { value: "5l_25l", label: "₹5–25 lakh" },
  { value: "25l_1cr", label: "₹25 lakh – ₹1 crore" },
  { value: "over_1cr", label: "Over ₹1 crore" },
];
const NOMINEE: AChoice[] = [
  { value: "registered", label: "Nominee registered" },
  { value: "none", label: "No nominee" },
  { value: "unknown", label: "Not sure" },
];
const HOLDING: AChoice[] = [
  { value: "single", label: "Single holder" },
  { value: "joint", label: "Joint holding" },
];

// Shared building blocks.
const valueBand = (): AField => ({ id: "value_band", label: "Approximate value", type: "value_band", choices: VALUE_BANDS });
const nominee = (): AField => ({ id: "nominee_status", label: "Is a nominee registered?", type: "choice", choices: NOMINEE, target: "col:nominee_status" });
const holding = (): AField => ({ id: "holding_mode", label: "Sole or joint holding?", type: "choice", choices: HOLDING, target: "col:holding_mode" });
const minorClaimant = (): AField => ({ id: "minor_claimant", label: "Is any claimant a minor?", type: "yesno", choices: YES_NO });
const dispute = (): AField => ({ id: "dispute", label: "Is this asset disputed?", type: "yesno", choices: YES_NO });

export const ASSET_SCHEMAS: Record<string, AField[]> = {
  // ---- PROPERTY ----
  property: [
    { id: "state_code", label: "State/UT where the property is", type: "state", target: "loc:state_code" },
    { id: "district", label: "District (property location)", type: "district", parentId: "state_code", target: "loc:district" },
    { id: "subdistrict", label: "Tehsil / taluk / subdistrict", type: "subdistrict", parentId: "district", target: "loc:tehsil_taluk" },
    { id: "village_ward", label: "Village, ward or local body", type: "text", target: "loc:village_ward" },
    { id: "urban_rural", label: "Urban or rural?", type: "choice", choices: [{ value: "urban", label: "Urban" }, { value: "rural", label: "Rural" }] },
    { id: "record_type", label: "What kind of property record is this?", type: "choice", target: "col:record_type", choices: [
      { value: "revenue_land", label: "Agricultural / revenue land" },
      { value: "municipal_tax", label: "Municipal property (tax record)" },
      { value: "apartment_flat", label: "Apartment / flat" },
      { value: "cooperative_society", label: "Cooperative society" },
      { value: "development_authority", label: "Development-authority property" },
      { value: "leasehold", label: "Leasehold" },
      { value: "cantonment", label: "Cantonment property" },
    ] },
    { id: "record_doc", label: "Which record document exists?", type: "choice", choices: [
      { value: "property_card", label: "Property card" },
      { value: "patta", label: "Patta" },
      { value: "khata", label: "Khata" },
      { value: "rtc", label: "RTC" },
      { value: "khatauni", label: "Khatauni" },
      { value: "none", label: "None / not sure" },
    ] },
    { id: "identifier", label: "Survey / khasra / plot / property number", type: "text", target: "loc:property_identifier" },
    { id: "ownership", label: "Sole or joint ownership?", type: "choice", choices: [{ value: "sole", label: "Sole" }, { value: "joint", label: "Joint" }] },
    { id: "title_document", label: "Is a title document (sale deed / gift / will) available?", type: "yesno", choices: YES_NO },
    { id: "mortgage", label: "Is the property mortgaged / pledged?", type: "yesno", choices: YES_NO },
    { id: "tenancy", label: "Is it tenanted / occupied by others?", type: "yesno", choices: YES_NO },
    { id: "litigation", label: "Is there litigation over this property?", type: "yesno", choices: YES_NO },
  ],

  // ---- BANK / FD ----
  bank: [
    { id: "institution", label: "Bank", type: "institution", institutionCategory: "bank", target: "inst" },
    { id: "branch", label: "Branch / IFSC (if known)", type: "text" },
    { id: "account_type", label: "Account type", type: "choice", choices: [
      { value: "savings", label: "Savings" }, { value: "current", label: "Current" }, { value: "fd", label: "Fixed deposit" }, { value: "rd", label: "Recurring deposit" },
    ] },
    nominee(),
    holding(),
    { id: "survivorship_mandate", label: "Is there a survivorship mandate (E or S / F or S)?", type: "yesno", choices: YES_NO, showIf: (a) => a.holding_mode === "joint" },
    valueBand(),
    { id: "passbook", label: "Do you have the passbook / FD receipt?", type: "yesno", choices: YES_NO },
    minorClaimant(),
    dispute(),
  ],

  // ---- DEMAT / SHARES / ETF / BONDS ----
  demat: [
    { id: "depository", label: "Depository", type: "choice", choices: [{ value: "nsdl", label: "NSDL" }, { value: "cdsl", label: "CDSL" }], target: "col:authority" },
    { id: "institution", label: "Depository participant (DP)", type: "institution", institutionCategory: "depository", target: "inst" },
    { id: "dp_id", label: "DP ID", type: "text" },
    { id: "client_id", label: "Client ID", type: "text" },
    { id: "issuer", label: "Issuer (company/fund)", type: "text" },
    { id: "rta", label: "Registrar & transfer agent (RTA)", type: "institution", institutionCategory: "rta" },
    { id: "form", label: "Physical or demat?", type: "choice", choices: [{ value: "demat", label: "Demat" }, { value: "physical", label: "Physical" }], target: "col:holding_mode" },
    { id: "listing", label: "Listed or unlisted?", type: "choice", choices: [{ value: "listed", label: "Listed" }, { value: "unlisted", label: "Unlisted" }] },
    nominee(),
    { id: "joint_holding", label: "Joint holding?", type: "yesno", choices: YES_NO },
    valueBand(),
    minorClaimant(),
    { id: "non_resident_heir", label: "Is any heir a non-resident?", type: "yesno", choices: YES_NO },
  ],

  // ---- MUTUAL FUNDS ----
  mutual_fund: [
    { id: "institution", label: "AMC / mutual fund", type: "institution", institutionCategory: "amc", target: "inst" },
    { id: "rta", label: "RTA (CAMS / KFintech)", type: "institution", institutionCategory: "rta" },
    { id: "folio", label: "Folio number", type: "text" },
    nominee(),
    { id: "joint_holding", label: "Joint holding?", type: "yesno", choices: YES_NO, target: "col:holding_mode" },
    valueBand(),
    { id: "claimant_structure", label: "Claimant", type: "choice", choices: [
      { value: "nominee", label: "Nominee" }, { value: "joint_holder", label: "Surviving joint holder" }, { value: "legal_heir", label: "Legal heir(s)" },
    ] },
  ],

  // ---- INSURANCE ----
  insurance: [
    { id: "institution", label: "Insurer", type: "institution", institutionCategory: "insurer", target: "inst" },
    { id: "policy_type", label: "Policy type", type: "choice", choices: [
      { value: "term", label: "Term" }, { value: "endowment", label: "Endowment" }, { value: "ulip", label: "ULIP" }, { value: "money_back", label: "Money-back" }, { value: "other", label: "Other" },
    ] },
    { id: "policy_number", label: "Policy number", type: "text" },
    { id: "nominee_status", label: "Is a nominee named?", type: "choice", choices: NOMINEE, target: "col:nominee_status" },
    { id: "assignee", label: "Is the policy assigned to anyone (e.g. a bank)?", type: "yesno", choices: YES_NO },
    { id: "policy_status", label: "Policy status", type: "choice", choices: [
      { value: "in_force", label: "In force" }, { value: "lapsed", label: "Lapsed" }, { value: "matured", label: "Matured" }, { value: "unknown", label: "Not sure" },
    ], target: "col:scheme" },
    { id: "death_nature", label: "Nature of death", type: "choice", choices: [{ value: "natural", label: "Natural" }, { value: "accidental", label: "Accidental" }] },
    { id: "original_policy", label: "Is the original policy document available?", type: "yesno", choices: YES_NO },
  ],

  // ---- EPF / EPS / EDLI ----
  epfo: [
    { id: "uan", label: "UAN (Universal Account Number)", type: "text" },
    { id: "employer", label: "Employer / establishment", type: "text" },
    { id: "nominee_status", label: "Is an EPF nomination registered?", type: "choice", choices: NOMINEE, target: "col:nominee_status" },
    { id: "employment_status", label: "Employment status at death", type: "choice", choices: [
      { value: "in_service", label: "In service" }, { value: "retired", label: "Retired" }, { value: "left_service", label: "Left service" },
    ], target: "col:scheme" },
    { id: "spouse", label: "Is there a surviving spouse?", type: "yesno", choices: YES_NO },
    { id: "children", label: "Are there children (for EPS/EDLI)?", type: "yesno", choices: YES_NO },
    { id: "dependent_parents", label: "Are there dependent parents?", type: "yesno", choices: YES_NO },
    { id: "pension_status", label: "Was a pension already being drawn?", type: "yesno", choices: YES_NO },
  ],

  // ---- NPS ----
  nps: [
    { id: "pran", label: "PRAN", type: "text" },
    { id: "sector", label: "NPS sector", type: "choice", choices: [
      { value: "government", label: "Government" }, { value: "all_citizen", label: "All-citizen" }, { value: "corporate", label: "Corporate" },
    ], target: "col:scheme" },
    { id: "institution", label: "CRA / intermediary", type: "institution", institutionCategory: "nps", target: "inst" },
    { id: "nominee_status", label: "Is a nominee registered?", type: "choice", choices: NOMINEE, target: "col:nominee_status" },
    { id: "annuity_status", label: "Annuity", type: "choice", choices: [
      { value: "not_started", label: "Not started" }, { value: "in_payment", label: "Already in payment" },
    ] },
  ],

  // ---- Smaller / template-first schemas ----
  post_office: [
    { id: "scheme", label: "Post-office scheme", type: "choice", target: "col:scheme", choices: [
      { value: "savings", label: "Savings account" }, { value: "mis", label: "MIS" }, { value: "scss", label: "SCSS" }, { value: "nsc", label: "NSC" }, { value: "kvp", label: "KVP" }, { value: "td", label: "Time deposit" }, { value: "other", label: "Other" },
    ] },
    { id: "office", label: "Post office (branch)", type: "text" },
    nominee(), valueBand(),
  ],
  ppf: [
    { id: "operator", label: "Where is the PPF held?", type: "choice", choices: [{ value: "post_office", label: "Post office" }, { value: "bank", label: "Bank" }] },
    { id: "institution", label: "Bank (if held at a bank)", type: "institution", institutionCategory: "bank", target: "inst", showIf: (a) => a.operator === "bank" },
    nominee(), valueBand(),
  ],
  gsec: [
    { id: "holding_form", label: "How is it held?", type: "choice", choices: [{ value: "rbi_retail_direct", label: "RBI Retail Direct" }, { value: "demat", label: "Demat" }, { value: "physical", label: "Physical" }], target: "col:holding_mode" },
    nominee(), valueBand(),
  ],
  sgb: [
    { id: "holding_form", label: "How is the SGB held?", type: "choice", choices: [{ value: "demat", label: "Demat" }, { value: "rbi_retail_direct", label: "RBI Retail Direct" }, { value: "physical", label: "Physical certificate" }], target: "col:holding_mode" },
    { id: "institution", label: "Depository participant (if demat)", type: "institution", institutionCategory: "depository", target: "inst", showIf: (a) => a.holding_form === "demat" },
    nominee(), valueBand(),
  ],
  corporate_bond: [
    { id: "holding_form", label: "Physical or demat?", type: "choice", choices: [{ value: "demat", label: "Demat" }, { value: "physical", label: "Physical" }], target: "col:holding_mode" },
    { id: "institution", label: "Depository participant (if demat)", type: "institution", institutionCategory: "depository", target: "inst", showIf: (a) => a.holding_form === "demat" },
    { id: "issuer", label: "Issuer", type: "text" },
    { id: "rta", label: "RTA", type: "institution", institutionCategory: "rta" },
    nominee(), valueBand(),
  ],
  locker: [
    { id: "institution", label: "Bank", type: "institution", institutionCategory: "bank", target: "inst" },
    { id: "branch", label: "Branch", type: "text" },
    nominee(),
    { id: "joint_hirer", label: "Was the locker jointly hired?", type: "yesno", choices: YES_NO, target: "col:holding_mode" },
  ],
  unclaimed: [
    { id: "kind", label: "What kind of unclaimed asset?", type: "choice", choices: [
      { value: "bank_deposit", label: "Unclaimed bank deposit (DEA/UDGAM)" }, { value: "shares_dividend", label: "Shares/dividends (IEPF)" }, { value: "insurance", label: "Unclaimed insurance" }, { value: "other", label: "Other" },
    ] },
    { id: "institution", label: "Institution (if known)", type: "institution", institutionCategory: "bank", target: "inst", showIf: (a) => a.kind === "bank_deposit" },
    valueBand(),
  ],
  vehicle: [
    { id: "state_code", label: "State where registered", type: "state", target: "loc:state_code" },
    { id: "rto", label: "RTO / registration number", type: "text" },
    { id: "vehicle_type", label: "Vehicle type", type: "choice", choices: [{ value: "two_wheeler", label: "Two-wheeler" }, { value: "car", label: "Car" }, { value: "commercial", label: "Commercial" }] },
    nominee(),
    { id: "loan", label: "Is there a vehicle loan / hypothecation?", type: "yesno", choices: YES_NO },
  ],
  gratuity: [
    { id: "employer", label: "Employer", type: "text" },
    { id: "employer_type", label: "Employer type", type: "choice", choices: [{ value: "private", label: "Private (Gratuity Act)" }, { value: "government", label: "Government / PSU" }] },
    { id: "nominee_status", label: "Is a gratuity nomination (Form F) registered?", type: "choice", choices: NOMINEE, target: "col:nominee_status" },
  ],
  family_pension: [
    { id: "pension_type", label: "Pension type", type: "choice", choices: [{ value: "eps", label: "EPS (EPFO)" }, { value: "government", label: "Government service" }, { value: "employer", label: "Other employer" }], target: "col:scheme" },
    { id: "eligible_member", label: "Eligible family member", type: "choice", choices: [{ value: "spouse", label: "Spouse" }, { value: "child", label: "Child" }, { value: "dependent_parent", label: "Dependent parent" }] },
  ],
  sole_proprietorship: [
    { id: "business_name", label: "Business name", type: "text" },
    { id: "gst_registered", label: "Is the business GST-registered?", type: "yesno", choices: YES_NO },
    { id: "continue", label: "Will the business continue?", type: "yesno", choices: YES_NO },
    { id: "licences", label: "Other licences (trade / FSSAI / shops & establishment)?", type: "text" },
  ],
  partnership: [
    { id: "firm_name", label: "Firm name", type: "text" },
    { id: "registered", label: "Is the firm registered with a Registrar of Firms?", type: "yesno", choices: YES_NO },
    { id: "deed", label: "Is the partnership deed available?", type: "yesno", choices: YES_NO },
    { id: "continue", label: "Will the firm continue after the death?", type: "yesno", choices: YES_NO },
  ],
  llp: [
    { id: "llp_name", label: "LLP name", type: "text" },
    { id: "llpin", label: "LLPIN", type: "text" },
    { id: "agreement", label: "Is the LLP agreement available?", type: "yesno", choices: YES_NO },
  ],
  private_company: [
    { id: "company_name", label: "Company name", type: "text" },
    { id: "cin", label: "CIN", type: "text" },
    { id: "rta", label: "RTA (if any)", type: "institution", institutionCategory: "rta" },
    { id: "holding_form", label: "Physical or demat shares?", type: "choice", choices: [{ value: "physical", label: "Physical" }, { value: "demat", label: "Demat" }], target: "col:holding_mode" },
    nominee(),
  ],
  unlisted_shares: [
    { id: "company_name", label: "Company name", type: "text" },
    { id: "holding_form", label: "Physical or demat?", type: "choice", choices: [{ value: "physical", label: "Physical" }, { value: "demat", label: "Demat" }], target: "col:holding_mode" },
    { id: "rta", label: "RTA (if any)", type: "institution", institutionCategory: "rta" },
    nominee(),
  ],
  employer_benefit: [
    { id: "employer", label: "Employer", type: "text" },
    { id: "benefit_type", label: "Benefit type", type: "text", help: "e.g. leave encashment, group insurance, superannuation" },
  ],
  overseas: [
    { id: "country", label: "Country where the asset is held", type: "text" },
    { id: "asset_kind", label: "Asset kind", type: "text", help: "e.g. bank account, property, brokerage" },
  ],
  digital: [
    { id: "platform", label: "Platform / service", type: "text" },
    { id: "account_kind", label: "Account kind", type: "choice", choices: [{ value: "email", label: "Email" }, { value: "social", label: "Social media" }, { value: "cloud", label: "Cloud storage" }, { value: "domain", label: "Domain" }, { value: "other", label: "Other" }] },
    { id: "legacy_contact", label: "Was a legacy contact / nominee set on the platform?", type: "yesno", choices: YES_NO },
  ],
  crypto: [
    { id: "custody", label: "Where is it held?", type: "choice", choices: [{ value: "exchange", label: "Exchange" }, { value: "self_custody", label: "Self-custody wallet" }] },
    { id: "exchange", label: "Exchange (if applicable)", type: "text", showIf: (a) => a.custody === "exchange" },
    { id: "access", label: "Are keys / recovery details accessible?", type: "yesno", choices: YES_NO },
  ],
  liability: [
    { id: "liability_type", label: "Liability type", type: "choice", choices: [
      { value: "home_loan", label: "Home loan" }, { value: "personal_loan", label: "Personal loan" }, { value: "credit_card", label: "Credit card" }, { value: "tax", label: "Tax" }, { value: "other", label: "Other" },
    ] },
    { id: "institution", label: "Lender (if a loan)", type: "institution", institutionCategory: "bank", target: "inst", showIf: (a) => a.liability_type === "home_loan" || a.liability_type === "personal_loan" },
    { id: "secured", label: "Is the debt secured against an asset?", type: "yesno", choices: YES_NO },
    valueBand(),
  ],
};

export function assetSchema(intakeKey: string | null | undefined): AField[] {
  return (intakeKey && ASSET_SCHEMAS[intakeKey]) || [];
}
