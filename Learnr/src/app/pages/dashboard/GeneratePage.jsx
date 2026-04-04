import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  FileText,
  Link as LinkIcon,
  Loader2,
  Mic,
  ScanLine,
  Sparkles,
  Type,
  Upload,
  Zap,
} from 'lucide-react';
import LazyMount from '../../../components/performance/LazyMount';
import useStudy from '../../../state/StudyContext';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import useI18n from '../../../hooks/useI18n';
import './GeneratePage.css';

const GenerateBenefitsSection = lazy(() => import('./GenerateBenefitsSection'));

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CARD_TYPES = ['flip', 'mcq', 'mixed'];
const MAX_CHARS = 10000;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const GenerateSchema = z.object({
  text: z.string().max(MAX_CHARS).optional().default(''),
  numCards: z.preprocess((v) => Number(v), z.number().int().min(1).max(60)).default(25),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  cardType: z.enum(['flip', 'mcq', 'mixed']).default('flip'),
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const str = String(reader.result || '');
      const base64 = str.includes(',') ? str.split(',')[1] : str;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed reading file.'));
    reader.readAsDataURL(file);
  });
}

const UsageSkeleton = memo(function UsageSkeleton() {
  return (
    <div className="gen-usage gen-usage--skeleton" aria-hidden="true">
      <span className="gen-usage__skel gen-usage__skel--wide" />
      <span className="gen-usage__skel gen-usage__skel--narrow" />
    </div>
  );
});

const BenefitsSkeleton = memo(function BenefitsSkeleton() {
  return (
    <section className="gen-benefits gen-benefits--skeleton" aria-hidden="true">
      {[1, 2, 3].map((row) => (
        <article key={row}>
          <span className="gen-benefits__skel-icon" />
          <span className="gen-benefits__skel-line gen-benefits__skel-line--title" />
          <span className="gen-benefits__skel-line" />
          <span className="gen-benefits__skel-line gen-benefits__skel-line--short" />
        </article>
      ))}
    </section>
  );
});

const QuickImportPanel = memo(function QuickImportPanel({
  importing,
  micSupported,
  micPending,
  micListening,
  interimTranscript,
  onImportFromUrl,
  onToggleVoice,
  onImportOCR,
  onImportText,
  t,
}) {
  return (
    <section className="gen-panel" aria-label="Quick import">
      <h3>Quick Import</h3>
      <div className="gen-panel__grid">
        <button className="gen-import-btn" onClick={onImportFromUrl} disabled={importing} type="button">
          <LinkIcon size={15} /> URL
        </button>
        <button
          className={`gen-import-btn ${micListening ? 'gen-import-btn--recording' : ''}`}
          onClick={onToggleVoice}
          disabled={importing || micPending || !micSupported}
          type="button"
        >
          <Mic size={15} />
          {micPending ? 'Mic...' : (micListening ? 'Stop' : 'Voice')}
        </button>
        <button className="gen-import-btn" onClick={onImportOCR} disabled={importing} type="button">
          <ScanLine size={15} /> OCR
        </button>
        <button className="gen-import-btn" onClick={onImportText} disabled={importing} type="button">
          <Type size={15} /> Text
        </button>
      </div>
      {micListening && (
        <p className="gen-mic-status">
          {t('generate.listening', 'Listening...')} {interimTranscript ? `"${interimTranscript}"` : t('generate.speakToTranscribe', 'start speaking to transcribe.')}
        </p>
      )}
    </section>
  );
});

