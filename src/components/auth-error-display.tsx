
'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthErrorDisplayProps {
  error: string | null;
}

export function AuthErrorDisplay({ 
  error,
}: AuthErrorDisplayProps) {
  return (
    <Card className="w-full max-w-lg mx-auto mt-10 border-amber-500 shadow-lg bg-amber-50">
      <CardHeader className="flex flex-row items-center space-x-3 bg-amber-100/50 p-4">
        <AlertTriangle className="h-8 w-8 text-amber-600" />
        <CardTitle className="font-headline text-2xl text-amber-700">Authentication Required</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {error && <p className="text-amber-700 text-center text-lg mb-4">{error}</p>}
      </CardContent>
    </Card>
  );
}
