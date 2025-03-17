'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Project } from '../lib/supabase';
// import * as THREE from 'three';
import THREE from '../shims/three-with-batchedmesh';
import { Mesh, Points, BufferGeometry, Material } from 'three';

// กำหนด type สำหรับ keysPressed
interface KeysPressed {
  [key: string]: boolean;
}

// Component for a star representing a project
const ProjectStar: React.FC<{ 
  project: Project; 
  onClick: () => void;
  isHedera?: boolean;
}> = ({ project, onClick, isHedera = false }) => {
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const size = isHedera ? 3 : 1;
  const color = isHedera ? '#00ff7f' : (hovered ? '#ff9000' : '#ffffff');
  
  return (
    <mesh
      ref={mesh}
      position={[project.x, project.y, project.z]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

// Component for camera control
const CameraController: React.FC<{ 
  onUpdatePosition: (position: THREE.Vector3) => void 
}> = ({ onUpdatePosition }) => {
  const { camera } = useThree();
  const keysPressed = useRef<KeysPressed>({});
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    
    const handleWheel = (e: WheelEvent) => {
      // Zoom in/out with mouse wheel
      const zoomSpeed = 5;
      const direction = new THREE.Vector3(0, 0, e.deltaY > 0 ? zoomSpeed : -zoomSpeed);
      direction.applyQuaternion(camera.quaternion);
      camera.position.add(direction);
      onUpdatePosition(camera.position);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [camera, onUpdatePosition]);
  
  useFrame(() => {
    const moveSpeed = 1;
    const direction = new THREE.Vector3(0, 0, 0);
    
    if (keysPressed.current['w']) direction.z -= moveSpeed;
    if (keysPressed.current['s']) direction.z += moveSpeed;
    if (keysPressed.current['a']) direction.x -= moveSpeed;
    if (keysPressed.current['d']) direction.x += moveSpeed;
    
    if (direction.length() > 0) {
      direction.applyQuaternion(camera.quaternion);
      camera.position.add(direction);
      onUpdatePosition(camera.position);
    }
  });
  
  return null;
};

// Create simple background stars manually instead of using Stars component
const BackgroundStars: React.FC = () => {
  const stars = useRef<Points>(null);
  
  useEffect(() => {
    if (stars.current) {
      const geometry = new THREE.BufferGeometry();
      const count = 3000;
      const positions = new Float32Array(count * 3);
      
      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 300;
        positions[i + 1] = (Math.random() - 0.5) * 300;
        positions[i + 2] = (Math.random() - 0.5) * 300;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      if (stars.current) {
        stars.current.geometry = geometry;
      }
    }
  }, []);
  
  return (
    <points ref={stars}>
      <bufferGeometry />
      <pointsMaterial size={0.5} color="#ffffff" />
    </points>
  );
};

// Main component for the 3D scene
interface ThreeSceneProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ projects, onProjectClick }) => {
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(0, 0, 50));
  
  // Create a Hedera star at center
  const hederaStar: Project = {
    id: 'hedera',
    name: 'Hedera',
    description: 'The central Hedera network',
    link: 'https://hedera.com',
    image: '',
    x: 0,
    y: 0,
    z: 0
  };
  
  return (
    <div className="w-full h-screen">
      <Canvas>
        <PerspectiveCamera 
          makeDefault 
          position={[cameraPosition.x, cameraPosition.y, cameraPosition.z]} 
        />
        <CameraController onUpdatePosition={setCameraPosition} />
        
        {/* Ambient light for basic visibility */}
        <ambientLight intensity={0.2} />
        
        {/* Directional light to create some shadows and depth */}
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        
        {/* Background stars */}
        <BackgroundStars />
        
        {/* Hedera star (center) */}
        <ProjectStar 
          project={hederaStar} 
          onClick={() => onProjectClick(hederaStar)} 
          isHedera={true} 
        />
        
        {/* Project stars */}
        {projects.map((project) => (
          <ProjectStar 
            key={project.id} 
            project={project} 
            onClick={() => onProjectClick(project)} 
          />
        ))}
      </Canvas>
    </div>
  );
};

export default ThreeScene; 