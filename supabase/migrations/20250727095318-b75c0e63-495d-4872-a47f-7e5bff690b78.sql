-- Create areas table for geographical organization
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  area_id UUID REFERENCES public.areas(id),
  user_type TEXT NOT NULL DEFAULT 'consumer' CHECK (user_type IN ('consumer', 'vendor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table for street vendor information
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  food_type TEXT NOT NULL,
  location_details TEXT NOT NULL,
  area_id UUID NOT NULL REFERENCES public.areas(id),
  license_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complainant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  area_id UUID NOT NULL REFERENCES public.areas(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  complaint_type TEXT NOT NULL CHECK (complaint_type IN ('quality', 'pricing', 'hygiene', 'behavior', 'location', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  food_quality_rating INTEGER CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
  price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  hygiene_rating INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, vendor_id)
);

-- Enable Row Level Security
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for areas (public read)
CREATE POLICY "Areas are viewable by everyone" 
ON public.areas FOR SELECT 
USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

-- RLS Policies for vendors
CREATE POLICY "Vendors are viewable by everyone" 
ON public.vendors FOR SELECT 
USING (true);

CREATE POLICY "Vendor owners can update their vendor info" 
ON public.vendors FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = vendors.profile_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create vendor profiles" 
ON public.vendors FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = vendors.profile_id 
  AND profiles.user_id = auth.uid()
));

-- RLS Policies for complaints
CREATE POLICY "Users can view complaints in their area" 
ON public.complaints FOR SELECT 
USING (true);

CREATE POLICY "Users can create complaints" 
ON public.complaints FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = complaints.complainant_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Complainants can update their complaints" 
ON public.complaints FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = complaints.complainant_id 
  AND profiles.user_id = auth.uid()
));

-- RLS Policies for ratings
CREATE POLICY "Ratings are viewable by everyone" 
ON public.ratings FOR SELECT 
USING (true);

CREATE POLICY "Users can create ratings" 
ON public.ratings FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = ratings.reviewer_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Reviewers can update their ratings" 
ON public.ratings FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = ratings.reviewer_id 
  AND profiles.user_id = auth.uid()
));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample areas data
INSERT INTO public.areas (name, district, state) VALUES
('Vijayawada Central', 'Krishna', 'Andhra Pradesh'),
('Guntur City', 'Guntur', 'Andhra Pradesh'),
('Visakhapatnam Beach Road', 'Visakhapatnam', 'Andhra Pradesh'),
('Tirupati Temple Area', 'Chittoor', 'Andhra Pradesh'),
('Kakinada Port Area', 'East Godavari', 'Andhra Pradesh'),
('Nellore City Center', 'Nellore', 'Andhra Pradesh'),
('Kurnool Old City', 'Kurnool', 'Andhra Pradesh'),
('Rajahmundry Main Road', 'East Godavari', 'Andhra Pradesh'),
('Anantapur Market', 'Anantapur', 'Andhra Pradesh'),
('Kadapa Railway Station', 'Kadapa', 'Andhra Pradesh');