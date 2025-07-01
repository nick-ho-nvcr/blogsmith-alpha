'use client';

import { PenTool } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 mb-8 border-b border-primary/20">
      <div className="container mx-auto flex items-center space-x-3">
        <PenTool className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter text-primary">
          Nouvelle Blogsmith
        </h1>
      </div>
    </header>
  );
}
