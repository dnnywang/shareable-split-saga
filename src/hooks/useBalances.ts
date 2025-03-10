
import { useMemo } from "react";
import { Purchase, User } from "@/lib/mockData";

interface Balance {
  userId: string;
  netBalance: number;
  owes: { userId: string; amount: number }[];
  isOwed: { userId: string; amount: number }[];
}

export const useBalances = (purchases: Purchase[], participants: User[]) => {
  const balances = useMemo(() => {
    // Initialize balances for all participants
    const balanceMap = new Map<string, Balance>();
    
    participants.forEach(participant => {
      balanceMap.set(participant.id, {
        userId: participant.id,
        netBalance: 0,
        owes: [],
        isOwed: []
      });
    });
    
    // Calculate raw balances from all purchases
    purchases.forEach(purchase => {
      // Add amounts paid
      purchase.paidBy.forEach(payment => {
        const userBalance = balanceMap.get(payment.userId);
        if (userBalance) {
          userBalance.netBalance += payment.amount;
        }
      });
      
      // Subtract amounts owed
      purchase.splitBetween.forEach(debt => {
        const userBalance = balanceMap.get(debt.userId);
        if (userBalance) {
          userBalance.netBalance -= debt.amount;
        }
      });
    });
    
    // Calculate the detailed owes/isOwed relationships
    const balances = Array.from(balanceMap.values());
    
    // For each pair of users, determine if one owes the other
    for (let i = 0; i < balances.length; i++) {
      for (let j = i + 1; j < balances.length; j++) {
        const user1 = balances[i];
        const user2 = balances[j];
        
        // If user1 owes user2
        if (user1.netBalance < 0 && user2.netBalance > 0) {
          const amount = Math.min(Math.abs(user1.netBalance), user2.netBalance);
          if (amount > 0) {
            user1.owes.push({ userId: user2.userId, amount });
            user2.isOwed.push({ userId: user1.userId, amount });
          }
        }
        // If user2 owes user1
        else if (user2.netBalance < 0 && user1.netBalance > 0) {
          const amount = Math.min(Math.abs(user2.netBalance), user1.netBalance);
          if (amount > 0) {
            user2.owes.push({ userId: user1.userId, amount });
            user1.isOwed.push({ userId: user2.userId, amount });
          }
        }
      }
    }
    
    return balances;
  }, [purchases, participants]);

  const simplified = useMemo(() => {
    // This is a simple implementation - a more advanced algorithm would be needed
    // for a complete debt simplification
    return balances.map(balance => ({
      userId: balance.userId,
      netBalance: balance.netBalance,
      transactions: balance.netBalance < 0 
        ? balance.owes 
        : balance.isOwed.map(item => ({ 
            userId: item.userId, 
            amount: item.amount 
          }))
    }));
  }, [balances]);

  return { balances, simplified };
};
