'use client';

import { SetStateAction, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';

interface DailyReflectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean | ((prevState: boolean) => boolean)) => void;
}

export function DailyReflectionModal({ open, onOpenChange }: DailyReflectionModalProps) {
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    // Here you would save the reflection to your database
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Reflection</DialogTitle>
          <DialogDescription>
            Take a moment to reflect on your day. What went well? What could have gone better?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Write your thoughts here..."
            value={reflection}
            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setReflection(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
          <Button onClick={handleSubmit}>Save Reflection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}