const ConfigPanel = memo(function ConfigPanel({
  numCards,
  difficulty,
  selectedCardType,
  generating,
  onNumCardsChange,
  onDifficultyChange,
  onCardTypeChange,
  t,
}) {
  const onDifficultyClick = useCallback((event) => {
    const { value } = event.currentTarget.dataset;
    if (value) {
      onDifficultyChange(value);
    }
  }, [onDifficultyChange]);

  const onCardTypeClick = useCallback((event) => {
    const { value } = event.currentTarget.dataset;
    if (value) {
      onCardTypeChange(value);
    }
  }, [onCardTypeChange]);

  return (
    <section className="gen-panel" aria-label="Card configuration">
      <h3>Card Configuration</h3>

      <div className="gen-config-row">
        <label className="gen-controls__label" htmlFor="numCardsSlider">
          <Sparkles size={13} /> Card Count
          <span className="gen-controls__value">{numCards}</span>
        </label>
        <input
          id="numCardsSlider"
          type="range"
          min={5}
          max={60}
          step={5}
          value={numCards}
          onChange={onNumCardsChange}
          className="gen-controls__slider"
          disabled={generating}
        />
      </div>

      <div className="gen-config-row">
        <p className="gen-controls__label"><BookOpen size={13} /> Difficulty</p>
        <div className="gen-controls__pills">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              data-value={level}
              className={`gen-controls__pill ${difficulty === level ? 'gen-controls__pill--active' : ''}`}
              onClick={onDifficultyClick}
              disabled={generating}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="gen-config-row">
        <p className="gen-controls__label"><Sparkles size={13} /> Card Type</p>
        <div className="gen-controls__pills gen-controls__pills--wrap">
          {CARD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              data-value={type}
              className={`gen-controls__pill ${selectedCardType === type ? 'gen-controls__pill--active' : ''}`}
              onClick={onCardTypeClick}
              disabled={generating}
            >
              {type === 'flip' ? t('generate.cardTypeFlip', 'Flashcards') : type === 'mcq' ? t('generate.cardTypeMcq', 'Multiple Choice') : t('generate.cardTypeMixed', 'Mixed')}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

const EditorSection = memo(function EditorSection({
  notes,
  generating,
  importing,
  onNotesChange,
  onOpenTextImport,
  charFillStyle,
  charCountStyle,
  t,
  textareaRef,
}) {
  return (
    <section className="gen-editor">
      <div className="gen-editor__drophead">
        <Upload size={18} />
        <h2>Drop your PDF or presentation here</h2>
        <p>Supports PDF, PPTX, DOCX, and TXT up to 10MB</p>
      </div>

      <textarea
        ref={textareaRef}
        className="gen-editor__textarea"
        placeholder={t('generate.notesPlaceholder', 'Paste your notes, chapter excerpts, lecture transcript, or raw study material...')}
        value={notes}
        onChange={onNotesChange}
        rows={11}
        disabled={generating}
      />

      <div className="gen-editor__footer">
        <button
          className="gen-editor__upload-btn"
          onClick={onOpenTextImport}
          type="button"
          disabled={importing}
        >
          <FileText size={14} />
          {importing ? t('generate.importing', 'Importing...') : t('generate.uploadDocument', 'Select File')}
        </button>

        <div className="gen-editor__charbar" aria-hidden="true">
          <div className="gen-editor__charbar-fill" style={charFillStyle} />
        </div>

        <span className="gen-editor__charcount" style={charCountStyle}>
          {notes.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>
    </section>
  );
});

export default function GeneratePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setGeneratedCards } = useStudy();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micPending, setMicPending] = useState(false);
  const [micListening, setMicListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const documentInputRef = useRef(null);
  const ocrInputRef = useRef(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(GenerateSchema),
    defaultValues: { text: '', numCards: 25, difficulty: 'Medium', cardType: 'flip' },
  });

  const [notes = '', numCards = 25, difficulty = 'Medium', selectedCardType = 'flip'] = useWatch({
    control,
    name: ['text', 'numCards', 'difficulty', 'cardType'],
  });

  const usageQuery = useQuery({
    queryKey: ['analytics', 'usage', accessToken],
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const response = await fetch('/api/v2/analytics/usage', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load usage.');
      }

      return response.json();
    },
  });

  const usage = usageQuery.data || null;
  const generationRemaining = usage?.remaining?.generations;
  const tokenRemaining = usage?.remaining?.tokens;

  useEffect(() => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(Boolean(SpeechRecognitionApi));
  }, []);

  const authHeaders = useMemo(() => {
    if (!accessToken) return null;
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }, [accessToken]);

  const ensureImportAuth = useCallback(() => {
    if (!authHeaders) {
      throw new Error('Please sign in to use import features.');
    }
    return authHeaders;
  }, [authHeaders]);

  const appendImportedText = useCallback((text, sourceLabel) => {
    const prev = String(getValues('text') || '').trim();
    const chunk = String(text || '').trim();
    if (!chunk) return;

    const merged = prev ? `${prev}\n\n[Imported: ${sourceLabel}]\n${chunk}` : chunk;
    setValue('text', merged.slice(0, MAX_CHARS), { shouldDirty: true });
    showToast(`${sourceLabel} imported.`, { type: 'success' });
  }, [getValues, setValue, showToast]);

  const importFromUrl = useCallback(async () => {
    const url = window.prompt('Paste a public article URL (http/https):');
    if (!url) return;

    setImporting(true);
    try {
      const response = await fetch('/api/v2/imports/import-url', {
        method: 'POST',
        headers: ensureImportAuth(),
        body: JSON.stringify({ url }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'URL import failed.');
      }

      appendImportedText(payload.text || '', 'URL');
    } catch (error) {
      showToast(error.message || 'URL import failed.', { type: 'error' });
    } finally {
      setImporting(false);
    }
  }, [appendImportedText, ensureImportAuth, showToast]);

  const importFromFile = useCallback(async (event, endpoint, sourceLabel) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      showToast('File exceeds 10MB limit.', { type: 'error' });
      return;
    }

    setImporting(true);
    try {
      const base64Data = await fileToBase64(file);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: ensureImportAuth(),
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          base64Data,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `${sourceLabel} import failed.`);
      }

      appendImportedText(payload.text || '', sourceLabel);
    } catch (error) {
      showToast(error.message || `${sourceLabel} import failed.`, { type: 'error' });
    } finally {
      setImporting(false);
    }
  }, [appendImportedText, ensureImportAuth, showToast]);

  const appendRecognizedSpeech = useCallback((text) => {
    const chunk = String(text || '').trim();
    if (!chunk) return;

    const base = String(getValues('text') || '').trimEnd();
    const separator = base ? (base.endsWith('.') || base.endsWith('!') || base.endsWith('?') ? ' ' : '\n') : '';
    setValue('text', `${base}${separator}${chunk}`.slice(0, MAX_CHARS), { shouldDirty: true });
  }, [getValues, setValue]);

  const stopVoiceTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setMicListening(false);
    setMicPending(false);
    setInterimTranscript('');
  }, []);

  const startVoiceTranscription = useCallback(async () => {
    if (!micSupported) {
      showToast(t('generate.voiceNotSupported', 'Live voice transcription is not supported in this browser.'), { type: 'error' });
      return;
    }

    if (micListening) {
      stopVoiceTranscription();
      return;
    }

    setMicPending(true);
    setInterimTranscript('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not available in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = recognitionRef.current || new SpeechRecognitionApi();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal) {
            finalText += result[0]?.transcript || '';
          } else {
            interimText += result[0]?.transcript || '';
          }
        }

        if (finalText.trim()) {
          appendRecognizedSpeech(finalText);
        }
        setInterimTranscript(interimText.trim());
      };

      recognition.onerror = (event) => {
        const code = event?.error || 'unknown';
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          showToast(t('generate.micPermissionDenied', 'Microphone permission denied. Enable mic access to use voice transcription.'), { type: 'error' });
        } else if (code !== 'aborted') {
          showToast(t('generate.voiceTranscriptionFailed', `Voice transcription failed (${code}).`), { type: 'error' });
        }
        setMicListening(false);
        setMicPending(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setMicListening(false);
        setMicPending(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setMicListening(true);
      setMicPending(false);
      showToast(t('generate.listeningHelp', 'Listening... speak now. Tap the mic button again to stop.'), { type: 'info' });
    } catch (error) {
      setMicListening(false);
      setMicPending(false);
      setInterimTranscript('');
      showToast(error.message || t('generate.failedMicAccess', 'Failed to access microphone.'), { type: 'error' });
    }
  }, [appendRecognizedSpeech, micListening, micSupported, showToast, stopVoiceTranscription, t]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const openDocumentPicker = useCallback(() => {
    documentInputRef.current?.click();
  }, []);

  const openOcrPicker = useCallback(() => {
    ocrInputRef.current?.click();
  }, []);

  const onDocumentInputChange = useCallback((event) => {
    importFromFile(event, '/api/v2/imports/upload-document', 'Document');
  }, [importFromFile]);

  const onOcrInputChange = useCallback((event) => {
    importFromFile(event, '/api/v2/imports/ocr-scan', 'OCR');
  }, [importFromFile]);

  const onNotesChange = useCallback((event) => {
    setValue('text', event.target.value.slice(0, MAX_CHARS), {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [setValue]);

  const onNumCardsChange = useCallback((event) => {
    setValue('numCards', Number(event.target.value), {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [setValue]);

  const onDifficultyChange = useCallback((nextDifficulty) => {
    setValue('difficulty', nextDifficulty, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [setValue]);

  const onCardTypeChange = useCallback((nextCardType) => {
    setValue('cardType', nextCardType, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [setValue]);

  const onGenerate = useCallback(async (values) => {
    const trimmed = String(values.text || '').trim();
    if (!trimmed) {
      showToast(t('generate.pasteNotes', 'Paste some notes to get started.'), { type: 'info' });
      textareaRef.current?.focus();
      return;
    }

    if (!accessToken) {
      showToast(t('generate.signInGenerate', 'Please sign in to generate cards.'), { type: 'error' });
      return;
    }

    if (usage?.remaining?.generations === 0) {
      showToast(t('generate.limitReached', 'Monthly generation limit reached.'), { type: 'error' });
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmed,
          numCards: values.numCards,
          cardType: values.cardType,
          difficulty: values.difficulty,
        }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message.error || `Server error ${response.status}`);
      }

      const payload = await response.json();
      const { flashcards } = payload;

      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error(t('generate.noFlashcardsGenerated', 'No flashcards were generated. Try different notes.'));
      }

      if (payload.usage && accessToken) {
        queryClient.setQueryData(['analytics', 'usage', accessToken], payload.usage);
      }

      setGeneratedCards(flashcards);
      showToast(t('generate.flashcardsGenerated', 'Flashcards generated!'), { type: 'success' });
      navigate('/app/preview');
    } catch (error) {
      showToast(error.message, { type: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [accessToken, navigate, queryClient, setGeneratedCards, showToast, t, usage]);

  const clearDraft = useCallback(() => {
    setValue('text', '', { shouldDirty: true, shouldValidate: false });
    textareaRef.current?.focus();
  }, [setValue]);

  const submitGenerate = useMemo(() => handleSubmit(onGenerate), [handleSubmit, onGenerate]);

  const charPct = useMemo(() => Math.min((notes.length / MAX_CHARS) * 100, 100), [notes.length]);
  const hasNotes = useMemo(() => Boolean(notes.trim()), [notes]);
  const isGenerateBlocked = useMemo(
    () => generating || !hasNotes || generationRemaining === 0,
    [generating, hasNotes, generationRemaining],
  );

  const charFillStyle = useMemo(
    () => ({
      width: `${charPct}%`,
      background: charPct > 90 ? 'var(--red)' : 'var(--brand)',
    }),
    [charPct],
  );

  const charCountStyle = useMemo(
    () => ({ color: charPct > 90 ? 'var(--red)' : 'var(--t3)' }),
    [charPct],
  );

  const estimateSeconds = useMemo(() => Math.ceil(Number(numCards || 0) / 10) * 5, [numCards]);

  return (
    <div className="gen-page">
      <div className="gen-main">
        <header className="gen-main__hero">
          <h1 className="gen-main__h1">{t('generate.titlePrefix', 'Generate study decks in seconds')}</h1>
          <p className="gen-main__sub">
            {t('generate.subtitle', 'Transform any material into high-retention flashcards using our advanced AI curation engine. Upload, paste, or speak your content.')}
          </p>

          {accessToken ? (
            usageQuery.isLoading ? (
              <UsageSkeleton />
            ) : usage ? (
              <div className="gen-usage">
                <span>{t('generate.monthlyGenerations', '{used} / {limit} generations this month', { used: usage.usage.generations, limit: usage.limits.generations })}</span>
                <span>{t('generate.monthlyTokens', '{used} / {limit} tokens', { used: usage.usage.tokens.toLocaleString(), limit: usage.limits.tokens.toLocaleString() })}</span>
              </div>
            ) : null
          ) : null}
        </header>

        <div className="gen-workbench">
          <EditorSection
            notes={notes}
            generating={generating}
            importing={importing}
            onNotesChange={onNotesChange}
            onOpenTextImport={openDocumentPicker}
            charFillStyle={charFillStyle}
            charCountStyle={charCountStyle}
            t={t}
            textareaRef={textareaRef}
          />

          <aside className="gen-sidepanels">
            <QuickImportPanel
              importing={importing}
              micSupported={micSupported}
              micPending={micPending}
              micListening={micListening}
              interimTranscript={interimTranscript}
              onImportFromUrl={importFromUrl}
              onToggleVoice={startVoiceTranscription}
              onImportOCR={openOcrPicker}
              onImportText={openDocumentPicker}
              t={t}
            />

            <ConfigPanel
              numCards={numCards}
              difficulty={difficulty}
              selectedCardType={selectedCardType}
              generating={generating}
              onNumCardsChange={onNumCardsChange}
              onDifficultyChange={onDifficultyChange}
              onCardTypeChange={onCardTypeChange}
              t={t}
            />
          </aside>
        </div>

        {errors.text?.message && <p className="gen-error">{errors.text.message}</p>}

        <div className="gen-actions">
          <button
            type="button"
            className="gen-btn gen-btn--ghost"
            onClick={clearDraft}
            disabled={generating || !hasNotes}
          >
            Save Draft
          </button>

          <button
            type="button"
            className="gen-btn gen-btn--primary"
            onClick={submitGenerate}
            disabled={isGenerateBlocked}
          >
            {generating ? (
              <>
                <Loader2 size={18} className="gen-btn__spinner" />
                {t('generate.generating', 'Generating...')}
              </>
            ) : (
              <>
                <Zap size={17} />
                {t('generate.generateCards', 'Generate Deck')}
              </>
            )}
          </button>
        </div>

        <p className="gen-hint">
          <Clock size={12} /> {t('generate.estimatedTime', 'Estimated time')}: ~{estimateSeconds}s · {t('generate.activeRecallMode', 'Active Recall Mode')}
          {usage && ` · ${t('generate.remainingThisMonth', 'Remaining this month')}: ${generationRemaining} ${t('generate.generationsUnit', 'generations')} / ${tokenRemaining?.toLocaleString()} ${t('generate.tokensUnit', 'tokens')}`}
        </p>

        <LazyMount
          className="gen-benefits-lazy"
          rootMargin="200px"
          fallback={<BenefitsSkeleton />}
        >
          <Suspense fallback={<BenefitsSkeleton />}>
            <GenerateBenefitsSection />
          </Suspense>
        </LazyMount>

        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="gen-hidden-input"
          onChange={onDocumentInputChange}
        />
        <input
          ref={ocrInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="gen-hidden-input"
          onChange={onOcrInputChange}
        />
      </div>
    </div>
  );
}
