// src/pages/HierarchyPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  resetServerContext
} from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Users, Briefcase, Heart, Shield, Star, HelpCircle, GripVertical } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import '@/styles/draggable.css';

// Define hierarchy categories with their properties
const hierarchyCategories = [
  { 
    id: 'private', 
    title: 'Private', 
    description: 'Closest connections and family', 
    color: '#8b5cf6', // Purple
    icon: <Shield size={18} />
  },
  { 
    id: 'personal', 
    title: 'Personal', 
    description: 'Close friends and important connections', 
    color: '#ec4899', // Pink
    icon: <Heart size={18} />
  },
  { 
    id: 'regular', 
    title: 'Regular', 
    description: 'Friends and frequent connections', 
    color: '#3b82f6', // Blue
    icon: <Users size={18} />
  },
  { 
    id: 'business', 
    title: 'Business', 
    description: 'Professional contacts and colleagues', 
    color: '#10b981', // Green
    icon: <Briefcase size={18} />
  },
  { 
    id: 'others', 
    title: 'Others', 
    description: 'Other contacts and acquaintances', 
    color: '#6b7280', // Gray
    icon: <HelpCircle size={18} /> 
  }
];

// Define the contact type with hierarchy information
interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  hierarchy?: string;
  hierarchy_order?: number;
  created_at: string;
  user_id?: string;
}

// Define interface for contacts grouped by hierarchy
interface GroupedContacts {
  [key: string]: Contact[];
}

