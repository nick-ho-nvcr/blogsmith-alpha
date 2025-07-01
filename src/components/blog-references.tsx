
'use client';

import type { Source } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ExternalLink, Loader2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BlogReferencesProps {
  sources: Source[];
  selectedSourceIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  isLoadingDelete: string | null;
  onToggleSelectAll: () => void;
  areAllSourcesSelected: boolean;
}

export function BlogReferences({
  sources,
  selectedSourceIds,
  onSelect,
  onDelete,
  isLoadingDelete,
  onToggleSelectAll,
  areAllSourcesSelected,
}: BlogReferencesProps) {
  const [sourceToConfirmDelete, setSourceToConfirmDelete] = useState<Source | null>(null);

  const handleConfirmDelete = async () => {
    if (sourceToConfirmDelete) {
      await onDelete(sourceToConfirmDelete.id);
      setSourceToConfirmDelete(null);
    }
  };

  if (sources.length === 0 && !isLoadingDelete && !sourceToConfirmDelete) { 
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Your Stored References</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You haven't stored any blog references yet. Use our Chrome extension to save interesting articles!</p>
        </CardContent>
      </Card>
    );
  }
  
  if (sources.length === 0 && (isLoadingDelete || sourceToConfirmDelete)) {
     return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
              <h2 className="text-3xl font-headline tracking-tight text-primary">Your Stored References</h2>
              <p className="text-muted-foreground">Select the sources you'd like to use for generating your new blog post, or manage your existing references.</p>
          </div>
           <Button onClick={onToggleSelectAll} variant="outline" size="sm" className="ml-auto" disabled={true}>
              <Square className="mr-2 h-4 w-4" />
              Select All
            </Button>
        </div>
         <Card className="mt-6 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No references available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-headline tracking-tight text-primary">Your Stored References</h2>
            <p className="text-muted-foreground max-w-xl">Select the sources you'd like to use for generating your new blog post, or manage your existing references.</p>
        </div>
        {sources.length > 0 && (
          <Button onClick={onToggleSelectAll} variant="outline" size="sm" className="whitespace-nowrap">
            {areAllSourcesSelected ? (
              <CheckSquare className="mr-2 h-4 w-4" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            {areAllSourcesSelected ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>
      
      {sources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <Card key={source.id} className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-headline text-xl leading-tight">{source.title}</CardTitle>
                  <Checkbox
                    id={`source-${source.id}`}
                    checked={selectedSourceIds.includes(source.id)}
                    onCheckedChange={(checked) => onSelect(source.id, !!checked)}
                    aria-label={`Select ${source.title}`}
                    className="mt-1 flex-shrink-0 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                </div>
                <CardDescription className="text-sm line-clamp-3 pt-1">
                  {source.snippet}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center pt-4 border-t mt-auto bg-secondary/30 p-4">
                {source.link && typeof source.link === 'string' && source.link.trim() !== '' ? (
                  <Link href={source.link} target="_blank" rel="noopener noreferrer" passHref>
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                      Read Source <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Link not available</span>
                )}
                <AlertDialog open={sourceToConfirmDelete?.id === source.id} onOpenChange={(isOpen) => !isOpen && setSourceToConfirmDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSourceToConfirmDelete(source)}
                      aria-label={`Delete ${source.title}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={isLoadingDelete === source.id} 
                    >
                       {/* Loader removed from here, will be on confirm button */}
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  {sourceToConfirmDelete?.id === source.id && (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                          Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the reference: <strong>{sourceToConfirmDelete.title}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSourceToConfirmDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDelete}
                          disabled={isLoadingDelete === sourceToConfirmDelete.id}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          {isLoadingDelete === sourceToConfirmDelete.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  )}
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <Card className="mt-6 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You haven't stored any blog references yet or they are currently loading. Use our Chrome extension to save interesting articles!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
