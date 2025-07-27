import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { User, Phone, MapPin, UserCheck, Save } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: string;
  area_id?: string;
  areas?: {
    name: string;
    district: string;
  };
}

interface Area {
  id: string;
  name: string;
  district: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    area_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    complaintsCount: 0,
    ratingsCount: 0,
    vendorInfo: null as any
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAreas();
      fetchUserStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          areas (name, district)
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        area_id: data.area_id || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Get user profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Fetch complaints count
      const { data: complaints } = await supabase
        .from('complaints')
        .select('id')
        .eq('complainant_id', profile.id);

      // Fetch ratings count
      const { data: ratings } = await supabase
        .from('ratings')
        .select('id')
        .eq('reviewer_id', profile.id);

      // Fetch vendor info if user is a vendor
      const { data: vendorInfo } = await supabase
        .from('vendors')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      setStats({
        complaintsCount: complaints?.length || 0,
        ratingsCount: ratings?.length || 0,
        vendorInfo
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          area_id: formData.area_id || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Profile...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_id">Area</Label>
                  <Select
                    value={formData.area_id}
                    onValueChange={(value) => setFormData({...formData, area_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your area" />
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

                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">User Type:</span>
                <Badge variant={profile.user_type === 'vendor' ? 'default' : 'secondary'}>
                  {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Email:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>

              {profile.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone:</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </span>
                </div>
              )}

              {profile.areas && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Location:</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.areas.name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Complaints Filed:</span>
                <span className="font-semibold">{stats.complaintsCount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Ratings Given:</span>
                <span className="font-semibold">{stats.ratingsCount}</span>
              </div>

              {stats.vendorInfo && (
                <>
                  <hr className="my-3" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Vendor Information:</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Business:</strong> {stats.vendorInfo.business_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Food Type:</strong> {stats.vendorInfo.food_type}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={stats.vendorInfo.is_verified ? 'default' : 'secondary'}>
                        {stats.vendorInfo.is_verified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;