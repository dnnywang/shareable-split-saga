
import { useState, useEffect } from 'react';
import { useTrip } from '@/context/TripContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Slider } from "@/components/ui/slider";

interface PurchaseFormProps {
  tripId: string;
  onClose: () => void;
}

interface PayerSelection {
  userId: string;
  amount: number;
}

interface SplitSelection {
  userId: string;
  amount: number;
}

const PurchaseForm = ({ tripId, onClose }: PurchaseFormProps) => {
  const { user } = useAuth();
  const { currentTrip, addPurchase, isLoading } = useTrip();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [payerSelections, setPayerSelections] = useState<PayerSelection[]>([]);
  const [splitSelections, setSplitSelections] = useState<SplitSelection[]>([]);
  const [error, setError] = useState('');
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalSplit, setTotalSplit] = useState(0);
  
  useEffect(() => {
    if (currentTrip && currentTrip.participants.length > 0) {
      // Initialize payer selections with the first participant and 100% of the amount
      setPayerSelections([{ 
        userId: currentTrip.participants[0].id, 
        amount: 100 
      }]);
      
      // Initialize split selections with all participants and equal split amounts
      const initialSplitAmount = 100 / currentTrip.participants.length;
      setSplitSelections(currentTrip.participants.map(participant => ({
        userId: participant.id,
        amount: initialSplitAmount
      })));
    }
  }, [currentTrip]);
  
  useEffect(() => {
    // Calculate the total percentage paid
    const newTotalPaid = payerSelections.reduce((sum, payer) => sum + payer.amount, 0);
    setTotalPaid(newTotalPaid);
  }, [payerSelections]);
  
  useEffect(() => {
    // Calculate the total percentage split
    const newTotalSplit = splitSelections.reduce((sum, split) => sum + split.amount, 0);
    setTotalSplit(newTotalSplit);
  }, [splitSelections]);
  
  if (!currentTrip) return null;
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    } else {
      setAmount(undefined);
    }
  };
  
  const handlePayerAmountChange = (userId: string, newValue: number[]) => {
    // Extract the single value from the array (Slider component returns an array)
    const sliderValue = newValue[0];
    
    setPayerSelections(prev => {
      const newPayers = prev.map(payer => {
        if (payer.userId === userId) {
          return { ...payer, amount: sliderValue };
        }
        return payer;
      });
      return newPayers;
    });
  };
  
  const handleSplitAmountChange = (userId: string, newValue: number[]) => {
    // Extract the single value from the array (Slider component returns an array)
    const sliderValue = newValue[0];
    
    setSplitSelections(prev => {
      const newSplits = prev.map(split => {
        if (split.userId === userId) {
          return { ...split, amount: sliderValue };
        }
        return split;
      });
      return newSplits;
    });
  };
  
  const createPurchase = async () => {
    setError('');
    
    if (!title) {
      setError('Please enter a title');
      return;
    }
    
    if (!amount) {
      setError('Please enter an amount');
      return;
    }
    
    if (Math.abs(totalPaid - 100) > 0.01) {
      setError('Total paid amount must be 100%');
      return;
    }
    
    if (Math.abs(totalSplit - 100) > 0.01) {
      setError('Total split amount must be 100%');
      return;
    }
    
    // Convert payer selections to the format expected by the API
    const paidBy = payerSelections.map(payer => ({
      userId: payer.userId,
      amount: (amount * payer.amount / 100)
    }));
    
    // Convert split selections to the format expected by the API
    const splitBetween = splitSelections.map(split => ({
      userId: split.userId,
      amount: (amount * split.amount / 100)
    }));
    
    try {
      await addPurchase({
        tripId: tripId,
        title: title,
        amount: amount,
        paidBy: paidBy,
        splitBetween: splitBetween,
        createdBy: user?.id || ''
      });
      
      toast({
        title: "Success!",
        description: "Purchase added successfully.",
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase');
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Add New Purchase</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Dinner at Restaurant XYZ"
            value={title}
            onChange={handleTitleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            placeholder="Enter amount"
            type="number"
            onChange={handleAmountChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Paid By</Label>
          {currentTrip.participants.map(participant => {
            const payerAmount = payerSelections.find(p => p.userId === participant.id)?.amount || 0;
            
            return (
              <div key={participant.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="mr-2">
                    <AvatarImage src={participant.avatarUrl} />
                    <AvatarFallback>{participant.emoji}</AvatarFallback>
                  </Avatar>
                  <span>{participant.username}</span>
                </div>
                <div className="w-24">
                  <Slider
                    value={[payerAmount]}
                    max={100}
                    step={1}
                    onValueChange={(value) => handlePayerAmountChange(participant.id, value)}
                  />
                </div>
                <span>{payerAmount}%</span>
              </div>
            );
          })}
          <p className="text-sm text-muted-foreground">Total Paid: {totalPaid.toFixed(1)}%</p>
        </div>
        
        <div className="space-y-2">
          <Label>Split Between</Label>
          {currentTrip.participants.map(participant => {
            const splitAmount = splitSelections.find(s => s.userId === participant.id)?.amount || 0;
            
            return (
              <div key={participant.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="mr-2">
                    <AvatarImage src={participant.avatarUrl} />
                    <AvatarFallback>{participant.emoji}</AvatarFallback>
                  </Avatar>
                  <span>{participant.username}</span>
                </div>
                <div className="w-24">
                  <Slider
                    value={[splitAmount]}
                    max={100}
                    step={1}
                    onValueChange={(value) => handleSplitAmountChange(participant.id, value)}
                  />
                </div>
                <span>{splitAmount.toFixed(1)}%</span>
              </div>
            );
          })}
          <p className="text-sm text-muted-foreground">Total Split: {totalSplit.toFixed(1)}%</p>
        </div>
      </CardContent>
      
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={createPurchase} disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Purchase'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PurchaseForm;
