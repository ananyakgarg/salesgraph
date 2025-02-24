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
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Textarea,
  Icon,
  Badge,
  SimpleGrid,
  Heading,
  useColorMode,
  List,
  ListItem,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Container,
  Flex,
  Spacer,
  useClipboard,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Checkbox,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFile, 
  FiCheck, 
  FiCopy, 
  FiMic, 
  FiUpload, 
  FiFileText, 
  FiList, 
  FiSave, 
  FiInbox, 
  FiCircle, 
  FiCheckCircle,
  FiSettings
} from 'react-icons/fi';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import MeetingRecorder from './MeetingRecorder';

interface TranscriptData {
  id: string;
  title: string;
  preview: string;
  source: string;
  createdAt: Date;
}

export default function TranscriptUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pastedTranscript, setPastedTranscript] = useState('');
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const [selectedTranscript, setSelectedTranscript] = useState<any>({});
  const [transcriptToDelete, setTranscriptToDelete] = useState<any>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { colorMode } = useColorMode();

  const fetchTranscripts = async () => {
    if (!auth.currentUser) return;
    
    try {
      console.log('Fetching transcripts for user:', auth.currentUser?.uid);
      const employeeQuery = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        console.log('Found employee doc:', employeeDoc.id);
        
        const transcriptsRef = collection(employeeDoc.ref, 'calls');
        const transcriptsQuery = query(transcriptsRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(transcriptsQuery);
        const transcriptsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            preview: data.preview || 'No preview available',
            source: data.source || 'Unknown source',
            createdAt: data.createdAt?.toDate() || new Date(),
            ...data // spread remaining data
          } as TranscriptData;
        });
        console.log('Loaded transcripts:', transcriptsList.length);
        setTranscripts(transcriptsList);
      } else {
        console.log('No employee document found');
      }
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      toast({
        title: 'Error fetching transcripts',
        description: 'Please try refreshing the page',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Fetch transcripts when component mounts
  useEffect(() => {
    if (auth.currentUser) {
      fetchTranscripts();
    }
  }, [auth.currentUser]);

  // Handle tab changes
  const handleTabChange = (index: number) => {
    setTabIndex(index);
    if (index === 2) { // Library tab
      fetchTranscripts();
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      // Get count of existing transcripts
      const fetchTranscriptCount = async () => {
        const q = query(
          collection(db, 'employee'),
          where('userId', '==', auth.currentUser?.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const employeeDoc = snapshot.docs[0];
          const callsCollection = collection(employeeDoc.ref, 'calls');
          const callsSnapshot = await getDocs(callsCollection);
          // setTranscriptCount(callsSnapshot.size);
        }
      };
      fetchTranscriptCount();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const processTranscriptContent = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.readAsText(file);
    });
  };

  const saveTranscript = async (content: string, source: string) => {
    if (!auth.currentUser) {
      toast({
        title: 'Error',
        description: 'Please sign in to save transcripts',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      // Get or create employee document
      const employeeQuery = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      let employeeRef;

      if (employeeSnapshot.empty) {
        // Create new employee document
        employeeRef = await addDoc(collection(db, 'employee'), {
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
        });
      } else {
        employeeRef = employeeSnapshot.docs[0].ref;
      }

      // Add transcript to calls subcollection
      const callsRef = collection(employeeRef, 'calls');
      await addDoc(callsRef, {
        transcript: content,
        createdAt: serverTimestamp(),
        source: source, // 'file' or 'paste'
        isReadyForQuerying: false
      });

      // Fetch updated transcripts
      await fetchTranscripts();
      
      // Switch to library tab
      setTabIndex(2);

      return true;
    } catch (error: any) {
      console.error('Error saving transcript:', error);
      throw error;
    }
  };

  const uploadFiles = async () => {
    setUploading(true);
    setProgress(0);
    const totalFiles = files.length;
    let processedFiles = 0;

    try {
      for (const file of files) {
        const content = await processTranscriptContent(file);
        await saveTranscript(content, 'file');
        
        processedFiles++;
        setProgress((processedFiles / totalFiles) * 100);
      }

      toast({
        title: 'Success',
        description: 'Transcripts uploaded successfully',
        status: 'success',
        duration: 5000,
      });

      setFiles([]);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedTranscript.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a transcript',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setUploading(true);
    try {
      await saveTranscript(pastedTranscript.trim(), 'paste');
      
      toast({
        title: 'Success',
        description: 'Transcript saved successfully',
        status: 'success',
        duration: 5000,
      });

      setPastedTranscript('');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const startQuerying = async (transcriptId: string, transcriptContent: string) => {
    if (!auth.currentUser) {
      router.push('/auth/login');
      return;
    }

    try {
      const q = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const employeeDoc = snapshot.docs[0];
        const transcriptRef = doc(employeeDoc.ref, 'calls', transcriptId);
        
        await updateDoc(transcriptRef, {
          isReadyForQuerying: true,
          lastUpdated: serverTimestamp()
        });

        // Navigate to the transcript query page
        router.push(`/transcript/${transcriptId}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDelete = async () => {
    if (!transcriptToDelete) return;
    
    try {
      const employeeQuery = query(
        collection(db, 'employees'),
        where('userId', '==', auth.currentUser?.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        const transcriptRef = doc(employeeDoc.ref, 'calls', transcriptToDelete.id);
        await deleteDoc(transcriptRef);
        
        // Update local state
        setTranscripts(prev => prev.filter(t => t.id !== transcriptToDelete.id));
        setSelectedTranscripts(prev => prev.filter(id => id !== transcriptToDelete.id));
        
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

  const handleTranscriptSelect = (transcriptId: string) => {
    console.log('Selecting transcript:', transcriptId);
    setSelectedTranscripts(prev => {
      const newSet = [...prev];
      if (newSet.includes(transcriptId)) {
        newSet.splice(newSet.indexOf(transcriptId), 1);
      } else {
        newSet.push(transcriptId);
      }
      console.log('Updated selected transcripts:', newSet);
      return newSet;
    });
  };

  const handleCombineTranscripts = () => {
    if (selectedTranscripts.length > 0) {
      const selectedIds = selectedTranscripts;
      console.log('Querying selected transcripts:', selectedIds);
      
      // Create a URL-safe string of IDs
      const idsParam = selectedIds
        .map(id => encodeURIComponent(id))
        .join(',');
      
      console.log('Navigation to:', `/transcripts/combined/${idsParam}`);
      router.push(`/transcripts/combined/${idsParam}`);
    } else {
      console.log('No transcripts selected');
    }
  };

  const handleViewTranscript = (transcript: TranscriptData) => {
    setSelectedTranscript(transcript);
    onOpen();
  };

  const handleStartChat = (transcript: TranscriptData) => {
    router.push(`/transcripts/${transcript.id}`);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    // Handle both Firestore Timestamp and regular Date objects
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <Box maxW="1200px" mx="auto" p={4}>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Sales Call Manager</Heading>
              <Text color="gray.500">Record, transcribe, and analyze your sales calls</Text>
            </VStack>
            <HStack>
              <Button
                leftIcon={<Icon as={FiCopy} />}
                colorScheme="blue"
                isDisabled={selectedTranscripts.length === 0}
                onClick={handleCombineTranscripts}
              >
                Analyze Selected Calls
              </Button>
              <Button
                variant="ghost"
                leftIcon={<Icon as={FiSettings} />}
                onClick={() => router.push('/settings')}
              >
                Settings
              </Button>
            </HStack>
          </HStack>

          <Tabs isFitted variant="enclosed-colored" index={tabIndex} onChange={handleTabChange}>
            <TabList mb="1em">
              <Tab>
                <HStack>
                  <Icon as={FiMic} />
                  <Text>Record</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FiFileText} />
                  <Text>Paste</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FiList} />
                  <Text>Library</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Box 
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
                  p={6} 
                  borderRadius="xl" 
                  shadow="sm"
                >
                  <MeetingRecorder />
                </Box>
              </TabPanel>

              <TabPanel>
                <Box 
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
                  p={6} 
                  borderRadius="xl" 
                  shadow="sm"
                >
                  <VStack spacing={4}>
                    <Textarea
                      value={pastedTranscript}
                      onChange={(e) => setPastedTranscript(e.target.value)}
                      placeholder="Paste your transcript here..."
                      size="lg"
                      minHeight="300px"
                      bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: 'none'
                      }}
                    />
                    <Button
                      colorScheme="blue"
                      onClick={handlePasteSubmit}
                      isLoading={uploading}
                      isDisabled={!pastedTranscript.trim()}
                      width="100%"
                      size="lg"
                      leftIcon={<Icon as={FiSave} />}
                    >
                      Save Transcript
                    </Button>
                  </VStack>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box 
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
                  p={6} 
                  borderRadius="xl" 
                  shadow="sm"
                >
                  {transcripts.length === 0 ? (
                    <VStack 
                      spacing={4} 
                      p={8} 
                      borderWidth={2}
                      borderRadius="lg"
                      borderStyle="dashed"
                      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                    >
                      <Icon as={FiInbox} boxSize={10} color="gray.500" />
                      <Text fontSize="lg">No transcripts yet</Text>
                      <Text color="gray.500" textAlign="center">
                        Record a meeting or upload transcripts to get started
                      </Text>
                    </VStack>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="medium" color="gray.500">
                          {transcripts.length} {transcripts.length === 1 ? 'Transcript' : 'Transcripts'}
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTranscripts([])}
                          isDisabled={selectedTranscripts.length === 0}
                        >
                          Clear Selection
                        </Button>
                      </HStack>
                      
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Select</Th>
                            <Th>Title</Th>
                            <Th>Source</Th>
                            <Th>Date</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {transcripts.map((transcript) => (
                            <Tr key={transcript.id}>
                              <Td>
                                <Checkbox
                                  isChecked={selectedTranscripts.includes(transcript.id)}
                                  onChange={() => handleTranscriptSelect(transcript.id)}
                                />
                              </Td>
                              <Td>{transcript.title}</Td>
                              <Td>{transcript.source}</Td>
                              <Td>{formatDate(transcript.createdAt)}</Td>
                              <Td>
                                <ButtonGroup size="sm" variant="ghost">
                                  <Button
                                    leftIcon={<FiFileText />}
                                    onClick={() => handleViewTranscript(transcript)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    leftIcon={<FiMic />}
                                    onClick={() => handleStartChat(transcript)}
                                  >
                                    Analyze with AI
                                  </Button>
                                  <Button
                                    leftIcon={<FiCircle />}
                                    onClick={() => {
                                      setTranscriptToDelete(transcript);
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
                    </VStack>
                  )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>

      {/* View Transcript Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text>View Transcript</Text>
                <Badge colorScheme={selectedTranscript.source === 'file' ? 'blue' : 'purple'}>
                  {selectedTranscript.source === 'file' ? 'File Upload' : 'Pasted'}
                </Badge>
              </VStack>
              <Text fontSize="sm" color="gray.500">
                {formatDate(selectedTranscript.createdAt)}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box
              p={4}
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
              borderRadius="md"
              maxH="600px"
              overflowY="auto"
            >
              <Text whiteSpace="pre-wrap">{selectedTranscript.transcript}</Text>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
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
              Are you sure you want to delete this transcript? This action cannot be undone.
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
    </>
  );
}
