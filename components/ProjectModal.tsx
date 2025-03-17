'use client';

import React, { useEffect, useState } from 'react';
import { Project } from '../lib/supabase';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }
    };
    
    // Animation: fade in when component mounts
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      clearTimeout(timer);
    };
  }, [onClose]);
  
  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }
  };
  
  const handleCloseClick = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };
  
  if (!project) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out p-4 sm:p-6 md:p-8 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } backdrop-blur-sm`}
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" onClick={handleBackdropClick}></div>
      
      <div 
        className={`relative bg-black border border-zinc-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl transition-all duration-300 overflow-visible max-h-[90vh] ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="overflow-y-auto max-h-[calc(90vh-32px)]">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
            {project.image ? (
              <div className="w-full md:w-1/3 h-40 sm:h-48 md:h-auto">
                <div className="w-full h-full relative rounded-lg overflow-hidden bg-zinc-900">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
                </div>
              </div>
            ) : (
              <div className="w-full md:w-1/3 h-40 sm:h-48 md:h-auto bg-zinc-900 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="w-full md:w-2/3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-tight">{project.name}</h2>
              <div className="w-12 sm:w-16 h-1 bg-white mb-2 sm:mb-4"></div>
              <p className="text-sm sm:text-base text-zinc-300 mb-4 sm:mb-6 leading-relaxed">{project.description}</p>
              
              {project.link && (
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    Visit Project
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={handleCloseClick}
                    className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors font-medium text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              )}
              
              <div className="mt-4 sm:mt-6 text-zinc-500 text-xs sm:text-sm">
                Project ID: {project.id}
                <span className="inline-block mx-2">•</span>
                Location: [{Math.round(project.x)}, {Math.round(project.y)}, {Math.round(project.z)}]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal; 