// UI message dictionaries. `en` is the source of truth and the fallback for every
// missing key. `hi` is human-written. Other locales intentionally omit UI chrome
// (they fall back to English) and are offered as assistant/voice languages instead —
// we do not ship unreviewed machine translations of legal-adjacent chrome.

export type MessageKey =
  | "brand"
  | "tagline"
  | "importantNotice"
  | "chooseLanguage"
  | "suggested"
  | "assistantOnlyNote"
  | "signOut"
  | "editCaseDetails"
  | "skipForNow"
  | "back"
  | "next"
  | "finish"
  | "iDontKnow"
  | "startTitle"
  | "startDemoDesc"
  | "startDemo"
  | "newCaseTitle"
  | "caseName"
  | "caseNamePlaceholder"
  | "createCase"
  | "yourCases"
  | "loading"
  | "signInWithAadhaar"
  | "orDemo"
  | "yourNextStep"
  | "yourRoadmap"
  | "roadmapEmpty"
  | "assetsBenefits"
  | "noAssets"
  | "addAssetTitle"
  | "orientationOnly"
  | "myProgress"
  | "notOfficialStatus"
  | "showDetails"
  | "hideDetails"
  | "whatToDo"
  | "exampleDocs"
  | "limits"
  | "officialSources"
  | "assetType"
  | "assetTypeSelect"
  | "shortLabel"
  | "institution"
  | "stateOfProperty"
  | "district"
  | "recordType"
  | "addToEstate"
  | "adding"
  | "askAssistant"
  | "assistantTitle"
  | "assistantIntro"
  | "aboutWhichAsset"
  | "generalCase"
  | "askToBegin"
  | "send"
  | "thinking"
  | "you"
  | "assistant"
  | "talkToAssistant"
  | "listening"
  | "processing"
  | "speaking"
  | "stop"
  | "micConsentTitle"
  | "micConsentBody"
  | "allowMic"
  | "micDenied"
  | "voiceUnsupported"
  | "readScreenAloud"
  | "confirmSave"
  | "yesSave"
  | "editAnswer"
  | "speed"
  | "stepOf"
  | "changeLater"
  | "yes"
  | "no"
  | "haveCertificate"
  | "notYet"
  | "willExists"
  | "noWill"
  | "onbName"
  | "onbNameHelp"
  | "onbResState"
  | "onbResStateHelp"
  | "onbResDistrict"
  | "onbDeathState"
  | "onbDeathStateHelp"
  | "onbDeathDistrict"
  | "onbDeathDate"
  | "onbRegistered"
  | "onbCertificate"
  | "onbWill"
  | "confirmToRefine"
  | "onbCertCopies"
  | "onbApplicantRel"
  | "onbApplicantRelHelp"
  | "onbWillRegistered"
  | "onbExecutor"
  | "onbProbate"
  | "onbDispute"
  | "onbNri"
  | "documentsTitle"
  | "docVaultIntro"
  | "uploadDoc"
  | "labelDoc"
  | "noDocs"
  | "docChecklist"
  | "viewDoc"
  | "deleteDoc"
  | "confirmDelete"
  | "uploading"
  | "scanNote"
  | "docsForThisStep"
  | "yourPlanTitle"
  | "yourPlanIntro"
  | "phaseDeath"
  | "phaseLegal"
  | "phaseAssets"
  | "phaseAssetsIntro"
  | "assetWord"
  | "reuseNote"
  | "myTracking"
  | "submittedOn"
  | "officeWhere"
  | "ackNumber"
  | "followUpDate"
  | "notesLabel"
  | "save"
  | "saved"
  | "reminders"
  | "overdue"
  | "dueToday"
  | "upcoming"
  | "noReminders"
  | "journeyMap"
  | "mapHint"
  | "transferStageTitle"
  | "transferStageIntro"
  | "generateJourney"
  | "journeyBuildFailed"
  | "retry"
  | "addedSoFar"
  | "districtsUnavailable"
  | "heroTitle"
  | "heroSub"
  | "heroSupporting"
  | "ctaPrimary"
  | "ctaSecondary"
  | "trustLine"
  | "navHow"
  | "navCoverage"
  | "navLanguage"
  | "enterWithSound"
  | "playMusic"
  | "pauseMusic"
  | "muteMusic"
  | "unmuteMusic"
  | "closeSound"
  | "volume"
  | "musicControls"
  | "secJourneyTitle"
  | "secJourneyBody"
  | "secCoverageTitle"
  | "secCoverageBody"
  | "secHowTitle"
  | "step1Title"
  | "step1Desc"
  | "step2Title"
  | "step2Desc"
  | "step3Title"
  | "step3Desc"
  | "secStateTitle"
  | "secStateBody"
  | "secLangTitle"
  | "secLangBody"
  | "secSourcesTitle"
  | "secSourcesBody"
  | "finalCtaTitle"
  | "finalCtaBody"
  | "footerNote"
  | "acResidential"
  | "acAgri"
  | "acCommercial"
  | "acBankFd"
  | "acShares"
  | "acMutual"
  | "acBonds"
  | "acInsurance"
  | "acVehicles"
  | "acEpf"
  | "acNps"
  | "acPension"
  | "acBusiness"
  | "acPartnership"
  | "acPrivateShares"
  | "acDigital"
  | "acCrypto"
  | "acOverseas"
  | "acLiabilities"
  | "glassHeading"
  | "qAssetState"
  | "qSelectState"
  | "qSelectDistrict"
  | "qSelectAsset"
  | "trustSources"
  | "trustVoice"
  | "trustState"
  | "pvDeath"
  | "pvHeirs"
  | "pvTransfer"
  | "pvClaim"
  | "startYourCase"
  | "tellUsTransfer"
  | "assetProperty"
  | "assetBank"
  | "assetInvest"
  | "assetBenefits"
  | "continueWord"
  | "signInToSave"
  | "jDeathCert"
  | "jHeirs"
  | "jAuthority"
  | "jProperty"
  | "jFinancial"
  | "jBenefits"
  | "jTax"
  | "jClosure";

type Dict = Record<MessageKey, string>;

