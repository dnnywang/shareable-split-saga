import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTrip } from "@/context/TripContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateTripForm from "@/components/trips/CreateTripForm";
import JoinTripForm from "@/components/trips/JoinTripForm";
import TripCard from "@/components/trips/TripCard";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { trips } = useTrip();
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState<"create" | "join" | null>(null);

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 17.5v-11" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">SplitSaga</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                <AvatarImage src={user.avatarUrl} />
              </Avatar>
              <span className="font-medium hidden md:inline">{user.email}</span>
            </div>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Trips</h2>
            <p className="text-muted-foreground">Manage your trips and expenses</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={activeDialog === "create"} onOpenChange={(open) => setActiveDialog(open ? "create" : null)}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Create Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CreateTripForm onSuccess={() => setActiveDialog(null)} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={activeDialog === "join"} onOpenChange={(open) => setActiveDialog(open ? "join" : null)}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus">
                    <path d="M16 21v-2a4 4 0 1 0 0 4h4a4 4 0 1 1 0 4H8" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6" />
                    <path d="M16 11h6" />
                  </svg>
                  Join Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <JoinTripForm onSuccess={() => setActiveDialog(null)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plane text-muted-foreground">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 4 2 2 4 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-6">Create a new trip or join an existing one to get started.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => setActiveDialog("create")}>Create a Trip</Button>
              <Button variant="outline" onClick={() => setActiveDialog("join")}>Join with Code</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onClick={() => navigate(`/trip/${trip.id}`)} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
