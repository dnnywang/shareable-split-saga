
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { useAuth } from './AuthContext';

export interface Participant {
  id: string;
  username: string;
  emoji: string;
}

export interface Payment {
  from: string; // participant id
  to: string; // participant id
  amount: number;
}

export interface Purchase {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: {
    participantId: string;
    amount: number;
  }[];
  splitBetween: {
    participantId: string;
    amount: number;
  }[];
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  emoji: string;
  code: string;
  participants: Participant[];
  purchases: Purchase[];
  createdBy: string;
}

interface TripContextType {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  createTrip: (name: string, description: string, emoji: string) => Promise<Trip>;
  joinTrip: (code: string) => Promise<void>;
  selectTrip: (tripId: string) => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'date'>) => Promise<void>;
  removePurchase: (purchaseId: string) => Promise<void>;
  updateTripDetails: (data: Partial<Trip>) => Promise<void>;
  calculateBalances: () => Record<string, number>;
  simplifyDebts: () => Payment[];
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load trips from local storage on mount
  useEffect(() => {
    const loadTrips = () => {
      setIsLoading(true);
      try {
        const storedTrips = localStorage.getItem('splitTrips');
        if (storedTrips) {
          setTrips(JSON.parse(storedTrips));
        }
      } catch (error) {
        console.error('Failed to load trips from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrips();
  }, []);

  // Save trips to local storage whenever they change
  useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem('splitTrips', JSON.stringify(trips));
    }
  }, [trips]);

  // Generate a random 6-character trip code
  const generateTripCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const createTrip = async (name: string, description: string, emoji: string) => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to create a trip');
      }
      
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        name,
        description,
        emoji,
        code: generateTripCode(),
        participants: [
          {
            id: user.id,
            username: user.username,
            emoji: user.emoji
          }
        ],
        purchases: [],
        createdBy: user.id
      };
      
      setTrips(prevTrips => [...prevTrips, newTrip]);
      setCurrentTrip(newTrip);
      toast.success("Trip created successfully!");
      return newTrip;
    } catch (error) {
      console.error('Create trip error:', error);
      toast.error("Failed to create trip");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinTrip = async (code: string) => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to join a trip');
      }
      
      // Check if trip with code exists
      const tripToJoin = trips.find(trip => trip.code === code);
      
      if (!tripToJoin) {
        throw new Error('Trip not found with that code');
      }
      
      // Check if user is already a participant
      if (tripToJoin.participants.some(p => p.id === user.id)) {
        setCurrentTrip(tripToJoin);
        toast.info("You're already a member of this trip");
        return;
      }
      
      // Add user to participants
      const updatedTrip = {
        ...tripToJoin,
        participants: [
          ...tripToJoin.participants,
          {
            id: user.id,
            username: user.username,
            emoji: user.emoji
          }
        ]
      };
      
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === updatedTrip.id ? updatedTrip : trip
        )
      );
      
      setCurrentTrip(updatedTrip);
      toast.success("Successfully joined the trip!");
    } catch (error) {
      console.error('Join trip error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to join trip");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId) || null;
    setCurrentTrip(trip);
  };

  const addPurchase = async (purchaseData: Omit<Purchase, 'id' | 'date'>) => {
    setIsLoading(true);
    try {
      if (!currentTrip) {
        throw new Error('No trip selected');
      }
      
      const newPurchase: Purchase = {
        ...purchaseData,
        id: `purchase-${Date.now()}`,
        date: new Date().toISOString(),
      };
      
      const updatedTrip = {
        ...currentTrip,
        purchases: [...currentTrip.purchases, newPurchase]
      };
      
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === updatedTrip.id ? updatedTrip : trip
        )
      );
      
      setCurrentTrip(updatedTrip);
      toast.success("Purchase added successfully!");
    } catch (error) {
      console.error('Add purchase error:', error);
      toast.error("Failed to add purchase");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removePurchase = async (purchaseId: string) => {
    setIsLoading(true);
    try {
      if (!currentTrip) {
        throw new Error('No trip selected');
      }
      
      const updatedTrip = {
        ...currentTrip,
        purchases: currentTrip.purchases.filter(p => p.id !== purchaseId)
      };
      
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === updatedTrip.id ? updatedTrip : trip
        )
      );
      
      setCurrentTrip(updatedTrip);
      toast.success("Purchase removed successfully!");
    } catch (error) {
      console.error('Remove purchase error:', error);
      toast.error("Failed to remove purchase");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTripDetails = async (data: Partial<Trip>) => {
    setIsLoading(true);
    try {
      if (!currentTrip) {
        throw new Error('No trip selected');
      }
      
      const updatedTrip = { ...currentTrip, ...data };
      
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === updatedTrip.id ? updatedTrip : trip
        )
      );
      
      setCurrentTrip(updatedTrip);
      toast.success("Trip details updated successfully!");
    } catch (error) {
      console.error('Update trip details error:', error);
      toast.error("Failed to update trip details");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBalances = () => {
    if (!currentTrip) return {};
    
    const balances: Record<string, number> = {};
    
    // Initialize balances for all participants
    currentTrip.participants.forEach(participant => {
      balances[participant.id] = 0;
    });
    
    // Calculate balances based on purchases
    currentTrip.purchases.forEach(purchase => {
      // Add what each person paid
      purchase.paidBy.forEach(payer => {
        balances[payer.participantId] += payer.amount;
      });
      
      // Subtract what each person owes
      purchase.splitBetween.forEach(debtor => {
        balances[debtor.participantId] -= debtor.amount;
      });
    });
    
    return balances;
  };

  const simplifyDebts = () => {
    if (!currentTrip) return [];
    
    const balances = calculateBalances();
    const payments: Payment[] = [];
    
    // Sort participants into creditors (positive balance) and debtors (negative balance)
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1]); // sort descending by amount
    
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1]); // sort ascending by amount (more negative first)
    
    let i = 0, j = 0;
    
    // Match debtors with creditors to minimize transactions
    while (i < debtors.length && j < creditors.length) {
      const [debtorId, debtAmount] = debtors[i];
      const [creditorId, creditAmount] = creditors[j];
      
      const absDebt = Math.abs(debtAmount);
      
      if (absDebt < creditAmount) {
        // Debtor pays their full debt to creditor
        payments.push({
          from: debtorId,
          to: creditorId,
          amount: absDebt
        });
        
        // Update remaining credit
        creditors[j] = [creditorId, creditAmount - absDebt];
        i++;
      } else {
        // Debtor pays part of their debt to creditor
        payments.push({
          from: debtorId,
          to: creditorId,
          amount: creditAmount
        });
        
        // Update remaining debt
        debtors[i] = [debtorId, debtAmount + creditAmount];
        j++;
      }
    }
    
    return payments;
  };

  return (
    <TripContext.Provider 
      value={{ 
        trips, 
        currentTrip, 
        isLoading, 
        createTrip, 
        joinTrip, 
        selectTrip,
        addPurchase,
        removePurchase,
        updateTripDetails,
        calculateBalances,
        simplifyDebts
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