const HierarchyPage: React.FC = () => {
  // State for all contacts and filtered contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load contacts on component mount
  useEffect(() => {
    const fetchUserAndContacts = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchContacts(user.id);
      } else {
        setLoading(false);
      }
    };
    
    fetchUserAndContacts();
  }, []);

  // Fetch contacts from Supabase
  const fetchContacts = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('hierarchy_order', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        const ids = data.map(c => c.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          console.warn('Duplicate contact IDs found in fetched data!');
          const idCounts: { [key: string]: number } = {};
          ids.forEach(id => {
            idCounts[id] = (idCounts[id] || 0) + 1;
          });
          const duplicates = Object.entries(idCounts).filter(([, count]) => count > 1);
          console.warn('The following IDs are duplicated:', duplicates.map(([id]) => id));
        }
        setContacts(data);
      } else {
        setContacts([]);
      }
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

  // Modified group contacts function to ensure stable IDs
  const groupContactsByHierarchy = () => {
    const grouped: GroupedContacts = {};
    hierarchyCategories.forEach(category => {
      grouped[category.id] = [];
    });

    const filteredContacts = contacts.filter(contact => {
      // Ensure contact has a valid ID before filtering
      if (!contact.id || String(contact.id).trim() === '') {
        // console.warn('Filtering out contact with invalid or missing ID during search:', contact);
        return false;
      }
      if (!searchQuery) return true;
      return (
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    filteredContacts.forEach(contact => {
      // This check is now earlier in the filter, but good to be defensive
      if (!contact.id || String(contact.id).trim() === '') {
        // console.warn('Skipping contact with invalid or missing ID during grouping:', contact);
        return;
      }
      const hierarchy = contact.hierarchy || 'others';
      // Ensure the contact object has its ID as a string for react-beautiful-dnd
      const contactWithStringId = { ...contact, id: String(contact.id) };
      if (grouped[hierarchy]) {
        grouped[hierarchy].push(contactWithStringId);
      } else {
        // Should not happen if initialized correctly, but as a fallback
        grouped['others'] = grouped['others'] || [];
        grouped['others'].push(contactWithStringId);
      }
    });
    return grouped;
  };

  // Handle drag and drop between categories
  const handleDragEnd = async (result: DropResult) => {
    console.log('Drag ended:', result);
    const { destination, source, draggableId } = result;
    
    // Drop outside a droppable area or same position
    if (!destination) {
      console.log('No destination');
      return;
    }
    
    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) {
      console.log('Same position');
      return;
    }
    
    try {
      console.log('Moving contact:', draggableId, 'to', destination.droppableId);
      
      // Extract the actual contact ID from the draggableId (remove 'contact-' prefix)
      const contactId = draggableId.replace('contact-', '');
      const newHierarchy = destination.droppableId;
      
      // Update the contact's hierarchy in the state
      const updatedContacts = contacts.map(contact => {
        if (String(contact.id) === contactId) {
          return { ...contact, hierarchy: newHierarchy };
        }
        return contact;
      });
      
      setContacts(updatedContacts);
      
      // Update the contact's hierarchy in Supabase
      const { error } = await supabase
        .from('contacts')
        .update({ hierarchy: newHierarchy })
        .eq('id', contactId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Contact Moved",
        description: `Contact moved to ${hierarchyCategories.find(c => c.id === newHierarchy)?.title || newHierarchy}`,
      });
      
    } catch (error) {
      console.error('Error updating contact hierarchy:', error);
      toast({
        title: "Error",
        description: "Failed to update contact hierarchy. Please try again.",
        variant: "destructive",
      });
      
      // Refresh contacts to revert the UI
      if (currentUserId) {
        fetchContacts(currentUserId);
      }
    }
  };

  // Get background color for contact card based on hierarchy
  const getBackgroundColor = (hierarchy: string) => {
    const category = hierarchyCategories.find(cat => cat.id === hierarchy);
    return category ? `${category.color}10` : '#f3f4f6';
  };

  // Get border color for contact card based on hierarchy
  const getBorderColor = (hierarchy: string) => {
    const category = hierarchyCategories.find(cat => cat.id === hierarchy);
    return category ? `${category.color}30` : '#e5e7eb';
  };
  
  const groupedContacts = groupContactsByHierarchy();

  // Add this to debug drag issues
  console.log('Rendering with contacts:', contacts);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Hierarchy</h1>
          <p className="text-muted-foreground">Organize your contacts based on closeness and importance</p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search contacts..." 
            value={searchQuery}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-[300px]"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-50 border-t-primary rounded-full"></div>
        </div>
      ) : contacts.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center h-60">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Contacts Available</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              You need to add contacts before you can organize them into hierarchies.
            </p>
            <Button 
              variant="default"
              onClick={() => window.location.href = '/contacts'}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Go to Contacts Page
            </Button>
          </CardContent>
        </Card>      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {hierarchyCategories.map((category) => (
              <Card 
                key={category.id}
                className="overflow-hidden border-t-4"
                style={{ borderTopColor: category.color }}
              >
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex items-center">
                    <div 
                      className="mr-2 p-1 rounded" 
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.title}</CardTitle>
                      <CardDescription className="text-xs">{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>                <Droppable droppableId={category.id} key={category.id}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 min-h-[300px] transition-colors duration-200 ${
                        snapshot.isDraggingOver ? 'bg-muted/50 border-2 border-dashed border-primary/50' : ''
                      }`}
                      style={{ minHeight: '300px', height: 'auto' }} // Ensure height is auto or 100%
                    >
                      {groupedContacts[category.id] &&
                      groupedContacts[category.id].length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-sm">
                            Drag contacts here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {groupedContacts[category.id] &&
                            groupedContacts[category.id]
                            // .filter(contact => { // Filter already applied in groupContactsByHierarchy
                            // const hasValidId = contact.id && String(contact.id).trim() !== '';
                            // const hasValidName = contact.name && contact.name.trim() !== '';
                            // if (!hasValidId) {
                            // console.warn('Rendering: Filtering out contact with invalid ID:', contact);
                            // }
                            // return hasValidId && hasValidName;
                            // })
                            .map((contact, index) => {
                              // Ensure draggableId is a string and unique
                              const draggableId = String(contact.id); // Use contact.id directly if it's guaranteed unique and string
                              
                              if (!draggableId || draggableId.trim() === '') {
                                console.error('Attempting to render Draggable with invalid ID:', contact);
                                return null; // Skip rendering this draggable
                              }

                              return (
                                <Draggable
                                  key={draggableId} // Key must be stable and unique
                                  draggableId={draggableId} // Must be a string
                                  index={index}
                                >
                                  {(providedDraggable, snapshotDraggable) => (
                                    <div
                                      ref={providedDraggable.innerRef}
                                      {...providedDraggable.draggableProps}
                                      // {...providedDraggable.dragHandleProps} // Apply dragHandleProps to the element you want to be the handle
                                      className={`p-3 rounded-md shadow-sm transition-all duration-200 ${
                                        snapshotDraggable.isDragging ? 'opacity-80 scale-105' : ''
                                      }`}
                                      style={{
                                        backgroundColor: getBackgroundColor(
                                          contact.hierarchy || 'others'
                                        ),
                                        borderLeft: `3px solid ${getBorderColor(
                                          contact.hierarchy || 'others'
                                        )}`,
                                        ...(snapshotDraggable.isDragging
                                          ? {
                                              boxShadow:
                                                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                              zIndex: 9999,
                                            }
                                          : {}),
                                        ...providedDraggable.draggableProps.style, // Important for dnd styles
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">
                                            {contact.name}
                                          </div>
                                          {contact.company && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                              {contact.company}
                                            </div>
                                          )}
                                        </div>
                                        <div
                                          {...providedDraggable.dragHandleProps} // Apply drag handle here
                                          className="cursor-grab p-1 hover:bg-gray-100 rounded"
                                          aria-label="Drag contact"
                                        >
                                          <GripVertical
                                            size={16}
                                            className="text-gray-400"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                          {provided.placeholder}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

// Add SSR support by wrapping the component
export default HierarchyPage;
