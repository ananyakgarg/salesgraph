'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiMic, FiSquare, FiUpload } from 'react-icons/fi';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  getDocs 
} from 'firebase/firestore';

const MeetingRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // First try to get microphone access
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // For system audio on macOS, we need to capture the entire screen
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor' as any, // Prefer full screen capture
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        systemAudio: 'include' as any // Chrome/Edge specific
      });

      // Create an audio context to mix the streams
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add screen audio to the mix if available
      const audioTracks = screenStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const screenSource = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
        screenSource.connect(destination);
      } else {
        toast({
          title: 'No System Audio',
          description: 'Could not capture system audio. Make sure to enable "Share system audio" in the screen share dialog.',
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
      }

      // Add mic audio to the mix
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      // Create a media recorder with the combined audio
      mediaRecorder.current = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        screenStream.getTracks().forEach(track => track.stop());
        micStream.getTracks().forEach(track => track.stop());
      };

      // Show instructions for screen sharing
      toast({
        title: 'Important Setup Steps',
        description: `
          1. Select "Entire Screen" when prompted
          2. Enable "Share system audio" in the screen share dialog
          3. Make sure your Zoom meeting is visible on the selected screen
        `,
        status: 'info',
        duration: 15000,
        isClosable: true,
      });

      mediaRecorder.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Setup',
        description: `
          To record Zoom meetings:
          1. Open your Zoom meeting
          2. Click "Start Recording" here
          3. Select "Entire Screen" that has Zoom
          4. Enable "Share system audio" checkbox
        `,
        status: 'warning',
        duration: 10000,
        isClosable: true,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob || !auth.currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // First, transcribe the audio using Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionResult = await response.json();
      
      // Get employee document reference
      const employeeQuery = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        
        // Save transcript to Firestore
        const transcriptRef = await addDoc(collection(employeeDoc.ref, 'calls'), {
          transcript: transcriptionResult.text,
          source: 'recording',
          createdAt: serverTimestamp(),
          duration: recordingTime,
        });

        toast({
          title: 'Recording transcribed',
          description: 'Your meeting has been recorded and transcribed successfully.',
          status: 'success',
          duration: 5000,
        });

        // Reset state
        setAudioBlob(null);
        setRecordingTime(0);
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to transcribe recording. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">
          Record Meeting
        </Text>

        <Box p={4} bg="blue.50" borderRadius="md">
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">How to record a Zoom meeting:</Text>
            <Text>1. Open your Zoom desktop app and join the meeting</Text>
            <Text>2. Click "Start Recording" below</Text>
            <Text>3. When prompted, select "Entire Screen" that has Zoom</Text>
            <Text>4. Make sure to enable "Share system audio" checkbox</Text>
            <Text color="red.600" fontSize="sm">
              Important: You must enable "Share system audio" to capture the meeting
            </Text>
            <Text color="gray.600" fontSize="sm">
              Note: For best quality, use Chrome or Edge browser
            </Text>
          </VStack>
        </Box>

        <Box textAlign="center">
          <Text fontSize="4xl" fontWeight="bold" color={isRecording ? 'red.500' : 'gray.500'}>
            {formatTime(recordingTime)}
          </Text>
        </Box>

        <HStack justify="center" spacing={4}>
          {!isRecording ? (
            <Button
              leftIcon={<Icon as={FiMic} />}
              colorScheme="blue"
              onClick={startRecording}
              size="lg"
              isDisabled={isUploading}
            >
              Start Recording
            </Button>
          ) : (
            <Button
              leftIcon={<Icon as={FiSquare} />}
              colorScheme="red"
              onClick={stopRecording}
              size="lg"
            >
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && (
            <Button
              leftIcon={<Icon as={FiUpload} />}
              colorScheme="green"
              onClick={uploadRecording}
              isLoading={isUploading}
              loadingText="Transcribing..."
              size="lg"
            >
              Transcribe Recording
            </Button>
          )}
        </HStack>

        {isUploading && (
          <Progress 
            size="sm" 
            colorScheme="blue" 
            hasStripe 
            isAnimated 
            value={uploadProgress} 
          />
        )}
      </VStack>
    </Box>
  );
};

export default MeetingRecorder;
