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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 p-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-black p-3 rounded-lg shadow-2xl w-full max-w-sm border border-zinc-800 transition-all duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 sticky top-0 bg-black z-10 pb-2">
          <h2 className="text-lg font-bold text-white tracking-tight">Add Your Project</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="w-12 h-0.5 bg-white mb-3"></div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div>
            <label htmlFor="name" className="block text-white mb-1 font-medium text-sm">Project Name</label>
            <input
              id="name"
              type="text"
              className="w-full p-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="Enter project name"
              {...register('name', { required: 'Project name is required' })}
            />
            {errors.name && <p className="text-red-400 mt-1 text-xs">{errors.name.message}</p>}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-white mb-1 font-medium text-sm">Description</label>
            <textarea
              id="description"
              className="w-full p-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="Describe your project"
              rows={2}
              {...register('description', { required: 'Description is required' })}
            ></textarea>
            {errors.description && <p className="text-red-400 mt-1 text-xs">{errors.description.message}</p>}
          </div>
          
          <div>
            <label htmlFor="link" className="block text-white mb-1 font-medium text-sm">Project Link</label>
            <input
              id="link"
              type="url"
              className="w-full p-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="https://your-project-url.com"
              {...register('link', { 
                required: 'Project link is required',
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: 'Please enter a valid URL starting with http:// or https://'
                }
              })}
            />
            {errors.link && <p className="text-red-400 mt-1 text-xs">{errors.link.message}</p>}
          </div>
          
          <div>
            <label className="block text-white mb-1 font-medium text-sm">Project Image</label>
            <div
              className={`rounded-md border-2 border-dashed ${
                dragActive ? 'border-white' : 'border-zinc-700'
              } ${image ? 'p-2' : 'p-0'} transition-colors`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {image ? (
                <div className="flex flex-col items-center">
                  <div className="w-full h-28 overflow-hidden rounded-md">
                    <img
                      src={image}
                      alt="Project preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-300 transition-colors font-medium text-xs mt-1"
                    onClick={() => setImage(null)}
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-1 py-2 flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-zinc-300 text-xs">Drag & drop or click to select</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="image-upload" 
                    className="mt-1 inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1 px-2 rounded-md cursor-pointer transition-colors text-xs"
                  >
                    Select Image
                  </label>
                </div>
              )}
            </div>
            {!image && <p className="text-zinc-500 mt-1 text-xs">Image required (max 5MB)</p>}
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-zinc-800 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-zinc-200 text-black font-medium py-1.5 px-3 rounded-md transition-colors flex items-center justify-center text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              className="flex-1 border border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium py-1.5 px-3 rounded-md transition-colors text-sm"
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