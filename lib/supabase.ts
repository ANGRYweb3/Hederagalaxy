import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Project {
  id: number;
  name: string;
  description: string;
  link: string;
  image: string;
  x: number;
  y: number;
  z: number;
  created_at?: string;
}

// Function to fetch all projects
export async function fetchProjects(): Promise<Project[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL and Anon Key must be set in .env.local');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return [];
  }
}

// Function to add a new project
export async function addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL and Anon Key must be set in .env.local');
    return null;
  }
  
  try {
    // ไม่ต้องกำหนด ID เอง เพราะใช้ SERIAL ใน PostgreSQL แล้ว
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding project:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return null;
  }
}

// Generate a random position in 3D space with minimum distance check
export function generateRandomPosition(existingProjects: Project[]): { x: number, y: number, z: number } {
  const MIN_DISTANCE = 20; // เพิ่มระยะห่างขั้นต่ำระหว่างดาว (เดิม 10)
  const MAX_ATTEMPTS = 50; // Maximum number of attempts to find a valid position
  
  // Range for random positions
  const RANGE = 120; // เพิ่มขอบเขตพื้นที่ให้กว้างขึ้น (เดิม 100)
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Generate random position
    const position = {
      x: (Math.random() * 2 - 1) * RANGE,
      y: (Math.random() * 2 - 1) * RANGE,
      z: (Math.random() * 2 - 1) * RANGE
    };
    
    // Check distance from center (Hedera star)
    const distanceFromCenter = Math.sqrt(
      position.x * position.x + 
      position.y * position.y + 
      position.z * position.z
    );
    
    if (distanceFromCenter < MIN_DISTANCE) {
      continue; // Too close to center, try again
    }
    
    // Check distance from other projects
    let tooClose = false;
    
    for (const project of existingProjects) {
      const distance = Math.sqrt(
        Math.pow(position.x - project.x, 2) + 
        Math.pow(position.y - project.y, 2) + 
        Math.pow(position.z - project.z, 2)
      );
      
      if (distance < MIN_DISTANCE) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      return position; // Valid position found
    }
  }
  
  // If we couldn't find a valid position after MAX_ATTEMPTS, 
  // generate a position further away to ensure no overlap
  return {
    x: (Math.random() * 2 - 1) * RANGE * 2.5,
    y: (Math.random() * 2 - 1) * RANGE * 2.5,
    z: (Math.random() * 2 - 1) * RANGE * 2.5
  };
} 