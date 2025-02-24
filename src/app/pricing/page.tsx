'use client';

import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Stack,
  VStack,
  HStack,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { FiCheck, FiStar, FiBarChart2, FiUsers, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

const MotionBox = motion(Box);

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  badge?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Base",
    price: "$10",
    description: "Perfect for individual sales representatives or small teams",
    features: [
      "100 AI chat messages per month",
      "20 meetings analyzed per month",
      "Basic sales insights",
      "Meeting transcription",
      "Call recording",
      "Basic performance metrics",
      "Email support"
    ],
    buttonText: "Start Plan",
    badge: "Best for Early-Stage Founders"
  },
  {
    name: "Gold",
    price: "$50",
    description: "For growing teams that need more power and flexibility",
    features: [
      "300 AI chat messages per month",
      "100 meetings analyzed per month",
      "Advanced sales insights",
      "Priority meeting transcription",
      "Call recording with highlights",
      "Advanced performance metrics",
      "Priority email & chat support",
      "Team collaboration features"
    ],
    buttonText: "Start Plan",
    isPopular: true,
  },
  {
    name: "Premier",
    price: "$150",
    description: "For sales teams that demand the best in AI-powered sales tools",
    features: [
      "Unlimited AI chat messages",
      "Unlimited meetings analyzed",
      "Premium sales insights & analytics",
      "Real-time meeting transcription",
      "Advanced call recording & analysis",
      "Automatic Kanban board creation",
      "24/7 Priority support",
      "Salesforce integration",
      "HubSpot integration",
      "Jira integration",
      "Trello integration",
      "Linear integration"
    ],
    buttonText: "Start Plan",
  },
];

const enterpriseFeatures = [
  {
    icon: FiBarChart2,
    title: "Advanced Analytics",
    description: "Deep insights into sales performance and team metrics"
  },
  {
    icon: FiStar,
    title: "Premium Integrations",
    description: "Connect with your favorite tools: Salesforce, HubSpot, Jira, and more"
  },
  {
    icon: FiUsers,
    title: "Team Collaboration",
    description: "Enhanced team features with role-based permissions"
  },
  {
    icon: FiZap,
    title: "Automation",
    description: "Automatic Kanban boards and workflow optimization"
  }
];

export default function Pricing() {
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const popularBg = useColorModeValue('blue.50', 'blue.900');

  const handleButtonClick = (buttonText: string) => {
    if (buttonText === 'Contact Sales') {
      router.push('/contact');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Navbar />
      
      <Container maxW="container.xl" pt="28" pb="20">
        <VStack spacing={8} textAlign="center" mb={16}>
          <Heading
            as="h1"
            size="2xl"
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
          >
            Simple, Transparent Pricing
          </Heading>
          <Text fontSize="xl" color={useColorModeValue('gray.600', 'gray.400')} maxW="2xl">
            Choose the plan that best fits your team's needs. All plans are billed monthly.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} mb={16}>
          {pricingTiers.map((tier, index) => (
            <MotionBox
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              bg={tier.isPopular ? popularBg : bgColor}
              border="1px"
              borderColor={borderColor}
              borderRadius="xl"
              overflow="hidden"
              p={6}
              position="relative"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: 'xl',
                transition: 'all 0.2s ease',
              }}
            >
              {(tier.isPopular || tier.badge) && (
                <Badge
                  colorScheme={tier.isPopular ? "blue" : "green"}
                  position="absolute"
                  top={4}
                  right={4}
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {tier.isPopular ? "Most Popular" : tier.badge}
                </Badge>
              )}

              <VStack spacing={6} align="stretch">
                <VStack align="start" spacing={2}>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    bgGradient={tier.isPopular ? "linear(to-r, blue.400, purple.500)" : "none"}
                    bgClip={tier.isPopular ? "text" : "unset"}
                  >
                    {tier.name}
                  </Text>
                  <HStack>
                    <Text fontSize="4xl" fontWeight="bold">
                      {tier.price}
                    </Text>
                    {tier.price !== "Custom" && (
                      <Text fontSize="lg" color="gray.500">
                        /month
                      </Text>
                    )}
                  </HStack>
                  <Text color="gray.500">
                    {tier.description}
                  </Text>
                </VStack>

                <Divider />

                <List spacing={3}>
                  {tier.features.map((feature, featureIndex) => (
                    <ListItem key={featureIndex}>
                      <HStack>
                        <ListIcon as={FiCheck} color="green.500" />
                        <Text>{feature}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>

                <Button
                  colorScheme={tier.isPopular ? "blue" : "gray"}
                  size="lg"
                  w="full"
                  variant={tier.isPopular ? "solid" : "outline"}
                  onClick={() => handleButtonClick(tier.buttonText)}
                >
                  {tier.buttonText}
                </Button>
              </VStack>
            </MotionBox>
          ))}
        </SimpleGrid>

        <VStack spacing={8} textAlign="center">
          <Heading size="lg">Premier Features</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
            {enterpriseFeatures.map((feature, index) => (
              <Box 
                key={index}
                p={6} 
                bg={bgColor} 
                borderRadius="lg" 
                border="1px" 
                borderColor={borderColor}
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl',
                  transition: 'all 0.2s ease',
                }}
              >
                <VStack>
                  <Icon as={feature.icon} boxSize={6} color="blue.500" />
                  <Text fontWeight="bold">{feature.title}</Text>
                  <Text color="gray.500">{feature.description}</Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}
