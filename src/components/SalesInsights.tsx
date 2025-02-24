import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  VStack,
  Text,
  List,
  ListItem,
  ListIcon,
  Icon,
} from '@chakra-ui/react';
import { 
  FiClock, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle,
  FiBarChart2,
  FiMessageCircle,
} from 'react-icons/fi';

interface SalesInsightsProps {
  insights: {
    sentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number;
    topics: string[];
    objections: string[];
    duration: number;
    nextSteps: string[];
  };
}

export default function SalesInsights({ insights }: SalesInsightsProps) {
  const sentimentColor = {
    positive: 'green',
    neutral: 'gray',
    negative: 'red',
  }[insights.sentiment];

  const sentimentEmoji = {
    positive: '😊',
    neutral: '😐',
    negative: '😟',
  }[insights.sentiment];

  return (
    <Box w="100%">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Stat
          px={4}
          py={3}
          bg={`${sentimentColor}.50`}
          borderRadius="lg"
          borderWidth={1}
          borderColor={`${sentimentColor}.200`}
        >
          <StatLabel color={`${sentimentColor}.700`}>Overall Sentiment</StatLabel>
          <StatNumber fontSize="2xl">
            {sentimentEmoji} {insights.sentiment.charAt(0).toUpperCase() + insights.sentiment.slice(1)}
          </StatNumber>
          <StatHelpText>
            Score: {(insights.sentimentScore * 100).toFixed(1)}%
          </StatHelpText>
        </Stat>

        <Stat
          px={4}
          py={3}
          bg="blue.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="blue.200"
        >
          <StatLabel color="blue.700">Call Duration</StatLabel>
          <StatNumber fontSize="2xl">
            <Icon as={FiClock} mr={2} />
            {insights.duration} min
          </StatNumber>
          <StatHelpText>
            Estimated from transcript
          </StatHelpText>
        </Stat>

        <Box
          p={4}
          bg="purple.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="purple.200"
        >
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium" color="purple.700">Key Topics</Text>
            {insights.topics.length > 0 ? (
              <List spacing={2}>
                {insights.topics.map((topic, index) => (
                  <ListItem key={index} display="flex" alignItems="center">
                    <ListIcon as={FiBarChart2} color="purple.500" />
                    <Text>{topic.charAt(0).toUpperCase() + topic.slice(1)}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color="gray.500">No key topics identified</Text>
            )}
          </VStack>
        </Box>

        <Box
          p={4}
          bg="orange.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="orange.200"
        >
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium" color="orange.700">Common Objections</Text>
            {insights.objections.length > 0 ? (
              <List spacing={2}>
                {insights.objections.map((objection, index) => (
                  <ListItem key={index} display="flex" alignItems="center">
                    <ListIcon as={FiAlertCircle} color="orange.500" />
                    <Text>{objection.charAt(0).toUpperCase() + objection.slice(1)}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color="gray.500">No objections identified</Text>
            )}
          </VStack>
        </Box>

        <Box
          p={4}
          bg="green.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="green.200"
        >
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium" color="green.700">Next Steps</Text>
            {insights.nextSteps.length > 0 ? (
              <List spacing={2}>
                {insights.nextSteps.map((step, index) => (
                  <ListItem key={index} display="flex" alignItems="center">
                    <ListIcon as={FiCheckCircle} color="green.500" />
                    <Text>{step}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color="gray.500">No next steps identified</Text>
            )}
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
