'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Progress,
  List,
  ListItem,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { storage, db, auth } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiFile, FiCheck } from 'react-icons/fi';

export default function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const processFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.readAsText(file);
    });
  };

  const uploadFiles = async () => {
    if (!auth.currentUser) {
      toast({
        title: 'Error',
        description: 'Please sign in to upload documents',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (const file of files) {
        // Upload file to Firebase Storage
        const storageRef = ref(storage, `docs/${auth.currentUser.uid}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Wait for upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(progress);
            },
            (error) => reject(error),
            () => resolve()
          );
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Process file content
        const content = await processFileContent(file);

        // Store document metadata in Firestore
        await addDoc(collection(db, 'documents'), {
          userId: auth.currentUser.uid,
          fileName: file.name,
          fileUrl: downloadURL,
          content: content,
          uploadedAt: serverTimestamp(),
          processed: false
        });
      }

      toast({
        title: 'Success',
        description: 'Documents uploaded successfully',
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
      setProgress(0);
    }
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">
          Upload Company Documents
        </Text>
        
        <Button
          as="label"
          htmlFor="file-upload"
          colorScheme="blue"
          cursor="pointer"
          isDisabled={uploading}
        >
          Select Files
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </Button>

        {files.length > 0 && (
          <List spacing={2}>
            {files.map((file, index) => (
              <ListItem key={index}>
                <HStack>
                  <Icon as={FiFile} />
                  <Text>{file.name}</Text>
                  <Icon as={FiCheck} color="green.500" />
                </HStack>
              </ListItem>
            ))}
          </List>
        )}

        {uploading && <Progress value={progress} size="sm" colorScheme="blue" />}

        <Button
          colorScheme="green"
          onClick={uploadFiles}
          isLoading={uploading}
          isDisabled={files.length === 0}
        >
          Upload Documents
        </Button>
      </VStack>
    </Box>
  );
}
