import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseSpeechRecognitionOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface RecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    onTranscript,
    onError,
    language = 'en-US',
    continuous = true,
    interimResults = true
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: RecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPart;
          } else {
            interim += transcriptPart;
          }
        }

        setInterimTranscript(interim);
        if (final) {
          setFinalTranscript(prev => prev + final);
          if (onTranscript) {
            onTranscript(final);
          }
        }
        setTranscript((prev) => prev + final + interim);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
        
        if (onError) {
          onError(event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current.onstart = () => {
        setError(null);
        setIsListening(true);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onTranscript, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition is not supported in this browser';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setFinalTranscript('');
      setInterimTranscript('');
      setError(null);
      recognitionRef.current.start();
    }
  }, [isSupported, isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useSpeechRecognition;