const en: Dict = {
  brand: "Inheritance Desk",
  tagline: "Guidance for families after a death in India",
  importantNotice:
    "This is orientation grounded in official sources. No route here is a certified, ready-to-file checklist, and we never invent fees, offices or legal requirements. Complex or disputed cases need a qualified professional.",
  chooseLanguage: "Language",
  suggested: "Suggested",
  assistantOnlyNote: "Machine-translated interface — not reviewed",
  signOut: "Sign out",
  editCaseDetails: "Edit case details",
  skipForNow: "Skip for now",
  back: "Back",
  next: "Next",
  finish: "Finish",
  iDontKnow: "I don't know",
  startTitle: "Start",
  startDemoDesc:
    "For local review, use demo access. This is not real government sign-in and creates a temporary demo account with synthetic data only.",
  startDemo: "Start demo access",
  newCaseTitle: "Start a new case",
  caseName: "Give this case a name",
  caseNamePlaceholder: "e.g. My father's estate",
  createCase: "Create case & begin",
  yourCases: "Your cases",
  loading: "Loading…",
  signInWithAadhaar: "Sign in with Aadhaar (sandbox)",
  orDemo: "or continue with demo access",
  yourNextStep: "Your next step",
  yourRoadmap: "Your roadmap",
  roadmapEmpty: "Add your case details and assets below to generate a personalized step-by-step plan.",
  assetsBenefits: "Assets & benefits",
  noAssets: "No assets added yet.",
  addAssetTitle: "Add an asset or benefit",
  orientationOnly:
    "Orientation only — grounded in official sources, but no route here is a certified, ready-to-file checklist. Government/institution charges are separate from any platform fee.",
  myProgress: "My progress",
  notOfficialStatus: "Your own tracking — not an official status.",
  showDetails: "Show details",
  hideDetails: "Hide details",
  whatToDo: "What to do:",
  exampleDocs: "Example documents (not a complete list):",
  limits: "Limits:",
  officialSources: "Official sources:",
  assetType: "Asset or benefit type",
  assetTypeSelect: "Select…",
  shortLabel: "A short label (optional)",
  institution: "Institution (bank / insurer / AMC / registrar), if known",
  stateOfProperty: "State/UT where the property is located",
  district: "District",
  recordType: "Record type",
  addToEstate: "Add to estate",
  adding: "Adding…",
  askAssistant: "Ask the assistant",
  assistantTitle: "Assistant",
  assistantIntro:
    "Answers come only from the official sources researched for your case. It will say when it is unsure and never invents fees, offices or legal conclusions.",
  aboutWhichAsset: "About which asset? (optional)",
  generalCase: "General / whole case",
  askToBegin: "Ask a question to begin.",
  send: "Send",
  thinking: "Thinking…",
  you: "You",
  assistant: "Assistant",
  talkToAssistant: "Talk to assistant",
  listening: "Listening…",
  processing: "Processing…",
  speaking: "Speaking…",
  stop: "Stop",
  micConsentTitle: "Use your microphone?",
  micConsentBody:
    "We use your microphone only while you hold the talk button. Audio is processed to understand your question and is not stored by default.",
  allowMic: "Allow microphone",
  micDenied: "Microphone permission was denied. You can still type your questions.",
  voiceUnsupported: "Voice is not supported for this language in your browser. You can still read and type.",
  readScreenAloud: "Read this screen aloud",
  confirmSave: "Should I save this answer?",
  yesSave: "Yes, save",
  editAnswer: "Edit",
  speed: "Speed",
  stepOf: "Step {n} of {total}",
  changeLater: "You can change any answer later. Answering more accurately gives you a more specific plan.",
  yes: "Yes",
  no: "No / not yet",
  haveCertificate: "Yes, I have it",
  notYet: "Not yet",
  willExists: "Yes, there is a will",
  noWill: "No will",
  onbName: "What was the full name of the person who died?",
  onbNameHelp: "You can skip this if you prefer.",
  onbResState: "Which state or UT did they usually live in before death?",
  onbResStateHelp: "This can be different from where they died or where their property is.",
  onbResDistrict: "Which district did they usually live in?",
  onbDeathState: "In which state or UT did the death happen?",
  onbDeathStateHelp: "A death is registered where it happened.",
  onbDeathDistrict: "In which district did the death happen?",
  onbDeathDate: "What was the date of death?",
  onbRegistered: "Has the death been registered with the government?",
  onbCertificate: "Do you have the death certificate?",
  onbWill: "Was there a will?",
  confirmToRefine: "To give you a more specific answer, please confirm:",
  onbCertCopies: "How many certified copies of the death certificate do you have?",
  onbApplicantRel: "What is your relationship to the deceased?",
  onbApplicantRelHelp: "e.g. spouse, son, daughter, parent.",
  onbWillRegistered: "Was the will registered?",
  onbExecutor: "Does the will name an executor?",
  onbProbate: "Is a probate or court proceeding already underway?",
  onbDispute: "Is there a family dispute, objection, or missing heir?",
  onbNri: "Was the deceased or any heir a non-resident (NRI/OCI), or are there overseas assets?",
  documentsTitle: "Documents",
  docVaultIntro:
    "Keep your documents here, privately. Uploading a document is for your own records — it does not mean any office has accepted it.",
  uploadDoc: "Upload a document",
  labelDoc: "What is this? (optional)",
  noDocs: "No documents uploaded yet.",
  docChecklist: "Documents your case may need",
  viewDoc: "View",
  deleteDoc: "Delete",
  confirmDelete: "Confirm delete?",
  uploading: "Uploading…",
  scanNote: "Files are stored privately. Automated virus scanning is not enabled yet.",
  docsForThisStep: "Documents for this step",
  yourPlanTitle: "Your personalised plan",
  yourPlanIntro: "Every step below is built from your answers and the assets you entered. Work top to bottom — the asset claims can run in parallel.",
  phaseDeath: "Phase 1 · The death record",
  phaseLegal: "Phase 2 · Who inherits",
  phaseAssets: "Phase 3 · Your assets",
  phaseAssetsIntro: "Each asset has its own complete process below — steps, documents, offices, fees and timelines.",
  assetWord: "Asset",
  reuseNote: "You can reuse one document across several claims.",
  myTracking: "My tracking (not an official status)",
  submittedOn: "Submitted on",
  officeWhere: "Office / where submitted",
  ackNumber: "Acknowledgement / reference no.",
  followUpDate: "Follow-up date",
  notesLabel: "Notes",
  save: "Save",
  saved: "Saved",
  reminders: "Reminders & follow-ups",
  overdue: "Overdue",
  dueToday: "Due today",
  upcoming: "Upcoming",
  noReminders: "No follow-up dates set yet. Add one on any step below.",
  journeyMap: "Journey map",
  mapHint: "Select a stage to open its details.",
  heroTitle: "Tell us what was left behind.",
  heroSub: "We’ll map every next step.",
  heroSupporting: "Get a personalised journey for property, bank accounts, investments, insurance and every asset your family needs to transfer.",
  glassHeading: "Let’s understand your family’s case.",
  qAssetState: "State where the asset is located",
  qSelectState: "Select state",
  qSelectDistrict: "Select district",
  qSelectAsset: "Select asset",
  trustSources: "Official sources",
  trustVoice: "Voice assistance",
  trustState: "State-specific guidance",
  pvDeath: "Death certificate",
  pvHeirs: "Identify legal heirs",
  pvTransfer: "Transfer each asset",
  pvClaim: "Complete mutation or claim",
  ctaPrimary: "Build my journey",
  ctaSecondary: "See how it works",
  trustLine: "Guidance based on official government and institutional sources.",
  navHow: "How it works",
  navCoverage: "What we cover",
  navLanguage: "Language",
  enterWithSound: "Enter with sound",
  playMusic: "Play music",
  pauseMusic: "Pause music",
  muteMusic: "Mute music",
  unmuteMusic: "Unmute music",
  closeSound: "Close sound",
  volume: "Volume",
  musicControls: "Background music controls",
  secJourneyTitle: "One guided journey, end to end",
  secJourneyBody: "Every certificate, office and claim connected in a single dependency path — so you always know the next step.",
  secCoverageTitle: "Every asset, one place",
  secCoverageBody: "From a family home to a demat account, each asset gets its own state-aware, source-grounded track.",
  secHowTitle: "How it works",
  step1Title: "Tell us about the case",
  step1Desc: "Answer a short, guided questionnaire about the family, the assets and the situation.",
  step2Title: "Get your personalised roadmap",
  step2Desc: "We assemble a connected journey, resolved from the selected state and each asset.",
  step3Title: "Complete each transfer",
  step3Desc: "Follow clear steps, track progress, and keep every document in one place.",
  secStateTitle: "State-aware guidance",
  secStateBody: "Each asset routes from its own state and district. Where a state has no verified procedure, an honest fallback tells you exactly what to confirm locally.",
  secLangTitle: "In your language, with a voice",
  secLangBody: "The whole experience follows your chosen language, with read-aloud and a voice assistant.",
  secSourcesTitle: "Grounded in official sources",
  secSourcesBody: "Every route links to the government or institutional source it came from, with its last-verified date and any unresolved fields.",
  finalCtaTitle: "Start your family's inheritance journey today.",
  finalCtaBody: "A clear, guided path for every asset — in your language.",
  footerNote: "Inheritance Desk — orientation and guidance, not legal advice.",
  acResidential: "Residential property",
  acAgri: "Agricultural land",
  acCommercial: "Commercial property",
  acBankFd: "Bank accounts & fixed deposits",
  acShares: "Shares & demat holdings",
  acMutual: "Mutual funds",
  acBonds: "Bonds & government securities",
  acInsurance: "Insurance",
  acVehicles: "Vehicles",
  acEpf: "EPF",
  acNps: "NPS",
  acPension: "Pension",
  acBusiness: "Businesses",
  acPartnership: "Partnerships & LLPs",
  acPrivateShares: "Private-company shares",
  acDigital: "Digital accounts",
  acCrypto: "Cryptoassets",
  acOverseas: "Overseas assets",
  acLiabilities: "Estate liabilities",
  startYourCase: "Start your case",
  tellUsTransfer: "Tell us what needs to be transferred",
  assetProperty: "Property",
  assetBank: "Bank Accounts",
  assetInvest: "Investments",
  assetBenefits: "Benefits",
  continueWord: "Continue",
  signInToSave: "Sign in to save and reopen your case",
  jDeathCert: "Death Certificate",
  jHeirs: "Identify Heirs",
  jAuthority: "Establish Authority",
  jProperty: "Transfer Property",
  jFinancial: "Claim Financial Assets",
  jBenefits: "Benefits & Pension",
  jTax: "Tax & Liabilities",
  jClosure: "Estate Closure",
  transferStageTitle: "What do you need to transfer?",
  transferStageIntro: "Add each property and financial asset the family needs to claim or transfer. Your step-by-step journey is built from these — you will not be asked again.",
  generateJourney: "Generate my complete journey →",
  journeyBuildFailed: "We couldn't build your journey. Please try again.",
  retry: "Retry",
  addedSoFar: "Added so far",
  districtsUnavailable: "Districts for this state aren't available yet — choose \"I don't know\" and confirm it with the local office.",
};

