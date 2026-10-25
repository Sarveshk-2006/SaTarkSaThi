import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, LifeBuoy, MessageSquareWarning, PhoneCall, Smartphone, Users } from 'lucide-react';
import { api } from '../../api/endpoints';
import { TrustedContact } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { useSeniorMode } from '../../context/SeniorModeContext';

type SeniorLang = 'en' | 'hi' | 'mr' | 'kn';

const TEXT: Record<SeniorLang, Record<string, string>> = {
  en: {
    title: 'What do you want to do?',
    checkMessage: 'Check a message or call',
    checkMessageHint: 'Paste a suspicious SMS or WhatsApp message',
    checkPayment: 'Check before paying',
    checkPaymentHint: 'Answer a few questions about the payment',
    family: 'My family helpers',
    familyHint: 'See who gets your alerts',
    lostMoney: 'I lost money — get help',
    lostMoneyHint: 'Prepare your complaint for 1930 and the bank',
    call1930: 'Call 1930 (Cyber Fraud Helpline)',
    callFamily: 'Call {name}',
    remember: 'Remember',
    rule1: 'Police never ask for money on a video call.',
    rule3: "If someone says 'don't tell your family', tell your family.",
    exit: 'Switch to full view',
    mockUpi: 'Practice with the demo UPI app',
  },
  hi: {
    title: 'आप क्या करना चाहते हैं?',
    checkMessage: 'कोई मैसेज या कॉल जाँचें',
    checkMessageHint: 'शक वाला SMS या WhatsApp मैसेज डालें',
    checkPayment: 'पैसे भेजने से पहले जाँचें',
    checkPaymentHint: 'भुगतान के बारे में कुछ सवालों के जवाब दें',
    family: 'मेरे परिवार के सहायक',
    familyHint: 'देखें कि आपके अलर्ट किसे मिलते हैं',
    lostMoney: 'मेरे पैसे चले गए — मदद लें',
    lostMoneyHint: '1930 और बैंक के लिए शिकायत तैयार करें',
    call1930: '1930 पर कॉल करें (साइबर धोखाधड़ी हेल्पलाइन)',
    callFamily: '{name} को कॉल करें',
    remember: 'याद रखें',
    rule1: 'पुलिस कभी वीडियो कॉल पर पैसे नहीं माँगती।',
    rule3: "अगर कोई कहे 'परिवार को मत बताना', तो परिवार को ज़रूर बताएँ।",
    exit: 'पूरा दृश्य दिखाएँ',
    mockUpi: 'डेमो UPI ऐप से अभ्यास करें',
  },
  mr: {
    title: 'तुम्हाला काय करायचे आहे?',
    checkMessage: 'एखादा मेसेज किंवा कॉल तपासा',
    checkMessageHint: 'संशयास्पद SMS किंवा WhatsApp मेसेज टाका',
    checkPayment: 'पैसे पाठवण्यापूर्वी तपासा',
    checkPaymentHint: 'पेमेंटबद्दल काही प्रश्नांची उत्तरे द्या',
    family: 'माझे कुटुंबातील मदतनीस',
    familyHint: 'तुमचे अलर्ट कोणाला मिळतात ते पाहा',
    lostMoney: 'माझे पैसे गेले — मदत घ्या',
    lostMoneyHint: '1930 आणि बँकेसाठी तक्रार तयार करा',
    call1930: '1930 वर कॉल करा (सायबर फसवणूक हेल्पलाइन)',
    callFamily: '{name} यांना कॉल करा',
    remember: 'लक्षात ठेवा',
    rule1: 'पोलीस कधीही व्हिडिओ कॉलवर पैसे मागत नाहीत.',
    rule3: "कोणी 'कुटुंबाला सांगू नका' म्हणाले, तर कुटुंबाला नक्की सांगा.",
    exit: 'पूर्ण दृश्य दाखवा',
    mockUpi: 'डेमो UPI ॲपवर सराव करा',
  },
  kn: {
    title: 'ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
    checkMessage: 'ಸಂದೇಶ ಅಥವಾ ಕರೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    checkMessageHint: 'ಅನುಮಾನಾಸ್ಪದ SMS ಅಥವಾ WhatsApp ಸಂದೇಶವನ್ನು ಅಂಟಿಸಿ',
    checkPayment: 'ಪಾವತಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ',
    checkPaymentHint: 'ಪಾವತಿಯ ಬಗ್ಗೆ ಕೆಲವು ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ',
    family: 'ನನ್ನ ಕುಟುಂಬದ ಸಹಾಯಕರು',
    familyHint: 'ನಿಮ್ಮ ಎಚ್ಚರಿಕೆಗಳು ಯಾರಿಗೆ ಹೋಗುತ್ತವೆ ಎಂದು ನೋಡಿ',
    lostMoney: 'ನಾನು ಹಣ ಕಳೆದುಕೊಂಡೆ — ಸಹಾಯ ಪಡೆಯಿರಿ',
    lostMoneyHint: '1930 ಮತ್ತು ಬ್ಯಾಂಕ್‌ಗಾಗಿ ದೂರು ಸಿದ್ಧಪಡಿಸಿ',
    call1930: '1930 ಗೆ ಕರೆ ಮಾಡಿ (ಸೈಬರ್ ವಂಚನೆ ಸಹಾಯವಾಣಿ)',
    callFamily: '{name} ಅವರಿಗೆ ಕರೆ ಮಾಡಿ',
    remember: 'ನೆನಪಿಡಿ',
    rule1: 'ಪೊಲೀಸರು ಎಂದಿಗೂ ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಹಣ ಕೇಳುವುದಿಲ್ಲ.',
    rule3: "ಯಾರಾದರೂ 'ಕುಟುಂಬಕ್ಕೆ ಹೇಳಬೇಡಿ' ಎಂದರೆ, ಕುಟುಂಬಕ್ಕೆ ಖಂಡಿತ ಹೇಳಿ.",
    exit: 'ಪೂರ್ಣ ನೋಟಕ್ಕೆ ಬದಲಿಸಿ',
    mockUpi: 'ಡೆಮೊ UPI ಆ್ಯಪ್‌ನಲ್ಲಿ ಅಭ್ಯಾಸ ಮಾಡಿ',
  },
};

