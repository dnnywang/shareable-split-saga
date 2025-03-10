
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '@/context/TripContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import EmojiPicker from '@/components/ui/emoji-picker';

const CreateTripForm = () => {
  const navigate = useNavigate();
  const { createTrip, isLoading } = useTrip();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name) {
      setError('Please enter a trip name');
      return;
    }
    
    try {
      const trip = await createTrip({
        name,
        description,
        emoji,
        code: generateRandomCode(),
        participants: [],
        purchases: []
      });
      
      navigate(`/trip/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
  };
  
  // Helper function to generate a random 6-character trip code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create a New Trip</DialogTitle>
        <DialogDescription>
          Set up your new trip to start splitting expenses
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <Label htmlFor="emoji">Trip Emoji</Label>
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
        
        <div className="flex justify-end pt-4">
          <Button type="button" variant="outline" className="mr-2">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name}>
            {isLoading ? 'Creating...' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateTripForm;
