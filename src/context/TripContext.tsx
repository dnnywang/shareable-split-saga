
import { createContext, useContext, useState, ReactNode } from "react";
import { mockTrips, mockPurchases, Trip, Purchase } from "@/lib/mockData";
import { useAuth } from "./AuthContext";

interface TripContextType {
  trips: Trip[];
  purchases: Purchase[];
  currentTrip: Trip | null;
  setCurrentTrip: (tripId: string | null) => void;
  createTrip: (trip: Omit<Trip, "id" | "createdAt" | "totalSpent">) => Promise<Trip>;
  joinTrip: (code: string) => Promise<Trip | null>;
  addPurchase: (purchase: Omit<Purchase, "id" | "date">) => Promise<Purchase>;
  getTripPurchases: (tripId: string) => Purchase[];
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [currentTrip, setCurrentTripState] = useState<Trip | null>(null);

  const setCurrentTrip = (tripId: string | null) => {
    if (!tripId) {
      setCurrentTripState(null);
      return;
    }
    
    const trip = trips.find(t => t.id === tripId) || null;
    setCurrentTripState(trip);
  };

  const createTrip = async (tripData: Omit<Trip, "id" | "createdAt" | "totalSpent">) => {
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalSpent: 0
    };
    
    setTrips(prev => [...prev, newTrip]);
    return newTrip;
  };

  const joinTrip = async (code: string) => {
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
  };

  const addPurchase = async (purchaseData: Omit<Purchase, "id" | "date">) => {
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
          totalSpent: trip.totalSpent + purchaseData.amount
        };
      }
      return trip;
    }));
    
    return newPurchase;
  };

  const getTripPurchases = (tripId: string) => {
    return purchases.filter(p => p.tripId === tripId);
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
        getTripPurchases
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
