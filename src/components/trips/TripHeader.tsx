import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip, useTrip } from '@/context/TripContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Share, 
  MoreHorizontal,
  ArrowLeft,
  Users,
  Edit
} from 'lucide-react';
import EmojiPicker from '@/components/ui/emoji-picker';
import { toast } from 'sonner';

interface TripHeaderProps {
  trip: Trip;
}

const TripHeader = ({ trip }: TripHeaderProps) => {
  const navigate = useNavigate();
  const { updateTripDetails, isLoading } = useTrip();
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [name, setName] = useState(trip.name);
  const [description, setDescription] = useState(trip.description);
  const [emoji, setEmoji] = useState(trip.emoji);
  
  const handleBack = () => {
    navigate('/');
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Trip name cannot be empty');
      return;
    }
    
    try {
      await updateTripDetails({
        name,
        description,
        emoji
      });
      
      setShowEditDialog(false);
      toast.success('Trip details updated successfully');
    } catch (error) {
      console.error('Failed to update trip:', error);
      toast.error('Failed to update trip details');
    }
  };
  
  const copyTripCodeToClipboard = () => {
    navigator.clipboard.writeText(trip.code)
      .then(() => {
        toast.success('Trip code copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy code to clipboard');
      });
  };
  
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex items-center">
          <span className="text-3xl mr-3">{trip.emoji}</span>
          <div>
            <h1 className="text-xl font-semibold">{trip.name}</h1>
            {trip.description && (
              <p className="text-sm text-muted-foreground">{trip.description}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share size={16} />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Trip</DialogTitle>
              <DialogDescription>
                Invite others to join this trip
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Trip Code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={trip.code}
                    readOnly
                    className="font-mono text-center tracking-widest"
                  />
                  <Button onClick={copyTripCodeToClipboard}>
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Share this code with others so they can join your trip
                </p>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => setShowShareDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Edit size={16} className="mr-2" />
                  Edit Trip Details
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                <Users size={16} className="mr-2" />
                Manage Participants
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Trip</DialogTitle>
              <DialogDescription>
                Update trip details
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Trip Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="button" variant="outline" className="mr-2" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TripHeader;
