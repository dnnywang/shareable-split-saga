
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Trip } from '@/context/TripContext';
import { formatDistanceToNow } from 'date-fns';

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

const TripCard = ({ trip, onClick }: TripCardProps) => {
  const navigate = useNavigate();
  
  // Extract the last purchase date for displaying "updated X time ago"
  const getLastActivityTime = (): string => {
    if (trip.purchases.length === 0) {
      return "No activity yet";
    }
    
    const dates = trip.purchases.map(p => new Date(p.date));
    const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return `Updated ${formatDistanceToNow(latestDate, { addSuffix: true })}`;
  };
  
  // Calculate total amount of all purchases in the trip
  const getTotalAmount = (): number => {
    return trip.purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/trip/${trip.id}`);
    }
  };
  
  return (
    <Card 
      className="h-full cursor-pointer transform transition-all duration-200 hover:shadow-md hover:-translate-y-1"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{trip.emoji}</div>
          <div className="text-sm text-muted-foreground">
            {trip.participants.length} {trip.participants.length === 1 ? 'person' : 'people'}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-1 truncate">{trip.name}</h3>
        <p className="text-sm text-muted-foreground truncate mb-4">{trip.description}</p>
        
        {trip.purchases.length > 0 && (
          <div className="text-sm font-medium">
            ${getTotalAmount().toFixed(2)} total spending
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 px-6 pb-4">
        <div className="text-xs text-muted-foreground w-full">
          {getLastActivityTime()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TripCard;
