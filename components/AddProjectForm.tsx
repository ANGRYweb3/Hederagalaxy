'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addProject, generateRandomPosition, Project } from '../lib/supabase';

interface AddProjectFormProps {
  existingProjects: Project[];
  onProjectAdded: (project: Project) => void;
  onClose: () => void;
}

interface FormValues {
  name: string;
  description: string;
  link: string;
}

const AddProjectForm: React.FC<AddProjectFormProps> = ({ existingProjects, onProjectAdded, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle image drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };
  
  // Process the image file
  const handleImageFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        // Resize image before storing as base64
        resizeImage(event.target.result as string, 300, 300, (resizedImage) => {
          setImage(resizedImage);
        });
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  // Resize image to specified dimensions
  const resizeImage = (
    dataUrl: string,
    maxWidth: number,
    maxHeight: number,
    callback: (resizedDataUrl: string) => void
  ) => {
    const img = new Image();
    img.src = dataUrl;
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Get resized data URL
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(resizedDataUrl);
    };
  };
  
  // Submit form
  const onSubmit = async (data: FormValues) => {
    if (!image) {
      alert('Please upload an image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate random position for the new project
      const position = generateRandomPosition(existingProjects);
      
      // Create new project object
      const newProject = {
        name: data.name,
        description: data.description,
        link: data.link,
        image,
        ...position
      };
      
      // Add project to Supabase
      const addedProject = await addProject(newProject);
      
      if (addedProject) {
        onProjectAdded(addedProject);
        onClose();
      }
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Failed to add project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 p-4 sm:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-black p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl border border-zinc-800 transition-all duration-300">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Add Your Project</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="w-16 sm:w-20 h-1 bg-white mb-4 sm:mb-6"></div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="name" className="block text-white mb-1 sm:mb-2 font-medium text-sm sm:text-base">Project Name</label>
            <input
              id="name"
              type="text"
              className="w-full p-2 sm:p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700 focus:border-white focus:outline-none transition-colors text-sm sm:text-base"
              placeholder="Enter project name"
              {...register('name', { required: 'Project name is required' })}
            />
            {errors.name && <p className="text-red-400 mt-1 sm:mt-2 text-xs sm:text-sm">{errors.name.message}</p>}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-white mb-1 sm:mb-2 font-medium text-sm sm:text-base">Description</label>
            <textarea
              id="description"
              rows={3}
              className="w-full p-2 sm:p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700 focus:border-white focus:outline-none transition-colors resize-none text-sm sm:text-base"
              placeholder="Describe your project"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && <p className="text-red-400 mt-1 sm:mt-2 text-xs sm:text-sm">{errors.description.message}</p>}
          </div>
          
          <div>
            <label htmlFor="link" className="block text-white mb-1 sm:mb-2 font-medium text-sm sm:text-base">Project Link</label>
            <input
              id="link"
              type="url"
              className="w-full p-2 sm:p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700 focus:border-white focus:outline-none transition-colors text-sm sm:text-base"
              placeholder="https://your-project-url.com"
              {...register('link', { 
                required: 'Project link is required',
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: 'Please enter a valid URL starting with http:// or https://'
                }
              })}
            />
            {errors.link && <p className="text-red-400 mt-1 sm:mt-2 text-xs sm:text-sm">{errors.link.message}</p>}
          </div>
          
          <div>
            <label className="block text-white mb-1 sm:mb-2 font-medium text-sm sm:text-base">Project Image</label>
            <div 
              className={`border-2 border-dashed p-4 sm:p-6 rounded-lg text-center cursor-pointer transition-colors ${
                dragActive ? 'border-white bg-zinc-900' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
              } ${image ? 'bg-zinc-900' : 'bg-zinc-900'}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {image ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="relative max-h-32 sm:max-h-48 overflow-hidden rounded-lg">
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="max-h-32 sm:max-h-48 max-w-full mx-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40"></div>
                  </div>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-300 transition-colors font-medium text-sm sm:text-base"
                    onClick={() => setImage(null)}
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 py-3 sm:py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-zinc-300 text-sm sm:text-base">Drag & drop an image here, or click to select</p>
                  <p className="text-zinc-500 text-xs sm:text-sm">Max size: 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="image-upload" 
                    className="mt-1 sm:mt-2 inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg cursor-pointer transition-colors text-sm sm:text-base"
                  >
                    Select Image
                  </label>
                </div>
              )}
            </div>
            {!image && <p className="text-zinc-500 mt-1 sm:mt-2 text-xs sm:text-sm">An image is required for your project</p>}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-zinc-200 text-black font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Add Project'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectForm; 