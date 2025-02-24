'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Heading,
  useToast,
  useColorModeValue,
  Icon,
  HStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      toast({
        title: "Signed out successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Heading size="sm" mb={2}>Account</Heading>
              <HStack justify="space-between" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <HStack>
                  <Icon as={FiUser} />
                  <Text>{auth.currentUser?.email}</Text>
                </HStack>
              </HStack>
            </Box>
            
            <Divider />
            
            <Box>
              <Button
                leftIcon={<Icon as={FiLogOut} />}
                colorScheme="red"
                variant="ghost"
                isLoading={isLoading}
                onClick={handleSignOut}
                width="full"
                justifyContent="flex-start"
              >
                Sign Out
              </Button>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
