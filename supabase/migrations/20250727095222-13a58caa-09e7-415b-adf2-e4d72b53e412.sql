-- Create enum types
CREATE TYPE public.complaint_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
CREATE TYPE public.complaint_category AS ENUM ('food_quality', 'pricing', 'hygiene', 'location_issue', 'licensing', 'other');
CREATE TYPE public.user_role AS ENUM ('consumer', 'vendor', 'authority', 'admin');

-- Create areas table for location-based complaints
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  pincode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  area_id UUID REFERENCES public.areas(id),
  role user_role NOT NULL DEFAULT 'consumer',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  license_number TEXT,
  area_id UUID NOT NULL REFERENCES public.areas(id),
  location_description TEXT NOT NULL,
  food_types TEXT[] DEFAULT '{}',
  is_licensed BOOLEAN DEFAULT false,
  average_rating DECIMAL(2,1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complainant_id UUID NOT NULL REFERENCES public.profiles(id),
  vendor_id UUID REFERENCES public.vendors(id),
  area_id UUID NOT NULL REFERENCES public.areas(id),
  category complaint_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  assigned_to UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  food_quality_rating INTEGER CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
  price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  hygiene_rating INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, customer_id)
);

-- Enable RLS on all tables
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for areas (public read)
CREATE POLICY "Areas are viewable by everyone" 
ON public.areas FOR SELECT USING (true);

CREATE POLICY "Only admins can modify areas" 
ON public.areas FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for vendors
CREATE POLICY "Vendors are viewable by everyone" 
ON public.vendors FOR SELECT USING (true);

CREATE POLICY "Vendors can update their own data" 
ON public.vendors FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = vendors.profile_id AND profiles.user_id = auth.uid()
));

CREATE POLICY "Vendors can insert their own data" 
ON public.vendors FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = profile_id AND profiles.user_id = auth.uid()
));

-- Create RLS policies for complaints
CREATE POLICY "Users can view complaints in their area or filed by them" 
ON public.complaints FOR SELECT 
USING (
  complainant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR assigned_to IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('authority', 'admin')
  )
);

CREATE POLICY "Users can file complaints" 
ON public.complaints FOR INSERT 
WITH CHECK (
  complainant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Authorities can update complaints" 
ON public.complaints FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role IN ('authority', 'admin')
));

-- Create RLS policies for ratings
CREATE POLICY "Ratings are viewable by everyone" 
ON public.ratings FOR SELECT USING (true);

CREATE POLICY "Users can rate vendors" 
ON public.ratings FOR INSERT 
WITH CHECK (
  customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own ratings" 
ON public.ratings FOR UPDATE 
USING (
  customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update vendor average rating
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendors 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.ratings 
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.ratings 
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update vendor ratings
CREATE TRIGGER update_vendor_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_rating();

-- Insert sample areas
INSERT INTO public.areas (name, district, pincode) VALUES
('Vijayawada Central', 'Krishna', '520001'),
('Guntur City', 'Guntur', '522001'),
('Visakhapatnam Beach Road', 'Visakhapatnam', '530001'),
('Tirupati Town', 'Chittoor', '517501'),
('Rajamahendravaram', 'East Godavari', '533101'),
('Kurnool City', 'Kurnool', '518001'),
('Nellore Town', 'Nellore', '524001'),
('Anantapur City', 'Anantapur', '515001'),
('Eluru Town', 'West Godavari', '534001'),
('Kadapa City', 'Kadapa', '516001');