'use client';

import Auth from '@/components/Auth';
import { Container } from '@chakra-ui/react';

export default function SignUp() {
  return (
    <Container maxW="container.xl" py={10}>
      <Auth mode="signup" />
    </Container>
  );
}
