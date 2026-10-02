export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface VoiceCommandIntent {
  intent: 'what_next' | 'start_timer' | 'record_study' | 'create_task' | 'add_note' | 'reschedule' | 'study_progress' | 'unknown';
  rawCommand: string;
  isDestructive: boolean;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  extractedParams?: Record<string, any>;
}

// Window type augmentations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class VoiceService {
  private recognition: any = null;
  private isListening = false;
  private isSupported = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.isSupported = true;
      }
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.isSupported;
  }

  isSpeechSupported(): boolean {
    return this.isSupported;
  }

  startListening(
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): void {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error || 'Speech recognition error');
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err: any) {
      onError(err.message || 'Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Text-to-speech voice response
   */
  speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Text-to-speech error:', err);
    }
  }

  /**
   * Interprets voice command and detects if it requires safety confirmation
   */
  interpretVoiceCommand(command: string): VoiceCommandIntent {
    const raw = command.trim().toLowerCase();

    // 1. Destructive check: Delete all / Clear
    if (/delete all|remove all|clear all/i.test(raw)) {
      return {
        intent: 'unknown',
        rawCommand: command,
        isDestructive: true,
        requiresConfirmation: true,
        confirmationMessage: `This command is potentially destructive: "${command}". Do you want to continue?`,
      };
    }

    // 2. "What should I do now?" / "What is next?"
    if (/what (should|to) do (now|next)|what('s| is) next/i.test(raw)) {
      return {
        intent: 'what_next',
        rawCommand: command,
        isDestructive: false,
        requiresConfirmation: false,
      };
    }

    // 3. "Start my Physics timer" / "Start timer"
    if (/start.*timer|start focus/i.test(raw)) {
      const subjectMatch = raw.match(/start (?:my )?([a-z0-9 ]+?) (?:timer|session|focus)/i);
      return {
        intent: 'start_timer',
        rawCommand: command,
        isDestructive: false,
        requiresConfirmation: false,
        extractedParams: { subject: subjectMatch ? subjectMatch[1].trim() : undefined },
      };
    }

    // 4. "I studied Chemistry for 45 minutes"
    if (/studied|finished studying/i.test(raw)) {
      const match = raw.match(/studied ([a-z0-9 ]+?) for (\d+)\s*(?:min|minute|minutes|hour|hours)/i);
      return {
        intent: 'record_study',
        rawCommand: command,
        isDestructive: false,
        requiresConfirmation: false,
        extractedParams: {
          subject: match ? match[1].trim() : 'Study',
          duration: match ? parseInt(match[2], 10) : 45,
        },
      };
    }

    // 5. "Add a note to Physics: revise thermodynamics"
    if (/add (?:a )?note/i.test(raw)) {
      return {
        intent: 'add_note',
        rawCommand: command,
        isDestructive: false,
        requiresConfirmation: false,
        extractedParams: { content: command },
      };
    }

    // 6. "Move Maths to tomorrow"
    if (/move|reschedule/i.test(raw)) {
      return {
        intent: 'reschedule',
        rawCommand: command,
        isDestructive: false,
        requiresConfirmation: true,
        confirmationMessage: `Reschedule task based on: "${command}"?`,
      };
    }

    // 7. "How much did I study this week?" / "Study progress"
    if (/how much.*study|study progress|progress this week/i.test(raw)) {
      return {
        intent: 'study_progress',
        rawCommand: command,
        isDestructive: false,
        requiresConfirmation: false,
      };
    }

    // Default: create task or question
    return {
      intent: 'create_task',
      rawCommand: command,
      isDestructive: false,
      requiresConfirmation: false,
    };
  }
}
