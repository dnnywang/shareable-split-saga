
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '@/context/TripContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const JoinTripForm = () => {
  const navigate = useNavigate();
  const { joinTrip, isLoading, trips } = useTrip();
  
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character trip code');
      return;
    }
    
    try {
      await joinTrip(code);
      
      // Find the trip that was just joined
      const joinedTrip = trips.find(trip => trip.code === code);
      
      setOpen(false);
      
      if (joinedTrip) {
        navigate(`/trip/${joinedTrip.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join trip');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="flex items-center gap-2">
          Join Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || code.length !== 6}>
              {isLoading ? 'Joining...' : 'Join Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinTripForm;
