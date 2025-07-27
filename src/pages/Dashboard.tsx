import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Users, Star, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalVendors: number;
  totalRatings: number;
  averageRating: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    totalVendors: 0,
    totalRatings: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch complaints stats
      const { data: complaints } = await supabase
        .from('complaints')
        .select('status');

      // Fetch vendors count
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id');

      // Fetch ratings stats
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating');

      const totalComplaints = complaints?.length || 0;
      const pendingComplaints = complaints?.filter(c => c.status === 'pending').length || 0;
      const resolvedComplaints = complaints?.filter(c => c.status === 'resolved').length || 0;
      const totalVendors = vendors?.length || 0;
      const totalRatings = ratings?.length || 0;
      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setStats({
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        totalVendors,
        totalRatings,
        averageRating
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of street vendor complaints and ratings system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.pendingComplaints} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Successfully handled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              Registered vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRatings}</div>
            <p className="text-xs text-muted-foreground">
              Customer reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest complaints and ratings from your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will show recent complaints, ratings, and vendor updates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • File a new complaint
            </p>
            <p className="text-sm text-muted-foreground">
              • Rate a vendor
            </p>
            <p className="text-sm text-muted-foreground">
              • Register as a vendor
            </p>
            <p className="text-sm text-muted-foreground">
              • View area-wise reports
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;