'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  useColorMode,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Icon,
  Button,
  Progress,
  useToast,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiFile, 
  FiCheck, 
  FiTrash2, 
  FiDownload,
  FiSettings,
  FiBook
} from 'react-icons/fi';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface CompanyDoc {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  size: number;
}

export default function SettingsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [documents, setDocuments] = useState<CompanyDoc[]>([]);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    if (!files.length) return;

    setUploading(true);
    setProgress(0);

    try {
      const totalFiles = files.length;
      let completed = 0;

      for (const file of files) {
        // Create a reference to upload the file
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('userId', '==', auth.currentUser?.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('Employee record not found');
        }

        const employeeDoc = querySnapshot.docs[0];
        const docsCollection = collection(employeeDoc.ref, 'company_docs');

        // Read the file
        const fileContent = await file.text();

        // Upload to Firestore
        await addDoc(docsCollection, {
          name: file.name,
          content: fileContent,
          type: file.type,
          size: file.size,
          uploadedAt: serverTimestamp(),
        });

        completed++;
        setProgress((completed / totalFiles) * 100);
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${totalFiles} document${totalFiles > 1 ? 's' : ''}`,
        status: 'success',
        duration: 5000,
      });

      setFiles([]);
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

  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Company Settings</Heading>
            <Text color="gray.500">Manage your company documents and preferences</Text>
          </VStack>
        </HStack>

        <Tabs isFitted variant="enclosed-colored">
          <TabList mb="1em">
            <Tab>
              <HStack>
                <Icon as={FiBook} />
                <Text>Documents</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Icon as={FiSettings} />
                <Text>Preferences</Text>
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
                <VStack spacing={6} align="stretch">
                  <VStack align="start" spacing={1}>
                    <Heading size="md">Company Documents</Heading>
                    <Text color="gray.500">
                      Upload company materials, sales scripts, and product documentation
                    </Text>
                  </VStack>

                  <Box 
                    p={8} 
                    borderWidth={2} 
                    borderRadius="lg" 
                    borderStyle="dashed" 
                    borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                    _hover={{
                      borderColor: 'blue.500',
                      bg: colorMode === 'dark' ? 'gray.700' : 'gray.50'
                    }}
                    transition="all 0.2s"
                  >
                    <VStack spacing={3}>
                      <Icon as={FiUpload} boxSize={8} color="gray.500" />
                      <Text fontSize="lg">Drop company documents here</Text>
                      <Text fontSize="sm" color="gray.500">
                        Supports PDF, DOC, DOCX, and TXT files
                      </Text>
                      <input
                        type="file"
                        multiple
                        accept=".txt,.doc,.docx,.pdf"
                        onChange={handleFileChange}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                    </VStack>
                  </Box>

                  {files.length > 0 && (
                    <VStack spacing={2} width="100%">
                      {files.map((file, index) => (
                        <HStack 
                          key={index}
                          p={3}
                          bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                          borderRadius="md"
                          width="100%"
                          justify="space-between"
                        >
                          <HStack>
                            <Icon as={FiFile} />
                            <Text>{file.name}</Text>
                          </HStack>
                          <Icon as={FiCheck} color="green.500" />
                        </HStack>
                      ))}
                    </VStack>
                  )}

                  {uploading && (
                    <Progress 
                      value={progress} 
                      size="sm" 
                      colorScheme="blue" 
                      width="100%" 
                      borderRadius="full"
                    />
                  )}

                  <Button
                    colorScheme="blue"
                    onClick={uploadFiles}
                    isLoading={uploading}
                    isDisabled={files.length === 0}
                    width="100%"
                    size="lg"
                    leftIcon={<Icon as={FiUpload} />}
                  >
                    Upload {files.length} {files.length === 1 ? 'Document' : 'Documents'}
                  </Button>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={8}>
                    {documents.map((doc) => (
                      <Box
                        key={doc.id}
                        p={4}
                        borderWidth={1}
                        borderRadius="lg"
                        borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                        _hover={{
                          transform: 'translateY(-2px)',
                          shadow: 'md'
                        }}
                        transition="all 0.2s"
                      >
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" width="100%">
                            <Badge 
                              colorScheme="blue"
                              borderRadius="full"
                              px={2}
                            >
                              {doc.type}
                            </Badge>
                            <HStack>
                              <Icon 
                                as={FiDownload}
                                cursor="pointer"
                                _hover={{ color: 'blue.500' }}
                              />
                              <Icon 
                                as={FiTrash2}
                                cursor="pointer"
                                _hover={{ color: 'red.500' }}
                              />
                            </HStack>
                          </HStack>
                          
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium" noOfLines={2}>
                              {doc.name}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </Text>
                          </VStack>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
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
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Company Preferences</Heading>
                  <Text color="gray.500">Coming soon...</Text>
                </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}
