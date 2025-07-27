import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Users, Star, MapPin, CheckCircle } from 'lucide-react';

interface Vendor {
  id: string;
  business_name: string;
  food_type: string;
  location_details: string;
  license_number?: string;
  is_verified: boolean;
  created_at: string;
  areas: {
    name: string;
    district: string;
  };
  profiles: {
    full_name: string;
  };
  average_rating?: number;
  total_ratings?: number;
}

interface Area {
  id: string;
  name: string;
  district: string;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    food_type: '',
    location_details: '',
    area_id: '',
    license_number: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchVendors();
    fetchAreas();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          areas (name, district),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ratings for each vendor
      const vendorsWithRatings = await Promise.all(
        (data || []).map(async (vendor) => {
          const { data: ratings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('vendor_id', vendor.id);

          const totalRatings = ratings?.length || 0;
          const averageRating = totalRatings > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0;

          return {
            ...vendor,
            total_ratings: totalRatings,
            average_rating: averageRating
          };
        })
      );

      setVendors(vendorsWithRatings);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name');

      if (error) throw error;
      setAreas(data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      const { error } = await supabase
        .from('vendors')
        .insert({
          ...formData,
          profile_id: profile.id
        });

      if (error) throw error;

      // Update user type to vendor
      await supabase
        .from('profiles')
        .update({ user_type: 'vendor' })
        .eq('id', profile.id);

      toast({
        title: "Success",
        description: "Vendor profile created successfully!"
      });

      setFormData({
        business_name: '',
        food_type: '',
        location_details: '',
        area_id: '',
        license_number: ''
      });
      setIsDialogOpen(false);
      fetchVendors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.food_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.areas.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Street Vendors</h1>
          <p className="text-muted-foreground">
            Discover and connect with local street food vendors
          </p>
        </div>
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Register as Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register as a Street Vendor</DialogTitle>
                <DialogDescription>
                  Create your vendor profile to connect with customers
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="food_type">Food Type</Label>
                    <Input
                      id="food_type"
                      placeholder="e.g., Chaat, Dosa, Pani Puri"
                      value={formData.food_type}
                      onChange={(e) => setFormData({...formData, food_type: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area_id">Area</Label>
                    <Select
                      value={formData.area_id}
                      onValueChange={(value) => setFormData({...formData, area_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}, {area.district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number (Optional)</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_details">Location Details</Label>
                  <Input
                    id="location_details"
                    placeholder="e.g., Near Bus Stand, Main Road"
                    value={formData.location_details}
                    onChange={(e) => setFormData({...formData, location_details: e.target.value})}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Registering...' : 'Register as Vendor'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredVendors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to register as a vendor'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {vendor.business_name}
                        {vendor.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        by {vendor.profiles.full_name}
                      </CardDescription>
                    </div>
                    {vendor.total_ratings > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {vendor.average_rating?.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({vendor.total_ratings})
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{vendor.food_type}</Badge>
                    {vendor.license_number && (
                      <Badge variant="outline">Licensed</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">{vendor.location_details}</p>
                      <p className="text-muted-foreground">
                        {vendor.areas.name}, {vendor.areas.district}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">
                      Since {new Date(vendor.created_at).toLocaleDateString()}
                    </span>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendors;