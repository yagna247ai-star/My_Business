/* AI Accelerator Hub v3 — i18n (REQ-I18N-01).
   Shell, navigation and key actions are translated; long-form content falls
   back to English and is flagged, so switching language never loses progress. */
(function (AH) {
  'use strict';
  const DICT = {
    en: {
      lang: 'English', here: 'You are here', search: 'Search or jump to…',
      g_learn: 'Learn', g_community: 'Community', g_support: 'Support', g_review: 'Review', g_program: 'Program', g_account: 'Account',
      mission: 'Mission Control', journey: 'Journey', tracks: 'Career Tracks', achievements: 'Achievements', standings: 'Standings',
      feed: 'Cohort Feed', library: 'Library', launch: 'Launch Wall', coaches: 'AI Coaches', settings: 'Settings',
      review: 'Review Queue', analytics: 'Cohort Analytics', learners: 'Learners', audit: 'Audit & Integrity',
      notifications: 'Notifications', markAll: 'Mark all as read', continue: 'Continue', askCoach: 'Ask a coach',
      switchRole: 'Switch workspace role', resetDemo: 'Reset demo data', signOut: 'Sign out', untranslated: 'Page content is shown in English while translation is in progress.'
    },
    hi: {
      lang: 'हिन्दी', here: 'आप यहाँ हैं', search: 'खोजें या जाएँ…',
      g_learn: 'सीखें', g_community: 'समुदाय', g_support: 'सहायता', g_review: 'समीक्षा', g_program: 'प्रोग्राम', g_account: 'खाता',
      mission: 'मिशन कंट्रोल', journey: 'यात्रा', tracks: 'करियर ट्रैक', achievements: 'उपलब्धियाँ', standings: 'रैंकिंग',
      feed: 'कोहोर्ट फ़ीड', library: 'लाइब्रेरी', launch: 'लॉन्च वॉल', coaches: 'AI कोच', settings: 'सेटिंग्स',
      review: 'समीक्षा कतार', analytics: 'कोहोर्ट एनालिटिक्स', learners: 'शिक्षार्थी', audit: 'ऑडिट और सत्यता',
      notifications: 'सूचनाएँ', markAll: 'सभी को पढ़ा हुआ करें', continue: 'जारी रखें', askCoach: 'कोच से पूछें',
      switchRole: 'भूमिका बदलें', resetDemo: 'डेमो डेटा रीसेट करें', signOut: 'साइन आउट', untranslated: 'अनुवाद जारी है, इसलिए पेज की सामग्री अंग्रेज़ी में दिखाई जा रही है।'
    },
    te: {
      lang: 'తెలుగు', here: 'మీరు ఇక్కడ ఉన్నారు', search: 'వెతకండి లేదా వెళ్ళండి…',
      g_learn: 'నేర్చుకోండి', g_community: 'సమాజం', g_support: 'సహాయం', g_review: 'సమీక్ష', g_program: 'ప్రోగ్రామ్', g_account: 'ఖాతా',
      mission: 'మిషన్ కంట్రోల్', journey: 'ప్రయాణం', tracks: 'కెరీర్ ట్రాక్‌లు', achievements: 'విజయాలు', standings: 'ర్యాంకింగ్‌లు',
      feed: 'కోహోర్ట్ ఫీడ్', library: 'లైబ్రరీ', launch: 'లాంచ్ వాల్', coaches: 'AI కోచ్‌లు', settings: 'సెట్టింగ్‌లు',
      review: 'సమీక్ష క్యూ', analytics: 'కోహోర్ట్ అనలిటిక్స్', learners: 'అభ్యాసకులు', audit: 'ఆడిట్ & సమగ్రత',
      notifications: 'నోటిఫికేషన్‌లు', markAll: 'అన్నీ చదివినట్లు గుర్తించండి', continue: 'కొనసాగించండి', askCoach: 'కోచ్‌ను అడగండి',
      switchRole: 'పాత్రను మార్చండి', resetDemo: 'డెమో డేటాను రీసెట్ చేయండి', signOut: 'సైన్ అవుట్', untranslated: 'అనువాదం జరుగుతోంది, కాబట్టి పేజీ కంటెంట్ ఆంగ్లంలో చూపబడుతోంది.'
    }
  };
  AH.LANGS = Object.keys(DICT).map(k => ({ code: k, label: DICT[k].lang }));
  AH.t = key => {
    const lang = (AH.S && AH.S.prefs.lang) || 'en';
    return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
  };
})(window.AH = window.AH || {});
