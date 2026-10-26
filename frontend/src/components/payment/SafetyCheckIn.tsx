import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertOctagon, CheckCircle2, Info, PhoneCall, RotateCcw, ShieldAlert, Users } from 'lucide-react';
import { api } from '../../api/endpoints';
import { CheckinLanguage, CheckinQuestion, CheckinResult } from '../../api/types';

export const CHECKIN_LANGUAGES: { code: CheckinLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

const UI: Record<CheckinLanguage, Record<string, string>> = {
  en: {
    title: 'Safety Check-in',
    subtitle: 'A few questions before money leaves your account',
    question: 'Question',
    next: 'Next',
    skip: 'Skip',
    placeholder: 'Type in your own words…',
    freeTextNote: 'Your typed answer is checked once and never saved.',
    restart: 'Start again',
    call1930: 'Call 1930',
    reasons: 'Why',
    engine: 'Guided rule-based check-in — not a generative AI model.',
    loading: 'Loading…',
    language: 'Language',
    waitingGuardian: 'Your family member has been asked to review this payment.',
    askGuardian: 'Ask family to review',
    noGuardian: 'No family member has accepted your invitation yet. Call a trusted person on a number you already know.',
  },
  hi: {
    title: 'सुरक्षा जाँच',
    subtitle: 'पैसे भेजने से पहले कुछ सवाल',
    question: 'सवाल',
    next: 'आगे',
    skip: 'छोड़ें',
    placeholder: 'अपने शब्दों में लिखें…',
    freeTextNote: 'आपका लिखा जवाब एक बार जाँचा जाता है और कभी सहेजा नहीं जाता।',
    restart: 'फिर से शुरू करें',
    call1930: '1930 पर कॉल करें',
    reasons: 'कारण',
    engine: 'नियम-आधारित निर्देशित जाँच — जनरेटिव AI मॉडल नहीं।',
    loading: 'लोड हो रहा है…',
    language: 'भाषा',
    waitingGuardian: 'आपके परिवारजन से इस भुगतान की जाँच करने को कहा गया है।',
    askGuardian: 'परिवार से जाँच करवाएँ',
    noGuardian: 'अभी तक किसी परिवारजन ने आपका निमंत्रण स्वीकार नहीं किया है। पहले से ज्ञात नंबर पर किसी भरोसेमंद व्यक्ति को कॉल करें।',
  },
  mr: {
    title: 'सुरक्षा तपासणी',
    subtitle: 'पैसे पाठवण्यापूर्वी काही प्रश्न',
    question: 'प्रश्न',
    next: 'पुढे',
    skip: 'वगळा',
    placeholder: 'तुमच्या शब्दांत लिहा…',
    freeTextNote: 'तुमचे लिहिलेले उत्तर एकदाच तपासले जाते आणि कधीही जतन केले जात नाही.',
    restart: 'पुन्हा सुरू करा',
    call1930: '1930 वर कॉल करा',
    reasons: 'कारणे',
    engine: 'नियम-आधारित मार्गदर्शित तपासणी — जनरेटिव्ह AI मॉडेल नाही.',
    loading: 'लोड होत आहे…',
    language: 'भाषा',
    waitingGuardian: 'तुमच्या कुटुंबीयांना हे पेमेंट तपासायला सांगितले आहे.',
    askGuardian: 'कुटुंबीयांकडून तपासून घ्या',
    noGuardian: 'अजून कोणत्याही कुटुंबीयाने तुमचे निमंत्रण स्वीकारलेले नाही. आधीपासून माहीत असलेल्या नंबरवर विश्वासू व्यक्तीला कॉल करा.',
  },
  kn: {
    title: 'ಸುರಕ್ಷತಾ ಪರಿಶೀಲನೆ',
    subtitle: 'ಹಣ ಕಳುಹಿಸುವ ಮೊದಲು ಕೆಲವು ಪ್ರಶ್ನೆಗಳು',
    question: 'ಪ್ರಶ್ನೆ',
    next: 'ಮುಂದೆ',
    skip: 'ಬಿಟ್ಟುಬಿಡಿ',
    placeholder: 'ನಿಮ್ಮ ಮಾತಿನಲ್ಲೇ ಬರೆಯಿರಿ…',
    freeTextNote: 'ನೀವು ಬರೆದ ಉತ್ತರವನ್ನು ಒಮ್ಮೆ ಮಾತ್ರ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ, ಎಂದಿಗೂ ಉಳಿಸಲಾಗುವುದಿಲ್ಲ.',
    restart: 'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ',
    call1930: '1930 ಗೆ ಕರೆ ಮಾಡಿ',
    reasons: 'ಕಾರಣಗಳು',
    engine: 'ನಿಯಮ-ಆಧಾರಿತ ಮಾರ್ಗದರ್ಶಿತ ಪರಿಶೀಲನೆ — ಜನರೇಟಿವ್ AI ಮಾದರಿಯಲ್ಲ.',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    language: 'ಭಾಷೆ',
    waitingGuardian: 'ಈ ಪಾವತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ನಿಮ್ಮ ಕುಟುಂಬದ ಸದಸ್ಯರನ್ನು ಕೇಳಲಾಗಿದೆ.',
    askGuardian: 'ಕುಟುಂಬದವರಿಂದ ಪರಿಶೀಲಿಸಿ',
    noGuardian: 'ಇನ್ನೂ ಯಾವುದೇ ಕುಟುಂಬದ ಸದಸ್ಯರು ನಿಮ್ಮ ಆಹ್ವಾನವನ್ನು ಸ್ವೀಕರಿಸಿಲ್ಲ. ಮೊದಲೇ ಗೊತ್ತಿದ್ದ ಸಂಖ್ಯೆಗೆ ನಂಬಿಕಸ್ಥ ವ್ಯಕ್ತಿಗೆ ಕರೆ ಮಾಡಿ.',
  },
};

const TIER_STYLE: Record<string, string> = {
  RED: 'bg-red-50 border-red-300 text-red-950',
  AMBER: 'bg-amber-50 border-amber-300 text-amber-950',
  GREEN: 'bg-emerald-50 border-emerald-300 text-emerald-950',
};

export function toCheckinLanguage(code: string | undefined): CheckinLanguage {
  return (['en', 'hi', 'mr', 'kn'] as string[]).includes(code || '') ? (code as CheckinLanguage) : 'en';
}

// The requester gets no WebSocket event for their own request, so panels are told locally.
function notifyApprovalChanged() {
  window.dispatchEvent(new CustomEvent('satark-live-event', { detail: { type: 'GUARDIAN_APPROVAL_LOCAL_UPDATE' } }));
}

interface SafetyCheckInProps {
  simulationId: string;
  initialLanguage?: CheckinLanguage;
  onCompleted?: (result: CheckinResult) => void;
}

export const SafetyCheckIn: React.FC<SafetyCheckInProps> = ({ simulationId, initialLanguage = 'en', onCompleted }) => {
  const [language, setLanguage] = useState<CheckinLanguage>(initialLanguage);
  const [answers, setAnswers] = useState<{ question_id: string; value: string }[]>([]);
  const [question, setQuestion] = useState<CheckinQuestion | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [engineNote, setEngineNote] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardianRequested, setGuardianRequested] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;
  const t = UI[language];

  const submit = useCallback(
    async (nextAnswers: { question_id: string; value: string }[], lang: CheckinLanguage) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.runSafetyCheckin(simulationId, lang, nextAnswers);
        setEngineNote(res.engine_note);
        setAnswers(nextAnswers);
        if (res.status === 'COMPLETED' && res.result) {
          setQuestion(null);
          setResult(res.result);
          setGuardianRequested(Boolean(res.result.guardian_request_ref));
          if (res.result.guardian_request_ref) notifyApprovalChanged();
          onCompletedRef.current?.(res.result);
        } else {
          setQuestion(res.next_question || null);
          setText('');
        }
      } catch (err: any) {
        setError(err.message || 'Check-in failed');
      } finally {
        setLoading(false);
      }
    },
    [simulationId]
  );

  useEffect(() => {
    setResult(null);
    submit([], language);
    // Restart only when the payment changes; language changes re-localize via changeLanguage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [question?.id, result]);

  const changeLanguage = (lang: CheckinLanguage) => {
    setLanguage(lang);
    if (!result) submit(answers, lang);
  };

  const answer = (value: string) => {
    if (!question) return;
    submit([...answers, { question_id: question.id, value }], language);
  };

  const restart = () => {
    setResult(null);
    setGuardianRequested(false);
    submit([], language);
  };

  const askGuardian = async () => {
    try {
      await api.requestGuardianApproval(simulationId);
      setGuardianRequested(true);
      notifyApprovalChanged();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4" lang={language}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#142A36]">{t.title}</p>
          <p className="text-xs text-[#64748B]">{t.subtitle}</p>
        </div>
        <div role="group" aria-label={t.language} className="flex flex-wrap gap-1">
          {CHECKIN_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => changeLanguage(l.code)}
              aria-pressed={language === l.code}
              className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                language === l.code ? 'bg-[#142A36] text-white border-[#142A36]' : 'bg-white text-[#142A36] border-[#CBD5E1] hover:bg-[#F7F8F4]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
          {error}
        </div>
      )}

      {!result && question && (
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] space-y-3" aria-busy={loading}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            {t.question} {question.step} / ~{question.total_estimate}
          </p>
          <h4 ref={headingRef} tabIndex={-1} className="text-sm sm:text-base font-bold text-[#142A36] leading-snug outline-none">
            {question.prompt}
          </h4>
          {language !== 'en' && <p className="text-[11px] text-[#64748B]">{question.prompt_en}</p>}

          {question.kind === 'single_choice' ? (
            <div role="group" aria-label={question.prompt} className="grid gap-2">
              {question.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={loading}
                  onClick={() => answer(o.value)}
                  className="w-full min-h-[44px] text-left px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:border-[#176B58] hover:bg-[#DCEDE5]/40 text-sm font-semibold text-[#142A36] cursor-pointer disabled:opacity-50"
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="checkin-free-text" className="sr-only">
                {question.prompt}
              </label>
              <textarea
                id="checkin-free-text"
                value={text}
                maxLength={500}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder={t.placeholder}
                className="w-full p-3 text-sm rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              />
              <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {t.freeTextNote}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => answer(text.trim())}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  {t.next}
                </button>
                {question.optional && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => answer('')}
                    className="min-h-[44px] px-4 rounded-xl border border-[#CBD5E1] bg-white text-sm font-semibold text-[#142A36] cursor-pointer disabled:opacity-50"
                  >
                    {t.skip}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !question && loading && <p className="text-xs text-[#64748B]">{t.loading}</p>}

      {result && (
        <div className={`p-4 rounded-xl border-2 space-y-3 ${TIER_STYLE[result.final_tier] || TIER_STYLE.AMBER}`} role="status">
          <div className="flex items-start gap-2">
            {result.final_tier === 'GREEN' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
            ) : result.final_tier === 'RED' ? (
              <AlertOctagon className="w-5 h-5 shrink-0 text-red-700" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700" />
            )}
            <h4 ref={headingRef} tabIndex={-1} className="text-sm sm:text-base font-bold leading-snug outline-none">
              {result.message}
            </h4>
          </div>

          {result.answers_could_not_clear_message && (
            <p className="text-xs font-semibold">{result.answers_could_not_clear_message}</p>
          )}

          {result.reasons.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{t.reasons}</p>
              <ul className="mt-1 space-y-1 list-disc pl-5 text-xs">
                {result.reasons.map((r) => (
                  <li key={r.code}>{r.label}</li>
                ))}
              </ul>
            </div>
          )}

          {(result.recommended_action === 'WAIT_FOR_GUARDIAN' || guardianRequested) && (
            <p className="text-xs flex items-center gap-1.5 font-semibold">
              <Users className="w-4 h-4" />
              {t.waitingGuardian}
            </p>
          )}

          {result.final_tier !== 'GREEN' && (
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="tel:1930"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-[#142A36] text-white text-sm font-bold"
              >
                <PhoneCall className="w-4 h-4" />
                {t.call1930}
              </a>
              {!guardianRequested && result.eligible_guardian_count > 0 && (
                <button
                  type="button"
                  onClick={askGuardian}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  {t.askGuardian}
                </button>
              )}
            </div>
          )}
          {result.final_tier !== 'GREEN' && result.eligible_guardian_count === 0 && (
            <p className="text-xs">{t.noGuardian}</p>
          )}

          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 text-xs font-semibold underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.restart}
          </button>
        </div>
      )}

      <p className="text-[10px] text-[#94A3B8]">{engineNote || t.engine}</p>
    </div>
  );
};
