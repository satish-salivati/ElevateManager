import { useState, useRef, useCallback } from 'react';

// TypeScript support for vendor-prefixed API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
}
interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const hasSupport = !!SpeechRecognitionAPI;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback((onTranscriptUpdate: (fullTranscript: string) => void) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    
    if (!hasSupport) {
        alert("Sorry, your browser does not support speech recognition.");
        return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = true; // Capture continuously until stopped
    recognition.interimResults = true; // Show results as they are being spoken
    recognition.lang = 'en-US';
    
    let finalTranscript = ''; // Accumulates final results for the duration of the session

    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      // Loop through all results from the current recognition instance
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      // The component receives the full string (all final parts + current interim part)
      onTranscriptUpdate(finalTranscript + interimTranscript);
    };
    
    recognition.start();

  }, [hasSupport]);

  return {
    isListening,
    startListening,
    stopListening,
    hasSupport,
  };
};