const hi: Dict = {
  brand: "इनहेरिटेंस डेस्क",
  tagline: "भारत में किसी की मृत्यु के बाद परिवारों के लिए मार्गदर्शन",
  importantNotice:
    "यह आधिकारिक स्रोतों पर आधारित प्रारंभिक मार्गदर्शन है। यहाँ कोई भी प्रक्रिया प्रमाणित, तैयार चेकलिस्ट नहीं है, और हम शुल्क, कार्यालय या कानूनी आवश्यकताएँ स्वयं नहीं गढ़ते। जटिल या विवादित मामलों के लिए योग्य पेशेवर की आवश्यकता है।",
  chooseLanguage: "भाषा",
  suggested: "सुझाई गई",
  assistantOnlyNote: "मशीन-अनूदित इंटरफ़ेस — समीक्षा नहीं की गई",
  signOut: "साइन आउट",
  editCaseDetails: "केस विवरण संपादित करें",
  skipForNow: "अभी छोड़ें",
  back: "पीछे",
  next: "आगे",
  finish: "समाप्त",
  iDontKnow: "मुझे नहीं पता",
  startTitle: "शुरू करें",
  startDemoDesc:
    "स्थानीय समीक्षा के लिए डेमो एक्सेस का उपयोग करें। यह असली सरकारी साइन-इन नहीं है और केवल कृत्रिम डेटा के साथ एक अस्थायी डेमो खाता बनाता है।",
  startDemo: "डेमो एक्सेस शुरू करें",
  newCaseTitle: "नया केस शुरू करें",
  caseName: "इस केस को एक नाम दें",
  caseNamePlaceholder: "जैसे, मेरे पिता की संपत्ति",
  createCase: "केस बनाएँ और शुरू करें",
  yourCases: "आपके केस",
  loading: "लोड हो रहा है…",
  signInWithAadhaar: "आधार से साइन इन करें (सैंडबॉक्स)",
  orDemo: "या डेमो एक्सेस के साथ जारी रखें",
  yourNextStep: "आपका अगला कदम",
  yourRoadmap: "आपकी योजना",
  roadmapEmpty: "व्यक्तिगत चरण-दर-चरण योजना बनाने के लिए नीचे अपने केस का विवरण और संपत्तियाँ जोड़ें।",
  assetsBenefits: "संपत्तियाँ और लाभ",
  noAssets: "अभी तक कोई संपत्ति नहीं जोड़ी गई।",
  addAssetTitle: "संपत्ति या लाभ जोड़ें",
  orientationOnly:
    "केवल प्रारंभिक मार्गदर्शन — आधिकारिक स्रोतों पर आधारित, पर यहाँ कोई प्रमाणित, तैयार चेकलिस्ट नहीं है। सरकारी/संस्थागत शुल्क किसी भी प्लेटफ़ॉर्म शुल्क से अलग हैं।",
  myProgress: "मेरी प्रगति",
  notOfficialStatus: "आपका अपना ट्रैकिंग — यह आधिकारिक स्थिति नहीं है।",
  showDetails: "विवरण देखें",
  hideDetails: "विवरण छिपाएँ",
  whatToDo: "क्या करना है:",
  exampleDocs: "उदाहरण दस्तावेज़ (पूरी सूची नहीं):",
  limits: "सीमाएँ:",
  officialSources: "आधिकारिक स्रोत:",
  assetType: "संपत्ति या लाभ का प्रकार",
  assetTypeSelect: "चुनें…",
  shortLabel: "एक छोटा नाम (वैकल्पिक)",
  institution: "संस्था (बैंक / बीमाकर्ता / एएमसी / रजिस्ट्रार), यदि ज्ञात हो",
  stateOfProperty: "वह राज्य/केंद्रशासित प्रदेश जहाँ संपत्ति स्थित है",
  district: "ज़िला",
  recordType: "रिकॉर्ड का प्रकार",
  addToEstate: "संपत्ति में जोड़ें",
  adding: "जोड़ा जा रहा है…",
  askAssistant: "सहायक से पूछें",
  assistantTitle: "सहायक",
  assistantIntro:
    "उत्तर केवल आपके केस के लिए शोधित आधिकारिक स्रोतों से आते हैं। जब यह अनिश्चित हो तो यह बताएगा और शुल्क, कार्यालय या कानूनी निष्कर्ष कभी नहीं गढ़ता।",
  aboutWhichAsset: "किस संपत्ति के बारे में? (वैकल्पिक)",
  generalCase: "सामान्य / पूरा केस",
  askToBegin: "शुरू करने के लिए प्रश्न पूछें।",
  send: "भेजें",
  thinking: "सोच रहा है…",
  you: "आप",
  assistant: "सहायक",
  talkToAssistant: "सहायक से बात करें",
  listening: "सुन रहा है…",
  processing: "प्रोसेस हो रहा है…",
  speaking: "बोल रहा है…",
  stop: "रोकें",
  micConsentTitle: "अपना माइक्रोफ़ोन उपयोग करें?",
  micConsentBody:
    "हम आपके माइक्रोफ़ोन का उपयोग केवल तब करते हैं जब आप बात करने का बटन दबाए रखते हैं। ऑडियो आपके प्रश्न को समझने के लिए संसाधित होता है और डिफ़ॉल्ट रूप से संग्रहीत नहीं किया जाता।",
  allowMic: "माइक्रोफ़ोन की अनुमति दें",
  micDenied: "माइक्रोफ़ोन की अनुमति अस्वीकृत हुई। आप फिर भी अपने प्रश्न टाइप कर सकते हैं।",
  voiceUnsupported: "आपके ब्राउज़र में इस भाषा के लिए आवाज़ समर्थित नहीं है। आप फिर भी पढ़ और टाइप कर सकते हैं।",
  readScreenAloud: "यह स्क्रीन ज़ोर से पढ़ें",
  confirmSave: "क्या मैं यह उत्तर सहेज दूँ?",
  yesSave: "हाँ, सहेजें",
  editAnswer: "संपादित करें",
  speed: "गति",
  stepOf: "चरण {n} / {total}",
  changeLater: "आप कोई भी उत्तर बाद में बदल सकते हैं। अधिक सटीक उत्तर देने पर आपको अधिक विशिष्ट योजना मिलती है।",
  yes: "हाँ",
  no: "नहीं / अभी नहीं",
  haveCertificate: "हाँ, मेरे पास है",
  notYet: "अभी नहीं",
  willExists: "हाँ, वसीयत है",
  noWill: "कोई वसीयत नहीं",
  onbName: "जिस व्यक्ति की मृत्यु हुई उनका पूरा नाम क्या था?",
  onbNameHelp: "यदि आप चाहें तो इसे छोड़ सकते हैं।",
  onbResState: "मृत्यु से पहले वे आमतौर पर किस राज्य/केंद्रशासित प्रदेश में रहते थे?",
  onbResStateHelp: "यह उस स्थान से अलग हो सकता है जहाँ उनकी मृत्यु हुई या जहाँ उनकी संपत्ति है।",
  onbResDistrict: "वे आमतौर पर किस ज़िले में रहते थे?",
  onbDeathState: "मृत्यु किस राज्य/केंद्रशासित प्रदेश में हुई?",
  onbDeathStateHelp: "मृत्यु का पंजीकरण वहीं होता है जहाँ वह हुई।",
  onbDeathDistrict: "मृत्यु किस ज़िले में हुई?",
  onbDeathDate: "मृत्यु की तारीख क्या थी?",
  onbRegistered: "क्या मृत्यु सरकार के पास पंजीकृत है?",
  onbCertificate: "क्या आपके पास मृत्यु प्रमाणपत्र है?",
  onbWill: "क्या कोई वसीयत थी?",
  confirmToRefine: "अधिक विशिष्ट उत्तर देने के लिए, कृपया पुष्टि करें:",
  onbCertCopies: "आपके पास मृत्यु प्रमाणपत्र की कितनी प्रमाणित प्रतियाँ हैं?",
  onbApplicantRel: "मृतक से आपका क्या संबंध है?",
  onbApplicantRelHelp: "जैसे, पति/पत्नी, पुत्र, पुत्री, माता-पिता।",
  onbWillRegistered: "क्या वसीयत पंजीकृत थी?",
  onbExecutor: "क्या वसीयत में कोई निष्पादक (एग्ज़ीक्यूटर) नामित है?",
  onbProbate: "क्या कोई प्रोबेट या न्यायालय की कार्यवाही पहले से चल रही है?",
  onbDispute: "क्या कोई पारिवारिक विवाद, आपत्ति या लापता वारिस है?",
  onbNri: "क्या मृतक या कोई वारिस अनिवासी (NRI/OCI) था, या विदेशी संपत्तियाँ हैं?",
  documentsTitle: "दस्तावेज़",
  docVaultIntro:
    "अपने दस्तावेज़ यहाँ निजी रूप से रखें। दस्तावेज़ अपलोड करना केवल आपके अपने रिकॉर्ड के लिए है — इसका मतलब यह नहीं कि किसी कार्यालय ने इसे स्वीकार कर लिया है।",
  uploadDoc: "दस्तावेज़ अपलोड करें",
  labelDoc: "यह क्या है? (वैकल्पिक)",
  noDocs: "अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया।",
  docChecklist: "आपके केस के लिए आवश्यक संभावित दस्तावेज़",
  viewDoc: "देखें",
  deleteDoc: "हटाएँ",
  confirmDelete: "हटाने की पुष्टि करें?",
  uploading: "अपलोड हो रहा है…",
  scanNote: "फ़ाइलें निजी रूप से संग्रहीत हैं। स्वचालित वायरस स्कैनिंग अभी सक्षम नहीं है।",
  docsForThisStep: "इस चरण के लिए दस्तावेज़",
  yourPlanTitle: "आपकी व्यक्तिगत योजना",
  yourPlanIntro: "नीचे दिया गया हर चरण आपके उत्तरों और आपके द्वारा दर्ज संपत्तियों से बना है। ऊपर से नीचे तक काम करें — संपत्ति के दावे समानांतर रूप से चल सकते हैं।",
  phaseDeath: "चरण 1 · मृत्यु रिकॉर्ड",
  phaseLegal: "चरण 2 · उत्तराधिकारी कौन",
  phaseAssets: "चरण 3 · आपकी संपत्तियाँ",
  phaseAssetsIntro: "प्रत्येक संपत्ति की अपनी पूरी प्रक्रिया नीचे है — चरण, दस्तावेज़, कार्यालय, शुल्क और समयसीमा।",
  assetWord: "संपत्ति",
  reuseNote: "आप एक दस्तावेज़ को कई दावों में पुनः उपयोग कर सकते हैं।",
  myTracking: "मेरी ट्रैकिंग (यह आधिकारिक स्थिति नहीं है)",
  submittedOn: "जमा करने की तारीख",
  officeWhere: "कार्यालय / कहाँ जमा किया",
  ackNumber: "पावती / संदर्भ संख्या",
  followUpDate: "अनुवर्ती (फ़ॉलो-अप) तारीख",
  notesLabel: "टिप्पणियाँ",
  save: "सहेजें",
  saved: "सहेजा गया",
  reminders: "अनुस्मारक और फ़ॉलो-अप",
  overdue: "अतिदेय",
  dueToday: "आज देय",
  upcoming: "आगामी",
  noReminders: "अभी तक कोई फ़ॉलो-अप तारीख नहीं। नीचे किसी भी चरण पर जोड़ें।",
  journeyMap: "यात्रा मानचित्र",
  mapHint: "विवरण खोलने के लिए किसी चरण को चुनें।",
  heroTitle: "हमें बताएँ कि पीछे क्या छूट गया है।",
  heroSub: "हम हर अगला कदम बताएँगे।",
  heroSupporting: "संपत्ति, बैंक खातों, निवेश, बीमा और हर उस संपत्ति के लिए एक व्यक्तिगत यात्रा पाएं जिसे आपके परिवार को स्थानांतरित करना है।",
  glassHeading: "आइए आपके परिवार का मामला समझें।",
  qAssetState: "वह राज्य जहाँ संपत्ति स्थित है",
  qSelectState: "राज्य चुनें",
  qSelectDistrict: "ज़िला चुनें",
  qSelectAsset: "संपत्ति चुनें",
  trustSources: "आधिकारिक स्रोत",
  trustVoice: "वॉइस सहायता",
  trustState: "राज्य-विशिष्ट मार्गदर्शन",
  pvDeath: "मृत्यु प्रमाणपत्र",
  pvHeirs: "कानूनी उत्तराधिकारियों की पहचान करें",
  pvTransfer: "प्रत्येक संपत्ति स्थानांतरित करें",
  pvClaim: "नामांतरण या दावा पूरा करें",
  ctaPrimary: "मेरी यात्रा बनाएँ",
  ctaSecondary: "यह कैसे काम करता है देखें",
  trustLine: "आधिकारिक सरकारी और संस्थागत स्रोतों पर आधारित मार्गदर्शन।",
  navHow: "यह कैसे काम करता है",
  navCoverage: "हम क्या कवर करते हैं",
  navLanguage: "भाषा",
  enterWithSound: "ध्वनि के साथ प्रवेश करें",
  playMusic: "संगीत चलाएँ",
  pauseMusic: "संगीत रोकें",
  muteMusic: "संगीत म्यूट करें",
  unmuteMusic: "संगीत अनम्यूट करें",
  closeSound: "ध्वनि बंद करें",
  volume: "आवाज़",
  musicControls: "पृष्ठभूमि संगीत नियंत्रण",
  secJourneyTitle: "एक निर्देशित यात्रा, आरंभ से अंत तक",
  secJourneyBody: "हर प्रमाणपत्र, कार्यालय और दावा एक ही निर्भरता-पथ में जुड़ा — ताकि आपको हमेशा अगला कदम पता हो।",
  secCoverageTitle: "हर संपत्ति, एक ही जगह",
  secCoverageBody: "पारिवारिक घर से लेकर डीमैट खाते तक, हर संपत्ति को उसका अपना राज्य-आधारित, स्रोत-समर्थित मार्ग मिलता है।",
  secHowTitle: "यह कैसे काम करता है",
  step1Title: "हमें मामले के बारे में बताएँ",
  step1Desc: "परिवार, संपत्तियों और स्थिति के बारे में एक संक्षिप्त, निर्देशित प्रश्नावली का उत्तर दें।",
  step2Title: "अपना व्यक्तिगत रोडमैप पाएँ",
  step2Desc: "हम चुने गए राज्य और हर संपत्ति से हल की गई एक जुड़ी हुई यात्रा तैयार करते हैं।",
  step3Title: "हर स्थानांतरण पूरा करें",
  step3Desc: "स्पष्ट चरणों का पालन करें, प्रगति ट्रैक करें, और हर दस्तावेज़ एक ही जगह रखें।",
  secStateTitle: "राज्य-आधारित मार्गदर्शन",
  secStateBody: "हर संपत्ति अपने राज्य और ज़िले से मार्ग तय करती है। जहाँ राज्य की प्रक्रिया सत्यापित नहीं है, एक ईमानदार फ़ॉलबैक बताता है कि स्थानीय रूप से क्या पुष्टि करनी है।",
  secLangTitle: "आपकी भाषा में, एक आवाज़ के साथ",
  secLangBody: "पूरा अनुभव आपकी चुनी हुई भाषा का पालन करता है, पढ़कर सुनाने और एक वॉइस असिस्टेंट के साथ।",
  secSourcesTitle: "आधिकारिक स्रोतों पर आधारित",
  secSourcesBody: "हर मार्ग उस सरकारी या संस्थागत स्रोत से जुड़ा है जहाँ से वह आया, उसकी अंतिम-सत्यापन तिथि और किसी भी अनसुलझे क्षेत्र के साथ।",
  finalCtaTitle: "आज ही अपने परिवार की उत्तराधिकार यात्रा शुरू करें।",
  finalCtaBody: "हर संपत्ति के लिए एक स्पष्ट, निर्देशित मार्ग — आपकी भाषा में।",
  footerNote: "इनहेरिटेंस डेस्क — मार्गदर्शन, कानूनी सलाह नहीं।",
  acResidential: "आवासीय संपत्ति",
  acAgri: "कृषि भूमि",
  acCommercial: "वाणिज्यिक संपत्ति",
  acBankFd: "बैंक खाते और सावधि जमा",
  acShares: "शेयर और डीमैट होल्डिंग्स",
  acMutual: "म्यूचुअल फंड",
  acBonds: "बॉन्ड और सरकारी प्रतिभूतियाँ",
  acInsurance: "बीमा",
  acVehicles: "वाहन",
  acEpf: "ईपीएफ",
  acNps: "एनपीएस",
  acPension: "पेंशन",
  acBusiness: "व्यवसाय",
  acPartnership: "साझेदारी और एलएलपी",
  acPrivateShares: "निजी-कंपनी शेयर",
  acDigital: "डिजिटल खाते",
  acCrypto: "क्रिप्टो-संपत्तियाँ",
  acOverseas: "विदेशी संपत्तियाँ",
  acLiabilities: "संपदा देनदारियाँ",
  startYourCase: "अपना केस शुरू करें",
  tellUsTransfer: "हमें बताएं क्या स्थानांतरित करना है",
  assetProperty: "संपत्ति",
  assetBank: "बैंक खाते",
  assetInvest: "निवेश",
  assetBenefits: "लाभ",
  continueWord: "आगे बढ़ें",
  signInToSave: "अपना केस सहेजने और दोबारा खोलने के लिए साइन इन करें",
  jDeathCert: "मृत्यु प्रमाणपत्र",
  jHeirs: "उत्तराधिकारी पहचानें",
  jAuthority: "प्राधिकार स्थापित करें",
  jProperty: "संपत्ति स्थानांतरण",
  jFinancial: "वित्तीय संपत्ति दावा",
  jBenefits: "लाभ और पेंशन",
  jTax: "कर और देनदारियां",
  jClosure: "एस्टेट समापन",
  transferStageTitle: "आपको क्या-क्या स्थानांतरित करना है?",
  transferStageIntro: "परिवार को जिन संपत्तियों और वित्तीय आस्तियों का दावा या स्थानांतरण करना है, उन्हें जोड़ें। आपकी चरण-दर-चरण यात्रा इन्हीं से बनती है — आपसे दोबारा नहीं पूछा जाएगा।",
  generateJourney: "मेरी पूरी यात्रा बनाएँ →",
  journeyBuildFailed: "हम आपकी यात्रा नहीं बना सके। कृपया पुनः प्रयास करें।",
  retry: "पुनः प्रयास करें",
  addedSoFar: "अब तक जोड़ा गया",
  districtsUnavailable: "इस राज्य के ज़िले अभी उपलब्ध नहीं हैं — \"मुझे नहीं पता\" चुनें और स्थानीय कार्यालय से पुष्टि करें।",
};

