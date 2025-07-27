import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, MessageSquare } from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
  areas: {
    name: string;
    district: string;
  };
  vendors?: {
    business_name: string;
  };
}

interface Area {
  id: string;
  name: string;
  district: string;
}

interface Vendor {
  id: string;
  business_name: string;
}

const Complaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    area_id: '',
    vendor_id: '',
    priority: 1
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComplaints();
    fetchAreas();
    fetchVendors();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          profiles (full_name),
          areas (name, district),
          vendors (business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
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

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name')
        .order('business_name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
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
        .from('complaints')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          area_id: formData.area_id,
          priority: formData.priority,
          complainant_id: profile.id,
          vendor_id: formData.vendor_id || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Complaint submitted successfully!"
      });

      setFormData({
        title: '',
        description: '',
        category: '',
        area_id: '',
        vendor_id: '',
        priority: 1
      });
      setIsDialogOpen(false);
      fetchComplaints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.areas.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Complaints</h1>
          <p className="text-muted-foreground">
            Report issues and track their resolution status
          </p>
        </div>
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                File Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>File a New Complaint</DialogTitle>
                <DialogDescription>
                  Report an issue with a street vendor or general area concern
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complaint_type">Type</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quality">Food Quality</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="hygiene">Hygiene</SelectItem>
                        <SelectItem value="behavior">Behavior</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="vendor_id">Vendor (Optional)</Label>
                    <Select
                      value={formData.vendor_id}
                      onValueChange={(value) => setFormData({...formData, vendor_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({...formData, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search complaints..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to file a complaint'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{complaint.title}</CardTitle>
                    <CardDescription>
                      Filed by {complaint.profiles.full_name} • {complaint.areas.name}, {complaint.areas.district}
                      {complaint.vendors && ` • ${complaint.vendors.business_name}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                    <Badge className={getPriorityColor(complaint.priority)}>
                      {complaint.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Type:</strong> {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                </p>
                <p className="text-sm mb-4">{complaint.description}</p>
                <p className="text-xs text-muted-foreground">
                  Filed on {new Date(complaint.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Complaints;