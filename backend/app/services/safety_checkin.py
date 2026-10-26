"""
Guided, adaptive pre-payment Safety Check-in.

Engine: deterministic rules (no LLM). The next question depends on the payment's
objective risk tier and the user's previous answers. Reassuring answers can never
lower the tier set by the objective payment signals (anti-coaching), and answers
that contradict earlier details or the call-state signal raise the tier.

Languages: English, Hindi, Marathi, Kannada. Non-English text was written for this
prototype and still needs native-speaker review before use with real users.
Free-text analysis uses the existing rule engine, which is tested on English,
Hindi (Devanagari) and Hinglish only.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from backend.app.services.transaction_risk import (
    CALL_STATE_DEMO, CALL_STATE_NONE, TIER_ORDER, tier_max,
)

SUPPORTED_LANGUAGES = ("en", "hi", "mr", "kn")
FREE_TEXT_MAX_CHARS = 500

YES_NO_UNSURE = [
    ("yes", {"en": "Yes", "hi": "हाँ", "mr": "होय", "kn": "ಹೌದು"}),
    ("no", {"en": "No", "hi": "नहीं", "mr": "नाही", "kn": "ಇಲ್ಲ"}),
    ("unsure", {"en": "Not sure", "hi": "पक्का नहीं पता", "mr": "खात्री नाही", "kn": "ಖಚಿತವಿಲ್ಲ"}),
]

QUESTIONS: Dict[str, Dict] = {
    "Q_CALL": {
        "kind": "single_choice",
        "prompt": {
            "en": "Is anyone on a phone or video call with you right now, or did someone call you about this payment?",
            "hi": "क्या अभी कोई आपसे फ़ोन या वीडियो कॉल पर है, या किसी ने इस भुगतान के बारे में आपको कॉल किया था?",
            "mr": "आत्ता कोणी तुमच्याशी फोन किंवा व्हिडिओ कॉलवर आहे का, किंवा या पेमेंटबद्दल कोणी तुम्हाला कॉल केला होता का?",
            "kn": "ಈಗ ಯಾರಾದರೂ ನಿಮ್ಮೊಂದಿಗೆ ಫೋನ್ ಅಥವಾ ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿದ್ದಾರೆಯೇ, ಅಥವಾ ಈ ಪಾವತಿಯ ಬಗ್ಗೆ ಯಾರಾದರೂ ನಿಮಗೆ ಕರೆ ಮಾಡಿದ್ದರೇ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_WHO": {
        "kind": "single_choice",
        "prompt": {
            "en": "Who asked you to make this payment?",
            "hi": "यह भुगतान करने के लिए आपसे किसने कहा?",
            "mr": "हे पेमेंट करायला तुम्हाला कोणी सांगितले?",
            "kn": "ಈ ಪಾವತಿ ಮಾಡಲು ನಿಮಗೆ ಯಾರು ಹೇಳಿದರು?",
        },
        "options": [
            ("self", {
                "en": "No one — it is my own regular payment",
                "hi": "किसी ने नहीं — यह मेरा अपना नियमित भुगतान है",
                "mr": "कोणीही नाही — हे माझे नेहमीचे पेमेंट आहे",
                "kn": "ಯಾರೂ ಇಲ್ಲ — ಇದು ನನ್ನ ಸ್ವಂತ ನಿಯಮಿತ ಪಾವತಿ",
            }),
            ("business", {
                "en": "A shop or business I chose myself",
                "hi": "कोई दुकान या व्यवसाय जिसे मैंने खुद चुना",
                "mr": "मी स्वतः निवडलेले दुकान किंवा व्यवसाय",
                "kn": "ನಾನೇ ಆಯ್ಕೆ ಮಾಡಿದ ಅಂಗಡಿ ಅಥವಾ ವ್ಯಾಪಾರ",
            }),
            ("known_person", {
                "en": "A family member or friend I spoke to in person",
                "hi": "परिवार का सदस्य या दोस्त, जिनसे मैंने खुद मिलकर बात की",
                "mr": "कुटुंबातील व्यक्ती किंवा मित्र, ज्यांच्याशी मी प्रत्यक्ष बोललो/बोलले",
                "kn": "ನಾನು ನೇರವಾಗಿ ಮಾತನಾಡಿದ ಕುಟುಂಬದ ಸದಸ್ಯ ಅಥವಾ ಸ್ನೇಹಿತ",
            }),
            ("caller_unknown", {
                "en": "Someone who called or messaged me",
                "hi": "कोई जिसने मुझे कॉल या मैसेज किया",
                "mr": "कोणीतरी ज्याने मला कॉल किंवा मेसेज केला",
                "kn": "ನನಗೆ ಕರೆ ಅಥವಾ ಸಂದೇಶ ಕಳುಹಿಸಿದ ಯಾರೋ",
            }),
            ("authority", {
                "en": "Someone saying they are from police, CBI, customs, court, a bank or a government office",
                "hi": "कोई जो खुद को पुलिस, CBI, कस्टम्स, कोर्ट, बैंक या सरकारी दफ़्तर से बता रहा है",
                "mr": "कोणी जो स्वतःला पोलीस, CBI, कस्टम्स, कोर्ट, बँक किंवा सरकारी कार्यालयातून असल्याचे सांगतो",
                "kn": "ಪೊಲೀಸ್, CBI, ಕಸ್ಟಮ್ಸ್, ನ್ಯಾಯಾಲಯ, ಬ್ಯಾಂಕ್ ಅಥವಾ ಸರ್ಕಾರಿ ಕಚೇರಿಯಿಂದ ಎಂದು ಹೇಳಿಕೊಳ್ಳುವ ಯಾರೋ",
            }),
            ("online_group", {
                "en": "An online investment, job or task group",
                "hi": "कोई ऑनलाइन निवेश, नौकरी या टास्क ग्रुप",
                "mr": "ऑनलाइन गुंतवणूक, नोकरी किंवा टास्क ग्रुप",
                "kn": "ಆನ್‌ಲೈನ್ ಹೂಡಿಕೆ, ಉದ್ಯೋಗ ಅಥವಾ ಟಾಸ್ಕ್ ಗುಂಪು",
            }),
        ],
    },
    "Q_SECRECY": {
        "kind": "single_choice",
        "prompt": {
            "en": "Has anyone told you to keep this payment secret, or not to tell your family or bank?",
            "hi": "क्या किसी ने आपसे यह भुगतान गुप्त रखने, या अपने परिवार या बैंक को न बताने के लिए कहा है?",
            "mr": "हे पेमेंट गुप्त ठेवायला, किंवा तुमच्या कुटुंबाला किंवा बँकेला न सांगायला कोणी सांगितले आहे का?",
            "kn": "ಈ ಪಾವತಿಯನ್ನು ರಹಸ್ಯವಾಗಿಡಲು, ಅಥವಾ ನಿಮ್ಮ ಕುಟುಂಬ ಅಥವಾ ಬ್ಯಾಂಕ್‌ಗೆ ಹೇಳಬೇಡಿ ಎಂದು ಯಾರಾದರೂ ನಿಮಗೆ ಹೇಳಿದ್ದಾರೆಯೇ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_THREAT": {
        "kind": "single_choice",
        "prompt": {
            "en": "Were you told something bad will happen — arrest, a blocked account, a power cut or a penalty — if you do not pay quickly?",
            "hi": "क्या आपसे कहा गया कि जल्दी भुगतान न करने पर कुछ बुरा होगा — गिरफ़्तारी, खाता बंद, बिजली कटना या जुर्माना?",
            "mr": "लवकर पैसे न भरल्यास काहीतरी वाईट होईल — अटक, खाते बंद, वीज कापली जाणे किंवा दंड — असे तुम्हाला सांगितले गेले का?",
            "kn": "ಬೇಗ ಪಾವತಿಸದಿದ್ದರೆ ಏನಾದರೂ ಕೆಟ್ಟದ್ದು ಆಗುತ್ತದೆ — ಬಂಧನ, ಖಾತೆ ಸ್ಥಗಿತ, ವಿದ್ಯುತ್ ಕಡಿತ ಅಥವಾ ದಂಡ — ಎಂದು ನಿಮಗೆ ಹೇಳಲಾಗಿದೆಯೇ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_REMOTE": {
        "kind": "single_choice",
        "prompt": {
            "en": "Has anyone asked you to install an app, share your screen, or tell them an OTP or PIN?",
            "hi": "क्या किसी ने आपसे कोई ऐप इंस्टॉल करने, अपनी स्क्रीन शेयर करने, या OTP या PIN बताने को कहा है?",
            "mr": "कोणी तुम्हाला एखादे ॲप इंस्टॉल करायला, तुमची स्क्रीन शेअर करायला, किंवा OTP किंवा PIN सांगायला सांगितले आहे का?",
            "kn": "ಯಾರಾದರೂ ನಿಮಗೆ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಲು, ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಹಂಚಿಕೊಳ್ಳಲು, ಅಥವಾ OTP ಅಥವಾ PIN ಹೇಳಲು ಕೇಳಿದ್ದಾರೆಯೇ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_RETURNS": {
        "kind": "single_choice",
        "prompt": {
            "en": "Were you promised fixed or guaranteed profits, or asked to pay a fee to unlock or withdraw your earnings?",
            "hi": "क्या आपको तय या गारंटीड मुनाफ़े का वादा किया गया, या अपनी कमाई निकालने या अनलॉक करने के लिए फ़ीस भरने को कहा गया?",
            "mr": "तुम्हाला ठराविक किंवा खात्रीशीर नफ्याचे वचन दिले गेले, किंवा तुमची कमाई काढण्यासाठी किंवा अनलॉक करण्यासाठी शुल्क भरायला सांगितले गेले का?",
            "kn": "ನಿಮಗೆ ನಿಗದಿತ ಅಥವಾ ಖಚಿತ ಲಾಭದ ಭರವಸೆ ನೀಡಲಾಗಿದೆಯೇ, ಅಥವಾ ನಿಮ್ಮ ಗಳಿಕೆಯನ್ನು ಹಿಂಪಡೆಯಲು ಅಥವಾ ಅನ್‌ಲಾಕ್ ಮಾಡಲು ಶುಲ್ಕ ಕಟ್ಟಲು ಕೇಳಲಾಗಿದೆಯೇ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_VERIFIED": {
        "kind": "single_choice",
        "prompt": {
            "en": "Have you checked this request yourself using a phone number or office you already knew — not one they gave you?",
            "hi": "क्या आपने यह अनुरोध खुद उस फ़ोन नंबर या दफ़्तर से जाँचा है जो आपको पहले से पता था — उनका दिया हुआ नहीं?",
            "mr": "तुम्हाला आधीपासून माहीत असलेल्या फोन नंबरवर किंवा कार्यालयात — त्यांनी दिलेल्या नव्हे — ही विनंती तुम्ही स्वतः तपासली आहे का?",
            "kn": "ನಿಮಗೆ ಮೊದಲೇ ಗೊತ್ತಿದ್ದ ಫೋನ್ ಸಂಖ್ಯೆ ಅಥವಾ ಕಚೇರಿಯ ಮೂಲಕ — ಅವರು ಕೊಟ್ಟದ್ದಲ್ಲ — ಈ ವಿನಂತಿಯನ್ನು ನೀವೇ ಪರಿಶೀಲಿಸಿದ್ದೀರಾ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_COACHED": {
        "kind": "single_choice",
        "prompt": {
            "en": "Has anyone told you how to answer these questions, or is anyone watching your screen now?",
            "hi": "क्या किसी ने आपको बताया है कि इन सवालों के क्या जवाब देने हैं, या क्या अभी कोई आपकी स्क्रीन देख रहा है?",
            "mr": "या प्रश्नांची उत्तरे कशी द्यायची हे तुम्हाला कोणी सांगितले आहे का, किंवा आत्ता कोणी तुमची स्क्रीन पाहत आहे का?",
            "kn": "ಈ ಪ್ರಶ್ನೆಗಳಿಗೆ ಹೇಗೆ ಉತ್ತರಿಸಬೇಕೆಂದು ಯಾರಾದರೂ ನಿಮಗೆ ಹೇಳಿದ್ದಾರೆಯೇ, ಅಥವಾ ಈಗ ಯಾರಾದರೂ ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ನೋಡುತ್ತಿದ್ದಾರೆಯೇ?",
        },
        "options": YES_NO_UNSURE,
    },
    "Q_OWN_WORDS": {
        "kind": "free_text",
        "optional": True,
        "prompt": {
            "en": "In your own words, what is this payment for? (Optional — you can skip.)",
            "hi": "अपने शब्दों में बताइए, यह भुगतान किस लिए है? (वैकल्पिक — आप इसे छोड़ सकते हैं।)",
            "mr": "तुमच्या शब्दांत सांगा, हे पेमेंट कशासाठी आहे? (ऐच्छिक — तुम्ही हे वगळू शकता.)",
            "kn": "ನಿಮ್ಮ ಮಾತಿನಲ್ಲೇ ಹೇಳಿ, ಈ ಪಾವತಿ ಯಾವುದಕ್ಕಾಗಿ? (ಐಚ್ಛಿಕ — ನೀವು ಇದನ್ನು ಬಿಟ್ಟುಬಿಡಬಹುದು.)",
        },
        "options": [],
    },
}

REASON_LABELS: Dict[str, Dict[str, str]] = {
    "ACTIVE_CALL_REPORTED": {
        "en": "Someone is on a call with you about this payment",
        "hi": "इस भुगतान को लेकर कोई आपसे कॉल पर है",
        "mr": "या पेमेंटबद्दल कोणी तुमच्याशी कॉलवर आहे",
        "kn": "ಈ ಪಾವತಿಯ ಬಗ್ಗೆ ಯಾರೋ ನಿಮ್ಮೊಂದಿಗೆ ಕರೆಯಲ್ಲಿದ್ದಾರೆ",
    },
    "AUTHORITY_REQUEST": {
        "en": "The request came from someone claiming to be an official",
        "hi": "अनुरोध खुद को अधिकारी बताने वाले व्यक्ति से आया",
        "mr": "विनंती स्वतःला अधिकारी म्हणवणाऱ्या व्यक्तीकडून आली",
        "kn": "ಅಧಿಕಾರಿ ಎಂದು ಹೇಳಿಕೊಳ್ಳುವವರಿಂದ ವಿನಂತಿ ಬಂದಿದೆ",
    },
    "UNSOLICITED_REQUEST": {
        "en": "The request came from someone who contacted you",
        "hi": "अनुरोध ऐसे व्यक्ति से आया जिसने खुद आपसे संपर्क किया",
        "mr": "विनंती अशा व्यक्तीकडून आली ज्याने स्वतः तुमच्याशी संपर्क केला",
        "kn": "ನಿಮ್ಮನ್ನು ತಾವೇ ಸಂಪರ್ಕಿಸಿದವರಿಂದ ವಿನಂತಿ ಬಂದಿದೆ",
    },
    "ONLINE_GROUP_REQUEST": {
        "en": "The request came from an online investment, job or task group",
        "hi": "अनुरोध ऑनलाइन निवेश, नौकरी या टास्क ग्रुप से आया",
        "mr": "विनंती ऑनलाइन गुंतवणूक, नोकरी किंवा टास्क ग्रुपकडून आली",
        "kn": "ಆನ್‌ಲೈನ್ ಹೂಡಿಕೆ, ಉದ್ಯೋಗ ಅಥವಾ ಟಾಸ್ಕ್ ಗುಂಪಿನಿಂದ ವಿನಂತಿ ಬಂದಿದೆ",
    },
    "SECRECY_REPORTED": {
        "en": "You were asked to keep it secret",
        "hi": "आपसे इसे गुप्त रखने को कहा गया",
        "mr": "तुम्हाला हे गुप्त ठेवायला सांगितले गेले",
        "kn": "ಇದನ್ನು ರಹಸ್ಯವಾಗಿಡಲು ನಿಮಗೆ ಹೇಳಲಾಗಿದೆ",
    },
    "THREAT_REPORTED": {
        "en": "You were threatened with a penalty or a deadline",
        "hi": "आपको जुर्माने या समय-सीमा की धमकी दी गई",
        "mr": "तुम्हाला दंड किंवा मुदतीची धमकी दिली गेली",
        "kn": "ನಿಮಗೆ ದಂಡ ಅಥವಾ ಗಡುವಿನ ಬೆದರಿಕೆ ಹಾಕಲಾಗಿದೆ",
    },
    "REMOTE_ACCESS_REQUEST": {
        "en": "You were asked to install an app, share your screen, or reveal an OTP or PIN",
        "hi": "आपसे ऐप इंस्टॉल करने, स्क्रीन शेयर करने या OTP/PIN बताने को कहा गया",
        "mr": "तुम्हाला ॲप इंस्टॉल करायला, स्क्रीन शेअर करायला किंवा OTP/PIN सांगायला सांगितले गेले",
        "kn": "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಲು, ಸ್ಕ್ರೀನ್ ಹಂಚಲು ಅಥವಾ OTP/PIN ಹೇಳಲು ನಿಮಗೆ ಕೇಳಲಾಗಿದೆ",
    },
    "GUARANTEED_RETURNS_REPORTED": {
        "en": "You were promised guaranteed profits or asked to pay to withdraw",
        "hi": "आपको गारंटीड मुनाफ़े का वादा किया गया या पैसे निकालने के लिए भुगतान माँगा गया",
        "mr": "तुम्हाला खात्रीशीर नफ्याचे वचन दिले गेले किंवा पैसे काढण्यासाठी पेमेंट मागितले गेले",
        "kn": "ಖಚಿತ ಲಾಭದ ಭರವಸೆ ನೀಡಲಾಗಿದೆ ಅಥವಾ ಹಣ ಹಿಂಪಡೆಯಲು ಪಾವತಿ ಕೇಳಲಾಗಿದೆ",
    },
    "NOT_INDEPENDENTLY_VERIFIED": {
        "en": "The request has not been checked through a number you already knew",
        "hi": "अनुरोध को पहले से ज्ञात नंबर से जाँचा नहीं गया है",
        "mr": "विनंती आधीपासून माहीत असलेल्या नंबरवरून तपासलेली नाही",
        "kn": "ಮೊದಲೇ ಗೊತ್ತಿದ್ದ ಸಂಖ್ಯೆಯ ಮೂಲಕ ವಿನಂತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ",
    },
    "POSSIBLE_COACHING": {
        "en": "Someone may be guiding your answers",
        "hi": "हो सकता है कोई आपके जवाबों को निर्देशित कर रहा हो",
        "mr": "कदाचित कोणी तुमची उत्तरे ठरवत असेल",
        "kn": "ಯಾರೋ ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ನಿರ್ದೇಶಿಸುತ್ತಿರಬಹುದು",
    },
    "ANSWERS_CONTRADICT_SIGNALS": {
        "en": "Some answers differ from the earlier payment details or the call signal",
        "hi": "कुछ जवाब पहले दिए गए भुगतान विवरण या कॉल संकेत से मेल नहीं खाते",
        "mr": "काही उत्तरे आधीच्या पेमेंट तपशिलाशी किंवा कॉल संकेताशी जुळत नाहीत",
        "kn": "ಕೆಲವು ಉತ್ತರಗಳು ಹಿಂದಿನ ಪಾವತಿ ವಿವರಗಳು ಅಥವಾ ಕರೆ ಸಂಕೇತದೊಂದಿಗೆ ಹೊಂದುತ್ತಿಲ್ಲ",
    },
    "FREE_TEXT_RISK_TERMS": {
        "en": "Your description mentions common scam terms",
        "hi": "आपके विवरण में धोखाधड़ी से जुड़े आम शब्द हैं",
        "mr": "तुमच्या वर्णनात फसवणुकीशी संबंधित सामान्य शब्द आहेत",
        "kn": "ನಿಮ್ಮ ವಿವರಣೆಯಲ್ಲಿ ಸಾಮಾನ್ಯ ವಂಚನೆ ಪದಗಳಿವೆ",
    },
    "PAYMENT_DETAILS_HIGH_RISK": {
        "en": "The payment details themselves match known scam patterns",
        "hi": "भुगतान का विवरण ही जाने-पहचाने धोखाधड़ी के तरीकों से मेल खाता है",
        "mr": "पेमेंटचा तपशीलच ओळखीच्या फसवणुकीच्या पद्धतींशी जुळतो",
        "kn": "ಪಾವತಿಯ ವಿವರಗಳೇ ಪರಿಚಿತ ವಂಚನೆ ಮಾದರಿಗಳಿಗೆ ಹೊಂದುತ್ತವೆ",
    },
}

ACTION_MESSAGES: Dict[str, Dict[str, str]] = {
    "DO_NOT_PAY": {
        "en": "Please do not send this money now. Talk to a trusted family member or call 1930 first.",
        "hi": "कृपया अभी यह पैसा न भेजें। पहले किसी भरोसेमंद परिवारजन से बात करें या 1930 पर कॉल करें।",
        "mr": "कृपया आत्ता हे पैसे पाठवू नका. आधी विश्वासू कुटुंबीयांशी बोला किंवा 1930 वर कॉल करा.",
        "kn": "ದಯವಿಟ್ಟು ಈಗ ಈ ಹಣವನ್ನು ಕಳುಹಿಸಬೇಡಿ. ಮೊದಲು ನಂಬಿಕಸ್ಥ ಕುಟುಂಬದ ಸದಸ್ಯರೊಂದಿಗೆ ಮಾತನಾಡಿ ಅಥವಾ 1930 ಗೆ ಕರೆ ಮಾಡಿ.",
    },
    "WAIT_FOR_GUARDIAN": {
        "en": "This payment needs a quick check by your family member before it continues.",
        "hi": "आगे बढ़ने से पहले इस भुगतान की आपके परिवारजन द्वारा एक छोटी जाँच ज़रूरी है।",
        "mr": "पुढे जाण्यापूर्वी या पेमेंटची तुमच्या कुटुंबीयांकडून छोटी तपासणी आवश्यक आहे.",
        "kn": "ಮುಂದುವರಿಯುವ ಮೊದಲು ಈ ಪಾವತಿಯನ್ನು ನಿಮ್ಮ ಕುಟುಂಬದ ಸದಸ್ಯರು ಒಮ್ಮೆ ಪರಿಶೀಲಿಸಬೇಕು.",
    },
    "PAUSE_AND_VERIFY": {
        "en": "Pause and check this payment with someone you trust before sending.",
        "hi": "भेजने से पहले रुकें और किसी भरोसेमंद व्यक्ति से इस भुगतान की जाँच करवाएँ।",
        "mr": "पाठवण्यापूर्वी थांबा आणि विश्वासू व्यक्तीकडून हे पेमेंट तपासून घ्या.",
        "kn": "ಕಳುಹಿಸುವ ಮೊದಲು ನಿಲ್ಲಿಸಿ, ನಂಬಿಕಸ್ಥ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಈ ಪಾವತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    },
    "PROCEED_WITH_CARE": {
        "en": "No warning signs from your answers. Still check the payee name before entering your UPI PIN.",
        "hi": "आपके जवाबों में कोई चेतावनी संकेत नहीं मिला। फिर भी UPI PIN डालने से पहले प्राप्तकर्ता का नाम जाँच लें।",
        "mr": "तुमच्या उत्तरांमध्ये कोणतेही धोक्याचे संकेत आढळले नाहीत. तरीही UPI PIN टाकण्यापूर्वी प्राप्तकर्त्याचे नाव तपासा.",
        "kn": "ನಿಮ್ಮ ಉತ್ತರಗಳಲ್ಲಿ ಯಾವುದೇ ಎಚ್ಚರಿಕೆಯ ಸಂಕೇತಗಳಿಲ್ಲ. ಆದರೂ UPI PIN ನಮೂದಿಸುವ ಮೊದಲು ಸ್ವೀಕರಿಸುವವರ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ.",
    },
}

ANSWERS_CANNOT_CLEAR: Dict[str, str] = {
    "en": "Your answers alone cannot clear this payment, because the payment details themselves match known scam patterns.",
    "hi": "सिर्फ़ आपके जवाबों से यह भुगतान सुरक्षित नहीं माना जा सकता, क्योंकि भुगतान का विवरण ही जाने-पहचाने धोखाधड़ी के तरीकों से मेल खाता है।",
    "mr": "फक्त तुमच्या उत्तरांवरून हे पेमेंट सुरक्षित मानता येणार नाही, कारण पेमेंटचा तपशीलच ओळखीच्या फसवणुकीच्या पद्धतींशी जुळतो.",
    "kn": "ನಿಮ್ಮ ಉತ್ತರಗಳಿಂದಲೇ ಈ ಪಾವತಿಯನ್ನು ಸುರಕ್ಷಿತ ಎನ್ನಲಾಗದು, ಏಕೆಂದರೆ ಪಾವತಿಯ ವಿವರಗಳೇ ಪರಿಚಿತ ವಂಚನೆ ಮಾದರಿಗಳಿಗೆ ಹೊಂದುತ್ತವೆ.",
}

INVESTMENT_PURPOSE_TERMS = ("invest", "trading", "crypto", "task", "return", "profit", "earning")


@dataclass
class CheckinContext:
    objective_tier: str
    call_state: str = CALL_STATE_NONE
    authority_claimed: bool = False
    secrecy_demanded: bool = False
    guaranteed_returns: bool = False
    pressure_present: bool = False
    purpose: str = ""


@dataclass
class CheckinEvaluation:
    answer_tier: str
    final_tier: str
    reason_codes: List[str] = field(default_factory=list)
    answers_could_not_clear: bool = False


def normalize_language(language: Optional[str]) -> str:
    lang = (language or "en").lower()
    return lang if lang in SUPPORTED_LANGUAGES else "en"


def build_sequence(ctx: CheckinContext, answers: Dict[str, str]) -> List[str]:
    who = answers.get("Q_WHO")
    on_call = answers.get("Q_CALL") in ("yes", "unsure") or ctx.call_state != CALL_STATE_NONE
    elevated = ctx.objective_tier != "GREEN"
    contacted = who in ("caller_unknown", "authority")
    investment = (
        who == "online_group"
        or ctx.guaranteed_returns
        or any(t in (ctx.purpose or "").lower() for t in INVESTMENT_PURPOSE_TERMS)
    )

    seq = ["Q_CALL", "Q_WHO"]
    if contacted or on_call or elevated:
        seq += ["Q_SECRECY", "Q_THREAT", "Q_REMOTE"]
    if investment:
        seq += ["Q_RETURNS", "Q_REMOTE"]
    concerning = contacted or on_call or elevated or investment or _has_concerning_answer(answers)
    if concerning:
        seq += ["Q_VERIFIED", "Q_COACHED"]
    seq.append("Q_OWN_WORDS")
    return list(dict.fromkeys(seq))


def _has_concerning_answer(answers: Dict[str, str]) -> bool:
    return any(answers.get(q) in ("yes", "unsure") for q in ("Q_SECRECY", "Q_THREAT", "Q_REMOTE", "Q_RETURNS"))


def next_question_id(ctx: CheckinContext, answers: Dict[str, str]) -> Optional[str]:
    for qid in build_sequence(ctx, answers):
        if qid not in answers:
            return qid
    return None


def validate_answer(question_id: str, value: str) -> Optional[str]:
    q = QUESTIONS.get(question_id)
    if not q:
        return f"Unknown question '{question_id}'."
    if q["kind"] == "free_text":
        if len(value or "") > FREE_TEXT_MAX_CHARS:
            return f"Answer is longer than {FREE_TEXT_MAX_CHARS} characters."
        return None
    if value not in {v for v, _ in q["options"]}:
        return f"Invalid option for {question_id}."
    return None


def localize_question(question_id: str, language: str, step: int, total: int) -> Dict:
    q = QUESTIONS[question_id]
    lang = normalize_language(language)
    return {
        "id": question_id,
        "kind": q["kind"],
        "prompt": q["prompt"][lang],
        "prompt_en": q["prompt"]["en"],
        "optional": bool(q.get("optional")),
        "options": [{"value": v, "label": labels[lang]} for v, labels in q["options"]],
        "step": step,
        "total_estimate": total,
    }


def evaluate(ctx: CheckinContext, answers: Dict[str, str], free_text_tier: str = "GREEN") -> CheckinEvaluation:
    codes: List[str] = []
    tier = "GREEN"

    def raise_to(t: str, code: str):
        nonlocal tier
        tier = tier_max(tier, t)
        if code not in codes:
            codes.append(code)

    call_ans = answers.get("Q_CALL")
    who = answers.get("Q_WHO")

    if call_ans == "yes":
        raise_to("AMBER", "ACTIVE_CALL_REPORTED")
    if who == "authority":
        raise_to("RED", "AUTHORITY_REQUEST")
    elif who == "caller_unknown":
        raise_to("AMBER", "UNSOLICITED_REQUEST")
    elif who == "online_group":
        raise_to("AMBER", "ONLINE_GROUP_REQUEST")

    secrecy = answers.get("Q_SECRECY")
    if secrecy == "yes":
        raise_to("RED", "SECRECY_REPORTED")
    elif secrecy == "unsure":
        raise_to("AMBER", "SECRECY_REPORTED")

    threat = answers.get("Q_THREAT")
    if threat == "yes":
        contacted = who in ("authority", "caller_unknown") or call_ans == "yes"
        raise_to("RED" if contacted else "AMBER", "THREAT_REPORTED")
    elif threat == "unsure":
        raise_to("AMBER", "THREAT_REPORTED")

    remote = answers.get("Q_REMOTE")
    if remote == "yes":
        raise_to("RED", "REMOTE_ACCESS_REQUEST")
    elif remote == "unsure":
        raise_to("AMBER", "REMOTE_ACCESS_REQUEST")

    returns = answers.get("Q_RETURNS")
    if returns == "yes":
        raise_to("RED", "GUARANTEED_RETURNS_REPORTED")
    elif returns == "unsure":
        raise_to("AMBER", "GUARANTEED_RETURNS_REPORTED")

    coached = answers.get("Q_COACHED")
    if coached == "yes":
        raise_to("RED", "POSSIBLE_COACHING")
    elif coached == "unsure":
        raise_to("AMBER", "POSSIBLE_COACHING")

    if answers.get("Q_VERIFIED") in ("no", "unsure") and (tier != "GREEN" or ctx.objective_tier != "GREEN"):
        raise_to("AMBER", "NOT_INDEPENDENTLY_VERIFIED")

    contradictions = [
        ctx.call_state == CALL_STATE_DEMO and call_ans == "no",
        ctx.authority_claimed and who in ("self", "business", "known_person"),
        ctx.secrecy_demanded and secrecy == "no",
        ctx.guaranteed_returns and returns == "no",
        ctx.pressure_present and threat == "no",
    ]
    if any(contradictions):
        raise_to("AMBER", "ANSWERS_CONTRADICT_SIGNALS")

    if TIER_ORDER.get(free_text_tier, 0) > 0:
        raise_to(free_text_tier, "FREE_TEXT_RISK_TERMS")

    final = tier_max(ctx.objective_tier, tier)
    could_not_clear = TIER_ORDER[ctx.objective_tier] > TIER_ORDER[tier]
    if could_not_clear:
        codes.append("PAYMENT_DETAILS_HIGH_RISK")

    return CheckinEvaluation(answer_tier=tier, final_tier=final, reason_codes=codes, answers_could_not_clear=could_not_clear)


def analyze_free_text_tier(text: str) -> str:
    """Runs the existing rule engine on the free-text answer. The text is not stored."""
    if not text or len(text.strip()) < 5:
        return "GREEN"
    from backend.app.services.risk_engine import analyze_text

    result = analyze_text(text.strip()[:FREE_TEXT_MAX_CHARS], channel="CHECKIN")
    tier = getattr(result, "policy_tier", "GREEN") or "GREEN"
    return tier if tier in TIER_ORDER else "GREEN"


def localized_reasons(codes: List[str], language: str) -> List[Dict[str, str]]:
    lang = normalize_language(language)
    return [{"code": c, "label": REASON_LABELS[c][lang]} for c in codes if c in REASON_LABELS]
