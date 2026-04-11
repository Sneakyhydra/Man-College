export type QueueLocale = "en" | "hi";

export const QUEUE_LOCALE_STORAGE_KEY = "man-college-queue-locale";

const en = {
  pageTitle: "Patient queue",
  pageSubtitle:
    "Enter your patient ID, name, mobile number, and preferred date to reserve a place in the queue.",
  languageLabel: "Language",
  tabEnglish: "English",
  tabHindi: "हिन्दी",
  importantNotesTitle: "Important notes",
  importantNotes: [
    "Use the exact patient ID provided by your internal registration system.",
    "If this is a new patient, choose the new-patient option and leave patient ID blank.",
    "One patient ID can be queued only once per selected day.",
    "A patient cannot join the queue again if they already have an upcoming queued visit.",
    "If the queue is full for a date, please choose a different day.",
  ],
  importantNotesHelpBefore: "For help, call ",
  importantNotesHelpAfter: ".",
  joinTitle: "Join the queue",
  joinIntro: (max: number, days: number) =>
    `Each day has its own queue with a maximum capacity of ${max} patients. You can reserve a day within the next ${days} days.`,
  manageTitle: "Manage appointment",
  manageIntro:
    "Already queued? You can cancel your visit or reschedule to another available date.",
  calendarTitle: "30-day queue calendar",
  calendarHint: "Select a day to set your queue date.",
  remaining: "Remaining",
  registered: "Registered",
  open: "Open",
  full: "Full",
  formVisitDate: "Visit date",
  formVisitDatePlaceholder: "Select a date from calendar",
  formPatientTypeLegend: "Are you a new patient?",
  formExistingPatient: "No, I am an existing patient",
  formNewPatient: "Yes, I am a new patient",
  formPatientId: "Patient ID",
  formPatientIdPlaceholder: "Example: MAN1234",
  formPatientName: "Patient name",
  formMobile: "Mobile number",
  formJoinQueue: "Join queue",
  formJoining: "Joining queue...",
  formMaxPerDay: (max: number) =>
    `Each day allows a maximum of ${max} patients.`,
  formErrPatientType:
    "Please select whether you are a new or existing patient.",
  formErrNoDate: "Please select a date from the calendar first.",
  formErrGeneric: "Failed to join queue.",
  formErrNetwork: "Network error. Please try again.",
  formSuccessAlready: "You have already entered the queue",
  formSuccessJoined: "Queue joined successfully",
  formVisitDetails: "Visit details",
  formVisitDateLabel: "Visit date",
  formQueueNumber: "Queue number",
  formReferenceId: "Reference ID",
  managePatientType: "Patient type",
  manageExistingPatient: "Existing patient",
  manageNewPatient: "New patient",
  manageAction: "Action",
  manageCancel: "Cancel appointment",
  manageReschedule: "Reschedule appointment",
  manageNewVisitDate: "New visit date",
  manageUpdating: "Updating...",
  manageErrGeneric: "Could not update appointment.",
  manageErrNetwork: "Network error. Please try again.",
  manageResultCancel: (message: string, date: string, num: number) =>
    `${message} Visit: ${date}, Queue #${num}.`,
  manageResultReschedule: (
    message: string,
    oldD: string,
    newD: string,
    num: number,
  ) => `${message} ${oldD} → ${newD}, new Queue #${num}.`,
} as const;

