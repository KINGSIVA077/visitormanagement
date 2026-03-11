const translations = {
    en: {
        welcome: "Welcome to VisitorGate",
        scan_to_reg: "Scan to Register",
        pending_approvals: "Pending Approvals",
        staff_portal: "Staff Portal",
        approve: "Approve",
        reject: "Reject",
        busy: "Busy",
        checkin: "Check In",
        checkout: "Check Out",
        visitor_name: "Visitor Name",
        phone: "Phone Number",
        dept: "Department",
        staff: "Staff member",
        purpose: "Purpose of Visit",
        submit: "Submit Request",
        waiting: "Waiting for approval...",
        approved: "Approved",
        rejected: "Rejected",
        visitor_history: "Visitor History",
        active_requests: "Active Requests",
        no_requests: "No visitor requests yet.",
        sign_out: "Sign Out",
        enter_reason: "Enter rejection reason (optional):"
    },
    ta: {
        welcome: "விசிட்டர்கேட்-க்கு வரவேற்கிறோம்",
        scan_to_reg: "பதிவு செய்ய ஸ்கேன் செய்யவும்",
        pending_approvals: "நிலுவையில் உள்ள அனுமதிகள்",
        staff_portal: "பணியாளர் போர்ட்டல்",
        approve: "அனுமதி",
        reject: "நிராகரி",
        busy: "வேலையாக இருக்கிறேன்",
        checkin: "உள்ளே நுழைய",
        checkout: "வெளியேற",
        visitor_name: "சந்திக்க வருபவர் பெயர்",
        phone: "தொலைபேசி எண்",
        dept: "துறை",
        staff: "சந்திக்க வேண்டிய பணியாளர்",
        purpose: "வருகையின் காரணம்",
        submit: "விண்ணப்பிக்கவும்",
        waiting: "அனுமதிக்காக காத்திருக்கிறோம்...",
        approved: "அனுமதிக்கப்பட்டது",
        rejected: "நிராகரிக்கப்பட்டது",
        visitor_history: "வருகையாளர் வரலாறு",
        active_requests: "தற்போதைய கோரிக்கைகள்",
        no_requests: "கோரிக்கைகள் எதுவும் இல்லை.",
        sign_out: "வெளியேறவும்",
        enter_reason: "நிராகரிப்பதற்கான காரணத்தை உள்ளிடவும் (விருப்பப்பட்டால்):"
    },
    hi: {
        welcome: "विज़िटरगेट में आपका स्वागत है",
        scan_to_reg: "पंजीकरण के लिए स्कैन करें",
        pending_approvals: "लंबित अनुमोदन",
        staff_portal: "स्टाफ पोर्टल",
        approve: "मंजूर करें",
        reject: "अस्वीकार करें",
        busy: "व्यस्त हूँ",
        checkin: "चेक-इन",
        checkout: "चेक-आउट",
        visitor_name: "आगंतुक का नाम",
        phone: "फ़ोन नंबर",
        dept: "विभाग",
        staff: "स्टाफ सदस्य",
        purpose: "आने का उद्देश्य",
        submit: "अनुरोध जमा करें",
        waiting: "अनुमोदन की प्रतीक्षा है...",
        approved: "अनुमोदित",
        rejected: "अस्वीकृत",
        visitor_history: "आगंतुक इतिहास",
        active_requests: "सक्रिय अनुरोध",
        no_requests: "अभी कोई अनुरोध नहीं है।",
        sign_out: "साइन आउट",
        enter_reason: "अस्वीकृति का कारण दर्ज करें (वैकल्पिक):"
    }
};

const lang = {
    current: localStorage.getItem('vms_lang') || 'en',
    t(key) {
        if (!translations[this.current] || !translations[this.current][key]) {
            return translations['en'][key] || key;
        }
        return translations[this.current][key];
    },
    set(l) {
        this.current = l;
        localStorage.setItem('vms_lang', l);
        location.reload();
    },
    init() {
        document.querySelectorAll('[data-lang]').forEach(el => {
            const key = el.getAttribute('data-lang');
            if (translations[this.current] && translations[this.current][key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translations[this.current][key];
                } else {
                    el.textContent = translations[this.current][key];
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => lang.init());
window.lang = lang;
