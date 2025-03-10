
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { toast } from 'sonner';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const handleToggleForm = () => {
    setActiveTab(activeTab === 'signin' ? 'signup' : 'signin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-500 to-purple-600 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-white space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Split expenses with friends and family</h1>
              <p className="text-xl opacity-90">
                Track shared expenses, calculate who owes what, and settle up easily.
              </p>
            </div>
            
            {/* Auth Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <SignInForm onToggleForm={handleToggleForm} />
                </TabsContent>
                
                <TabsContent value="signup">
                  <SignUpForm onToggleForm={handleToggleForm} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 px-4 container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">Simplify your shared expenses</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold">Track expenses</h3>
            <p className="text-muted-foreground">
              Record who paid for what and how it should be split.
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-semibold">Calculate balances</h3>
            <p className="text-muted-foreground">
              Automatically see who owes money and who's owed.
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold">Settle up</h3>
            <p className="text-muted-foreground">
              Get the simplest way for everyone to be paid back.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-8 border-t">
        <div className="container mx-auto max-w-6xl px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Expense Sharing App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
