// src/pages/ContactsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  UserPlus, Upload, MoreHorizontal, Trash2, Edit, FileText, 
  Phone, Mail, MapPin, CalendarClock, Download, Plus, Search
} from 'lucide-react';
import  supabase from '@/lib/supabaseClient';
import Papa from 'papaparse';
import { toast } from '@/hooks/use-toast';
import { EmptyContactState } from '@/components/EmptyContactState';

// Define Contact type
type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  notes?: string;
  created_at: string;
  last_interaction?: string;
  tags?: string[];
  user_id?: string;
};

const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    notes: ''
  });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch the current user along with contacts
  useEffect(() => {
    const fetchUserAndContacts = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      
      fetchContacts();
    };
    
    fetchUserAndContacts();
  }, []);

  // Fetch contacts from Supabase
  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      // Get current user if not available yet
      let userId = currentUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
        setCurrentUserId(userId);
      }
      
      // Only fetch if we have a user
      if (!userId) {
        console.warn('No authenticated user found');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)  // Only get contacts for current user
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower) ||
      contact.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Handle CSV file upload and parsing
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          // Get current user if not available yet
          let userId = currentUserId;
          if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id || null;
            setCurrentUserId(userId);
          }

          if (!userId) {
            toast({
              title: "Authentication Required",
              description: "You must be signed in to import contacts.",
              variant: "destructive",
            });
            return;
          }

          // For debugging
          console.log("CSV Headers:", results.meta.fields);
          console.log("First row sample:", results.data[0]);
          
          const parsedContacts = results.data
            .filter((row: any) => {
              // Filter out empty rows or rows without required data
              return row && 
                (row['First Name'] || row['Last Name'] || row['Name'] || 
                 row['E-mail 1 - Value'] || row['Phone 1 - Value']);
            })
            .map((row: any) => {
              // Construct the full name from various possible fields
              const firstName = row['First Name'] || '';
              const middleName = row['Middle Name'] || '';
              const lastName = row['Last Name'] || '';
              
              // Try to get the name from different fields
              let fullName = row['Name'] || '';
              if (!fullName) {
                // Combine first, middle and last names if available
                fullName = [firstName, middleName, lastName]
                  .filter(Boolean)  // Remove empty parts
                  .join(' ');
                
                // If still empty, try nickname or file as
                if (!fullName) {
                  fullName = row['Nickname'] || row['File As'] || '';
                }
              }
              
              // Handle multiple emails (Google format has E-mail 1, E-mail 2, etc.)
              let email = '';
              if (row['E-mail 1 - Value']) {
                // Handle multiple emails in same field (separated by " ::: ")
                const emailValues = row['E-mail 1 - Value'].split(' ::: ');
                email = emailValues[0]; // Take the first one
              } else if (row['E-mail 2 - Value']) {
                const emailValues = row['E-mail 2 - Value'].split(' ::: ');
                email = emailValues[0];
              }
              
              // Handle multiple phones (Google format has Phone 1, Phone 2, etc.)
              let phone = '';
              if (row['Phone 1 - Value']) {
                // Handle multiple phones in same field (separated by " ::: ")
                const phoneValues = row['Phone 1 - Value'].split(' ::: ');
                phone = phoneValues[0]; // Take the first one and clean it
                phone = phone.replace(/\s+/g, ''); // Remove spaces
              } else if (row['Phone 2 - Value']) {
                const phoneValues = row['Phone 2 - Value'].split(' ::: ');
                phone = phoneValues[0].replace(/\s+/g, '');
              }
              
              // Construct address from components
              let address = '';
              if (row['Address 1 - Formatted']) {
                address = row['Address 1 - Formatted'];
              } else {
                // Build address from components
                const street = row['Address 1 - Street'] || '';
                const city = row['Address 1 - City'] || '';
                const region = row['Address 1 - Region'] || '';
                const postalCode = row['Address 1 - Postal Code'] || '';
                const country = row['Address 1 - Country'] || '';
                
                address = [street, city, region, postalCode, country]
                  .filter(Boolean)
                  .join(', ');
              }
              
              // Extract organization name
              const company = row['Organization Name'] || '';
              
              // Extract notes and merge with any custom fields
              let notes = row['Notes'] || '';
              
              // Add other useful information to notes
              if (row['Birthday']) {
                notes += notes ? '\n\n' : '';
                notes += `Birthday: ${row['Birthday']}`;
              }
              
              if (row['Labels']) {
                notes += notes ? '\n\n' : '';
                notes += `Groups/Labels: ${row['Labels']}`;
              }
              
              // Add relationship info if available
              if (row['Relation 1 - Value']) {
                notes += notes ? '\n\n' : '';
                notes += `Relationship: ${row['Relation 1 - Value']}`;
              }
              
              // Add custom fields if available
              if (row['Custom Field 1 - Label'] && row['Custom Field 1 - Value']) {
                notes += notes ? '\n\n' : '';
                notes += `${row['Custom Field 1 - Label']}: ${row['Custom Field 1 - Value']}`;
              }
              
              // Return the parsed contact object
              return {
                name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
                company: company.trim(),
                notes: notes.trim(),
                created_at: new Date().toISOString(),
                tags: row['Labels'] ? row['Labels'].split(' ::: ').map((tag: string) => tag.replace(/^\* /, '')) : [],
                user_id: userId
              };
            })
            .filter((contact: Partial<Contact>) => {
              // Final validation - must have name and at least one contact method
              return contact.name && (contact.email || contact.phone);
            });

          if (parsedContacts.length === 0) {
            toast({
              title: "No valid contacts",
              description: "No valid contacts found in the CSV file.",
              variant: "destructive",
            });
            return;
          }

          console.log("Parsed contacts:", parsedContacts);

          // Insert contacts into Supabase
          const { data, error } = await supabase
            .from('contacts')
            .insert(parsedContacts)
            .select();

          if (error) {
            throw error;
          }

          toast({
            title: "Success!",
            description: `Imported ${parsedContacts.length} contacts.`,
            variant: "default",
          });

          // Refresh the contacts list
          fetchContacts();
        } catch (error) {
          console.error('Error importing contacts:', error);
          toast({
            title: "Import Failed",
            description: "Failed to import contacts. Please check the file format.",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file. Please check the file format.",
          variant: "destructive",
        });
      }
    });

    // Clear the input
    event.target.value = '';
  };

  // Add new contact
  const handleAddContact = async () => {
    try {
      if (!newContact.name || !newContact.email && !newContact.phone) {
        toast({
          title: "Missing Information",
          description: "Name and either email or phone are required.",
          variant: "destructive",
        });
        return;
      }

      // Get current user if not available yet
      let userId = currentUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
        setCurrentUserId(userId);
      }

      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "You must be signed in to add contacts.",
          variant: "destructive",
        });
        return;
      }

      const contactWithTimestamp = {
        ...newContact,
        created_at: new Date().toISOString(),
        tags: [],
        user_id: userId  // Add the user_id
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactWithTimestamp])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Contact Added",
        description: "New contact has been successfully added.",
      });

      // Reset form and close dialog
      setNewContact({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        notes: ''
      });
      setShowAddDialog(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update existing contact
  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(editingContact)
        .eq('id', editingContact.id)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Contact Updated",
        description: "Contact information has been updated successfully.",
      });

      setShowEditDialog(false);
      fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Contact Deleted",
        description: "Contact has been removed from your list.",
      });

      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Export contacts as CSV
  const handleExportContacts = () => {
    const data = filteredContacts.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Address: c.address || '',
      Company: c.company || '',
      Notes: c.notes || '',
      'Date Added': new Date(c.created_at).toLocaleDateString(),
      'Last Interaction': c.last_interaction ? new Date(c.last_interaction).toLocaleDateString() : ''
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger file input click
  const handleImportClick = () => {
    document.getElementById('csvFileUpload')?.click();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts & Notes</h1>
          <p className="text-muted-foreground">Manage your network and keep track of important details.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={16} />
                <span className="hidden md:inline">Add Contact</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Enter the details of your new contact.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Full Name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className="col-span-3"
                    placeholder="Email Address"
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className="col-span-3"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={newContact.company}
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                    className="col-span-3"
                    placeholder="Company or Organization"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={newContact.address}
                    onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                    className="col-span-3"
                    placeholder="Address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newContact.notes}
                    onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                    className="col-span-3"
                    placeholder="Additional notes about this contact"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddContact}>Save Contact</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <span className="hidden md:inline">Import/Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Data Management</DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={handleImportClick}>
                <Upload size={16} />
                <span>Import from Google CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={handleExportContacts}>
                <Download size={16} />
                <span>Export Current List</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search contacts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Contacts</CardTitle>
          <CardDescription>
            {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'} {searchQuery ? 'found' : 'total'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-60 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-50 border-t-primary rounded-full"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <EmptyContactState 
              onAddContact={() => setShowAddDialog(true)}
              onImportContacts={handleImportClick}
              isSearching={!!searchQuery}
              searchQuery={searchQuery}
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact Info</TableHead>
                    <TableHead className="hidden lg:table-cell">Company</TableHead>
                    <TableHead className="hidden lg:table-cell">Added On</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail size={14} className="text-muted-foreground" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone size={14} className="text-muted-foreground" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.address && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin size={14} className="text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{contact.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{contact.company || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarClock size={14} className="text-muted-foreground" />
                          <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={showEditDialog && editingContact?.id === contact.id} onOpenChange={(open) => {
                          if (!open) setShowEditDialog(false);
                        }}>
                          <AlertDialog>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingContact(contact);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit size={16} />
                              </Button>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 size={16} className="text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                            </div>
                            
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {contact.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Contact</DialogTitle>
                              <DialogDescription>
                                Update information for {contact.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">
                                  Name
                                </Label>
                                <Input
                                  id="edit-name"
                                  value={editingContact?.name}
                                  onChange={(e) => setEditingContact(prev => prev ? {...prev, name: e.target.value} : null)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-email" className="text-right">
                                  Email
                                </Label>
                                <Input
                                  id="edit-email"
                                  value={editingContact?.email}
                                  onChange={(e) => setEditingContact(prev => prev ? {...prev, email: e.target.value} : null)}
                                  className="col-span-3"
                                  type="email"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-phone" className="text-right">
                                  Phone
                                </Label>
                                <Input
                                  id="edit-phone"
                                  value={editingContact?.phone}
                                  onChange={(e) => setEditingContact(prev => prev ? {...prev, phone: e.target.value} : null)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-company" className="text-right">
                                  Company
                                </Label>
                                <Input
                                  id="edit-company"
                                  value={editingContact?.company || ''}
                                  onChange={(e) => setEditingContact(prev => prev ? {...prev, company: e.target.value} : null)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-address" className="text-right">
                                  Address
                                </Label>
                                <Input
                                  id="edit-address"
                                  value={editingContact?.address || ''}
                                  onChange={(e) => setEditingContact(prev => prev ? {...prev, address: e.target.value} : null)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-notes" className="text-right">
                                  Notes
                                </Label>
                                <Textarea
                                  id="edit-notes"
                                  value={editingContact?.notes || ''}
                                  onChange={(e) => setEditingContact(prev => prev ? {...prev, notes: e.target.value} : null)}
                                  className="col-span-3"
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateContact}>
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden file input for CSV upload */}
      <input
        id="csvFileUpload"
        type="file"
        accept=".csv"
        onChange={handleCsvUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ContactsPage;
