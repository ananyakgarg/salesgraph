'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  Box,
  VStack,
  Text,
  Heading,
  Grid,
  GridItem,
  Container,
  List,
  ListItem,
  Badge,
  HStack,
  Icon,
  Center,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import TranscriptUpload from '@/components/TranscriptUpload';
import TranscriptList from '@/components/TranscriptList';
import SalesInsights from '@/components/SalesInsights';
import { analyzeTranscript } from '@/utils/transcriptAnalysis';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { FiBarChart2 } from 'react-icons/fi';

interface Transcript {
  id: string;
  title?: string;
  transcript: string;
  source: 'recording' | 'paste';
  createdAt: any; // Firebase Timestamp
  userId: string;
}

interface TranscriptData {
  id: string;
  transcript: string;
  preview?: string;
}

interface CombinedTranscript {
  id: string;
  transcriptIds: string[];
  createdAt: any;
}

export default function TranscriptsPage() {
  const [user, setUser] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [combinedTranscripts, setCombinedTranscripts] = useState<CombinedTranscript[]>([]);
  const [transcriptData, setTranscriptData] = useState<Transcript[]>([]);
  const [insights, setInsights] = useState<any>({
    sentiment: 'neutral',
    sentimentScore: 0,
    topics: [],
    objections: [],
    duration: 0,
    nextSteps: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const boxBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/auth/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'transcripts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      async (snapshot) => {
        const transcriptData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transcript[];
        setTranscripts(transcriptData);

        // Generate insights from all transcripts
        if (transcriptData.length > 0) {
          const combinedText = transcriptData.map(t => t.transcript || '').join('\n');
          const newInsights = analyzeTranscript({
            id: 'combined',
            transcript: combinedText
          });
          setInsights(newInsights);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to combined transcripts collection
    const combinedQ = query(
      collection(db, 'combinedTranscripts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeCombined = onSnapshot(combinedQ, (snapshot) => {
      const docs: CombinedTranscript[] = [];
      snapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data(),
        } as CombinedTranscript);
      });
      setCombinedTranscripts(docs);
    });

    return () => unsubscribeCombined();
  }, [user]);

  useEffect(() => {
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
          const transcriptsList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              transcript: data.transcript || '',
              title: data.title,
              source: data.source,
              createdAt: data.createdAt?.toDate() || new Date(),
              userId: data.userId
            } as Transcript;
          });
          
          setTranscriptData(transcriptsList);
        }
      } catch (error) {
        console.error('Error fetching transcripts:', error);
      }
    };

    fetchTranscripts();
  }, []);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" w="100vw" bg={bgColor} py={8}>
      <Grid
        templateColumns="repeat(12, 1fr)"
        gap={6}
        w="100%"
        px={8}
      >
        <GridItem colSpan={12}>
          <Box p={6} borderWidth={1} borderRadius="lg" bg={boxBg} w="100%">
            <VStack spacing={4} align="stretch" w="100%">
              <Heading size="md">Sales Performance Insights</Heading>
              <Text color="gray.600">
                Analysis of your sales call transcripts
              </Text>
              {transcripts.length > 0 ? (
                <SalesInsights insights={insights} />
              ) : (
                <VStack 
                  spacing={4} 
                  p={8} 
                  borderWidth={2}
                  borderRadius="lg"
                  borderStyle="dashed"
                  borderColor="gray.200"
                >
                  <Icon as={FiBarChart2} boxSize={10} color="gray.500" />
                  <Text fontSize="lg">No insights available yet</Text>
                  <Text color="gray.500" textAlign="center">
                    Upload some transcripts to see your performance insights
                  </Text>
                </VStack>
              )}
            </VStack>
          </Box>
        </GridItem>

        <GridItem colSpan={12}>
          <TranscriptUpload />
        </GridItem>

        <GridItem colSpan={12}>
          <Box p={6} borderWidth={1} borderRadius="lg" bg={boxBg} w="100%">
            <VStack spacing={4} align="stretch" w="100%">
              <HStack justify="space-between">
                <Heading size="md">Your Transcripts</Heading>
                <Text color="gray.500">
                  Total: {transcripts.length} {transcripts.length === 1 ? 'transcript' : 'transcripts'}
                </Text>
              </HStack>
              {transcripts.length > 0 ? (
                <List spacing={2}>
                  {transcripts.map((transcript) => (
                    <ListItem key={transcript.id} p={4} borderWidth={1} borderRadius="md">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">
                            {transcript.title || 'Untitled Transcript'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Created: {new Date(transcript.createdAt?.toDate()).toLocaleString()}
                          </Text>
                        </VStack>
                        <Badge colorScheme={transcript.source === 'recording' ? 'blue' : 'purple'}>
                          {transcript.source === 'recording' ? 'Recording' : 'Pasted'}
                        </Badge>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text color="gray.500">No transcripts yet</Text>
              )}
            </VStack>
          </Box>
        </GridItem>

        <GridItem colSpan={12}>
          <Box p={6} borderWidth={1} borderRadius="lg" bg={boxBg} w="100%">
            <VStack spacing={4} align="stretch" w="100%">
              <Heading size="md">Combined Transcripts</Heading>
              {combinedTranscripts.length > 0 ? (
                <List spacing={2}>
                  {combinedTranscripts.map((combined) => (
                    <ListItem key={combined.id} p={4} borderWidth={1} borderRadius="md">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">
                            Combined Set ({combined.transcriptIds.length} transcripts)
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Created: {new Date(combined.createdAt?.toDate()).toLocaleString()}
                          </Text>
                        </VStack>
                        <Badge colorScheme="green">Combined</Badge>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text color="gray.500">No combined transcripts yet</Text>
              )}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
