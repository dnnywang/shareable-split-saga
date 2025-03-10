
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  emoji?: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  code: string;
  createdAt: string;
  participants: User[];
  totalSpent: number;
}

export interface Purchase {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  paidBy: { userId: string; amount: number }[];
  splitBetween: { userId: string; amount: number }[];
  date: string;
}

export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "user1@example.com",
    name: "John Doe",
    emoji: "👨‍💻"
  },
  {
    id: "user-2",
    email: "user2@example.com",
    name: "Jane Smith",
    emoji: "👩‍🎨"
  },
  {
    id: "user-3",
    email: "user3@example.com",
    name: "Bob Johnson",
    emoji: "🧗‍♂️"
  },
  {
    id: "user-4",
    email: "user4@example.com",
    name: "Alice Williams",
    emoji: "🏄‍♀️"
  }
];

export const mockTrips: Trip[] = [
  {
    id: "trip-1",
    name: "Weekend Getaway",
    description: "Trip to the mountains",
    emoji: "🏔️",
    code: "ABC123",
    createdAt: "2023-07-15T12:00:00Z",
    participants: [mockUsers[0], mockUsers[1], mockUsers[2]],
    totalSpent: 750.50
  },
  {
    id: "trip-2",
    name: "Beach Vacation",
    description: "Summer beach trip",
    emoji: "🏖️",
    code: "DEF456",
    createdAt: "2023-08-20T12:00:00Z",
    participants: [mockUsers[0], mockUsers[3]],
    totalSpent: 1250.75
  },
  {
    id: "trip-3",
    name: "City Break",
    description: "Weekend in the city",
    emoji: "🏙️",
    code: "GHI789",
    createdAt: "2023-09-10T12:00:00Z",
    participants: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    totalSpent: 980.25
  }
];

export const mockPurchases: Purchase[] = [
  {
    id: "purchase-1",
    tripId: "trip-1",
    title: "Hotel Booking",
    amount: 450.00,
    paidBy: [{ userId: "user-1", amount: 450.00 }],
    splitBetween: [
      { userId: "user-1", amount: 150.00 },
      { userId: "user-2", amount: 150.00 },
      { userId: "user-3", amount: 150.00 }
    ],
    date: "2023-07-16T14:30:00Z"
  },
  {
    id: "purchase-2",
    tripId: "trip-1",
    title: "Groceries",
    amount: 120.50,
    paidBy: [{ userId: "user-2", amount: 120.50 }],
    splitBetween: [
      { userId: "user-1", amount: 40.17 },
      { userId: "user-2", amount: 40.17 },
      { userId: "user-3", amount: 40.16 }
    ],
    date: "2023-07-17T09:15:00Z"
  },
  {
    id: "purchase-3",
    tripId: "trip-1",
    title: "Hiking Tour",
    amount: 180.00,
    paidBy: [{ userId: "user-3", amount: 180.00 }],
    splitBetween: [
      { userId: "user-1", amount: 60.00 },
      { userId: "user-2", amount: 60.00 },
      { userId: "user-3", amount: 60.00 }
    ],
    date: "2023-07-18T11:45:00Z"
  }
];
