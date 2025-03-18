'use client';

import { useEffect, useState } from 'react';
// import ThreeScene from '../components/ThreeScene';
import MinimalScene from '../components/MinimalScene';
import ProjectModal from '../components/ProjectModal';
import AddProjectForm from '../components/AddProjectForm';
import { fetchProjects, Project } from '../lib/supabase';

// ดาว Hedera ที่จะอยู่ตรงจุดศูนย์กลาง
const HEDERA_STAR: Project = {
  id: 0, // เริ่มที่ 0 ให้ Hedera เป็นหลัก ส่วนโปรเจคที่เพิ่มจะเริ่มที่ 1
  name: 'Hedera',
  description: 'Hedera is a decentralized public network where developers can build secure, fair applications with near real-time consensus.',
  link: 'https://hedera.com',
  image: '/hbar.png', // ใช้ texture จากไฟล์ภาพที่มีอยู่แล้ว
  x: 0,
  y: 0,
  z: 0,
  created_at: new Date().toISOString()
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
        // Show welcome message when loading completes
        setShowWelcome(true);
        
        // Hide welcome message after 5 seconds
        setTimeout(() => {
          setShowWelcome(false);
        }, 5000);
      }
    };

    loadProjects();
  }, []);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleAddProject = (newProject: Project) => {
    setProjects([newProject, ...projects]);
  };

  return (
    <main className="relative min-h-screen bg-black">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-2xl">Loading Hedera Galaxy...</div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 text-xl">{error}</div>
        </div>
      ) : (
        <>
          <MinimalScene 
            projects={projects} 
            onProjectClick={handleProjectClick} 
            showUI={true}
            hederaStar={HEDERA_STAR}
            isFormOpen={showAddForm || showAbout}
          />
          
          {selectedProject && (
            <ProjectModal 
              project={selectedProject} 
              onClose={() => setSelectedProject(null)} 
            />
          )}
          
          <div className="absolute top-4 left-4">
            <img src="/sitelogo.png" alt="Hedera Galaxy" className="h-10" />
          </div>
          
          <div className="absolute top-4 right-4 flex items-center">
            <button
              onClick={() => setShowAbout(true)}
              className="bg-white hover:bg-zinc-200 text-black font-medium py-2.5 px-5 rounded-lg shadow-lg transition-colors flex items-center space-x-1.5 mr-2"
            >
              <span>About</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-white hover:bg-zinc-200 text-black font-medium py-2.5 px-5 rounded-lg shadow-lg transition-colors flex items-center space-x-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Project</span>
            </button>
          </div>
          
          {/* Welcome Text with Neon Effect */}
          {showWelcome && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center fade-out">
              <h1 className="text-4xl font-bold tracking-wide animate-pulse" 
                  style={{ 
                    color: '#39FF14', 
                    textShadow: '0 0 5px rgba(57, 255, 20, 0.7), 0 0 10px rgba(57, 255, 20, 0.5)' 
                  }}>
                Welcome to Hedera Galaxy
              </h1>
            </div>
          )}
          
          {/* About Modal */}
          {showAbout && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 border border-white p-6 rounded-xl max-w-md">
              <h2 className="text-2xl font-bold mb-4">About Hedera Galaxy</h2>
              <p className="mb-4">Hedera Galaxy is a platform that showcases projects and creators on the Hedera Network, visualized as a 3D galaxy. Users can add their projects or promote themselves, each appearing as a new star in the space.</p>
              <p className="mb-4 text-yellow-300">Note: Refresh the page if star textures don't load (logo not visible)</p>
              <div className="flex justify-between items-center">
                <a href="https://x.com/HederaGalaxy" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <button 
                  onClick={() => setShowAbout(false)} 
                  className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          {showAddForm && (
            <AddProjectForm 
              existingProjects={projects}
              onProjectAdded={handleAddProject}
              onClose={() => setShowAddForm(false)}
            />
          )}
        </>
      )}
    </main>
  );
} 