// Tamil — machine-assisted, not professionally reviewed for legal terminology.
const ta: Dict = {
  brand: "இன்ஹெரிடன்ஸ் டெஸ்க்",
  tagline: "இந்தியாவில் ஒருவர் இறந்த பிறகு குடும்பங்களுக்கான வழிகாட்டி",
  importantNotice:
    "இது அதிகாரப்பூர்வ ஆதாரங்களை அடிப்படையாகக் கொண்ட தொடக்க வழிகாட்டல் மட்டுமே. இங்கு எந்த வழிமுறையும் சான்றளிக்கப்பட்ட, தயார் செய்யப்பட்ட சரிபார்ப்புப் பட்டியல் அல்ல; கட்டணங்கள், அலுவலகங்கள் அல்லது சட்டத் தேவைகளை நாங்கள் கற்பனையாக உருவாக்குவதில்லை. சிக்கலான அல்லது சர்ச்சைக்குரிய வழக்குகளுக்குத் தகுதியான நிபுணர் தேவை.",
  chooseLanguage: "மொழி",
  suggested: "பரிந்துரைக்கப்பட்டவை",
  assistantOnlyNote: "இயந்திர மொழிபெயர்ப்பு இடைமுகம் — சரிபார்க்கப்படவில்லை",
  signOut: "வெளியேறு",
  editCaseDetails: "வழக்கு விவரங்களைத் திருத்து",
  skipForNow: "இப்போதைக்குத் தவிர்",
  back: "பின்",
  next: "அடுத்து",
  finish: "முடி",
  iDontKnow: "எனக்குத் தெரியாது",
  startTitle: "தொடங்கு",
  startDemoDesc:
    "உள்ளூர் மதிப்பாய்வுக்கு டெமோ அணுகலைப் பயன்படுத்துங்கள். இது உண்மையான அரசு உள்நுழைவு அல்ல; செயற்கைத் தரவுடன் தற்காலிக டெமோ கணக்கை மட்டுமே உருவாக்குகிறது.",
  startDemo: "டெமோ அணுகலைத் தொடங்கு",
  newCaseTitle: "புதிய வழக்கைத் தொடங்கு",
  caseName: "இந்த வழக்குக்கு ஒரு பெயர் கொடுங்கள்",
  caseNamePlaceholder: "எ.கா., என் தந்தையின் சொத்து",
  createCase: "வழக்கை உருவாக்கி தொடங்கு",
  yourCases: "உங்கள் வழக்குகள்",
  loading: "ஏற்றுகிறது…",
  signInWithAadhaar: "ஆதார் மூலம் உள்நுழை (சாண்ட்பாக்ஸ்)",
  orDemo: "அல்லது டெமோ அணுகலுடன் தொடரவும்",
  yourNextStep: "உங்கள் அடுத்த படி",
  yourRoadmap: "உங்கள் திட்டவழி",
  roadmapEmpty: "தனிப்பயன் படிப்படியான திட்டத்தை உருவாக்க, கீழே உங்கள் வழக்கு விவரங்களையும் சொத்துக்களையும் சேர்க்கவும்.",
  assetsBenefits: "சொத்துக்கள் & பலன்கள்",
  noAssets: "இன்னும் எந்தச் சொத்தும் சேர்க்கப்படவில்லை.",
  addAssetTitle: "ஒரு சொத்து அல்லது பலனைச் சேர்",
  orientationOnly:
    "தொடக்க வழிகாட்டல் மட்டுமே — அதிகாரப்பூர்வ ஆதாரங்களை அடிப்படையாகக் கொண்டது, ஆனால் இங்கு எந்த வழியும் சான்றளிக்கப்பட்ட, தயார் செய்யப்பட்ட சரிபார்ப்புப் பட்டியல் அல்ல. அரசு/நிறுவனக் கட்டணங்கள் எந்தவொரு தள கட்டணத்திலிருந்தும் தனியானவை.",
  myProgress: "எனது முன்னேற்றம்",
  notOfficialStatus: "உங்கள் சொந்தக் கண்காணிப்பு — இது அதிகாரப்பூர்வ நிலை அல்ல.",
  showDetails: "விவரங்களைக் காட்டு",
  hideDetails: "விவரங்களை மறை",
  whatToDo: "என்ன செய்ய வேண்டும்:",
  exampleDocs: "எடுத்துக்காட்டு ஆவணங்கள் (முழுப் பட்டியல் அல்ல):",
  limits: "வரம்புகள்:",
  officialSources: "அதிகாரப்பூர்வ ஆதாரங்கள்:",
  assetType: "சொத்து அல்லது பலன் வகை",
  assetTypeSelect: "தேர்ந்தெடு…",
  shortLabel: "ஒரு சிறிய பெயர் (விருப்பம்)",
  institution: "நிறுவனம் (வங்கி / காப்பீட்டாளர் / AMC / பதிவாளர்), தெரிந்தால்",
  stateOfProperty: "சொத்து அமைந்துள்ள மாநிலம்/யூனியன் பிரதேசம்",
  district: "மாவட்டம்",
  recordType: "பதிவு வகை",
  addToEstate: "சொத்தில் சேர்",
  adding: "சேர்க்கிறது…",
  askAssistant: "உதவியாளரிடம் கேள்",
  assistantTitle: "உதவியாளர்",
  assistantIntro:
    "பதில்கள் உங்கள் வழக்குக்காக ஆராயப்பட்ட அதிகாரப்பூர்வ ஆதாரங்களிலிருந்து மட்டுமே வரும். உறுதியில்லாதபோது அதைச் சொல்லும்; கட்டணங்கள், அலுவலகங்கள் அல்லது சட்ட முடிவுகளை ஒருபோதும் கற்பனையாக உருவாக்காது.",
  aboutWhichAsset: "எந்தச் சொத்து பற்றி? (விருப்பம்)",
  generalCase: "பொது / முழு வழக்கு",
  askToBegin: "தொடங்க ஒரு கேள்வியைக் கேளுங்கள்.",
  send: "அனுப்பு",
  thinking: "யோசிக்கிறது…",
  you: "நீங்கள்",
  assistant: "உதவியாளர்",
  talkToAssistant: "உதவியாளருடன் பேசு",
  listening: "கேட்கிறது…",
  processing: "செயலாக்குகிறது…",
  speaking: "பேசுகிறது…",
  stop: "நிறுத்து",
  micConsentTitle: "உங்கள் மைக்ரோஃபோனைப் பயன்படுத்தலாமா?",
  micConsentBody:
    "நீங்கள் பேசு பொத்தானை அழுத்திப் பிடிக்கும்போது மட்டுமே மைக்ரோஃபோனைப் பயன்படுத்துகிறோம். ஒலி உங்கள் கேள்வியைப் புரிந்துகொள்ளச் செயலாக்கப்படுகிறது; இயல்பாக சேமிக்கப்படுவதில்லை.",
  allowMic: "மைக்ரோஃபோனை அனுமதி",
  micDenied: "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. நீங்கள் இன்னும் உங்கள் கேள்விகளைத் தட்டச்சு செய்யலாம்.",
  voiceUnsupported: "உங்கள் உலாவியில் இந்த மொழிக்கு குரல் ஆதரவு இல்லை. நீங்கள் இன்னும் படிக்கலாம், தட்டச்சு செய்யலாம்.",
  readScreenAloud: "இந்தத் திரையை உரக்கப் படி",
  confirmSave: "இந்தப் பதிலைச் சேமிக்கவா?",
  yesSave: "ஆம், சேமி",
  editAnswer: "திருத்து",
  speed: "வேகம்",
  stepOf: "படி {n} / {total}",
  changeLater: "எந்தப் பதிலையும் பின்னர் மாற்றலாம். மிகச் சரியாகப் பதிலளித்தால் மேலும் குறிப்பிட்ட திட்டம் கிடைக்கும்.",
  yes: "ஆம்",
  no: "இல்லை / இன்னும் இல்லை",
  haveCertificate: "ஆம், என்னிடம் உள்ளது",
  notYet: "இன்னும் இல்லை",
  willExists: "ஆம், உயில் உள்ளது",
  noWill: "உயில் இல்லை",
  onbName: "இறந்தவரின் முழுப் பெயர் என்ன?",
  onbNameHelp: "விரும்பினால் இதைத் தவிர்க்கலாம்.",
  onbResState: "இறப்பதற்கு முன் அவர் வழக்கமாக எந்த மாநிலம்/யூனியன் பிரதேசத்தில் வசித்தார்?",
  onbResStateHelp: "இது அவர் இறந்த இடம் அல்லது சொத்து உள்ள இடத்திலிருந்து வேறுபடலாம்.",
  onbResDistrict: "அவர் வழக்கமாக எந்த மாவட்டத்தில் வசித்தார்?",
  onbDeathState: "இறப்பு எந்த மாநிலம்/யூனியன் பிரதேசத்தில் நிகழ்ந்தது?",
  onbDeathStateHelp: "இறப்பு நிகழ்ந்த இடத்திலேயே பதிவு செய்யப்படுகிறது.",
  onbDeathDistrict: "இறப்பு எந்த மாவட்டத்தில் நிகழ்ந்தது?",
  onbDeathDate: "இறப்பு தேதி என்ன?",
  onbRegistered: "இறப்பு அரசிடம் பதிவு செய்யப்பட்டதா?",
  onbCertificate: "உங்களிடம் இறப்புச் சான்றிதழ் உள்ளதா?",
  onbWill: "உயில் இருந்ததா?",
  confirmToRefine: "இன்னும் குறிப்பிட்ட பதில் தர, தயவுசெய்து உறுதிப்படுத்துங்கள்:",
  onbCertCopies: "உங்களிடம் மரண சான்றிதழின் எத்தனை சான்றளிக்கப்பட்ட நகல்கள் உள்ளன?",
  onbApplicantRel: "இறந்தவருடன் உங்கள் உறவு என்ன?",
  onbApplicantRelHelp: "எ.கா. வாழ்க்கைத் துணை, மகன், மகள், பெற்றோர்.",
  onbWillRegistered: "உயில் பதிவு செய்யப்பட்டதா?",
  onbExecutor: "உயிலில் ஒரு நிர்வாகி (எக்ஸிகியூட்டர்) பெயரிடப்பட்டுள்ளதா?",
  onbProbate: "ஏதேனும் ப்ரோபேட் அல்லது நீதிமன்ற நடவடிக்கை ஏற்கனவே நடந்து வருகிறதா?",
  onbDispute: "குடும்பத் தகராறு, ஆட்சேபனை அல்லது காணாமல் போன வாரிசு உள்ளதா?",
  onbNri: "இறந்தவர் அல்லது ஏதேனும் வாரிசு வெளிநாட்டு வாசியா (NRI/OCI), அல்லது வெளிநாட்டு சொத்துக்கள் உள்ளனவா?",
  documentsTitle: "ஆவணங்கள்",
  docVaultIntro:
    "உங்கள் ஆவணங்களை இங்கே தனிப்பட்ட முறையில் வைத்திருங்கள். ஆவணத்தைப் பதிவேற்றுவது உங்கள் சொந்தப் பதிவுக்காக மட்டுமே — எந்த அலுவலகமும் அதை ஏற்றுக்கொண்டது என்று அர்த்தமல்ல.",
  uploadDoc: "ஆவணத்தைப் பதிவேற்று",
  labelDoc: "இது என்ன? (விருப்பம்)",
  noDocs: "இன்னும் எந்த ஆவணமும் பதிவேற்றப்படவில்லை.",
  docChecklist: "உங்கள் வழக்குக்குத் தேவைப்படக்கூடிய ஆவணங்கள்",
  viewDoc: "பார்",
  deleteDoc: "நீக்கு",
  confirmDelete: "நீக்குவதை உறுதிப்படுத்தவா?",
  uploading: "பதிவேற்றுகிறது…",
  scanNote: "கோப்புகள் தனிப்பட்ட முறையில் சேமிக்கப்படுகின்றன. தானியங்கி வைரஸ் ஸ்கேனிங் இன்னும் இயக்கப்படவில்லை.",
  docsForThisStep: "இந்தப் படிநிலைக்கான ஆவணங்கள்",
  yourPlanTitle: "உங்கள் தனிப்பயன் திட்டம்",
  yourPlanIntro: "கீழே உள்ள ஒவ்வொரு படியும் உங்கள் பதில்கள் மற்றும் நீங்கள் உள்ளிட்ட சொத்துகளிலிருந்து உருவாக்கப்பட்டது. மேலிருந்து கீழாகச் செயல்படுங்கள் — சொத்து உரிமைகோரல்கள் இணையாக நடக்கலாம்.",
  phaseDeath: "கட்டம் 1 · இறப்புப் பதிவு",
  phaseLegal: "கட்டம் 2 · வாரிசு யார்",
  phaseAssets: "கட்டம் 3 · உங்கள் சொத்துகள்",
  phaseAssetsIntro: "ஒவ்வொரு சொத்துக்கும் அதன் முழுமையான செயல்முறை கீழே உள்ளது — படிகள், ஆவணங்கள், அலுவலகங்கள், கட்டணங்கள் மற்றும் காலவரிசை.",
  assetWord: "சொத்து",
  reuseNote: "ஒரு ஆவணத்தை பல உரிமைகோரல்களில் மீண்டும் பயன்படுத்தலாம்.",
  myTracking: "எனது கண்காணிப்பு (இது அதிகாரப்பூர்வ நிலை அல்ல)",
  submittedOn: "சமர்ப்பித்த தேதி",
  officeWhere: "அலுவலகம் / எங்கு சமர்ப்பித்தது",
  ackNumber: "ஒப்புகை / குறிப்பு எண்",
  followUpDate: "பின்தொடர் தேதி",
  notesLabel: "குறிப்புகள்",
  save: "சேமி",
  saved: "சேமிக்கப்பட்டது",
  reminders: "நினைவூட்டல்கள் & பின்தொடர்தல்",
  overdue: "தாமதமானது",
  dueToday: "இன்று செலுத்த வேண்டியது",
  upcoming: "வரவிருக்கும்",
  noReminders: "இன்னும் பின்தொடர் தேதி இல்லை. கீழே எந்த படியிலும் சேர்க்கவும்.",
  journeyMap: "பயண வரைபடம்",
  mapHint: "விவரங்களைத் திறக்க ஒரு படியைத் தேர்ந்தெடுக்கவும்.",
  heroTitle: "பின்னால் விடப்பட்டதை எங்களிடம் சொல்லுங்கள்.",
  heroSub: "ஒவ்வொரு அடுத்த படியையும் நாங்கள் வழிகாட்டுவோம்.",
  heroSupporting: "சொத்து, வங்கிக் கணக்குகள், முதலீடுகள், காப்பீடு மற்றும் உங்கள் குடும்பம் மாற்ற வேண்டிய ஒவ்வொரு சொத்துக்கும் தனிப்பயன் பயணம் பெறுங்கள்.",
  glassHeading: "உங்கள் குடும்பத்தின் வழக்கைப் புரிந்துகொள்வோம்.",
  qAssetState: "சொத்து அமைந்துள்ள மாநிலம்",
  qSelectState: "மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
  qSelectDistrict: "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
  qSelectAsset: "சொத்தைத் தேர்ந்தெடுக்கவும்",
  trustSources: "அதிகாரப்பூர்வ ஆதாரங்கள்",
  trustVoice: "குரல் உதவி",
  trustState: "மாநில-சார்ந்த வழிகாட்டல்",
  pvDeath: "இறப்புச் சான்றிதழ்",
  pvHeirs: "சட்டப்பூர்வ வாரிசுகளை அடையாளம் காணுங்கள்",
  pvTransfer: "ஒவ்வொரு சொத்தையும் மாற்றுங்கள்",
  pvClaim: "பெயர் மாற்றம் அல்லது கோரிக்கையை நிறைவு செய்யுங்கள்",
  ctaPrimary: "எனது பயணத்தை உருவாக்கு",
  ctaSecondary: "இது எப்படி வேலை செய்கிறது என்று பாருங்கள்",
  trustLine: "அதிகாரப்பூர்வ அரசு மற்றும் நிறுவன ஆதாரங்களை அடிப்படையாகக் கொண்ட வழிகாட்டல்.",
  navHow: "எப்படி வேலை செய்கிறது",
  navCoverage: "நாங்கள் என்ன உள்ளடக்குகிறோம்",
  navLanguage: "மொழி",
  enterWithSound: "ஒலியுடன் நுழையுங்கள்",
  playMusic: "இசையை இயக்கு",
  pauseMusic: "இசையை இடைநிறுத்து",
  muteMusic: "இசையை முடக்கு",
  unmuteMusic: "இசையை இயக்கு",
  closeSound: "ஒலியை மூடு",
  volume: "ஒலியளவு",
  musicControls: "பின்னணி இசைக் கட்டுப்பாடுகள்",
  secJourneyTitle: "ஒரே வழிகாட்டப்பட்ட பயணம், தொடக்கம் முதல் இறுதி வரை",
  secJourneyBody: "ஒவ்வொரு சான்றிதழ், அலுவலகம் மற்றும் கோரிக்கையும் ஒரே சார்பு-பாதையில் இணைக்கப்பட்டுள்ளது — அடுத்த படி எப்போதும் தெரியும்.",
  secCoverageTitle: "ஒவ்வொரு சொத்தும், ஒரே இடத்தில்",
  secCoverageBody: "குடும்ப வீட்டிலிருந்து டீமேட் கணக்கு வரை, ஒவ்வொரு சொத்துக்கும் அதன் சொந்த மாநில-சார்ந்த, ஆதார-அடிப்படையிலான பாதை உண்டு.",
  secHowTitle: "இது எப்படி வேலை செய்கிறது",
  step1Title: "வழக்கைப் பற்றி எங்களிடம் சொல்லுங்கள்",
  step1Desc: "குடும்பம், சொத்துகள் மற்றும் சூழ்நிலை பற்றிய குறுகிய, வழிகாட்டப்பட்ட கேள்வித்தொகுப்புக்கு பதிலளியுங்கள்.",
  step2Title: "உங்கள் தனிப்பயன் வழித்திட்டத்தைப் பெறுங்கள்",
  step2Desc: "தேர்ந்தெடுக்கப்பட்ட மாநிலம் மற்றும் ஒவ்வொரு சொத்திலிருந்தும் தீர்க்கப்பட்ட ஒரு இணைந்த பயணத்தை நாங்கள் உருவாக்குகிறோம்.",
  step3Title: "ஒவ்வொரு மாற்றத்தையும் நிறைவு செய்யுங்கள்",
  step3Desc: "தெளிவான படிகளைப் பின்பற்றுங்கள், முன்னேற்றத்தைக் கண்காணியுங்கள், ஒவ்வொரு ஆவணத்தையும் ஒரே இடத்தில் வைக்கவும்.",
  secStateTitle: "மாநில-சார்ந்த வழிகாட்டல்",
  secStateBody: "ஒவ்வொரு சொத்தும் அதன் சொந்த மாநிலம் மற்றும் மாவட்டத்திலிருந்து பாதை அமைக்கிறது. மாநிலத்திற்கு சரிபார்க்கப்பட்ட நடைமுறை இல்லாத இடத்தில், உள்ளூரில் எதை உறுதிசெய்ய வேண்டும் என்பதை நேர்மையான ஃபால்பேக் கூறுகிறது.",
  secLangTitle: "உங்கள் மொழியில், ஒரு குரலுடன்",
  secLangBody: "முழு அனுபவமும் நீங்கள் தேர்ந்தெடுத்த மொழியைப் பின்பற்றுகிறது, படித்துக்காட்டல் மற்றும் குரல் உதவியாளருடன்.",
  secSourcesTitle: "அதிகாரப்பூர்வ ஆதாரங்களில் அடித்தளம்",
  secSourcesBody: "ஒவ்வொரு பாதையும் அது வந்த அரசு அல்லது நிறுவன ஆதாரத்துடன், அதன் கடைசி-சரிபார்ப்பு தேதி மற்றும் தீர்க்கப்படாத புலங்களுடன் இணைக்கப்பட்டுள்ளது.",
  finalCtaTitle: "இன்றே உங்கள் குடும்பத்தின் வாரிசு பயணத்தைத் தொடங்குங்கள்.",
  finalCtaBody: "ஒவ்வொரு சொத்துக்கும் தெளிவான, வழிகாட்டப்பட்ட பாதை — உங்கள் மொழியில்.",
  footerNote: "இன்ஹெரிட்டன்ஸ் டெஸ்க் — வழிகாட்டல், சட்ட ஆலோசனை அல்ல.",
  acResidential: "குடியிருப்பு சொத்து",
  acAgri: "விவசாய நிலம்",
  acCommercial: "வணிக சொத்து",
  acBankFd: "வங்கிக் கணக்குகள் & நிலையான வைப்புகள்",
  acShares: "பங்குகள் & டீமேட் இருப்புகள்",
  acMutual: "பரஸ்பர நிதிகள்",
  acBonds: "பத்திரங்கள் & அரசு பத்திரங்கள்",
  acInsurance: "காப்பீடு",
  acVehicles: "வாகனங்கள்",
  acEpf: "இபிஎஃப்",
  acNps: "என்பிஎஸ்",
  acPension: "ஓய்வூதியம்",
  acBusiness: "வணிகங்கள்",
  acPartnership: "கூட்டாண்மைகள் & எல்எல்பி",
  acPrivateShares: "தனியார்-நிறுவனப் பங்குகள்",
  acDigital: "டிஜிட்டல் கணக்குகள்",
  acCrypto: "கிரிப்டோ சொத்துகள்",
  acOverseas: "வெளிநாட்டு சொத்துகள்",
  acLiabilities: "எஸ்டேட் பொறுப்புகள்",
  startYourCase: "உங்கள் வழக்கைத் தொடங்குங்கள்",
  tellUsTransfer: "என்ன மாற்ற வேண்டும் என்று சொல்லுங்கள்",
  assetProperty: "சொத்து",
  assetBank: "வங்கிக் கணக்குகள்",
  assetInvest: "முதலீடுகள்",
  assetBenefits: "பலன்கள்",
  continueWord: "தொடரவும்",
  signInToSave: "உங்கள் வழக்கைச் சேமித்து மீண்டும் திறக்க உள்நுழையவும்",
  jDeathCert: "இறப்புச் சான்றிதழ்",
  jHeirs: "வாரிசுகளை அடையாளம் காணவும்",
  jAuthority: "அதிகாரத்தை நிறுவவும்",
  jProperty: "சொத்து மாற்றம்",
  jFinancial: "நிதிச் சொத்து உரிமைகோரல்",
  jBenefits: "பலன்கள் & ஓய்வூதியம்",
  jTax: "வரி & பொறுப்புகள்",
  jClosure: "எஸ்டேட் நிறைவு",
  transferStageTitle: "நீங்கள் எதையெல்லாம் மாற்ற வேண்டும்?",
  transferStageIntro: "குடும்பம் உரிமைகோர அல்லது மாற்ற வேண்டிய ஒவ்வொரு சொத்து மற்றும் நிதிச் சொத்தையும் சேர்க்கவும். உங்கள் படிப்படியான பயணம் இவற்றிலிருந்தே உருவாக்கப்படுகிறது — மீண்டும் கேட்கப்படமாட்டீர்கள்.",
  generateJourney: "எனது முழு பயணத்தை உருவாக்கு →",
  journeyBuildFailed: "உங்கள் பயணத்தை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  retry: "மீண்டும் முயற்சி",
  addedSoFar: "இதுவரை சேர்க்கப்பட்டது",
  districtsUnavailable: "இந்த மாநிலத்திற்கான மாவட்டங்கள் இன்னும் கிடைக்கவில்லை — \"எனக்குத் தெரியாது\" என்பதைத் தேர்ந்தெடுத்து உள்ளூர் அலுவலகத்துடன் உறுதிப்படுத்தவும்.",
};

