
import { createContext, useContext, useState, ReactNode } from "react";
import { mockTrips, mockPurchases, Trip as MockTrip, Purchase as MockPurchase, User } from "@/lib/mockData";
import { useAuth } from "./AuthContext";

// Export these interfaces so they can be used in other components
export interface Participant extends User {
  // Add any additional properties needed for participants
}

export interface Payment {
  from: string;
  to: string;
  amount: number;
}

export interface Purchase extends MockPurchase {
  // Extending the MockPurchase interface
}

export interface Trip extends MockTrip {
  purchases: Purchase[];
}

interface TripContextType {
  trips: Trip[];
  purchases: Purchase[];
  currentTrip: Trip | null;
  setCurrentTrip: (tripId: string | null) => void;
  createTrip: (tripData: Omit<Trip, "id" | "createdAt" | "totalSpent">) => Promise<Trip>;
  joinTrip: (code: string) => Promise<Trip | null>;
  addPurchase: (purchase: Omit<Purchase, "id" | "date">) => Promise<Purchase>;
  getTripPurchases: (tripId: string) => Purchase[];
  removePurchase: (purchaseId: string) => Promise<void>;
  calculateBalances: () => Record<string, number>;
  simplifyDebts: () => Payment[];
  selectTrip: (tripId: string) => void;
  updateTripDetails: (details: {name: string, description?: string, emoji?: string}) => Promise<void>;
  isLoading: boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(mockTrips.map(trip => ({ ...trip, purchases: [] })));
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [currentTrip, setCurrentTripState] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId) || null;
    setCurrentTripState(trip);
  };

  const setCurrentTrip = (tripId: string | null) => {
    if (!tripId) {
      setCurrentTripState(null);
      return;
    }
    
    selectTrip(tripId);
  };

  const createTrip = async (tripData: Omit<Trip, "id" | "createdAt" | "totalSpent">) => {
    setIsLoading(true);
    
    try {
      const newTrip: Trip = {
        ...tripData,
        id: `trip-${Date.now()}`,
        createdAt: new Date().toISOString(),
        totalSpent: 0,
        purchases: []
      };
      
      setTrips(prev => [...prev, newTrip]);
      return newTrip;
    } finally {
      setIsLoading(false);
    }
  };

  const joinTrip = async (code: string) => {
    setIsLoading(true);
    
    try {
      const trip = trips.find(t => t.code === code);
      if (!trip) return null;
      
      // If user is already a participant, just return the trip
      if (trip.participants.some(p => p.id === user?.id)) {
        return trip;
      }
      
      // Add user to trip participants
      const updatedTrip = {
        ...trip,
        participants: [...trip.participants, {
          id: user?.id || 'unknown',
          email: user?.email || 'unknown',
          emoji: user?.emoji
        }]
      };
      
      setTrips(prev => prev.map(t => t.id === trip.id ? updatedTrip : t));
      return updatedTrip;
    } finally {
      setIsLoading(false);
    }
  };

  const addPurchase = async (purchaseData: Omit<Purchase, "id" | "date">) => {
    setIsLoading(true);
    
    try {
      const newPurchase: Purchase = {
        ...purchaseData,
        id: `purchase-${Date.now()}`,
        date: new Date().toISOString()
      };
      
      setPurchases(prev => [...prev, newPurchase]);
      
      // Update trip total
      setTrips(prev => prev.map(trip => {
        if (trip.id === purchaseData.tripId) {
          return {
            ...trip,
            totalSpent: trip.totalSpent + purchaseData.amount,
            purchases: [...(trip.purchases || []), newPurchase]
          };
        }
        return trip;
      }));
      
      return newPurchase;
    } finally {
      setIsLoading(false);
    }
  };

  const removePurchase = async (purchaseId: string) => {
    setIsLoading(true);
    
    try {
      const purchaseToRemove = purchases.find(p => p.id === purchaseId);
      
      if (purchaseToRemove) {
        // Remove purchase from purchases array
        setPurchases(prev => prev.filter(p => p.id !== purchaseId));
        
        // Update trip total and purchases array
        setTrips(prev => prev.map(trip => {
          if (trip.id === purchaseToRemove.tripId) {
            return {
              ...trip,
              totalSpent: trip.totalSpent - purchaseToRemove.amount,
              purchases: (trip.purchases || []).filter(p => p.id !== purchaseId)
            };
          }
          return trip;
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateTripDetails = async (details: {name: string, description?: string, emoji?: string}) => {
    setIsLoading(true);
    
    try {
      if (!currentTrip) return;
      
      const updatedTrip = {
        ...currentTrip,
        ...details
      };
      
      setTrips(prev => prev.map(t => t.id === currentTrip.id ? updatedTrip : t));
      setCurrentTripState(updatedTrip);
    } finally {
      setIsLoading(false);
    }
  };

  const getTripPurchases = (tripId: string) => {
    return purchases.filter(p => p.tripId === tripId);
  };

  const calculateBalances = () => {
    if (!currentTrip) return {};
    
    const balances: Record<string, number> = {};
    
    // Initialize balances to 0 for all participants
    currentTrip.participants.forEach(participant => {
      balances[participant.id] = 0;
    });
    
    // Calculate based on all purchases for the trip
    const tripPurchases = getTripPurchases(currentTrip.id);
    
    tripPurchases.forEach(purchase => {
      // Add money for people who paid
      purchase.paidBy.forEach(payer => {
        balances[payer.userId] = (balances[payer.userId] || 0) + payer.amount;
      });
      
      // Subtract money for people who owe
      purchase.splitBetween.forEach(debtor => {
        balances[debtor.userId] = (balances[debtor.userId] || 0) - debtor.amount;
      });
    });
    
    return balances;
  };

  const simplifyDebts = () => {
    if (!currentTrip) return [];
    
    const balances = calculateBalances();
    const payments: Payment[] = [];
    
    // Extract creditors (positive balance) and debtors (negative balance)
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1]); // Sort by highest creditor first
    
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1]); // Sort by highest debtor first
    
    // Match debtors to creditors
    while (debtors.length > 0 && creditors.length > 0) {
      const [debtorId, debtorBalance] = debtors[0];
      const [creditorId, creditorBalance] = creditors[0];
      
      const amount = Math.min(Math.abs(debtorBalance), creditorBalance);
      
      if (amount > 0.01) { // Only add payments for meaningful amounts
        payments.push({
          from: debtorId,
          to: creditorId,
          amount
        });
      }
      
      // Update balances
      const newDebtorBalance = debtorBalance + amount;
      const newCreditorBalance = creditorBalance - amount;
      
      // Remove or update creditor and debtor
      if (Math.abs(newCreditorBalance) < 0.01) {
        creditors.shift();
      } else {
        creditors[0] = [creditorId, newCreditorBalance];
      }
      
      if (Math.abs(newDebtorBalance) < 0.01) {
        debtors.shift();
      } else {
        debtors[0] = [debtorId, newDebtorBalance];
      }
    }
    
    return payments;
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        purchases,
        currentTrip,
        setCurrentTrip,
        createTrip,
        joinTrip,
        addPurchase,
        getTripPurchases,
        removePurchase,
        calculateBalances,
        simplifyDebts,
        selectTrip,
        updateTripDetails,
        isLoading
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
};
