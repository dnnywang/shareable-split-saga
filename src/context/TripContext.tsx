
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Export these interfaces so they can be used in other components
export interface Participant {
  id: string;
  email: string;
  name: string | null;
  emoji: string | null;
  username: string;
  avatarUrl?: string;
}

export interface Payment {
  from: string;
  to: string;
  amount: number;
}

export interface Purchase {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  date: string;
  paidBy: { userId: string; amount: number }[];
  splitBetween: { userId: string; amount: number }[];
  createdBy: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  code: string;
  createdAt: string;
  totalSpent: number;
  participants: Participant[];
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [currentTrip, setCurrentTripState] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch trips from Supabase when user changes
  useEffect(() => {
    if (user) {
      fetchTrips();
    } else {
      // Reset state when user logs out
      setTrips([]);
      setPurchases([]);
      setCurrentTripState(null);
    }
  }, [user]);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      // First get trips where the user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('trip_participants')
        .select('trip_id')
        .eq('user_id', user?.id);

      if (participantError) {
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        // If user has no trips, return empty arrays
        setTrips([]);
        setPurchases([]);
        setIsLoading(false);
        return;
      }

      const tripIds = participantData.map(p => p.trip_id);
      
      // Get the trip details
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds);

      if (tripsError) {
        throw tripsError;
      }

      // Format trips for the app
      const formattedTrips: Trip[] = await Promise.all(tripsData.map(async (trip) => {
        // Get participants for each trip
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select('*')
          .eq('trip_id', trip.id);

        if (participantsError) {
          throw participantsError;
        }

        // Get purchases for each trip
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select('*')
          .eq('trip_id', trip.id);

        if (purchasesError) {
          throw purchasesError;
        }

        // Format purchases with payers and splits
        const tripPurchases: Purchase[] = await Promise.all(purchasesData.map(async (purchase) => {
          // Get payers
          const { data: payersData, error: payersError } = await supabase
            .from('purchase_payers')
            .select('*')
            .eq('purchase_id', purchase.id);

          if (payersError) {
            throw payersError;
          }

          // Get splits
          const { data: splitsData, error: splitsError } = await supabase
            .from('purchase_splits')
            .select('*')
            .eq('purchase_id', purchase.id);

          if (splitsError) {
            throw splitsError;
          }

          return {
            id: purchase.id,
            tripId: purchase.trip_id,
            title: purchase.title,
            amount: parseFloat(purchase.amount.toString()),
            date: purchase.date,
            paidBy: payersData.map(payer => ({
              userId: payer.user_id,
              amount: parseFloat(payer.amount.toString())
            })),
            splitBetween: splitsData.map(split => ({
              userId: split.user_id,
              amount: parseFloat(split.amount.toString())
            })),
            createdBy: purchase.created_by
          };
        }));

        // Add purchases to our state
        setPurchases(prev => [...prev, ...tripPurchases]);

        // Calculate total spent
        const totalSpent = tripPurchases.reduce((total, p) => total + p.amount, 0);

        return {
          id: trip.id,
          name: trip.name,
          description: trip.description || "",
          emoji: trip.emoji || "✈️",
          code: trip.code,
          createdAt: trip.created_at,
          totalSpent: totalSpent,
          participants: participantsData.map(p => ({
            id: p.user_id,
            email: p.username, // Using username as email for now
            username: p.username,
            emoji: p.emoji,
            name: p.username
          })),
          purchases: tripPurchases
        };
      }));

      setTrips(formattedTrips);
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to load trips");
    } finally {
      setIsLoading(false);
    }
  };

  const selectTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    
    if (trip) {
      // Get all purchases for this trip
      const tripPurchases = purchases.filter(p => p.tripId === tripId);
      
      // Create a new trip object with the purchases array
      const tripWithPurchases = {
        ...trip,
        purchases: tripPurchases
      };
      
      setCurrentTripState(tripWithPurchases);
    } else {
      console.error(`Trip with id ${tripId} not found`);
      setCurrentTripState(null);
    }
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
      // Insert new trip into Supabase
      const { data: newTripData, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: tripData.name,
          description: tripData.description || null,
          emoji: tripData.emoji || "✈️",
          code: tripData.code,
          created_by: user?.id
        })
        .select()
        .single();

      if (tripError) {
        throw tripError;
      }

      // Add creator as a participant
      const { error: participantError } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: newTripData.id,
          user_id: user?.id,
          username: user?.name || user?.email,
          emoji: user?.emoji
        });

      if (participantError) {
        throw participantError;
      }

      // Format the new trip for the app
      const newTrip: Trip = {
        id: newTripData.id,
        name: newTripData.name,
        description: newTripData.description || "",
        emoji: newTripData.emoji || "✈️",
        code: newTripData.code,
        createdAt: newTripData.created_at,
        totalSpent: 0,
        participants: [{
          id: user?.id || "",
          email: user?.email || "",
          name: user?.name || null,
          emoji: user?.emoji || null
        }],
        purchases: []
      };
      
      // Update local state
      setTrips(prev => [...prev, newTrip]);
      return newTrip;
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast.error(error.message || "Failed to create trip");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinTrip = async (code: string) => {
    setIsLoading(true);
    
    try {
      // Find trip by code
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('code', code)
        .single();

      if (tripError) {
        if (tripError.code === 'PGRST116') {
          toast.error("Trip not found. Please check the code and try again.");
          return null;
        }
        throw tripError;
      }

      // Check if user is already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('trip_participants')
        .select('*')
        .eq('trip_id', tripData.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingParticipant) {
        toast.info("You're already a participant in this trip!");
        // Refresh trips to ensure we have the latest data
        await fetchTrips();
        const trip = trips.find(t => t.id === tripData.id);
        return trip || null;
      }

      // Add user as a participant
      const { error: joinError } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: tripData.id,
          user_id: user?.id,
          username: user?.name || user?.email,
          emoji: user?.emoji
        });

      if (joinError) {
        throw joinError;
      }

      // Refresh trips to get the one we just joined
      await fetchTrips();
      
      // Find the trip we just joined
      const joinedTrip = trips.find(t => t.id === tripData.id);
      
      if (!joinedTrip) {
        throw new Error("Failed to retrieve joined trip");
      }
      
      return joinedTrip;
    } catch (error: any) {
      console.error("Error joining trip:", error);
      toast.error(error.message || "Failed to join trip");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addPurchase = async (purchaseData: Omit<Purchase, "id" | "date">) => {
    setIsLoading(true);
    
    try {
      // Insert new purchase into Supabase
      const { data: newPurchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          trip_id: purchaseData.tripId,
          title: purchaseData.title,
          amount: purchaseData.amount.toString(), // Convert to string here
          created_by: purchaseData.createdBy,
          date: new Date().toISOString()
        })
        .select()
        .single();

      if (purchaseError) {
        throw purchaseError;
      }

      // Insert payers
      const payerPromises = purchaseData.paidBy.map(payer => 
        supabase
          .from('purchase_payers')
          .insert({
            purchase_id: newPurchaseData.id,
            user_id: payer.userId,
            amount: payer.amount
          })
      );

      await Promise.all(payerPromises);

      // Insert splits
      const splitPromises = purchaseData.splitBetween.map(split => 
        supabase
          .from('purchase_splits')
          .insert({
            purchase_id: newPurchaseData.id,
            user_id: split.userId,
            amount: split.amount
          })
      );

      await Promise.all(splitPromises);

      // Format the new purchase for the app
      const newPurchase: Purchase = {
        id: newPurchaseData.id,
        tripId: newPurchaseData.trip_id,
        title: newPurchaseData.title,
        amount: parseFloat(newPurchaseData.amount.toString()),
        date: newPurchaseData.date,
        paidBy: purchaseData.paidBy,
        splitBetween: purchaseData.splitBetween,
        createdBy: newPurchaseData.created_by
      };
      
      // Update local state
      setPurchases(prev => [...prev, newPurchase]);
      
      // Update trip total and add purchase to trip.purchases
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
      
      // Update current trip if this purchase belongs to it
      if (currentTrip && currentTrip.id === purchaseData.tripId) {
        setCurrentTripState({
          ...currentTrip,
          totalSpent: currentTrip.totalSpent + purchaseData.amount,
          purchases: [...(currentTrip.purchases || []), newPurchase]
        });
      }
      
      return newPurchase;
    } catch (error: any) {
      console.error("Error adding purchase:", error);
      toast.error(error.message || "Failed to add purchase");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removePurchase = async (purchaseId: string) => {
    setIsLoading(true);
    
    try {
      const purchaseToRemove = purchases.find(p => p.id === purchaseId);
      
      if (!purchaseToRemove) {
        throw new Error("Purchase not found");
      }

      // Delete purchase from Supabase (cascade will handle payers and splits)
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) {
        throw error;
      }
      
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
      
      // Update current trip if this purchase belongs to it
      if (currentTrip && currentTrip.id === purchaseToRemove.tripId) {
        setCurrentTripState({
          ...currentTrip,
          totalSpent: currentTrip.totalSpent - purchaseToRemove.amount,
          purchases: currentTrip.purchases.filter(p => p.id !== purchaseId)
        });
      }
    } catch (error: any) {
      console.error("Error removing purchase:", error);
      toast.error(error.message || "Failed to remove purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTripDetails = async (details: {name: string, description?: string, emoji?: string}) => {
    setIsLoading(true);
    
    try {
      if (!currentTrip) return;
      
      // Update trip in Supabase
      const { error } = await supabase
        .from('trips')
        .update({
          name: details.name,
          description: details.description,
          emoji: details.emoji
        })
        .eq('id', currentTrip.id);

      if (error) {
        throw error;
      }
      
      const updatedTrip = {
        ...currentTrip,
        ...details
      };
      
      // Update trips array
      setTrips(prev => prev.map(t => t.id === currentTrip.id ? updatedTrip : t));
      
      // Update current trip
      setCurrentTripState(updatedTrip);
    } catch (error: any) {
      console.error("Error updating trip details:", error);
      toast.error(error.message || "Failed to update trip");
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
