"use client"

import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', label: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
]

export function GoogleTranslate() {
  const [mounted, setMounted] = useState(false)
  const [currentLang, setCurrentLang] = useState('fr')

  useEffect(() => {
    setMounted(true)

    // Initialize google translate global function
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'fr',
          includedLanguages: 'fr,en,es,ar,de,ja,zh-CN,ru,he',
          layout: window.google.translate.TranslateElement.InlineLayout.VERTICAL,
          autoDisplay: false,
        },
        'google_translate_element'
      )
    }

    // Inject Script
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    } else if (window.google?.translate?.TranslateElement) {
      setTimeout(() => window.googleTranslateElementInit(), 100);
    }

    // Polling to sync state with hidden Google combo box AND remove top banner
    const intervalId = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo && combo.value !== currentLang) {
        setCurrentLang(combo.value || 'fr');
      }

      // SELECTIVELY REMOVE all Google Translate floating elements, banners, and widgets
      const googleElements = document.querySelectorAll(
        'iframe.goog-te-banner-frame, .goog-te-banner-frame, [class*="VIpgJd"], .goog-te-spinner-pos'
      );
      googleElements.forEach((el) => {
        try {
          if (el && el.id !== 'google_translate_element' && !el.querySelector('.goog-te-combo')) {
            el.setAttribute('style', 'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;');
          }
        } catch (e) {
          // Ignore
        }
      });

      // Force body positioning
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.body.style.position === 'relative') {
        document.body.style.position = 'static';
      }
    }, 100); // Check every 100ms for aggressive removal

    return () => {
      clearInterval(intervalId);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    // Wait a bit for Google Translate to initialize if needed
    setTimeout(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo) {
        combo.value = langCode;
        // Trigger multiple events to ensure it works
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        combo.dispatchEvent(new Event('input', { bubbles: true }));
        combo.dispatchEvent(new Event('click', { bubbles: true }));
        setCurrentLang(langCode);
      } else {
        console.warn('Google Translate combo box not found');
      }
    }, 100);
  }

  if (!mounted) return null

  return (
    <>
      {/* Hidden Container for Google Widget */}
      <div
        id="google_translate_element"
        style={{
          visibility: 'hidden',
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          top: '-9999px',
          left: '-9999px',
          zIndex: -9999
        }}
      />

      {/* Custom Dropdown Trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-neutral-800/50 px-3 py-1.5 rounded-md transition-colors cursor-pointer group outline-none">
          <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors hidden sm:inline-block">
            {LANGUAGES.find(l => l.code === currentLang)?.label || 'Français'}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] bg-background border-border">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
              {currentLang === lang.code && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
