
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import EmojiPicker from '@/components/ui/emoji-picker';
import { toast } from '@/hooks/use-toast';

const CreateTripForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTrip, isLoading } = useTrip();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter a trip name');
      return;
    }
    
    try {
      // Ensure user is authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(sessionError.message);
      }
      
      if (!sessionData.session || !sessionData.session.user) {
        setError('Authentication required. Please sign in again.');
        return;
      }
      
      // Generate a unique 6-character alphanumeric code for trip sharing
      const tripCode = generateTripCode();
      
      const trip = await createTrip({
        name: name.trim(),
        description: description.trim(),
        emoji,
        code: tripCode,
        participants: [],
        purchases: []
      });
      
      toast({
        title: "Trip Created",
        description: `Your trip "${name}" has been created successfully!`,
      });
      
      // Navigate to the new trip's detail page
      navigate(`/trip/${trip.id}`);
    } catch (err) {
      console.error("Error creating trip:", err);
      setError(err instanceof Error ? err.message : 'Failed to create trip');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create trip',
        variant: "destructive"
      });
    }
  };
  
  // Generate a random 6-character alphanumeric trip code
  const generateTripCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create a New Trip</DialogTitle>
        <DialogDescription>
          Set up your new trip to start tracking and splitting expenses
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="emoji">Trip Icon</Label>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{emoji}</div>
            <EmojiPicker selectedEmoji={emoji} onEmojiSelect={setEmoji} />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Trip Name</Label>
          <Input
            id="name"
            placeholder="Summer Vacation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Trip Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="A week in Barcelona with friends"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="submit" 
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateTripForm;
