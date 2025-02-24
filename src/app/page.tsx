'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useColorModeValue,
  Flex,
  SimpleGrid,
  Icon,
  List,
  ListItem,
  ListIcon,
  Badge,
  chakra,
  shouldShowFallbackImage,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  FiBarChart2, 
  FiCpu, 
  FiTrendingUp, 
  FiZap,
  FiCheckCircle,
  FiMic,
  FiMessageSquare,
  FiPieChart,
  FiDollarSign,
  FiUsers
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

const MotionBox = motion(Box);
const MotionContainer = motion(Container);

const floatAnimation = {
  y: [-20, 0, -20],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const features = [
  {
    icon: FiMic,
    title: "Record & Transcribe",
    description: "Automatically capture and transcribe sales calls with crystal-clear accuracy"
  },
  {
    icon: FiCpu,
    title: "AI-Powered Analysis",
    description: "Get instant insights from your sales conversations using advanced AI"
  },
  {
    icon: FiTrendingUp,
    title: "Performance Tracking",
    description: "Track key metrics and identify winning patterns in your sales approach"
  },
  {
    icon: FiMessageSquare,
    title: "Smart Insights",
    description: "Extract customer sentiment, objections, and buying signals automatically"
  }
];

const benefits = [
  "Close more deals with AI-driven insights",
  "Save hours on manual call analysis",
  "Identify and replicate successful sales patterns",
  "Train new reps faster with real examples",
  "Never miss a critical customer signal",
  "Make data-driven sales decisions"
];

const stats = [
  { number: "40%", label: "Increase in Win Rate" },
  { number: "3.5x", label: "Faster Deal Velocity" },
  { number: "60%", label: "Time Saved on Analysis" },
  { number: "90%", label: "Rep Satisfaction" }
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const statsBg = useColorModeValue('blue.50', 'blue.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Box>
      <Navbar />
      
      {/* Main content with padding for navbar */}
      <Box pt="64px">
        {/* Hero Section */}
        <MotionBox
          as="section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          bg={useColorModeValue('gray.50', 'gray.900')} 
          pt={{ base: 20, md: 28 }} 
          pb={{ base: 16, md: 24 }}
        >
          <MotionContainer maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
              <VStack align="flex-start" spacing={6}>
                <Badge 
                  colorScheme="blue" 
                  fontSize="md" 
                  px={4} 
                  py={2} 
                  borderRadius="full"
                >
                  AI-Powered Sales Intelligence
                </Badge>
                <Heading 
                  as="h1" 
                  size="3xl" 
                  fontWeight="bold"
                  lineHeight="shorter"
                >
                  Transform Your Sales Calls into
                  <Text 
                    as="span" 
                    background="linear-gradient(120deg, #4299E1, #805AD5)"
                    backgroundClip="text"
                    color="transparent"
                  > Actionable Insights
                  </Text>
                </Heading>
                <Text fontSize="xl" color={textColor}>
                  Leverage AI to analyze sales conversations, identify winning patterns, and close more deals. Your sales team's unfair advantage starts here.
                </Text>
                <HStack spacing={4}>
                  {!user ? (
                    <Button
                      colorScheme="blue"
                      size="lg"
                      height="4rem"
                      px={8}
                      fontSize="lg"
                      onClick={() => window.location.href = '/pricing'}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'lg',
                      }}
                    >
                      See Pricing
                    </Button>
                  ) : (
                    <Button
                      colorScheme="blue"
                      size="lg"
                      height="4rem"
                      px={8}
                      fontSize="lg"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </HStack>
              </VStack>
              <MotionBox
                initial={{ y: 0 }}
                animate={floatAnimation}
                display={{ base: 'none', md: 'block' }}
              >
                <Box
                  bg={cardBg}
                  p={8}
                  borderRadius="2xl"
                  boxShadow="2xl"
                  border="1px"
                  borderColor={borderColor}
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '-15px',
                    left: '-15px',
                    right: '-15px',
                    bottom: '-15px',
                    background: 'linear-gradient(45deg, #4299E1, #805AD5)',
                    borderRadius: '2xl',
                    zIndex: -1,
                    opacity: 0.2,
                  }}
                >
                  <VStack spacing={6} align="stretch">
                    <HStack justify="space-between">
                      <Icon as={FiBarChart2} boxSize={6} color="blue.500" />
                      <Badge colorScheme="green">Live Analysis</Badge>
                    </HStack>
                    <Text fontWeight="bold" fontSize="lg">
                      Sales Call Analysis
                    </Text>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box p={4} bg={statsBg} borderRadius="lg">
                        <Text fontSize="sm" color={textColor}>Objection Rate</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">-35%</Text>
                      </Box>
                      <Box p={4} bg={statsBg} borderRadius="lg">
                        <Text fontSize="sm" color={textColor}>Close Rate</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">+42%</Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </Box>
              </MotionBox>
            </SimpleGrid>
          </MotionContainer>
        </MotionBox>

        {/* Stats Section */}
        <MotionBox
          as="section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          py={20} bg={statsBg}
        >
          <MotionContainer maxW="container.xl">
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={10}>
              {stats.map((stat, index) => (
                <VStack key={index} align="center">
                  <Text 
                    fontSize={{ base: "4xl", md: "6xl" }} 
                    fontWeight="bold" 
                    color="blue.500"
                  >
                    {stat.number}
                  </Text>
                  <Text fontSize="lg" color={textColor} textAlign="center">
                    {stat.label}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </MotionContainer>
        </MotionBox>

        {/* Features Section */}
        <MotionBox
          as="section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          py={20}
        >
          <MotionContainer maxW="container.xl">
            <VStack spacing={16}>
              <VStack spacing={4} textAlign="center">
                <Heading size="2xl">
                  Everything You Need to
                  <Text 
                    as="span" 
                    color="blue.500"
                  > Excel at Sales
                  </Text>
                </Heading>
                <Text fontSize="xl" color={textColor} maxW="2xl">
                  Our platform combines cutting-edge AI with intuitive design to help your sales team perform at their best.
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
                {features.map((feature, index) => (
                  <MotionBox
                    whileHover={{ scale: 1.05 }}
                    key={index}
                    p={8}
                    bg={cardBg}
                    borderRadius="xl"
                    boxShadow="lg"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: 'xl',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <VStack align="start" spacing={4}>
                      <Icon as={feature.icon} boxSize={8} color="blue.500" />
                      <Text fontSize="xl" fontWeight="bold">
                        {feature.title}
                      </Text>
                      <Text color={textColor}>
                        {feature.description}
                      </Text>
                    </VStack>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </MotionContainer>
        </MotionBox>

        {/* Benefits Section */}
        <MotionBox
          as="section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          py={20} bg={useColorModeValue('gray.50', 'gray.900')}
        >
          <MotionContainer maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
              <VStack align="start" spacing={8}>
                <Heading size="2xl">
                  Why Teams Choose
                  <Text 
                    as="span" 
                    color="blue.500"
                  > SalesGraph
                  </Text>
                </Heading>
                <List spacing={5}>
                  {benefits.map((benefit, index) => (
                    <ListItem key={index} fontSize="lg">
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      {benefit}
                    </ListItem>
                  ))}
                </List>
                {!user && (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    See Pricing
                  </Button>
                )}
              </VStack>
              <Box
                bg={cardBg}
                p={8}
                borderRadius="2xl"
                boxShadow="2xl"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(66, 153, 225, 0.1), rgba(128, 90, 213, 0.1))',
                  borderRadius: '2xl',
                }}
              >
                <VStack spacing={6}>
                  <Icon as={FiDollarSign} boxSize={12} color="green.500" />
                  <Heading size="lg" textAlign="center">
                    10x ROI
                  </Heading>
                  <Text fontSize="lg" color={textColor} textAlign="center">
                    Average return on investment reported by our enterprise customers within the first 6 months.
                  </Text>
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <Box p={4} bg={statsBg} borderRadius="lg" textAlign="center">
                      <Text fontWeight="bold">$500K+</Text>
                      <Text fontSize="sm">Additional Revenue</Text>
                    </Box>
                    <Box p={4} bg={statsBg} borderRadius="lg" textAlign="center">
                      <Text fontWeight="bold">-45%</Text>
                      <Text fontSize="sm">Sales Cycle</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </Box>
            </SimpleGrid>
          </MotionContainer>
        </MotionBox>

        {/* CTA Section */}
        <MotionBox
          as="section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          py={20} bg="blue.500" color="white"
        >
          <MotionContainer maxW="container.xl">
            <Box
              p={{ base: 8, md: 16 }}
              borderRadius="2xl"
              textAlign="center"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(66, 153, 225, 0.2), rgba(128, 90, 213, 0.2))',
                borderRadius: '2xl',
              }}
            >
              <VStack spacing={8}>
                <Heading size="2xl">
                  Ready to Transform Your Sales Process?
                </Heading>
                <Text fontSize="xl" maxW="2xl">
                  Join thousands of sales professionals using SalesGraph to close more deals and drive revenue growth.
                </Text>
                {!user && (
                  <HStack spacing={4}>
                    <Button
                      colorScheme="white"
                      size="lg"
                      height="4rem"
                      px={8}
                      fontSize="lg"
                      onClick={() => window.location.href = '/pricing'}
                    >
                      See Pricing
                    </Button>
                  </HStack>
                )}
              </VStack>
            </Box>
          </MotionContainer>
        </MotionBox>
      </Box>
    </Box>
  );
}
