
import { useState } from 'react';
import { useTrip, Payment, Participant } from '@/context/TripContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';

interface TripBalancesProps {
  className?: string;
}

const TripBalances = ({ className }: TripBalancesProps) => {
  const { currentTrip, calculateBalances, simplifyDebts } = useTrip();
  const [simplifiedDebts, setSimplifiedDebts] = useState<Payment[]>([]);
  const [openSimplifyDialog, setOpenSimplifyDialog] = useState(false);
  
  if (!currentTrip) return null;
  
  const balances = calculateBalances();
  
  const getParticipantById = (id: string): Participant | undefined => {
    return currentTrip.participants.find(p => p.id === id);
  };
  
  const handleSimplifyDebts = () => {
    const payments = simplifyDebts();
    setSimplifiedDebts(payments);
    setOpenSimplifyDialog(true);
  };
  
  return (
    <div className={className}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Balances</CardTitle>
          <CardDescription>
            Who owes whom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTrip.purchases.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No purchases yet. Add one to see balances.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {currentTrip.participants.map(participant => {
                  const balance = balances[participant.id] || 0;
                  const isPositive = balance > 0;
                  const isNegative = balance < 0;
                  const isZero = balance === 0;
                  
                  return (
                    <div 
                      key={participant.id}
                      className="flex items-center justify-between py-2 border-b border-border"
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{participant.emoji}</span>
                        <span className="font-medium">{participant.username}</span>
                      </div>
                      <div className={`font-semibold ${
                        isPositive ? 'text-split-green' : 
                        isNegative ? 'text-split-red' : ''
                      }`}>
                        {isPositive && '+'}
                        ${balance.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-2">
                <Button onClick={handleSimplifyDebts} variant="outline" className="w-full">
                  Simplify Payments
                </Button>
              </div>
            </>
          )}
          
          <Dialog open={openSimplifyDialog} onOpenChange={setOpenSimplifyDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Simplified Payments</DialogTitle>
                <DialogDescription>
                  Here's the most efficient way to settle all debts
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {simplifiedDebts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No payments needed! Everyone is settled.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {simplifiedDebts.map((payment, index) => {
                      const from = getParticipantById(payment.from);
                      const to = getParticipantById(payment.to);
                      
                      return (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                          <div className="flex items-center">
                            <span className="text-lg mr-1">{from?.emoji}</span>
                            <span className="font-medium">{from?.username}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ArrowRight size={14} />
                            <span>${payment.amount.toFixed(2)}</span>
                            <ArrowRight size={14} />
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-lg mr-1">{to?.emoji}</span>
                            <span className="font-medium">{to?.username}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripBalances;
