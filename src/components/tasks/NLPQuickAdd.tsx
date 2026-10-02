import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NLPParserService, type ParsedTaskResult } from '../../services/nlpParser.service';
import { Sparkles, Mic, ArrowRight, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';

interface NLPQuickAddProps {
  onOpenStructuredModal?: () => void;
}

export const NLPQuickAdd: React.FC<NLPQuickAddProps> = () => {
  const { createTask, services } = useApp();
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedTaskResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const res = NLPParserService.parseTaskString(inputText);
    if (res.isValid && res.dto.title) {
      setParsedResult(res);
    } else {
      setFeedback('Could not understand task. Please try a clearer phrase.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult) return;
    try {
      setIsSubmitting(true);
      await createTask(parsedResult.dto);
      setInputText('');
      setParsedResult(null);
      setFeedback(`Task "${parsedResult.dto.title}" scheduled successfully!`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      services.voiceService.stopListening();
      setIsListening(false);
      return;
    }

    if (!services.voiceService.isSpeechRecognitionSupported()) {
      setFeedback('Speech recognition is not supported in this browser.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsListening(true);
    services.voiceService.startListening(
      (transcript) => {
        setInputText(transcript);
        setIsListening(false);
        const res = NLPParserService.parseTaskString(transcript);
        if (res.isValid) {
          setParsedResult(res);
        }
      },
      (error) => {
        setFeedback(`Voice error: ${error}`);
        setIsListening(false);
        setTimeout(() => setFeedback(null), 3000);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      {/* Input Form Bar */}
      <form onSubmit={handleParse} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 8px 4px 14px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color var(--transition-fast)',
          }}
          className="nlp-input-wrapper"
        >
          <Sparkles size={16} color="var(--accent-text)" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            className="form-input"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              padding: '8px 4px',
              fontSize: '0.9rem',
              boxShadow: 'none',
            }}
            placeholder='Type naturally, e.g. "Study Physics for 1 hour tomorrow at 7 PM" or click mic...'
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />

          {/* Voice Microphone Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={handleMicClick}
            style={{
              color: isListening ? '#EF4444' : 'var(--text-secondary)',
              backgroundColor: isListening ? 'var(--danger-subtle)' : 'transparent',
              borderRadius: '50%',
              marginRight: '4px',
            }}
            title={isListening ? 'Listening...' : 'Voice Input'}
          >
            <Mic size={16} />
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!inputText.trim()}
          >
            <span>Parse</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </form>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--accent-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Structured Confirmation Card (Section 5 Requirement) */}
      {parsedResult && (
        <div
          className="card"
          style={{
            marginTop: 'var(--space-md)',
            border: '1px solid var(--accent-primary)',
            backgroundColor: 'var(--bg-elevated)',
            padding: 'var(--space-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-text)' }}>
                Create task?
              </span>
              {parsedResult.extractedDetails.subject && (
                <Badge variant="blue">{parsedResult.extractedDetails.subject}</Badge>
              )}
              {parsedResult.extractedDetails.isRecurring && (
                <Badge variant="emerald">Recurring</Badge>
              )}
            </div>

            <button
              className="btn-icon"
              style={{ padding: '2px' }}
              onClick={() => setParsedResult(null)}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {parsedResult.extractedDetails.title}
          </h3>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            <div><strong>Date:</strong> {parsedResult.extractedDetails.date}</div>
            <div><strong>Time:</strong> {parsedResult.extractedDetails.startTime || 'Flexible'}</div>
            <div><strong>Duration:</strong> {parsedResult.extractedDetails.duration} min</div>
            <div><strong>Priority:</strong> {parsedResult.extractedDetails.priority}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setParsedResult(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              <Check size={14} /> Confirm Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
