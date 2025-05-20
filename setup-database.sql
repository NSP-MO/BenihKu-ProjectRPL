-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  care_instructions JSONB,
  seller JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample product data
INSERT INTO products (name, price, image, category, description, is_popular, care_instructions, seller)
VALUES
  (
    'Monstera Deliciosa',
    250000,
    '/placeholder.svg?height=500&width=500',
    'Tanaman Hias',
    'Monstera Deliciosa atau Swiss Cheese Plant adalah tanaman hias populer dengan daun besar berlubang yang unik.',
    true,
    '{
      "light": "Cahaya tidak langsung yang terang.",
      "water": "Siram saat lapisan atas tanah kering.",
      "soil": "Campuran tanah yang kaya nutrisi dengan drainase yang baik.",
      "humidity": "Menyukai kelembaban tinggi.",
      "temperature": "Suhu ideal 18-30°C.",
      "fertilizer": "Pupuk setiap bulan selama musim pertumbuhan."
    }',
    '{
      "name": "Toko Tanaman Sejahtera",
      "rating": 4.8,
      "response_time": "± 1 jam"
    }'
  ),
  (
    'Fiddle Leaf Fig',
    350000,
    '/placeholder.svg?height=500&width=500',
    'Tanaman Indoor',
    'Fiddle Leaf Fig (Ficus lyrata) adalah tanaman indoor populer dengan daun besar berbentuk biola.',
    true,
    '{
      "light": "Cahaya tidak langsung yang terang.",
      "water": "Siram saat 5-7 cm lapisan atas tanah kering.",
      "soil": "Tanah yang kaya nutrisi dengan drainase yang baik.",
      "humidity": "Menyukai kelembaban sedang hingga tinggi.",
      "temperature": "Suhu ideal 18-24°C.",
      "fertilizer": "Pupuk setiap 4-6 minggu selama musim pertumbuhan."
    }',
    '{
      "name": "Garden Center Indonesia",
      "rating": 4.9,
      "response_time": "± 30 menit"
    }'
  ),
  (
    'Snake Plant',
    150000,
    '/placeholder.svg?height=500&width=500',
    'Tanaman Indoor',
    'Snake Plant (Sansevieria) adalah tanaman yang sangat mudah dirawat dengan daun tegak yang kaku.',
    true,
    '{
      "light": "Toleran terhadap berbagai kondisi cahaya.",
      "water": "Siram hanya ketika tanah benar-benar kering.",
      "soil": "Campuran tanah kaktus atau tanah dengan drainase sangat baik.",
      "humidity": "Toleran terhadap kelembaban rendah.",
      "temperature": "Suhu ideal 18-27°C.",
      "fertilizer": "Pupuk ringan setiap 3-4 bulan."
    }',
    '{
      "name": "Kebun Hijau",
      "rating": 4.7,
      "response_time": "± 2 jam"
    }'
  );

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  total_amount INTEGER NOT NULL,
  shipping_info JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  shipping_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
