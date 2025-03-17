import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
  image: string;
  x: number;
  y: number;
  z: number;
  created_at?: string;
}

// Mock data for development
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Example Project 1',
    description: 'This is an example project for testing.',
    link: 'https://example.com',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzU1YWFmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkV4YW1wbGUgUHJvamVjdCAxPC90ZXh0Pjwvc3ZnPg==',
    x: 20,
    y: 10,
    z: 15
  },
  {
    id: '2',
    name: 'Example Project 2',
    description: 'Another example project for testing.',
    link: 'https://example.org',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmNTU1NSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkV4YW1wbGUgUHJvamVjdCAyPC90ZXh0Pjwvc3ZnPg==',
    x: -30,
    y: 5,
    z: 25
  },
  {
    id: '3',
    name: 'Example Project 3',
    description: 'A third example project for testing.',
    link: 'https://example.net',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzU1ZmY3ZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkV4YW1wbGUgUHJvamVjdCAzPC90ZXh0Pjwvc3ZnPg==',
    x: 10,
    y: -15,
    z: -20
  }
];

// Function to fetch all projects
export async function fetchProjects(): Promise<Project[]> {
  // Use mock data if no valid Supabase URL
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Using mock data. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local for real data.');
    return mockProjects;
  }
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching projects:', error);
      return mockProjects; // Fallback to mock data on error
    }
    
    return data || mockProjects;
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return mockProjects; // Fallback to mock data on error
  }
}

// Function to add a new project
export async function addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> {
  // Use mock data if no valid Supabase URL
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Using mock data. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local for real data.');
    const newProject: Project = {
      id: Date.now().toString(),
      name: project.name,
      description: project.description,
      link: project.link,
      image: project.image,
      x: project.x,
      y: project.y,
      z: project.z,
      created_at: new Date().toISOString()
    };
    mockProjects.push(newProject);
    return newProject;
  }
  
  try {
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
  const MIN_DISTANCE = 10; // Minimum distance between stars
  const MAX_ATTEMPTS = 50; // Maximum number of attempts to find a valid position
  
  // Range for random positions
  const RANGE = 100;
  
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
    x: (Math.random() * 2 - 1) * RANGE * 2,
    y: (Math.random() * 2 - 1) * RANGE * 2,
    z: (Math.random() * 2 - 1) * RANGE * 2
  };
} 