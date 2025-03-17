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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            isFormOpen={showAddForm}
          />
          
          {selectedProject && (
            <ProjectModal 
              project={selectedProject} 
              onClose={() => setSelectedProject(null)} 
            />
          )}
          
          <div className="absolute top-4 right-4">
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