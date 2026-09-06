export const API_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  : process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
