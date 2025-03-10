
import { useState } from 'react';
import { format } from 'date-fns';
import { useTrip, Purchase } from '@/context/TripContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import { Trash } from 'lucide-react';

interface PurchaseItemProps {
  purchase: Purchase;
}

const PurchaseItem = ({ purchase }: PurchaseItemProps) => {
  const { user } = useAuth();
  const { currentTrip, removePurchase, isLoading } = useTrip();
  
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  if (!currentTrip) return null;
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  const getParticipantById = (id: string) => {
    return currentTrip.participants.find(p => p.id === id);
  };
  
  const isPaidByCurrentUser = purchase.paidBy.some(payer => payer.userId === user?.id);
  
  // Is the purchase paid by multiple people?
  const isMultiPayer = purchase.paidBy.length > 1;
  
  // Display the payers in a readable format
  const renderPayers = () => {
    if (isMultiPayer) {
      return (
        <div className="text-sm font-medium">
          <p className="text-muted-foreground mb-1">Paid by:</p>
          <div className="space-y-1">
            {purchase.paidBy.map(payer => {
              const participant = getParticipantById(payer.userId);
              return (
                <div key={payer.userId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2">{participant?.emoji}</span>
                    <span>{participant?.username}</span>
                  </div>
                  <div>${payer.amount.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    const payer = getParticipantById(purchase.paidBy[0].userId);
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <span className="mr-1">Paid by</span>
        <span className="mr-1">{payer?.emoji}</span>
        <span>{payer?.username}</span>
      </div>
    );
  };
  
  // Render details about who owes what
  const renderSplitDetails = () => {
    return (
      <div className="mt-4 text-sm">
        <p className="text-muted-foreground mb-2">Split between:</p>
        <div className="space-y-1">
          {purchase.splitBetween.map(split => {
            const participant = getParticipantById(split.userId);
            return (
              <div key={split.userId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">{participant?.emoji}</span>
                  <span>{participant?.username}</span>
                </div>
                <div>${split.amount.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const handleDelete = async () => {
    try {
      await removePurchase(purchase.id);
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };
  
  return (
    <Card className={cn(
      "w-full transition-all",
      isPaidByCurrentUser ? "border-l-4 border-l-teal-500" : ""
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">{purchase.title}</h3>
          </div>
          <div className="text-lg font-semibold">${purchase.amount.toFixed(2)}</div>
        </div>
      </CardHeader>
      
      <CardContent className="py-2 px-4">
        <div className="flex items-center justify-between">
          {renderPayers()}
          <div className="text-sm text-muted-foreground">
            {formatDate(purchase.date)}
          </div>
        </div>
        
        {/* Show split details if expanded */}
        {showDetails && renderSplitDetails()}
      </CardContent>
      
      <CardFooter className="py-2 px-4 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this purchase and update everyone's balances.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default PurchaseItem;
