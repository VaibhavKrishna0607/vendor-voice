import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Users, Star, User, LogOut, Home } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary">
              VendorVoice
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link to="/complaints">
                  <Button
                    variant={isActive('/complaints') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Complaints
                  </Button>
                </Link>
                <Link to="/vendors">
                  <Button
                    variant={isActive('/vendors') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Vendors
                  </Button>
                </Link>
                <Link to="/ratings">
                  <Button
                    variant={isActive('/ratings') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Ratings
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button
                    variant={isActive('/profile') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;