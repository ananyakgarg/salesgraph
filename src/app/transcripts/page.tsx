'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  GridItem,
  useColorModeValue,
  List,
  ListItem,
  Badge,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import TranscriptUpload from '@/components/TranscriptUpload';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface Transcript {
  id: string;
  fileName: string;
  uploadedAt: any;
  isProcessed: boolean;
  isCombined: boolean;
}

interface CombinedTranscript {
  id: string;
  createdAt: any;
  transcriptIds: string[];
}

export default function TranscriptsPage() {
  const [user, setUser] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [combinedTranscripts, setCombinedTranscripts] = useState<CombinedTranscript[]>([]);
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');

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

    // Subscribe to transcripts collection
    const q = query(
      collection(db, 'transcripts'),
      where('userId', '==', user.uid),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribeTranscripts = onSnapshot(q, (snapshot) => {
      const docs: Transcript[] = [];
      snapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data(),
        } as Transcript);
      });
      setTranscripts(docs);
    });

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

    return () => {
      unsubscribeTranscripts();
      unsubscribeCombined();
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Grid templateColumns="repeat(12, 1fr)" gap={6}>
        <GridItem colSpan={12}>
          <Box bg={bgColor} p={8} borderRadius="xl" boxShadow="xl">
            <VStack spacing={6} align="stretch">
              <Heading size="xl">Transcript Management</Heading>
              <Text fontSize="lg" color="gray.600">
                Upload and manage your sales call transcripts. Transcripts will be automatically
                combined when you reach 5 uploads for better analysis.
              </Text>
            </VStack>
          </Box>
        </GridItem>

        <GridItem colSpan={12} w={{ md: "50%" }}>
          <TranscriptUpload />
        </GridItem>

        <GridItem colSpan={12} w={{ md: "50%" }}>
          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <VStack spacing={4} align="stretch">
              <Heading size="md">Your Transcripts</Heading>

              {combinedTranscripts.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Combined Transcripts</Text>
                  <List spacing={2}>
                    {combinedTranscripts.map((combined) => (
                      <ListItem key={combined.id} p={2} borderWidth={1} borderRadius="md">
                        <Text fontWeight="semibold">
                          Combined Set ({combined.transcriptIds.length} transcripts)
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Created: {new Date(combined.createdAt?.toDate()).toLocaleString()}
                        </Text>
                        <Badge colorScheme="green">Combined</Badge>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box mt={4}>
                <Text fontWeight="bold" mb={2}>Individual Transcripts</Text>
                <List spacing={2}>
                  {transcripts.map((transcript) => (
                    <ListItem key={transcript.id} p={2} borderWidth={1} borderRadius="md">
                      <Text fontWeight="semibold">{transcript.fileName}</Text>
                      <Text fontSize="sm" color="gray.500">
                        Uploaded: {new Date(transcript.uploadedAt?.toDate()).toLocaleString()}
                      </Text>
                      <Badge 
                        colorScheme={transcript.isCombined ? "green" : "yellow"}
                      >
                        {transcript.isCombined ? "Combined" : "Individual"}
                      </Badge>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {transcripts.length === 0 && (
                <Text color="gray.500">No transcripts uploaded yet</Text>
              )}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}