// Reviewed, hand-authored dictionaries.
const REVIEWED: Record<string, Partial<Dict>> = { en, hi, ta };

// Pre-generated static dictionaries for every other supported locale (translated once
// from the canonical English catalogue via scripts/gen-translations.ts and SHIPPED, so
// the whole UI switches language instantly and completely — no per-load runtime call).
// Regenerate after changing the English catalogue: `node --experimental-strip-types
// scripts/gen-translations.ts` (server up), which rewrites these files.
import bn from "./generated/bn.json" with { type: "json" };
import te from "./generated/te.json" with { type: "json" };
import mr from "./generated/mr.json" with { type: "json" };
import kn from "./generated/kn.json" with { type: "json" };
import gu from "./generated/gu.json" with { type: "json" };
import pa from "./generated/pa.json" with { type: "json" };
import ml from "./generated/ml.json" with { type: "json" };
import or from "./generated/or.json" with { type: "json" };
import ur from "./generated/ur.json" with { type: "json" };

const GENERATED: Record<string, Partial<Dict>> = {
  bn: bn as Partial<Dict>, te: te as Partial<Dict>, mr: mr as Partial<Dict>,
  kn: kn as Partial<Dict>, gu: gu as Partial<Dict>, pa: pa as Partial<Dict>,
  ml: ml as Partial<Dict>, or: or as Partial<Dict>, ur: ur as Partial<Dict>,
};

const DICTS: Record<string, Partial<Dict>> = { ...REVIEWED, ...GENERATED };

/** Canonical catalogue: message id -> English source. The single source of truth. */
export const CANONICAL: Dict = en;
export const MESSAGE_IDS = Object.keys(en) as MessageKey[];
/** Every locale that has a shipped static dictionary (reviewed or generated). */
export const STATIC_LOCALES = Object.keys(DICTS);
/** Locales whose dictionary is hand-reviewed (vs. machine-generated). */
export const REVIEWED_LOCALES = new Set(Object.keys(REVIEWED));
export { DICTS };

export function translate(locale: string, key: MessageKey): string {
  const dict = DICTS[locale];
  return (dict && dict[key]) || en[key];
}

/** True when a shipped static dictionary exists (so no runtime translation needed). */
export function hasReviewedUi(locale: string): boolean {
  return locale in DICTS;
}

/** True only for hand-reviewed locales (for the honest "machine-translated" note). */
export function isReviewedLocale(locale: string): boolean {
  return REVIEWED_LOCALES.has(locale);
}
