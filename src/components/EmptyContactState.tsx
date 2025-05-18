import React from 'react';
import { FileText, UserPlus, Upload, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyContactStateProps {
  onAddContact: () => void;
  onImportContacts: () => void;
  isSearching: boolean;
  searchQuery?: string;
}

export const EmptyContactState: React.FC<EmptyContactStateProps> = ({
  onAddContact,
  onImportContacts,
  isSearching,
  searchQuery
}) => {
  if (isSearching) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No matches found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          No contacts match your search for "{searchQuery}". 
          Try a different search term or clear your search.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Add your first contact manually or import your existing contacts from Google.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Card className="p-6 cursor-pointer hover:border-primary/50 transition-all" onClick={onAddContact}>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-medium mb-2">Add Contact Manually</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Enter contact details one by one
          </p>
          <Button size="sm" className="w-full" onClick={onAddContact}>
            Add Contact
          </Button>
        </Card>
        
        <Card className="p-6 cursor-pointer hover:border-primary/50 transition-all" onClick={onImportContacts}>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-medium mb-2">Import from Google</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Import contacts from a Google CSV export
          </p>
          <Button size="sm" variant="outline" className="w-full" onClick={onImportContacts}>
            Import Contacts
          </Button>
        </Card>
      </div>
    </div>
  );
};
