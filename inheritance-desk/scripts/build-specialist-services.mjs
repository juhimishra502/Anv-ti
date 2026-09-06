// Splits the generic `specialist_review` routing into 16 dedicated services, each
// with an orientation procedure grounded in a VERIFIED official source (or, where no
// reviewed source exists yet, no fabricated procedure — the service is registered in
// lib/guidance/services.ts as a template and the roadmap adds a professional-review
// node). Idempotent: skips anything already present. Re-runnable.
//
// Run: node scripts/build-specialist-services.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const DIR = path.join(process.cwd(), "government-data");
const read = (f) => JSON.parse(readFileSync(path.join(DIR, f), "utf8"));
const write = (f, v) => writeFileSync(path.join(DIR, f), JSON.stringify(v, null, 2) + "\n");

const sources = read("sources.json");
const procedures = read("procedures.json");
const assetTypes = read("asset-types.json");
const CHECKED = "2026-09-05";
const REVIEW_DUE = "2026-12-05";

// ---- Verified official sources (URLs from deep-research/claim-source-ledger.csv) --
const NEW_SOURCES = [
  { id: "cbic-gst-96", title: "CBIC GST Circular 96/15/2019 — transfer of business on death of proprietor", publisher: "CBIC", url: "https://cbic-gst.gov.in/pdf/circular-cgst-96.pdf" },
  { id: "partnership-act", title: "Indian Partnership Act, 1932", publisher: "India Code", url: "https://www.indiacode.nic.in/handle/123456789/2394?view_type=browse" },
  { id: "llp-act", title: "Limited Liability Partnership Act, 2008", publisher: "India Code", url: "https://www.indiacode.nic.in/indiacode/handle/123456789/2023?view_type=browse" },
  { id: "llp-form4", title: "MCA LLP Form 4 instruction kit (cessation of partner)", publisher: "MCA", url: "https://www.mca.gov.in/content/dam/mca/mca-forms-instruction-kit/Form-No.-4_help%20kit_clean%20copy.pdf" },
  { id: "companies-act-56", title: "Companies Act, 2013 — Section 56 (transmission of securities)", publisher: "India Code", url: "https://www.indiacode.nic.in/bitstream/123456789/2114/3/a2013-18.pdf" },
  { id: "rbi-nri-transmission", title: "RBI Master Direction — transmission of Indian securities to a non-resident heir", publisher: "Reserve Bank of India", url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11200" },
  { id: "morth-vehicle", title: "Motor vehicle transfer on death of owner (CMVR / Form 31)", publisher: "Ministry of Road Transport & Highways (Parivahan)", url: "https://parivahan.gov.in/" },
  { id: "gratuity-act", title: "Payment of Gratuity Act, 1972", publisher: "India Code", url: "https://www.indiacode.nic.in/handle/123456789/1621?view_type=browse" },
];
for (const s of NEW_SOURCES) {
  if (sources.some((x) => x.id === s.id)) continue;
  sources.push({
    ...s,
    kind: "official",
    research_checked_on: CHECKED,
    source_publication_date: null,
    access_note: "Verified reference from the claim-source ledger; specific procedural fields still require confirmation.",
    snapshot_path: null,
    sha256: null,
    snapshot_status: "not_downloaded",
  });
}

// ---- Orientation procedures for services that have a reviewed source --------------
// completeness stays orientation-level and execution_available is always false.
const proc = (o) => ({
  version: 1,
  location_basis: "institution_or_scheme",
  match: {},
  needed_context: ["institution"],
  evidence_locator: o.evidence,
  last_source_reviewed: CHECKED,
  review_due: REVIEW_DUE,
  review_status: "source_checked_orientation",
  legal_review_status: "not_approved_for_execution",
  execution_available: false,
  completeness: "orientation_only",
  document_examples: [],
  fees: null,
  published_processing_time: null,
  application_url: null,
  ...o,
});

const NEW_PROCS = [
  proc({
    id: "sole-proprietorship-succession-in", service: "sole_proprietorship_succession",
    title: "Sole proprietorship: succession on death of proprietor",
    source_ids: ["cbic-gst-96"], evidence: "CBIC Circular 96/15/2019",
    summary: "When a sole proprietor who ran a GST-registered business dies and the business continues, the successor registers afresh (REG-01), transfers input tax credit (ITC-02) and then the old registration is cancelled (REG-16). Non-GST licences, bank current account and trade licences transfer separately. This is orientation only.",
    steps: [
      "Confirm whether the business will continue or be wound up; identify GST registration and other licences.",
      "Successor obtains fresh GST registration (Form REG-01) as transferee.",
      "File ITC-02 to transfer unutilised input tax credit to the successor before cancellation.",
      "Apply to cancel the deceased's registration (Form REG-16).",
      "Transfer the current account, trade licence and any sector licences per each authority's death procedure.",
    ],
    limits: "Sequencing per CBIC Circular 96; exact current forms, timelines and non-GST licence steps require confirmation.",
  }),
  proc({
    id: "partnership-interest-succession-in", service: "partnership_interest_succession",
    title: "Partnership firm: interest of a deceased partner",
    source_ids: ["partnership-act"], evidence: "Indian Partnership Act, 1932",
    summary: "A partnership is dissolved on a partner's death subject to a contrary contract between the partners; where the firm continues, the deceased partner's estate is entitled to the value of their share as settled under the partnership deed. Read the deed first. Orientation only.",
    steps: [
      "Obtain and read the partnership deed — it governs whether the firm continues and how the share is settled.",
      "Notify the surviving partners and any registrar of firms of the death.",
      "Have the estate's entitlement (capital + share of profits/goodwill as per deed) determined.",
      "Settle the estate's share and record any reconstitution of the firm.",
    ],
    limits: "Entitlement depends on the deed and the Act; no share value or settlement is computed here.",
  }),
  proc({
    id: "llp-interest-succession-in", service: "llp_interest_succession",
    title: "LLP: cessation of a deceased partner and estate rights",
    source_ids: ["llp-act", "llp-form4"], evidence: "LLP Act 2008; MCA Form 4 kit",
    summary: "A partner ceases to be a partner of an LLP on death. Cessation is recorded with MCA in Form 4 (and Form 3 where the LLP agreement changes). The estate's rights (to capital contribution and profit share) depend on the LLP Act and the LLP agreement. Orientation only.",
    steps: [
      "Read the LLP agreement — it governs the estate's financial entitlement and any continuation.",
      "File Form 4 with MCA to record the partner's cessation (with Form 3 if the agreement is amended).",
      "Have the estate's entitlement determined and settled per the agreement and the Act.",
    ],
    limits: "Current e-form rules must be checked at filing; no entitlement is computed here.",
  }),
  proc({
    id: "private-company-share-transmission-in", service: "private_company_share_transmission",
    title: "Private company shares: transmission by operation of law",
    source_ids: ["companies-act-56"], evidence: "Companies Act 2013, s.56",
    summary: "Companies Act 2013 s.56 recognises transmission of shares by operation of law; on intimation with proper evidence the company registers the transmission and delivers certificates within the statutory period, subject to the articles and any lawful restriction. Private-company articles often add pre-emption/board approval. Orientation only.",
    steps: [
      "Read the company's articles for transmission restrictions and pre-emption rights.",
      "Intimate the company/RTA with the death certificate, succession evidence (will/probate/LoA/succession certificate) and transmission request.",
      "The company registers the transmission and issues share certificates within the s.56 timeline.",
    ],
    limits: "Subject to the articles and lawful restrictions; exact evidence threshold and any board approval require confirmation.",
  }),
  proc({
    id: "unlisted-share-transmission-in", service: "unlisted_share_transmission",
    title: "Unlisted company shares: transmission",
    source_ids: ["companies-act-56"], evidence: "Companies Act 2013, s.56",
    summary: "Transmission of unlisted shares follows Companies Act 2013 s.56 and is processed by the company or its RTA. Where held in demat, the depository transmission process applies; where in physical form, the company registers the transmission on evidence. Orientation only.",
    steps: [
      "Establish whether the shares are in physical or demat form and identify the company/RTA.",
      "Submit the transmission request with death certificate and succession evidence.",
      "The company/RTA (or DP for demat) registers the transmission.",
    ],
    limits: "Depository vs physical route and evidence threshold require confirmation for the specific company.",
  }),
  proc({
    id: "vehicle-transmission-in", service: "vehicle_transmission",
    title: "Motor vehicle: transfer of ownership on death of owner",
    source_ids: ["morth-vehicle"], evidence: "CMVR / Parivahan (Form 31)",
    summary: "On the death of a registered owner, the person succeeding to possession applies to the registering authority to transfer ownership (commonly Form 31 with the registration certificate, death certificate and succession evidence) within the period prescribed under the Central Motor Vehicles Rules. Orientation only.",
    steps: [
      "Identify the registering authority (RTO) where the vehicle is registered.",
      "Apply to transfer ownership (Form 31) with the RC, death certificate and succession evidence.",
      "Complete insurance transfer separately with the insurer.",
    ],
    limits: "Current form, fee, timeline and state-specific steps require confirmation at the RTO.",
  }),
  proc({
    id: "gratuity-death-claim-in", service: "gratuity_death_claim",
    title: "Gratuity: death claim by nominee / legal heir",
    source_ids: ["gratuity-act"], evidence: "Payment of Gratuity Act, 1972",
    summary: "Under the Payment of Gratuity Act 1972, on an employee's death gratuity is payable to the nominee (Form F) or, if none, the legal heirs, on application to the employer; the vesting-service condition does not apply on death. Public-sector/CDA-rule gratuity follows separate service rules. Orientation only.",
    steps: [
      "Confirm the employer and whether the Gratuity Act or service (CDA/CCS) rules apply.",
      "Nominee applies to the employer (Form F route); legal heirs apply where there is no nominee.",
      "Employer computes and pays the gratuity; escalate to the Controlling Authority on dispute/delay.",
    ],
    limits: "Employer-specific forms, timeline and amount are not encoded; confirm with the employer/authority.",
  }),
  proc({
    id: "corporate-bond-transmission-in", service: "corporate_bond_transmission",
    title: "Corporate bonds/debentures: transmission",
    source_ids: ["sebi-transmission"], evidence: "SEBI transmission norms",
    summary: "Corporate bonds/debentures held in demat are transmitted through the depository (NSDL/CDSL) via the depository participant, following SEBI transmission norms; physical holdings are transmitted by the issuer/RTA. Orientation only.",
    steps: [
      "Establish demat vs physical holding and identify the DP or issuer/RTA.",
      "Submit the transmission request with death certificate and succession evidence per SEBI norms.",
      "The DP/RTA registers the transmission to the nominee or legal heir.",
    ],
    limits: "Value-threshold documents and issuer-specific steps require confirmation.",
  }),
  proc({
    id: "sgb-transmission-in", service: "sovereign_gold_bond_transmission",
    title: "Sovereign Gold Bonds: transmission",
    source_ids: ["sebi-transmission"], evidence: "Depository transmission (SGB in demat)",
    summary: "Sovereign Gold Bonds held in demat are transmitted through the depository/DP like other demat securities; bonds held in RBI's Retail Direct / physical certificate form follow the RBI/receiving-office transmission process. Orientation only.",
    steps: [
      "Establish where the SGB is held (demat via DP, or RBI Retail Direct / receiving office).",
      "Submit the transmission request with death certificate and succession evidence to the DP or receiving office.",
      "The holding is transmitted to the nominee or legal heir.",
    ],
    limits: "RBI Retail Direct vs depository route and exact forms require confirmation.",
  }),
  proc({
    id: "ppf-death-claim-in", service: "ppf_death_claim",
    title: "PPF: claim on death of the account holder",
    source_ids: ["post-office"], evidence: "Government savings / PPF (post office & bank)",
    summary: "On the death of a PPF account holder the balance is paid to the nominee, or to the legal heirs where there is no nomination, on application at the operating post office or bank branch; the account is not continued by the claimant. Orientation only.",
    steps: [
      "Identify the operating branch (post office or bank) and whether a nomination exists.",
      "Nominee applies with the prescribed claim form, death certificate and identity/bank proof.",
      "Where there is no nominee, legal heirs apply with succession evidence (thresholds apply).",
    ],
    limits: "Current claim form, thresholds for legal-heir claims and processing time require confirmation at the branch.",
  }),
  proc({
    id: "family-pension-claim-in", service: "family_pension_claim",
    title: "Family pension: claim by eligible family member",
    source_ids: ["epfo-death"], evidence: "EPS family pension (EPFO)",
    summary: "EPS family pension is claimed from EPFO by the eligible family member (spouse, then children) with the death certificate and claim forms; government-service and other employer family pensions follow separate DoPPW/employer rules. Orientation only.",
    steps: [
      "Confirm the pension type (EPS via EPFO, government service pension, or other employer pension).",
      "Eligible family member submits the family-pension claim with death certificate and forms.",
      "For government service pension, apply through the pension-sanctioning authority per DoPPW rules.",
    ],
    limits: "Non-EPS (government/employer) family pension rules, forms and eligibility require separate confirmation.",
  }),
];
for (const p of NEW_PROCS) {
  if (procedures.some((x) => x.id === p.id)) continue;
  procedures.push(p);
}

// ---- Asset-type -> service remap + new asset types --------------------------------
const REMAP = {
  ppf: "ppf_death_claim",
  corporate_bond: "corporate_bond_transmission",
  sovereign_gold_bond: "sovereign_gold_bond_transmission",
  vehicle: "vehicle_transmission",
  business_interest: "sole_proprietorship_succession",
  partnership: "partnership_interest_succession",
  private_shares: "private_company_share_transmission",
  family_pension: "family_pension_claim",
  gratuity: "gratuity_death_claim",
  employer_benefit: "employer_benefit_claim",
  overseas_assets: "overseas_asset_succession",
  digital_assets: "digital_account_legacy",
  liability: "estate_liability_resolution",
};
for (const t of assetTypes) if (REMAP[t.id]) t.service = REMAP[t.id];
const NEW_TYPES = [
  { id: "llp_interest", service: "llp_interest_succession" },
  { id: "unlisted_shares", service: "unlisted_share_transmission" },
  { id: "cryptoasset", service: "cryptoasset_recovery" },
];
for (const t of NEW_TYPES) if (!assetTypes.some((x) => x.id === t.id)) assetTypes.push(t);

write("sources.json", sources);
write("procedures.json", procedures);
write("asset-types.json", assetTypes);

// Refresh integrity.json hashes for the files we touched (manifest, not enforced).
const integrity = read("integrity.json");
for (const f of ["sources.json", "procedures.json", "asset-types.json"]) {
  integrity.files[f] = createHash("sha256").update(readFileSync(path.join(DIR, f))).digest("hex");
}
write("integrity.json", integrity);

console.log(`Sources: ${sources.length}, procedures: ${procedures.length}, asset-types: ${assetTypes.length}.`);
console.log("New orientation procedures added for services with a verified source.");
console.log("Template-only services (no grounded procedure yet): employer_benefit_claim, overseas_asset_succession, digital_account_legacy, cryptoasset_recovery, estate_liability_resolution.");
