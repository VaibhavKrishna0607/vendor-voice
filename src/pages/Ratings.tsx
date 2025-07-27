import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Star, User } from 'lucide-react';

interface Rating {
  id: string;
  rating: number;
  review?: string;
  food_quality_rating?: number;
  price_rating?: number;
  hygiene_rating?: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
  vendors: {
    business_name: string;
    food_types: string[];
    areas: {
      name: string;
      district: string;
    };
  };
}

interface Vendor {
  id: string;
  business_name: string;
  food_types: string[];
}

const StarRating = ({ rating, onRatingChange, readonly = false }: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer transition-colors ${
            star <= rating
              ? 'text-yellow-500 fill-current'
              : 'text-gray-300'
          } ${readonly ? 'cursor-default' : 'hover:text-yellow-400'}`}
          onClick={() => !readonly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
};

const Ratings = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendor_id: '',
    rating: 0,
    review_text: '',
    food_quality_rating: 0,
    price_rating: 0,
    hygiene_rating: 0
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchRatings();
    fetchVendors();
  }, []);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles (full_name),
          vendors (
            business_name,
            food_type,
            areas (name, district)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, food_type')
        .order('business_name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || formData.rating === 0) return;

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
        .from('ratings')
        .insert({
          ...formData,
          reviewer_id: profile.id,
          food_quality_rating: formData.food_quality_rating || null,
          price_rating: formData.price_rating || null,
          hygiene_rating: formData.hygiene_rating || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rating submitted successfully!"
      });

      setFormData({
        vendor_id: '',
        rating: 0,
        review_text: '',
        food_quality_rating: 0,
        price_rating: 0,
        hygiene_rating: 0
      });
      setIsDialogOpen(false);
      fetchRatings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const filteredRatings = ratings.filter(rating =>
    rating.vendors.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.vendors.food_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Ratings</h1>
          <p className="text-muted-foreground">
            Rate and review street food vendors
          </p>
        </div>
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Rate Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Rate a Vendor</DialogTitle>
                <DialogDescription>
                  Share your experience with other customers
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_id">Vendor</Label>
                  <Select
                    value={formData.vendor_id}
                    onValueChange={(value) => setFormData({...formData, vendor_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.business_name} - {vendor.food_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Overall Rating *</Label>
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={(rating) => setFormData({...formData, rating})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Food Quality</Label>
                    <StarRating
                      rating={formData.food_quality_rating}
                      onRatingChange={(rating) => setFormData({...formData, food_quality_rating: rating})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Value</Label>
                    <StarRating
                      rating={formData.price_rating}
                      onRatingChange={(rating) => setFormData({...formData, price_rating: rating})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hygiene</Label>
                    <StarRating
                      rating={formData.hygiene_rating}
                      onRatingChange={(rating) => setFormData({...formData, hygiene_rating: rating})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_text">Review (Optional)</Label>
                  <Textarea
                    id="review_text"
                    value={formData.review_text}
                    onChange={(e) => setFormData({...formData, review_text: e.target.value})}
                    rows={3}
                    placeholder="Share your experience..."
                  />
                </div>

                <Button type="submit" disabled={loading || formData.rating === 0} className="w-full">
                  {loading ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ratings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredRatings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ratings found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to rate a vendor'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRatings.map((rating) => (
            <Card key={rating.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {rating.vendors.business_name}
                    </CardTitle>
                    <CardDescription>
                      {rating.vendors.food_type} • {rating.vendors.areas.name}, {rating.vendors.areas.district}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <StarRating rating={rating.rating} readonly />
                    <p className="text-xs text-muted-foreground mt-1">
                      by {rating.profiles.full_name}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(rating.food_quality_rating || rating.price_rating || rating.hygiene_rating) && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {rating.food_quality_rating && (
                      <div>
                        <p className="font-medium mb-1">Food Quality</p>
                        <StarRating rating={rating.food_quality_rating} readonly />
                      </div>
                    )}
                    {rating.price_rating && (
                      <div>
                        <p className="font-medium mb-1">Price Value</p>
                        <StarRating rating={rating.price_rating} readonly />
                      </div>
                    )}
                    {rating.hygiene_rating && (
                      <div>
                        <p className="font-medium mb-1">Hygiene</p>
                        <StarRating rating={rating.hygiene_rating} readonly />
                      </div>
                    )}
                  </div>
                )}
                
                {rating.review_text && (
                  <div>
                    <p className="text-sm font-medium mb-2">Review:</p>
                    <p className="text-sm text-muted-foreground italic">
                      "{rating.review_text}"
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Rated on {new Date(rating.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Ratings;