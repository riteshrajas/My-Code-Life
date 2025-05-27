import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2,
  Loader2,
  Sparkles,
  Send,
  BookOpen,
  CheckCircle,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onAIAnalysis?: (analysis: string) => void;
  placeholder?: string;
  isAnalyzing?: boolean;
  className?: string;
  mode?: 'diary' | 'task' | 'note';
}

interface RecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onAIAnalysis,
  placeholder = "Click to start voice recording...",
  isAnalyzing = false,
  className = "",
  mode = 'diary'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState(''); // Store accumulated final transcript
  const [interimTranscript, setInterimTranscript] = useState(''); // Store current interim transcript
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>(''); // Keep persistent transcript across pauses

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';      recognitionRef.current.onresult = (event: RecognitionEvent) => {
        let currentFinalTranscript = '';
        let currentInterimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinalTranscript += transcriptPart;
          } else {
            currentInterimTranscript += transcriptPart;
          }
        }

        // Add new final transcript to accumulated transcript
        if (currentFinalTranscript) {
          accumulatedTranscriptRef.current += currentFinalTranscript;
          setFinalTranscript(accumulatedTranscriptRef.current);
        }

        // Update interim transcript
        setInterimTranscript(currentInterimTranscript);
        
        // Combine accumulated final transcript with current interim
        const fullTranscript = accumulatedTranscriptRef.current + currentInterimTranscript;
        setTranscript(fullTranscript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        
        let errorMessage = 'Voice recognition failed';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone access denied or not available.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
        }
        
        toast({
          title: 'Voice Input Error',
          description: errorMessage,
          variant: 'destructive'
        });
      };      recognitionRef.current.onend = () => {
        // Only set listening to false if we're not intentionally pausing
        if (!isPaused) {
          setIsListening(false);
          stopAudioVisualization();
          stopTimer();
        }
      };
    }

    return () => {
      stopListening();
    };
  }, []);

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopAudioVisualization = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  const startTimer = () => {
    setRecordingTime(0);
    timeIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
  };
  const startListening = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsListening(true);
      // Only reset if this is a completely new session (not resuming from pause)
      if (!isPaused) {
        setTranscript('');
        setFinalTranscript('');
        setInterimTranscript('');
        accumulatedTranscriptRef.current = '';
      }
      setIsPaused(false);
      startTimer();
      await startAudioVisualization();
      recognitionRef.current.start();
      
      toast({
        title: 'Recording Started',
        description: `Start speaking your ${mode}...`,
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };
  const stopListening = () => {
    if (recognitionRef.current && (isListening || isPaused)) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsPaused(false);
    stopAudioVisualization();
    stopTimer();
  };const pauseListening = () => {
    if (isListening && recognitionRef.current) {
      // Before stopping, make sure any final results are captured
      recognitionRef.current.stop();
      setIsPaused(true);
      setIsListening(false);
      stopAudioVisualization();
      // Don't stop the timer on pause - keep it running to show total session time
      
      toast({
        title: 'Recording Paused',
        description: 'Click Resume to continue recording',
      });
    }
  };

  const resumeListening = async () => {
    if (isPaused) {
      try {
        setIsListening(true);
        setIsPaused(false);
        await startAudioVisualization();
        
        // Add a small space to separate the resumed content
        if (accumulatedTranscriptRef.current && !accumulatedTranscriptRef.current.endsWith(' ')) {
          accumulatedTranscriptRef.current += ' ';
          setFinalTranscript(accumulatedTranscriptRef.current);
          setTranscript(accumulatedTranscriptRef.current);
        }
        
        recognitionRef.current.start();
        
        toast({
          title: 'Recording Resumed',
          description: 'Continue speaking...',
        });
      } catch (error) {
        console.error('Error resuming speech recognition:', error);
        setIsPaused(true);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      setIsProcessing(true);
      onTranscript(transcript);
      
      // Optional AI analysis
      if (onAIAnalysis) {
        // This would trigger AI analysis of the transcript
        setTimeout(() => {
          onAIAnalysis(`AI analysis of the ${mode}: ${transcript.substring(0, 100)}...`);
          setIsProcessing(false);
        }, 2000);
      } else {
        setIsProcessing(false);
      }
      
      // Reset
      setTranscript('');
      setRecordingTime(0);
      
      toast({
        title: 'Voice Input Processed',
        description: 'Your speech has been transcribed and saved.',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'diary': return BookOpen;
      case 'task': return CheckCircle;
      case 'note': return Edit2;
      default: return Mic;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'diary': return 'purple';
      case 'task': return 'blue';
      case 'note': return 'green';
      default: return 'gray';
    }
  };

  if (!isSupported) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="p-6 text-center">
          <MicOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Voice input is not supported in this browser
          </p>
        </CardContent>
      </Card>
    );
  }

  const ModeIcon = getModeIcon();
  const modeColor = getModeColor();

  return (
    <Card className={`shadow-lg border-2 ${isListening ? `border-${modeColor}-200 bg-${modeColor}-50/30` : 'border-gray-200'} ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ModeIcon className={`h-5 w-5 text-${modeColor}-500`} />
              <span className="font-medium capitalize">{mode} Voice Input</span>
            </div>            {(isListening || isPaused) && (
              <Badge variant="secondary" className={isPaused ? "bg-yellow-100 text-yellow-800" : "animate-pulse"}>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-ping'}`} />
                  {isPaused ? 'Paused' : 'Recording'}
                </div>
              </Badge>
            )}
          </div>          {/* Audio Visualization */}
          {isListening && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-4"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <motion.div
                    key={i}
                    className={`w-1 bg-${modeColor}-500 rounded-full`}
                    style={{
                      height: Math.max(4, audioLevel * 40 + Math.random() * 10),
                    }}
                    animate={{
                      height: Math.max(4, audioLevel * 40 + Math.random() * 10),
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Paused State Visualization */}
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-4"
            >
              <div className="flex items-center gap-2 text-yellow-600">
                <Pause className="h-6 w-6" />
                <span className="text-sm font-medium">Recording Paused</span>
              </div>
            </motion.div>
          )}{/* Timer */}
          {(isListening || isPaused || transcript) && (
            <div className="text-center">
              <span className={`text-sm ${isPaused ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                {formatTime(recordingTime)} {isPaused && '(Paused)'}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            {!isListening && !isPaused ? (
              <Button
                onClick={startListening}
                size="lg"
                className={`bg-${modeColor}-500 hover:bg-${modeColor}-600 text-white px-6`}
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : isPaused ? (
              <>
                <Button onClick={resumeListening} size="lg" variant="outline">
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
                <Button onClick={stopListening} size="lg" variant="outline">
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            ) : (
              <>
                <Button onClick={pauseListening} size="lg" variant="outline">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
                <Button onClick={stopListening} size="lg" variant="destructive">
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Transcript Display */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Transcript:</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {transcript || placeholder}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing || !transcript.trim()}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save {mode}
                      </>
                    )}
                  </Button>
                  
                  {onAIAnalysis && (
                    <Button variant="outline" size="icon">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setTranscript('');
                      setFinalTranscript('');
                      setInterimTranscript('');
                      accumulatedTranscriptRef.current = '';
                      setRecordingTime(0);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          {!isListening && !transcript && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Speak clearly and at a normal pace for best results</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInput;
