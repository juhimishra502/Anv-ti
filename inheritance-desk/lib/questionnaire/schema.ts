// Versioned, schema-driven conditional questionnaire. Replaces the short static
// QUESTIONS array. Fields are grouped into sections and shown conditionally via
// `showIf`. Labels are inline English (the app's chrome-fallback model: assistant
// and voice translate at runtime; we do not ship unreviewed legal-chrome strings).
//
// `mapsTo` links a field to an existing `deceased` column so the grounded engine
// keeps working unchanged; every answer (mapped or not) is also persisted as JSON
// with the schema + answer version, so a roadmap records exactly what generated it.

export const QUESTIONNAIRE_VERSION = "2026-09-05.1";

export type QSection = "death" | "legal" | "heirs" | "estate";

export type QType = "text" | "date" | "yesno" | "choice" | "state" | "district" | "number";

/** Deceased columns the engine already reads. Mapping keeps engine compatibility. */
export type DeceasedColumn =
  | "full_name" | "residence_state" | "residence_district" | "death_state" | "death_district"
  | "death_date" | "death_registered" | "death_certificate" | "certificate_copies"
  | "will_status" | "will_registered" | "executor_present" | "probate_status"
  | "dispute_status" | "applicant_relationship" | "nri_status";

export interface QChoice {
  value: string;
  label: string;
}

export interface QField {
  id: string;
  section: QSection;
  label: string;
  help?: string;
  type: QType;
  choices?: QChoice[];
  allowUnknown?: boolean;
  /** Parent-state answer id for a district field. */
  parentStateId?: string;
  /** Only shown when this predicate passes. Pure function of collected answers. */
  showIf?: (a: QAnswers) => boolean;
  /** Persist into this deceased column (in addition to answers_json). */
  mapsTo?: DeceasedColumn;
}

export type QAnswers = Record<string, string | null | undefined>;