const hi = {
  pageTitle: "मरीज़ कतार",
  pageSubtitle:
    "कतार में जगह सुरक्षित करने के लिए अपना मरीज़ ID, नाम, मोबाइल नंबर और पसंदीदा तारीख दर्ज करें।",
  languageLabel: "भाषा",
  tabEnglish: "English",
  tabHindi: "हिन्दी",
  importantNotesTitle: "महत्वपूर्ण जानकारी",
  importantNotes: [
    "आंतरिक पंजीकरण प्रणाली द्वारा दिए गए सटीक मरीज़ ID का उपयोग करें।",
    "यदि नया मरीज़ है, तो ‘नया मरीज़’ विकल्प चुनें और मरीज़ ID खाली छोड़ दें।",
    "एक मरीज़ ID चुनी गई तारीख पर केवल एक बार कतार में हो सकता है।",
    "यदि मरीज़ की पहले से कोई आगामी कतार भरी यात्रा है, तो फिर से कतार में नहीं जा सकता।",
    "यदि किसी तारीख की कतार भर गई हो, तो कृपया दूसरी तारीख चुनें।",
  ],
  importantNotesHelpBefore: "सहायता के लिए कॉल करें ",
  importantNotesHelpAfter: "।",
  joinTitle: "कतार में शामिल हों",
  joinIntro: (max: number, days: number) =>
    `प्रत्येक दिन की अपनी कतार होती है, अधिकतम ${max} मरीज़। आप अगले ${days} दिनों के भीतर एक दिन आरक्षित कर सकते हैं।`,
  manageTitle: "अपॉइंटमेंट प्रबंधित करें",
  manageIntro:
    "पहले से कतार में हैं? अपनी यात्रा रद्द करें या किसी अन्य उपलब्ध तारीख पर बदलें।",
  calendarTitle: "30-दिन की कतार कैलेंडर",
  calendarHint: "अपनी कतार की तारीख चुनने के लिए एक दिन पर क्लिक करें।",
  remaining: "शेष",
  registered: "पंजीकृत",
  open: "खुला",
  full: "पूर्ण",
  formVisitDate: "यात्रा की तारीख",
  formVisitDatePlaceholder: "कैलेंडर से तारीख चुनें",
  formPatientTypeLegend: "क्या आप नए मरीज़ हैं?",
  formExistingPatient: "नहीं, मैं पहले से पंजीकृत मरीज़ हूँ",
  formNewPatient: "हाँ, मैं नया मरीज़ हूँ",
  formPatientId: "मरीज़ ID",
  formPatientIdPlaceholder: "उदाहरण: MAN1234",
  formPatientName: "मरीज़ का नाम",
  formMobile: "मोबाइल नंबर",
  formJoinQueue: "कतार में शामिल हों",
  formJoining: "शामिल हो रहे हैं...",
  formMaxPerDay: (max: number) =>
    `प्रत्येक दिन अधिकतम ${max} मरीज़ स्वीकार किए जाते हैं।`,
  formErrPatientType: "कृपया बताएँ कि आप नए मरीज़ हैं या पहले से पंजीकृत।",
  formErrNoDate: "कृपया पहले कैलेंडर से एक तारीख चुनें।",
  formErrGeneric: "कतार में शामिल नहीं हो सके।",
  formErrNetwork: "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।",
  formSuccessAlready: "आप पहले ही कतार में हैं",
  formSuccessJoined: "कतार में सफलतापूर्वक शामिल हुए",
  formVisitDetails: "यात्रा विवरण",
  formVisitDateLabel: "यात्रा की तारीख",
  formQueueNumber: "कतार संख्या",
  formReferenceId: "संदर्भ ID",
  managePatientType: "मरीज़ प्रकार",
  manageExistingPatient: "पंजीकृत मरीज़",
  manageNewPatient: "नया मरीज़",
  manageAction: "कार्रवाई",
  manageCancel: "अपॉइंटमेंट रद्द करें",
  manageReschedule: "अपॉइंटमेंट पुनर्निर्धारित करें",
  manageNewVisitDate: "नई यात्रा तारीख",
  manageUpdating: "अपडेट हो रहा है...",
  manageErrGeneric: "अपॉइंटमेंट अपडेट नहीं हो सका।",
  manageErrNetwork: "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।",
  manageResultCancel: (message: string, date: string, num: number) =>
    `${message} यात्रा: ${date}, कतार #${num}।`,
  manageResultReschedule: (
    message: string,
    oldD: string,
    newD: string,
    num: number,
  ) => `${message} ${oldD} → ${newD}, नई कतार #${num}।`,
} as const;

export const queueMessages = { en, hi } as const;

export type QueueMessages = (typeof queueMessages)[QueueLocale];

export function getQueueMessages(locale: QueueLocale): QueueMessages {
  return queueMessages[locale];
}
