import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'bn';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  tagline: string;
  goldenRule: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    tagline: 'Stop. Verify. Stay Safe.',
    goldenRule: 'Never enter your UPI PIN to receive money or lottery prizes.',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    tagline: 'रुकें. जांचें. सुरक्षित रहें.',
    goldenRule: 'पैसे प्राप्त करने के लिए कभी भी अपना UPI पिन न डालें।',
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    tagline: 'थांबा. पडताळा. सुरक्षित राहा.',
    goldenRule: 'पैसे मिळवण्यासाठी कधीही आपला UPI पिन टाकू नका.',
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    tagline: 'நில்லுங்கள். சரிபாருங்கள். பாதுகாப்பாக இருங்கள்.',
    goldenRule: 'பணம் பெற உங்கள் UPI பின்னை ஒருபோதும் உள்ளிட வேண்டாம்.',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    tagline: 'থামুন. যাচাই করুন. নিরাপদ থাকুন.',
    goldenRule: 'টাকা পাওয়ার জন্য কখনোই আপনার UPI পিন দেবেন না।',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  currentMeta: LanguageMeta;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('satark_saathi_lang', lang);
  };

  const currentMeta = LANGUAGES[language] || LANGUAGES.en;

  return (
    <LanguageContext.Provider value={{ language, currentMeta, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
