
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrip } from '@/context/TripContext';
import { useAuth } from '@/context/AuthContext';
import TripHeader from '@/components/trips/TripHeader';
import TripBalances from '@/components/trips/TripBalances';
import PurchaseForm from '@/components/purchases/PurchaseForm';
import PurchaseItem from '@/components/purchases/PurchaseItem';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trips, selectTrip, currentTrip } = useTrip();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  
  // Set the current trip based on the URL param
  useEffect(() => {
    if (id) {
      selectTrip(id);
    }
  }, [id, selectTrip]);
  
  // If trip is not found, redirect to home
  useEffect(() => {
    if (trips.length > 0 && id && !trips.some(trip => trip.id === id)) {
      navigate('/');
    }
  }, [trips, id, navigate]);
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  if (!currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-teal-50 to-purple-50">
      <TripHeader trip={currentTrip} />
      
      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Purchases Column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Purchases</h2>
            <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1" size={16} />
                  Add Purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <PurchaseForm 
                  tripId={currentTrip.id} 
                  onClose={() => setShowPurchaseForm(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {currentTrip.purchases.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No purchases yet!</h3>
              <p className="text-muted-foreground mb-6">
                Add your first purchase to start tracking expenses
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-1" size={16} />
                    Add First Purchase
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <PurchaseForm 
                    tripId={currentTrip.id} 
                    onClose={() => setShowPurchaseForm(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sort purchases by date (newest first) */}
              {[...currentTrip.purchases]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(purchase => (
                  <PurchaseItem key={purchase.id} purchase={purchase} />
                ))
              }
            </div>
          )}
        </div>
        
        {/* Balances Column */}
        <div className="lg:col-span-1">
          <TripBalances />
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