export function seniorText(language: string): Record<string, string> {
  return TEXT[(['en', 'hi', 'mr', 'kn'].includes(language) ? language : 'en') as SeniorLang];
}

const tiles = [
  { to: '/scanner', icon: MessageSquareWarning, title: 'checkMessage', hint: 'checkMessageHint', tone: 'bg-white border-[#176B58]' },
  { to: '/payment-checkpoint', icon: CreditCard, title: 'checkPayment', hint: 'checkPaymentHint', tone: 'bg-white border-[#176B58]' },
  { to: '/family-shield', icon: Users, title: 'family', hint: 'familyHint', tone: 'bg-white border-[#176B58]' },
  { to: '/golden-hour', icon: LifeBuoy, title: 'lostMoney', hint: 'lostMoneyHint', tone: 'bg-red-50 border-red-700' },
];

/** Simplified home shown instead of the dashboard when Senior Mode is on. */
export const SeniorHome: React.FC = () => {
  const { language, currentMeta } = useLanguage();
  const { setSeniorMode } = useSeniorMode();
  const t = seniorText(language);
  const [guardian, setGuardian] = useState<TrustedContact | null>(null);

  useEffect(() => {
    api
      .getContacts()
      .then((cs) => {
        const eligible = cs.filter((c) => c.is_active && c.consent_granted && c.contact_consent_status === 'ACCEPTED');
        setGuardian(eligible.find((c) => c.is_primary) || eligible[0] || null);
      })
      .catch(() => setGuardian(null));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="senior-home">
      <h1 className="text-3xl font-bold text-[#142A36]">{t.title}</h1>

      <nav aria-label={t.title} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map(({ to, icon: Icon, title, hint, tone }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${tone} hover:shadow-md focus-visible:ring-4 focus-visible:ring-amber-500`}
          >
            <Icon className="w-9 h-9 shrink-0 text-[#142A36]" aria-hidden="true" />
            <span>
              <span className="block text-xl font-bold text-[#142A36]">{t[title]}</span>
              <span className="block text-base text-[#1F2937] mt-1">{t[hint]}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="tel:1930" className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xl font-bold">
          <PhoneCall className="w-7 h-7" aria-hidden="true" />
          {t.call1930}
        </a>
        {guardian && (
          <a
            href={`tel:${guardian.phone_number.replace(/\s/g, '')}`}
            className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-[#176B58] hover:bg-[#135948] text-white text-xl font-bold"
          >
            <Users className="w-7 h-7" aria-hidden="true" />
            {t.callFamily.replace('{name}', guardian.name)}
          </a>
        )}
      </div>

      <section className="p-5 rounded-2xl border-2 border-[#142A36] bg-white space-y-2" aria-labelledby="senior-rules">
        <h2 id="senior-rules" className="text-xl font-bold text-[#142A36]">{t.remember}</h2>
        <ul className="list-disc pl-6 space-y-2 text-lg text-[#111827]">
          <li>{t.rule1}</li>
          <li>{currentMeta.goldenRule}</li>
          <li>{t.rule3}</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/mock-upi" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-[#142A36] text-base font-semibold text-[#142A36] bg-white">
          <Smartphone className="w-5 h-5" aria-hidden="true" />
          {t.mockUpi}
        </Link>
        <button
          type="button"
          onClick={() => setSeniorMode(false)}
          className="px-4 py-3 rounded-xl border-2 border-slate-500 text-base font-semibold text-[#142A36] bg-white cursor-pointer"
        >
          {t.exit}
        </button>
      </div>
    </div>
  );
};
