'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  useToast,
  Container,
  Heading,
  Badge,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Avatar,
  Input,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  addDoc,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import openai from '@/lib/openai';
import { FiCopy, FiSend } from 'react-icons/fi';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface Transcript {
  id: string;
  transcript: string;
  createdAt: Date;
  source: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export default function CombinedTranscriptQueryPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchTranscripts = async () => {
      if (!auth.currentUser) {
        console.log('No authenticated user, redirecting to login');
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      try {
        console.log('Params:', params);
        if (!params.ids) {
          console.error('No transcript IDs provided');
          toast({
            title: 'Error',
            description: 'No transcripts selected',
            status: 'error',
            duration: 5000,
          });
          return;
        }

        const transcriptIds = decodeURIComponent(params.ids as string).split(',');
        console.log('Fetching transcripts with IDs:', transcriptIds);
        
        // First get the employee document
        const employeeQuery = query(
          collection(db, 'employee'),
          where('userId', '==', auth.currentUser.uid)
        );
        const employeeSnapshot = await getDocs(employeeQuery);
        console.log('Employee query result:', employeeSnapshot.size);
        
        if (!employeeSnapshot.empty) {
          const employeeDoc = employeeSnapshot.docs[0];
          console.log('Found employee doc:', employeeDoc.id);
          const fetchedTranscripts: Transcript[] = [];
          
          // Fetch each transcript
          for (const id of transcriptIds) {
            console.log('Fetching transcript:', id);
            const transcriptRef = doc(employeeDoc.ref, 'calls', id);
            const transcriptDoc = await getDoc(transcriptRef);
            
            if (transcriptDoc.exists()) {
              console.log('Found transcript:', transcriptDoc.id);
              const data = transcriptDoc.data();
              fetchedTranscripts.push({
                id: transcriptDoc.id,
                transcript: data.transcript || '',
                createdAt: data.createdAt?.toDate() || new Date(),
                source: data.source || 'unknown'
              });
            } else {
              console.warn('Transcript not found:', id);
            }
          }
          
          console.log('Fetched transcripts:', fetchedTranscripts);
          if (fetchedTranscripts.length === 0) {
            toast({
              title: 'No transcripts found',
              description: 'Could not find the selected transcripts',
              status: 'warning',
              duration: 5000,
            });
          }
          setTranscripts(fetchedTranscripts);
        } else {
          console.error('No employee document found');
          toast({
            title: 'Error',
            description: 'Could not find user data',
            status: 'error',
            duration: 5000,
          });
        }
      } catch (error: any) {
        console.error('Error fetching transcripts:', error);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTranscripts();
  }, [params.ids, router, toast]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!auth.currentUser) return;

      try {
        // Get employee doc
        const employeeQuery = query(
          collection(db, 'employee'),
          where('userId', '==', auth.currentUser.uid)
        );
        const employeeSnapshot = await getDocs(employeeQuery);
        
        if (!employeeSnapshot.empty) {
          const employeeDoc = employeeSnapshot.docs[0];
          
          // Create a sorted combination ID that will be consistent regardless of order
          const idsArray = Array.isArray(params.ids) ? params.ids : params.ids.split(',');
          const combinationId = idsArray.sort().join('_');
          
          // Get or create the messages collection for this combination
          const messagesRef = collection(employeeDoc.ref, 'combinations', combinationId, 'messages');
          const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
          
          // Set up real-time listener for messages
          const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate()
            })) as Message[];
            setMessages(messagesList);
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error fetching messages',
          description: 'Please try refreshing the page',
          status: 'error',
          duration: 5000,
        });
      }
    };

    fetchMessages();
  }, [auth.currentUser, params.ids, toast]);

  const handleQuery = async () => {
    if (!userQuery.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage = userQuery.trim();
    setUserQuery('');

    try {
      // Get employee doc
      const employeeQueryRef = query(
        collection(db, 'employee'),
        where('userId', '==', auth.currentUser?.uid)
      );
      const employeeSnapshot = await getDocs(employeeQueryRef);
      
      if (!employeeSnapshot.empty) {
        const employeeDoc = employeeSnapshot.docs[0];
        
        // Create a sorted combination ID
        const idsArray = Array.isArray(params.ids) ? params.ids : params.ids.split(',');
        const combinationId = idsArray.sort().join('_');
        
        // Add user message to this combination's messages
        const messagesRef = collection(employeeDoc.ref, 'combinations', combinationId, 'messages');
        await addDoc(messagesRef, {
          content: userMessage,
          role: 'user',
          createdAt: serverTimestamp()
        });

        // Prepare conversation history for OpenAI
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Create system message with all transcripts context
        const combinedTranscripts = transcripts
          .map((t, index) => `
=== Transcript ${index + 1} ===
Date: ${t.createdAt.toLocaleString()}
Source: ${t.source}

${t.transcript}
          `)
          .join('\n\n');

        const systemMessage: ChatCompletionMessageParam = {
          role: 'system',
          content: `You are ChatQuery, an AI assistant specialized in analyzing sales call transcripts. You help sales teams, managers, and founders extract valuable insights from customer conversations.

You are analyzing ${transcripts.length} transcript(s):

${combinedTranscripts}

When asked what questions you can answer, ONLY suggest questions related to sales call analysis such as:

SALES INSIGHTS
• "What were the main objections raised by customers?"
• "How did the sales team handle pricing discussions?"
• "What competitors were mentioned and in what context?"
• "What features or benefits resonated most with prospects?"
• "What closing techniques were used successfully?"

CUSTOMER FEEDBACK
• "What pain points did customers mention most often?"
• "What feature requests came up in these conversations?"
• "How satisfied were customers with the onboarding process?"
• "What technical requirements did customers bring up?"
• "What integrations did customers ask about?"

ANALYSIS TYPES
• Single Call Deep-Dive: Detailed analysis of specific conversations
• Multi-Call Patterns: Identify trends across multiple calls
• Success/Failure Analysis: What worked/didn't in closing deals
• Competitive Intelligence: Gather insights about market position
• Product Feedback: Aggregate feature requests and complaints

Remember: You are ONLY here to analyze sales conversations. Do not suggest or answer questions outside of sales call analysis.

Format responses using:

QUICK SUMMARY
[Brief overview of key points from the call(s)]

KEY FINDINGS
• Finding with supporting quote
• Finding with supporting quote

OBJECTIONS & CONCERNS
• Objection with how it was handled
• Concern with context

POSITIVE SIGNALS
• Positive point with evidence
• Positive point with evidence

ACTION ITEMS
1. Clear next step
2. Clear next step
3. Clear next step

Guidelines:
• Use bullet points with • character (not - or *)
• Use numbers with periods (1. 2. 3.) for sequential items
• Format quotes as: "exact quote" [Transcript X]
• Keep each point concise and actionable
• Always include evidence from transcripts
• If no quote exists, state: No direct quote available

Target Audience:
Your insights should help sales teams improve their process, understand customer needs, and close more deals effectively.

If something is unclear or missing, ask for clarification. Keep responses focused on what's explicitly stated in the transcripts.`
        };

        // Get OpenAI response
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            systemMessage,
            ...conversationHistory.map(msg => ({
              role: msg.role,
              content: msg.content
            } as ChatCompletionMessageParam)),
            { role: 'user', content: userMessage } as ChatCompletionMessageParam
          ],
          temperature: 0.7,
          max_tokens: 1500
        });

        // Add AI response to this combination's messages
        await addDoc(messagesRef, {
          content: completion.choices[0].message.content || 'No response generated',
          role: 'assistant',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error processing query:', error);
      toast({
        title: 'Error processing query',
        description: 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading transcripts...</Text>
      </Container>
    );
  }

  if (transcripts.length === 0) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>No transcripts found</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch" w="full" maxW="1200px" mx="auto" p={6}>
        {/* Messages Container */}
        <VStack 
          spacing={6} 
          align="stretch" 
          flex={1} 
          bg="white" 
          borderRadius="xl"
          p={6}
          shadow="sm"
          minH="600px"
          overflowY="auto"
        >
          {messages.map((message, index) => (
            <HStack
              key={message.id}
              align="flex-start"
              spacing={4}
              justify={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
              w="full"
            >
              {message.role === 'assistant' && (
                <Avatar 
                  size="sm" 
                  name="AI Assistant" 
                  bg="blue.500" 
                  color="white"
                  fontSize="sm"
                />
              )}
              
              <Box
                maxW="80%"
                bg={message.role === 'assistant' ? 'white' : 'blue.500'}
                color={message.role === 'assistant' ? 'gray.800' : 'white'}
                p={4}
                borderRadius="2xl"
                shadow="sm"
                position="relative"
              >
                {message.role === 'assistant' ? (
                  <VStack align="stretch" spacing={4}>
                    {message.content.split('\n').map((line, idx) => {
                      // Handle section headers (all caps)
                      if (/^[A-Z\s]+$/.test(line.trim()) && line.trim().length > 0) {
                        return (
                          <Text
                            key={idx}
                            fontSize="lg"
                            fontWeight="600"
                            color="gray.800"
                          >
                            {line}
                          </Text>
                        );
                      }

                      // Handle bullet points
                      if (line.trim().startsWith('•')) {
                        return (
                          <HStack key={idx} spacing={3} align="flex-start">
                            <Box 
                              w={2} 
                              h={2} 
                              borderRadius="full" 
                              bg="blue.500" 
                              mt={2}
                            />
                            <Text flex={1}>{line.substring(1).trim()}</Text>
                          </HStack>
                        );
                      }

                      // Handle numbered points
                      if (/^\d+\./.test(line.trim())) {
                        const [num, ...rest] = line.split('.');
                        return (
                          <HStack key={idx} spacing={3} align="flex-start">
                            <Text fontWeight="600" color="blue.600" minW="24px">
                              {num}.
                            </Text>
                            <Text flex={1}>{rest.join('.').trim()}</Text>
                          </HStack>
                        );
                      }

                      // Handle quotes
                      if (line.includes('"')) {
                        return (
                          <Box 
                            key={idx}
                            p={3}
                            bg="gray.50"
                            borderLeft="4px solid"
                            borderLeftColor="blue.500"
                            borderRadius="sm"
                          >
                            <Text fontSize="md">{line}</Text>
                          </Box>
                        );
                      }

                      // Regular text
                      return line.trim() ? (
                        <Text key={idx}>{line}</Text>
                      ) : <Box key={idx} h={2} />;
                    })}
                    
                    {/* Action buttons */}
                    <HStack spacing={2} mt={4}>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Icon as={FiCopy} />}
                        onClick={() => navigator.clipboard.writeText(message.content)}
                      >
                        Copy to clipboard
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <Text color="white">{message.content}</Text>
                )}
                
                <Text 
                  fontSize="xs" 
                  color={message.role === 'assistant' ? 'gray.500' : 'whiteAlpha.800'}
                  mt={2}
                >
                  {message.createdAt?.toLocaleString()}
                </Text>
              </Box>

              {message.role === 'user' && (
                <Avatar 
                  size="sm" 
                  name="User" 
                  bg="gray.200"
                  color="gray.700"
                  fontSize="sm"
                />
              )}
            </HStack>
          ))}
          
          {isProcessing && (
            <HStack spacing={4} align="flex-start">
              <Avatar 
                size="sm" 
                name="AI Assistant" 
                bg="blue.500" 
                color="white"
                fontSize="sm"
              />
              <Box p={4} borderRadius="2xl" bg="gray.100">
                <Text>Strut is typing...</Text>
              </Box>
            </HStack>
          )}
        </VStack>

        {/* Input Area */}
        <Box 
          position="sticky" 
          bottom={0} 
          bg="white" 
          p={4} 
          borderRadius="xl"
          shadow="sm"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            handleQuery();
          }}>
            <HStack spacing={4}>
              <Input
                placeholder="Send a message about the transcripts..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                size="lg"
                bg="gray.50"
                border="none"
                _focus={{
                  bg: "white",
                  shadow: "sm"
                }}
              />
              <IconButton
                type="submit"
                aria-label="Send message"
                icon={<Icon as={FiSend} />}
                size="lg"
                colorScheme="blue"
                isLoading={isProcessing}
              />
            </HStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}
