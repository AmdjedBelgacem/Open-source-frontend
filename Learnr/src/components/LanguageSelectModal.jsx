import { useMemo, useState } from 'react';
import { Languages, Search, X } from 'lucide-react';
import useI18n from '../hooks/useI18n';
import './LanguageSelectModal.css';

export const SUPPORTED_TRANSLATION_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'nl', 'tr', 'ru', 'sv', 'pl',
];

function getLanguageName(code) {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    return dn.of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export default function LanguageSelectModal({
  open,
  title,
  subtitle,
  sourceLanguageCode,
  onClose,
  onSelect,
}) {
  const [query, setQuery] = useState('');
  const { t } = useI18n();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORTED_TRANSLATION_LANGUAGES;
    return SUPPORTED_TRANSLATION_LANGUAGES.filter((code) => {
      const name = getLanguageName(code).toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [query]);

  if (!open) return null;

  return (
    <div className="lang-modal__backdrop" onClick={onClose}>
      <div className="lang-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title || t('decks.chooseTranslateLanguage', 'Choose translation language')}>
        <div className="lang-modal__head">
          <div>
            <h3>{title || t('decks.chooseTranslateLanguage', 'Choose translation language')}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" aria-label={t('common.close', 'Close')} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="lang-modal__search">
          <Search size={14} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search', 'Search')}
          />
        </div>

        {sourceLanguageCode && (
          <p className="lang-modal__source">
            <Languages size={13} />
            {t('decks.sourceLanguage', 'Source language')}: {sourceLanguageCode.toUpperCase()}
          </p>
        )}

        <div className="lang-modal__grid">
          {filtered.map((code) => (
            <button
              key={code}
              type="button"
              className="lang-modal__item"
              onClick={() => onSelect(code)}
              disabled={sourceLanguageCode && sourceLanguageCode.toLowerCase() === code.toLowerCase()}
            >
              <span>{getLanguageName(code)}</span>
              <small>{code.toUpperCase()}</small>
            </button>
          ))}
        </div>

        {filtered.length === 0 && <p className="lang-modal__empty">{t('decks.noLanguageMatches', 'No language matches your search.')}</p>}
      </div>
    </div>
  );
}