const YES_NO: QChoice[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Convenience predicates.
const isYes = (a: QAnswers, id: string) => a[id] === "yes";
const willExists = (a: QAnswers) => a.will === "exists";

export const SECTIONS: { id: QSection; title: string }[] = [
  { id: "death", title: "The death" },
  { id: "legal", title: "Legal context" },
  { id: "heirs", title: "The heirs" },
  { id: "estate", title: "The estate" },
];

export const QUESTIONNAIRE: QField[] = [
  // ---- DEATH ----------------------------------------------------------------
  { id: "full_name", section: "death", label: "Full name of the person who died", type: "text", mapsTo: "full_name" },
  { id: "date_of_death", section: "death", label: "Date of death", type: "date", allowUnknown: true, mapsTo: "death_date" },
  {
    id: "place_type_of_death", section: "death", label: "Where did the death occur?", type: "choice", allowUnknown: true,
    choices: [
      { value: "home", label: "At home" },
      { value: "hospital", label: "Hospital / institution" },
      { value: "other", label: "Other place" },
    ],
  },
  { id: "death_state", section: "death", label: "State/UT where the death occurred", type: "state", allowUnknown: true, mapsTo: "death_state" },
  { id: "death_district", section: "death", label: "District where the death occurred", type: "district", parentStateId: "death_state", allowUnknown: true, mapsTo: "death_district" },
  { id: "death_outside_india", section: "death", label: "Did the death occur outside India?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "death_registered", section: "death", label: "Has the death been registered?", type: "yesno", choices: YES_NO, allowUnknown: true, mapsTo: "death_registered" },
  {
    id: "delayed_registration", section: "death",
    label: "Was registration delayed beyond the normal 21-day period?",
    help: "Delayed registration usually needs an order permitting late entry.",
    type: "yesno", choices: YES_NO, allowUnknown: true,
    showIf: (a) => a.death_registered === "no",
  },
  {
    id: "death_certificate", section: "death", label: "Do you have the death certificate?", type: "choice", allowUnknown: true, mapsTo: "death_certificate",
    choices: [
      { value: "available", label: "Yes, I have it" },
      { value: "not_available", label: "Not yet" },
    ],
  },
  {
    id: "certificate_copies", section: "death", label: "How many certified copies do you have?", type: "number", allowUnknown: true, mapsTo: "certificate_copies",
    showIf: (a) => a.death_certificate === "available",
  },

  // ---- LEGAL CONTEXT --------------------------------------------------------
  { id: "last_residence_state", section: "legal", label: "State/UT of last ordinary residence", type: "state", allowUnknown: true, mapsTo: "residence_state" },
  { id: "last_residence_district", section: "legal", label: "District of last ordinary residence", type: "district", parentStateId: "last_residence_state", allowUnknown: true, mapsTo: "residence_district" },
  {
    id: "religion_succession", section: "legal",
    label: "Which succession law is likely to apply?",
    help: "This routes only orientation; a qualified review confirms the applicable law.",
    type: "choice", allowUnknown: true,
    choices: [
      { value: "hindu", label: "Hindu / Buddhist / Jain / Sikh (Hindu Succession Act)" },
      { value: "muslim", label: "Muslim (personal law)" },
      { value: "christian_parsi_other", label: "Christian / Parsi / other (Indian Succession Act)" },
    ],
  },
  {
    id: "will", section: "legal", label: "Did the person leave a will?", type: "choice", allowUnknown: true, mapsTo: "will_status",
    choices: [
      { value: "exists", label: "Yes, there is a will" },
      { value: "none", label: "No will" },
    ],
  },
  { id: "will_original_available", section: "legal", label: "Is the original will available?", type: "yesno", choices: YES_NO, allowUnknown: true, showIf: willExists },
  { id: "registered_will", section: "legal", label: "Is the will registered?", type: "yesno", choices: YES_NO, allowUnknown: true, mapsTo: "will_registered", showIf: willExists },
  { id: "executor", section: "legal", label: "Does the will name an executor?", type: "yesno", choices: YES_NO, allowUnknown: true, mapsTo: "executor_present", showIf: willExists },
  { id: "executor_available", section: "legal", label: "Is the named executor able and willing to act?", type: "yesno", choices: YES_NO, allowUnknown: true, showIf: (a) => willExists(a) && isYes(a, "executor") },
  { id: "witnesses", section: "legal", label: "Are the will's witnesses available?", type: "yesno", choices: YES_NO, allowUnknown: true, showIf: willExists },
  { id: "probate", section: "legal", label: "Has probate been obtained or applied for?", type: "yesno", choices: YES_NO, allowUnknown: true, mapsTo: "probate_status" },
  { id: "letters_of_administration", section: "legal", label: "Have letters of administration been obtained or applied for?", type: "yesno", choices: YES_NO, allowUnknown: true, showIf: (a) => a.will !== "exists" },
  { id: "succession_certificate", section: "legal", label: "Do you have (or need) a succession certificate?", type: "choice", allowUnknown: true,
    choices: [{ value: "have", label: "Have one" }, { value: "need", label: "Likely need one" }, { value: "no", label: "Not needed" }] },
  { id: "family_settlement", section: "legal", label: "Is there a family settlement / partition arrangement?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "court_proceeding", section: "legal", label: "Is any court proceeding about the estate underway?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "dispute", section: "legal", label: "Is there a dispute among heirs?", type: "yesno", choices: YES_NO, allowUnknown: true, mapsTo: "dispute_status" },
  { id: "objection", section: "legal", label: "Has anyone raised an objection to a claim?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "missing_heir", section: "legal", label: "Is any heir missing or untraceable?", type: "yesno", choices: YES_NO, allowUnknown: true },

  // ---- HEIRS ----------------------------------------------------------------
  { id: "applicant_relationship", section: "heirs", label: "Your relationship to the person who died", type: "text", allowUnknown: true, mapsTo: "applicant_relationship" },
  { id: "spouse", section: "heirs", label: "Is there a surviving spouse?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "sons_daughters", section: "heirs", label: "Are there surviving sons or daughters?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "predeceased_children", section: "heirs", label: "Did any child die before the deceased?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "descendants_of_predeceased", section: "heirs", label: "Do any predeceased children have surviving children?", type: "yesno", choices: YES_NO, allowUnknown: true, showIf: (a) => isYes(a, "predeceased_children") },
  { id: "parents", section: "heirs", label: "Are either of the deceased's parents surviving?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "other_heirs", section: "heirs", label: "Are there other potentially applicable heirs (siblings, etc.)?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "minors", section: "heirs", label: "Is any heir a minor (under 18)?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "minor_guardian", section: "heirs", label: "Is a natural/legal guardian available for the minor heir(s)?", type: "yesno", choices: YES_NO, allowUnknown: true, showIf: (a) => isYes(a, "minors") },
  { id: "dependants", section: "heirs", label: "Are there dependants (financially dependent on the deceased)?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "heirs_with_disabilities", section: "heirs", label: "Does any heir have a disability affecting capacity to claim?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "overseas_heirs", section: "heirs", label: "Is any heir a non-resident / overseas?", type: "yesno", choices: YES_NO, allowUnknown: true, mapsTo: "nri_status" },
  { id: "overseas_heir_country", section: "heirs", label: "Which country does the overseas heir reside in?", type: "text", allowUnknown: true, showIf: (a) => isYes(a, "overseas_heirs") },
  { id: "noc_available", section: "heirs", label: "Will the other heirs provide a no-objection certificate (NOC)?", type: "yesno", choices: YES_NO, allowUnknown: true },

  // ---- ESTATE ---------------------------------------------------------------
  { id: "debts", section: "estate", label: "Did the deceased have outstanding debts?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "mortgages", section: "estate", label: "Is any property mortgaged / pledged?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "tax_obligations", section: "estate", label: "Are there pending tax obligations (income tax, property tax)?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "business", section: "estate", label: "Did the deceased own or run a business?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "employer_benefits", section: "estate", label: "Are there employer benefits (gratuity, pension, PF, insurance)?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "overseas_assets", section: "estate", label: "Are there any assets held outside India?", type: "yesno", choices: YES_NO, allowUnknown: true },
  { id: "overseas_assets_country", section: "estate", label: "Which country holds the overseas asset(s)?", type: "text", allowUnknown: true, showIf: (a) => isYes(a, "overseas_assets") },
  { id: "digital_assets", section: "estate", label: "Are there digital assets (online accounts, crypto, domains)?", type: "yesno", choices: YES_NO, allowUnknown: true },
];

/** Conditional flow: only fields whose showIf passes are visible, in schema order. */
export function visibleFields(answers: QAnswers): QField[] {
  return QUESTIONNAIRE.filter((f) => !f.showIf || f.showIf(answers));
}

/** Map schema answers to the deceased columns the engine reads. A declared dispute,
 *  objection, or missing heir all route claims to professional review, so any of
 *  them sets dispute_status='yes'. */
export function answersToDeceasedColumns(answers: QAnswers): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const f of QUESTIONNAIRE) {
    if (!f.mapsTo) continue;
    const v = answers[f.id];
    out[f.mapsTo] = v == null || v === "" ? null : v;
  }
  if (isYes(answers, "objection") || isYes(answers, "missing_heir")) out.dispute_status = "yes";
  return out;
}
