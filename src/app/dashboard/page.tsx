'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  orderBy, 
  limit,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import {
  Box,
  Button,
  VStack,
  Text,
  Heading,
  Grid,
  GridItem,
  HStack,
  useToast,
  Icon,
  SimpleGrid,
  Badge,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  ButtonGroup,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiSettings, FiMic, FiList, FiCircle } from 'react-icons/fi';
import Settings from '@/components/Settings';

interface Document {
  id: string;
  fileName: string;
  uploadedAt: any;
  isProcessed: boolean;
  isCombined: boolean;
  title?: string;
  source?: string;
  createdAt?: any;
}

export default function Dashboard() {
  const router = useRouter();
  const toast = useToast();
  const [recentCalls, setRecentCalls] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptToDelete, setTranscriptToDelete] = useState<Document | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const handleDelete = async () => {
    if (!transcriptToDelete) return;
    
    try {
      const employeeQuery = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser?.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        const transcriptRef = doc(employeeDoc.ref, 'calls', transcriptToDelete.id);
        await deleteDoc(transcriptRef);
        
        setRecentCalls(prev => prev.filter(t => t.id !== transcriptToDelete.id));
        
        toast({
          title: "Transcript deleted",
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast({
        title: "Error deleting transcript",
        status: "error",
        duration: 3000,
      });
    }
    
    onDeleteClose();
    setTranscriptToDelete(null);
  };

  const handleStartChat = (transcript: Document) => {
    router.push(`/transcripts/${transcript.id}`);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        // First get the employee document
        const employeeQuery = query(
          collection(db, 'employee'),
          where('userId', '==', user.uid)
        );

        getDocs(employeeQuery).then((employeeSnapshot) => {
          if (!employeeSnapshot.empty) {
            const employeeDoc = employeeSnapshot.docs[0];
            
            // Then subscribe to the calls subcollection
            const callsQuery = query(
              collection(employeeDoc.ref, 'calls'),
              orderBy('createdAt', 'desc'),
              limit(10)
            );

            const unsubscribeTranscripts = onSnapshot(callsQuery, (snapshot) => {
              const docs: Document[] = [];
              snapshot.forEach((doc) => {
                docs.push({
                  id: doc.id,
                  fileName: doc.data().fileName || doc.data().title || 'Untitled',
                  uploadedAt: doc.data().createdAt,
                  isProcessed: doc.data().isReadyForQuerying || false,
                  isCombined: false,
                  source: doc.data().source || 'upload',
                  title: doc.data().title
                });
              });
              setRecentCalls(docs);
              setLoading(false);
            }, (error) => {
              console.error('Error fetching transcripts:', error);
              setLoading(false);
            });

            return () => unsubscribeTranscripts();
          } else {
            setLoading(false);
          }
        }).catch((error) => {
          console.error('Error fetching employee:', error);
          setLoading(false);
        });
      } else {
        router.push('/auth/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <HStack justify="space-between" mb={8}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Welcome Back</Heading>
          <Text color="gray.500">Manage and analyze your sales calls</Text>
        </VStack>
        <HStack>
          <Button
            colorScheme="blue"
            leftIcon={<Icon as={FiMic} />}
            onClick={() => router.push('/record')}
          >
            Record Call
          </Button>
          <Button
            variant="ghost"
            leftIcon={<Icon as={FiList} />}
            onClick={() => router.push('/transcripts')}
          >
            View All Transcripts
          </Button>
          <Button
            leftIcon={<Icon as={FiSettings} />}
            variant="ghost"
            onClick={onSettingsOpen}
          >
            Settings
          </Button>
        </HStack>
      </HStack>

      <Settings isOpen={isSettingsOpen} onClose={onSettingsClose} />

      {loading ? (
        <Center h="200px">
          <Spinner size="xl" />
        </Center>
      ) : (
        <Box>
          <Heading size="md" mb={4}>Recent Calls</Heading>
          <Box mb={4}>
            <Text color="gray.500" fontSize="sm">
              Showing recent calls. {recentCalls.length > 0 && (
                <Button
                  variant="link"
                  color="blue.500"
                  onClick={() => router.push('/transcripts')}
                  size="sm"
                >
                  View all transcripts →
                </Button>
              )}
            </Text>
          </Box>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Source</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentCalls.map((call) => (
                <Tr key={call.id}>
                  <Td>{call.fileName || call.title || 'Untitled'}</Td>
                  <Td>
                    <Badge colorScheme={call.source === 'paste' ? 'purple' : 'blue'}>
                      {call.source === 'paste' ? 'Pasted' : 'Uploaded'}
                    </Badge>
                  </Td>
                  <Td>{formatDate(call.uploadedAt || call.createdAt)}</Td>
                  <Td>
                    <ButtonGroup size="sm" variant="ghost">
                      <Button
                        leftIcon={<FiMic />}
                        onClick={() => handleStartChat(call)}
                      >
                        Analyze with AI
                      </Button>
                      <Button
                        leftIcon={<FiCircle />}
                        onClick={() => {
                          setTranscriptToDelete(call);
                          onDeleteOpen();
                        }}
                        colorScheme="red"
                      >
                        Delete
                      </Button>
                    </ButtonGroup>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Transcript
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
