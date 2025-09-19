'use client';

import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, RefreshCw, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getOralFluencyPrompt } from '@/ai/flows/get-oral-fluency-prompt';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type OralInterviewProps = {
    onTranscriptChange: (transcript: string) => void;
    prompt?: string;
}


export function OralInterview({ onTranscriptChange, prompt: initialPrompt }: OralInterviewProps) {
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null); // SpeechRecognition instance
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const getNewPrompt = async () => {
    setIsLoadingPrompt(true);
    setTranscript('');
    onTranscriptChange('');
    try {
      const result = await getOralFluencyPrompt();
      setPrompt(result.prompt);
    } catch (error) {
      console.error('Error getting oral fluency prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load a new prompt. Please try again.',
      });
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  useEffect(() => {
    if (!initialPrompt) {
        getNewPrompt();
    } else {
        setIsLoadingPrompt(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Speech recognition is not supported in your browser.'
      });
      setHasPermission(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
             setTranscript((prev) => {
                const newTranscript = prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim();
                onTranscriptChange(newTranscript);
                return newTranscript;
            });
        }
    };
    
    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
             setHasPermission(false);
        }
    };


    recognitionRef.current = recognition;

    // Check for microphone permission
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop()); // Stop the track immediately after getting permission
      })
      .catch(err => {
        setHasPermission(false);
        console.error('Error accessing microphone:', err);
      });

  }, [toast, onTranscriptChange]);
  
  const startRecording = () => {
    if (recognitionRef.current && hasPermission) {
      setTranscript('');
      onTranscriptChange('');
      recognitionRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
     if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleToggleRecording = () => {
    if (hasPermission === false) {
        toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please enable microphone permissions in your browser settings to use this feature.',
        });
        return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
        {hasPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Microphone Access Required</AlertTitle>
                <AlertDescription>
                    Please grant microphone access to start your practice session.
                </AlertDescription>
            </Alert>
        )}
        
        {initialPrompt === undefined && (
            <div className="rounded-lg border bg-muted p-4 text-center">
                {isLoadingPrompt ? (
                    <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading a new prompt...</span>
                    </div>
                ) : (
                    <p className="text-lg font-medium">{prompt}</p>
                )}
            </div>
        )}

        <div className='text-center'>
            <Button onClick={handleToggleRecording} size="lg" type="button" className="rounded-full w-20 h-20" disabled={hasPermission !== true || isLoadingPrompt}>
                {isRecording ? <MicOff /> : <Mic />}
            </Button>
            <div className="text-sm text-muted-foreground mt-2">
                {isRecording ? 
                    `Recording... (${formatTime(recordingTime)})` : 
                    (hasPermission ? 'Click to start recording' : 'Microphone access needed')
                }
            </div>
        </div>
        {transcript && (
            <div className="space-y-2">
                <h4 className="font-semibold">Your Answer (Transcript):</h4>
                <div className="rounded-md border p-4 text-muted-foreground bg-background/50 min-h-[6rem]">
                    {transcript}
                </div>
            </div>
        )}
         {initialPrompt === undefined && (
            <div className='flex justify-end'>
                <Button onClick={getNewPrompt} type="button" variant="outline" disabled={isLoadingPrompt || isRecording}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Get New Prompt
                </Button>
            </div>
         )}
    </div>
  );
}

// Add this to your global CSS or a style tag if not present
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
