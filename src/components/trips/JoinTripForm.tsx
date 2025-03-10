
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '@/context/TripContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const JoinTripForm = () => {
  const navigate = useNavigate();
  const { joinTrip, isLoading } = useTrip();
  const { user } = useAuth();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      setError('You must be logged in to join a trip');
      return;
    }
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character trip code');
      return;
    }
    
    try {
      console.log("Joining trip with code:", code, "User ID:", user.id);
      
      const joinedTrip = await joinTrip(code);
      
      if (joinedTrip) {
        toast({
          title: "Success",
          description: `Joined trip "${joinedTrip.name}" successfully!`,
        });
        navigate(`/trip/${joinedTrip.id}`);
      } else {
        setError('Could not find a trip with this code');
      }
    } catch (err) {
      console.error("Error joining trip:", err);
      setError(err instanceof Error ? err.message : 'Failed to join trip');
    }
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Join a Trip</DialogTitle>
        <DialogDescription>
          Enter the 6-character trip code to join an existing trip
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <Label htmlFor="code">Trip Code</Label>
          <Input
            id="code"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center text-lg tracking-widest uppercase"
            maxLength={6}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter the 6-character code provided by the trip creator
          </p>
        </div>
        
        <div className="flex justify-end pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="mr-2">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading || code.length !== 6}>
            {isLoading ? 'Joining...' : 'Join Trip'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default JoinTripForm;
