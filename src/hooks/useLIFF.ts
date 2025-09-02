'use client';

import { useContext } from 'react';
import { LIFFProvider } from '@/components/providers/LIFFProvider';

// Re-export the context hook from the provider
export { useLIFF } from '@/components/providers/LIFFProvider';