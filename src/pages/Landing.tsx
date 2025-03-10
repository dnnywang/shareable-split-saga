
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import TripCard from '@/components/trips/TripCard';
import CreateTripForm from '@/components/trips/CreateTripForm';
import JoinTripForm from '@/components/trips/JoinTripForm';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { trips } = useTrip();
  
  const [showSignUp, setShowSignUp] = useState(false);
  
  // If user is already authenticated, load their trips
  useEffect(() => {
    if (user && trips.length === 1) {
      navigate(`/trip/${trips[0].id}`);
    }
  }, [user, trips, navigate]);
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-teal-50 to-purple-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-split-teal">Split Saga</h1>
            <p className="text-lg text-muted-foreground">
              Split bills with friends, roommates, and travel groups
            </p>
          </div>
          
          {showSignUp ? (
            <SignUpForm onToggleForm={() => setShowSignUp(false)} />
          ) : (
            <SignInForm onToggleForm={() => setShowSignUp(true)} />
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-teal-50 to-purple-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-split-teal">Split Saga</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium flex items-center">
              <span className="mr-2 text-xl">{user.emoji}</span>
              <span>{user.name}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile')}
              className="text-muted-foreground"
            >
              <User size={20} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => signOut()}
              className="text-muted-foreground"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Your Trips</h2>
          
          <div className="flex items-center gap-3">
            <JoinTripForm />
            <CreateTripForm />
          </div>
        </div>
        
        {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-xl font-medium mb-4">No trips yet!</h3>
            <p className="text-muted-foreground mb-6">
              Create a new trip to start splitting expenses with friends
            </p>
            <CreateTripForm />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Landing;
