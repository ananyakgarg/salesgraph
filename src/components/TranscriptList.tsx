'use client';

import {
  List,
  ListItem,
  Text,
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiFileText, FiTrash2, FiEye } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface TranscriptData {
  id: string;
  title: string;
  preview: string;
  source: string;
  createdAt: Date;
}

export default function TranscriptList() {
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const router = useRouter();
  const bgHover = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    if (!auth.currentUser) return;
    
    try {
      const employeeQuery = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        const transcriptsRef = collection(employeeDoc.ref, 'calls');
        const transcriptsQuery = query(transcriptsRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(transcriptsQuery);
        const transcriptsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as TranscriptData[];
        
        setTranscripts(transcriptsList);
      }
    } catch (error) {
      console.error('Error fetching transcripts:', error);
    }
  };

  const handleDelete = async (transcriptId: string) => {
    if (!auth.currentUser) return;
    
    try {
      const employeeQuery = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        const transcriptRef = doc(employeeDoc.ref, 'calls', transcriptId);
        await deleteDoc(transcriptRef);
        
        // Update local state
        setTranscripts(prev => prev.filter(t => t.id !== transcriptId));
      }
    } catch (error) {
      console.error('Error deleting transcript:', error);
    }
  };

  const handleView = (transcriptId: string) => {
    router.push(`/transcripts/${transcriptId}`);
  };

  if (transcripts.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Icon as={FiFileText} boxSize={10} color="gray.400" />
        <Text mt={4} color="gray.500">
          No transcripts yet. Upload your first call recording or transcript.
        </Text>
      </Box>
    );
  }

  return (
    <List spacing={3}>
      {transcripts.map((transcript) => (
        <ListItem
          key={transcript.id}
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          _hover={{ bg: bgHover }}
          transition="background-color 0.2s"
        >
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text fontWeight="semibold" noOfLines={1}>
                {transcript.title || 'Untitled Transcript'}
              </Text>
              <Badge colorScheme="blue">
                {transcript.source || 'Upload'}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.500" noOfLines={2}>
              {transcript.preview}
            </Text>
            
            <HStack justify="space-between" pt={2}>
              <Text fontSize="sm" color="gray.500">
                {transcript.createdAt.toLocaleDateString()}
              </Text>
              
              <HStack spacing={2}>
                <Button
                  size="sm"
                  leftIcon={<FiEye />}
                  variant="ghost"
                  onClick={() => handleView(transcript.id)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FiTrash2 />}
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDelete(transcript.id)}
                >
                  Delete
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </ListItem>
      ))}
    </List>
  );
}
