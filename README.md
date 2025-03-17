# Hedera Galaxy

A 3D interactive visualization platform where creators can showcase their Hedera-based projects as stars in a galaxy-themed space.

## Features

- 3D galaxy visualization with Three.js
- Central Hedera star surrounded by community projects
- Interactive navigation using W, A, S, D keys and mouse wheel for zoom
- Project submission form with image upload
- Project details displayed when clicking on stars
- Responsive design

## Tech Stack

- **Frontend**: Next.js with TypeScript, React
- **3D Rendering**: Three.js with @react-three/fiber and @react-three/drei
- **Backend/Database**: Supabase
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/hedera-galaxy.git
cd hedera-galaxy
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` to add your Supabase URL and anonymous key.

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Supabase Setup

1. Create a new Supabase project
2. Create the required tables using the SQL in `supabase-schema.sql`
3. Enable RLS (Row Level Security) with the policies defined in the SQL file

## Deployment

The application is configured for easy deployment on Vercel:

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Add your environment variables (Supabase URL and key)
4. Deploy

## Usage

- **Navigating the Galaxy**: Use W, A, S, D keys to move through the space, and mouse wheel to zoom in/out
- **Adding a Project**: Click the "Add Project" button and fill out the form
- **Viewing Project Details**: Click on any star to see project information

## License

MIT

## Acknowledgments

- Hedera for inspiring this visualization platform
- Three.js community for the amazing 3D web technologies # Hederagalaxy
