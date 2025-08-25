import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play,
  Pause,
  RotateCcw,
  Send,
  Volume2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Waveform
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSalesEntry } from '@/integrations/supabase/salesData';

interface VoiceRecording {
  blob: Blob;
  url: string;
  duration: number;
}

interface ParsedSalesData {
  items: Array<{
    category: string;
    amount: number;
    quantity?: number;
    description?: string;
  }>;
  date?: string;
  paymentMethod?: 'cash' | 'card' | 'digital';
  confidence: number;
}

const VoiceSalesInput: React.FC = () => {
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedSalesData | null>(null);
  const [submittingData, setSubmittingData] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // High-quality format for better transcription
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = recordingTime;
        
        setRecording({
          blob: audioBlob,
          url: audioUrl,
          duration
        });
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms for smooth recording
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly about your sales data",
        variant: "default"
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      toast({
        title: "Recording Completed",
        description: `Recorded ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
        variant: "default"
      });
    }
  };

  const playRecording = () => {
    if (recording && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = recording.url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const resetRecording = () => {
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    setRecording(null);
    setParsedData(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const processAudio = async () => {
    if (!recording) return;

    setProcessingAudio(true);
    try {
      // Mock voice-to-text processing (in real implementation, this would call Deepgram API)
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock parsed data (in real implementation, this would be the result from Deepgram + DeepSeek processing)
      const mockParsedData: ParsedSalesData = {
        items: [
          {
            category: 'breakfast',
            amount: 45.50,
            quantity: 3,
            description: 'Breakfast combo orders with coffee'
          },
          {
            category: 'beverages',
            amount: 12.75,
            quantity: 5,
            description: 'Various hot drinks'
          }
        ],
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'card',
        confidence: 0.92
      };

      setParsedData(mockParsedData);
      
      toast({
        title: "Audio Processed",
        description: `Found ${mockParsedData.items.length} sales items with ${(mockParsedData.confidence * 100).toFixed(0)}% confidence`,
        variant: "default"
      });

    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingAudio(false);
    }
  };

  const submitParsedData = async () => {
    if (!parsedData) return;

    setSubmittingData(true);
    try {
      // Submit each parsed item as a separate sales entry
      for (const item of parsedData.items) {
        await createSalesEntry({
          date: parsedData.date || new Date().toISOString().split('T')[0],
          amount: item.amount,
          currency: 'EUR',
          category: item.category,
          description: item.description,
          items: item.quantity || 1,
          payment_method: parsedData.paymentMethod || 'cash',
          source: 'voice'
        });
      }

      toast({
        title: "Success",
        description: `${parsedData.items.length} sales entries saved successfully!`,
        variant: "default"
      });

      // Reset form
      resetRecording();
      
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to save sales entries",
        variant: "destructive"
      });
    } finally {
      setSubmittingData(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, [recording]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-6 w-6" />
          Voice Sales Input
        </CardTitle>
        <CardDescription>
          Record your sales data using voice input. Speak clearly about items, quantities, and amounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="text-center space-y-4">
          {!isRecording && !recording && (
            <Button
              onClick={startRecording}
              size="lg"
              className="w-40 h-40 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <div className="text-center">
                <Mic className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Start Recording</span>
              </div>
            </Button>
          )}

          {isRecording && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16"
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </Button>
                
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-red-600">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      {isPaused ? 'Paused' : 'Recording...'}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={stopRecording}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </div>

              {/* Visual waveform indicator */}
              <div className="flex items-center justify-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-red-500 rounded-full transition-all duration-150 ${
                      !isPaused ? 'animate-pulse' : ''
                    }`}
                    style={{
                      height: Math.random() * 20 + 10,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {recording && !isRecording && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Recording Complete</div>
                <div className="text-muted-foreground">Duration: {formatTime(recording.duration)}</div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={playRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <Button
                  onClick={resetRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  onClick={processAudio}
                  disabled={processingAudio}
                  className="flex items-center gap-2"
                >
                  {processingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Waveform className="h-4 w-4" />
                  )}
                  Process Audio
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {processingAudio && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Processing audio...</div>
                  <div className="text-xs text-muted-foreground">
                    Converting speech to sales data using AI
                  </div>
                </div>
              </div>
              <Progress value={Math.random() * 100} className="mt-3" />
            </CardContent>
          </Card>
        )}

        {/* Parsed Results */}
        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Parsed Sales Data
              </CardTitle>
              <CardDescription>
                Review the extracted information before saving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confidence Score */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Confidence Score:</span>
                <Badge variant={parsedData.confidence > 0.8 ? "default" : "secondary"}>
                  {(parsedData.confidence * 100).toFixed(0)}%
                </Badge>
                {parsedData.confidence < 0.8 && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
              </div>

              {/* Extracted Items */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Extracted Items:</div>
                {parsedData.items.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium capitalize">{item.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">€{item.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} items
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Details */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline">
                  Date: {parsedData.date}
                </Badge>
                <Badge variant="outline">
                  Payment: {parsedData.paymentMethod}
                </Badge>
                <Badge variant="outline">
                  Total: €{parsedData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </Badge>
              </div>

              {/* Submit Button */}
              <Button
                onClick={submitParsedData}
                disabled={submittingData}
                className="w-full"
                size="lg"
              >
                {submittingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Sales Data...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Save Sales Entries
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Voice Input Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>• Speak clearly and at a moderate pace</p>
              <p>• Include category, quantity, and amount for each item</p>
              <p>• Example: "We sold 3 breakfast combos for 45 euros and 5 coffees for 12.75"</p>
              <p>• Mention payment method if different from cash</p>
              <p>• You can specify the date if it's not today</p>
            </div>
          </CardContent>
        </Card>

        {/* Hidden audio element for playback */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
};

export default VoiceSalesInput;