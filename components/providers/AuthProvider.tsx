'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth(); // Initialize auth listener globally
  return <>{children}</>;
}
