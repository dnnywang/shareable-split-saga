
import { useState, useEffect } from 'react';
import { useTrip, Purchase } from '@/context/TripContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';

const SPLIT_TYPES = {
  EQUAL: 'equal',
  PERCENTAGE: 'percentage',
  CUSTOM: 'custom'
};

const PurchaseForm = () => {
  const { user } = useAuth();
  const { currentTrip, addPurchase, isLoading } = useTrip();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState(SPLIT_TYPES.EQUAL);
  const [payers, setPayers] = useState<Record<string, boolean>>({});
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [debtors, setDebtors] = useState<Record<string, boolean>>({});
  const [debtorAmounts, setDebtorAmounts] = useState<Record<string, string>>({});
  const [debtorPercentages, setDebtorPercentages] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  
  // Initialize payers and debtors when trip changes
  useEffect(() => {
    if (currentTrip) {
      const initialPayers: Record<string, boolean> = {};
      const initialDebtors: Record<string, boolean> = {};
      
      currentTrip.participants.forEach(participant => {
        // If current user, set as default payer
        initialPayers[participant.id] = participant.id === user?.id;
        // Everyone is a debtor by default
        initialDebtors[participant.id] = true;
      });
      
      setPayers(initialPayers);
      setDebtors(initialDebtors);
      resetAmounts();
    }
  }, [currentTrip, user?.id]);
  
  const resetAmounts = () => {
    if (!currentTrip) return;
    
    const resetPayerAmounts: Record<string, string> = {};
    const resetDebtorAmounts: Record<string, string> = {};
    const resetDebtorPercentages: Record<string, string> = {};
    
    currentTrip.participants.forEach(participant => {
      resetPayerAmounts[participant.id] = '';
      resetDebtorAmounts[participant.id] = '';
      // Default to equal percentages
      resetDebtorPercentages[participant.id] = (100 / currentTrip.participants.length).toFixed(0);
    });
    
    setPayerAmounts(resetPayerAmounts);
    setDebtorAmounts(resetDebtorAmounts);
    setDebtorPercentages(resetDebtorPercentages);
  };
  
  const handleSplitTypeChange = (value: string) => {
    setSplitType(value);
    resetAmounts();
  };
  
  const togglePayer = (id: string) => {
    setPayers(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const toggleDebtor = (id: string) => {
    setDebtors(prev => {
      const newDebtors = { ...prev, [id]: !prev[id] };
      
      // Recompute percentages if using percentage split
      if (splitType === SPLIT_TYPES.PERCENTAGE) {
        const activeDebtors = Object.entries(newDebtors).filter(([_, isActive]) => isActive).length;
        if (activeDebtors > 0) {
          const equalPercentage = (100 / activeDebtors).toFixed(0);
          
          const newPercentages: Record<string, string> = {};
          Object.entries(newDebtors).forEach(([debtorId, isActive]) => {
            newPercentages[debtorId] = isActive ? equalPercentage : '0';
          });
          
          setDebtorPercentages(newPercentages);
        }
      }
      
      return newDebtors;
    });
  };
  
  const handlePayerAmountChange = (id: string, value: string) => {
    setPayerAmounts(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDebtorAmountChange = (id: string, value: string) => {
    setDebtorAmounts(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDebtorPercentageChange = (id: string, value: string) => {
    setDebtorPercentages(prev => ({ ...prev, [id]: value }));
  };
  
  const validateForm = (): boolean => {
    if (!title) {
      setError('Please enter a title');
      return false;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    const totalAmount = Number(amount);
    
    // Check if at least one payer selected
    const selectedPayers = Object.values(payers).filter(Boolean).length;
    if (selectedPayers === 0) {
      setError('Please select at least one payer');
      return false;
    }
    
    // Validate payer amounts
    if (selectedPayers > 1) {
      const payerTotal = Object.entries(payers)
        .filter(([_, isSelected]) => isSelected)
        .reduce((sum, [id]) => sum + Number(payerAmounts[id] || 0), 0);
      
      if (Math.abs(payerTotal - totalAmount) > 0.01) {
        setError(`Payer amounts must equal the total: $${totalAmount.toFixed(2)}`);
        return false;
      }
    }
    
    // Check if at least one debtor selected
    const selectedDebtors = Object.values(debtors).filter(Boolean).length;
    if (selectedDebtors === 0) {
      setError('Please select at least one debtor');
      return false;
    }
    
    // Validate based on split type
    if (splitType === SPLIT_TYPES.PERCENTAGE) {
      const percentageTotal = Object.entries(debtors)
        .filter(([_, isSelected]) => isSelected)
        .reduce((sum, [id]) => sum + Number(debtorPercentages[id] || 0), 0);
      
      if (Math.abs(percentageTotal - 100) > 1) {
        setError('Percentages must add up to 100%');
        return false;
      }
    } else if (splitType === SPLIT_TYPES.CUSTOM) {
      const debtorTotal = Object.entries(debtors)
        .filter(([_, isSelected]) => isSelected)
        .reduce((sum, [id]) => sum + Number(debtorAmounts[id] || 0), 0);
      
      if (Math.abs(debtorTotal - totalAmount) > 0.01) {
        setError(`Debtor amounts must equal the total: $${totalAmount.toFixed(2)}`);
        return false;
      }
    }
    
    return true;
  };
  
  const preparePurchaseData = (): Omit<Purchase, 'id' | 'date'> => {
    const totalAmount = Number(amount);
    
    // Calculate payer data
    const paidBy = Object.entries(payers)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => {
        // If only one payer, they pay the full amount
        const payerAmount = Object.values(payers).filter(Boolean).length === 1
          ? totalAmount
          : Number(payerAmounts[id] || 0);
        
        return {
          participantId: id,
          amount: payerAmount
        };
      });
    
    // Calculate debtor data
    let splitBetween;
    
    if (splitType === SPLIT_TYPES.EQUAL) {
      // Equal split
      const activeDebtors = Object.entries(debtors).filter(([_, isActive]) => isActive);
      const equalAmount = totalAmount / activeDebtors.length;
      
      splitBetween = activeDebtors.map(([id]) => ({
        participantId: id,
        amount: equalAmount
      }));
    } else if (splitType === SPLIT_TYPES.PERCENTAGE) {
      // Percentage split
      splitBetween = Object.entries(debtors)
        .filter(([_, isActive]) => isActive)
        .map(([id]) => ({
          participantId: id,
          amount: totalAmount * Number(debtorPercentages[id] || 0) / 100
        }));
    } else {
      // Custom split
      splitBetween = Object.entries(debtors)
        .filter(([_, isActive]) => isActive)
        .map(([id]) => ({
          participantId: id,
          amount: Number(debtorAmounts[id] || 0)
        }));
    }
    
    return {
      title,
      amount: totalAmount,
      paidBy,
      splitBetween
    };
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const purchaseData = preparePurchaseData();
      await addPurchase(purchaseData);
      
      // Reset form
      setTitle('');
      setAmount('');
      setSplitType(SPLIT_TYPES.EQUAL);
      resetAmounts();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add purchase');
    }
  };
  
  if (!currentTrip) return null;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          Add Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Purchase</DialogTitle>
          <DialogDescription>
            Enter purchase details and how it should be split
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Purchase Title</Label>
              <Input
                id="title"
                placeholder="Dinner at restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Who Paid?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentTrip.participants.map(participant => (
                <div key={participant.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`payer-${participant.id}`}
                    checked={payers[participant.id]}
                    onCheckedChange={() => togglePayer(participant.id)}
                  />
                  <Label htmlFor={`payer-${participant.id}`} className="cursor-pointer flex items-center">
                    <span className="mr-2">{participant.emoji}</span>
                    <span>{participant.username}</span>
                  </Label>
                </div>
              ))}
            </div>
            
            {/* If multiple payers, show amount inputs */}
            {Object.values(payers).filter(Boolean).length > 1 && (
              <div className="pt-2 space-y-2">
                <Label>How much did each person pay?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(payers).filter(([_, isSelected]) => isSelected).map(([id]) => {
                    const participant = currentTrip.participants.find(p => p.id === id);
                    return (
                      <div key={id} className="flex items-center space-x-2">
                        <Label htmlFor={`payer-amount-${id}`} className="w-full">
                          <div className="flex items-center mb-1">
                            <span className="mr-1">{participant?.emoji}</span>
                            <span>{participant?.username}</span>
                          </div>
                          <Input
                            id={`payer-amount-${id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={payerAmounts[id] || ''}
                            onChange={(e) => handlePayerAmountChange(id, e.target.value)}
                            required
                          />
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>How Should It Be Split?</Label>
              <RadioGroup
                value={splitType}
                onValueChange={handleSplitTypeChange}
                className="flex flex-col space-y-1 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={SPLIT_TYPES.EQUAL} id="split-equal" />
                  <Label htmlFor="split-equal">Split Equally</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={SPLIT_TYPES.PERCENTAGE} id="split-percentage" />
                  <Label htmlFor="split-percentage">Split by Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={SPLIT_TYPES.CUSTOM} id="split-custom" />
                  <Label htmlFor="split-custom">Split by Custom Amounts</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label>Who's Involved?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {currentTrip.participants.map(participant => (
                  <div key={participant.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`debtor-${participant.id}`}
                      checked={debtors[participant.id]}
                      onCheckedChange={() => toggleDebtor(participant.id)}
                    />
                    <Label htmlFor={`debtor-${participant.id}`} className="cursor-pointer flex items-center">
                      <span className="mr-2">{participant.emoji}</span>
                      <span>{participant.username}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {splitType === SPLIT_TYPES.PERCENTAGE && (
              <div className="pt-2 space-y-2">
                <Label>Percentage Split</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(debtors).filter(([_, isSelected]) => isSelected).map(([id]) => {
                    const participant = currentTrip.participants.find(p => p.id === id);
                    return (
                      <div key={id} className="flex items-center space-x-2">
                        <Label htmlFor={`debtor-percentage-${id}`} className="w-full">
                          <div className="flex items-center mb-1">
                            <span className="mr-1">{participant?.emoji}</span>
                            <span>{participant?.username}</span>
                          </div>
                          <div className="relative">
                            <Input
                              id={`debtor-percentage-${id}`}
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={debtorPercentages[id] || ''}
                              onChange={(e) => handleDebtorPercentageChange(id, e.target.value)}
                              className="pr-7"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2">%</span>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {splitType === SPLIT_TYPES.CUSTOM && (
              <div className="pt-2 space-y-2">
                <Label>Custom Amount Split</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(debtors).filter(([_, isSelected]) => isSelected).map(([id]) => {
                    const participant = currentTrip.participants.find(p => p.id === id);
                    return (
                      <div key={id} className="flex items-center space-x-2">
                        <Label htmlFor={`debtor-amount-${id}`} className="w-full">
                          <div className="flex items-center mb-1">
                            <span className="mr-1">{participant?.emoji}</span>
                            <span>{participant?.username}</span>
                          </div>
                          <Input
                            id={`debtor-amount-${id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={debtorAmounts[id] || ''}
                            onChange={(e) => handleDebtorAmountChange(id, e.target.value)}
                          />
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding Purchase...' : 'Add Purchase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseForm;
