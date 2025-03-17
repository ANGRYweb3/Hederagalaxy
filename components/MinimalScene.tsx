'use client';

import React, { useRef, useEffect, useState, useCallback, Suspense, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Project } from '../lib/supabase';
import * as THREE from 'three';

// กำหนดค่าสูงสุดในการซูมออก (ระยะห่างสูงสุดจากจุดศูนย์กลาง)
const MAX_ZOOM_DISTANCE = 200;

// กำหนด type สำหรับ keysPressed
interface KeysPressed {
  [key: string]: boolean;
}

// สร้าง context สำหรับเก็บ texture
interface TextureContextType {
  hederaTexture: THREE.Texture | null;
}

const TextureContext = createContext<TextureContextType>({ hederaTexture: null });

// โหลด texture สำหรับดาว Hedera
const hederaTexturePath = '/hbar.png';

// Component ที่รอการโหลด texture และเก็บไว้ใน context
const TexturePreloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hederaTexture, setHederaTexture] = useState<THREE.Texture | null>(null);
  const texture = useLoader(THREE.TextureLoader, hederaTexturePath);
  
  useEffect(() => {
    if (texture && !hederaTexture) {
      console.log('Global texture loaded with useLoader');
      // ตั้งค่า texture
      texture.needsUpdate = true;
      texture.anisotropy = 16;
      
      // ทดลองเซ็ต sRGB
      try {
        (texture as any).colorSpace = THREE.SRGBColorSpace;
      } catch (e) {
        try {
          (texture as any).encoding = THREE.sRGBEncoding;
        } catch (err) {
          console.warn('Could not set texture encoding', err);
        }
      }
      
      setHederaTexture(texture);
    }
  }, [texture, hederaTexture]);
  
  return (
    <TextureContext.Provider value={{ hederaTexture }}>
      {children}
    </TextureContext.Provider>
  );
};

// Hook สำหรับการใช้งาน texture จาก context
const useHederaTexture = () => {
  return useContext(TextureContext).hederaTexture;
};

// Component for a star representing a project
const ProjectStar: React.FC<{ 
  project: Project; 
  onClick: () => void;
  isHedera?: boolean;
}> = ({ project, onClick, isHedera = false }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  // ใช้ texture จาก context
  const hederaTexture = useHederaTexture();
  
  // สุ่มสีสำหรับออร่านีออน
  const [glowColor] = useState(() => {
    if (isHedera) return '#00ff7f'; // Hedera ใช้สีเขียวนีออน
    
    // สุ่มสีนีออนสำหรับดาวอื่นๆ
    const neonColors = [
      '#ff00ff', // สีชมพูนีออน
      '#00ffff', // สีฟ้านีออน
      '#ffff00', // สีเหลืองนีออน
      '#ff0088', // สีชมพูเข้ม
      '#00ff88', // สีเขียวฟ้า
      '#8800ff', // สีม่วง
      '#ff8800'  // สีส้ม
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
  });
  
  // เพิ่มขนาดของดาว Hedera ให้ใหญ่ขึ้น
  const size = isHedera ? 6 : 1;
  const color = isHedera ? '#00ff7f' : (hovered ? '#ff9000' : '#ffffff');

  // ทำให้ดาวหมุนรอบตัวเอง
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += isHedera ? 0.001 : 0.002; // ดาว Hedera หมุนช้ากว่าเล็กน้อย
    }
  });
  
  return (
    <group>
      {/* ออร่านีออนรอบดาว */}
      <pointLight 
        distance={isHedera ? 25 : 10} 
        intensity={isHedera ? 0.5 : 0.8}
        color={glowColor}
        position={[project.x, project.y, project.z]}
      />
      
      {/* ดาวตัวหลัก */}
      <mesh
        ref={mesh}
        position={[project.x, project.y, project.z]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 64, 64]} />
        {isHedera ? (
          <meshStandardMaterial 
            map={hederaTexture}
            transparent={true}
            color={hederaTexture ? '#ffffff' : '#00ff7f'}
            emissive={glowColor}
            emissiveIntensity={hederaTexture ? 0.1 : 0.8}
          />
        ) : (
          // ดาวอื่นๆ
          <meshStandardMaterial 
            color={color} 
            emissive={glowColor} 
            emissiveIntensity={hovered ? 1 : 0.7} 
          />
        )}
      </mesh>
      
      {/* เอฟเฟกต์ออร่าเพิ่มเติม - ใช้ sphere ที่ใหญ่กว่าและโปร่งใส */}
      <mesh position={[project.x, project.y, project.z]}>
        <sphereGeometry args={[size * 1.3, 32, 32]} />
        <meshBasicMaterial 
          color={glowColor} 
          transparent={true} 
          opacity={0.05} // ลดความทึบลงเพื่อให้เห็น texture ชัดขึ้น
        />
      </mesh>
    </group>
  );
};

// Component สำหรับกาแล็กซี่ที่หมุนโดยรวม
const RotatingGalaxy: React.FC<{
  projects: Project[];
  onProjectClick: (project: Project) => void;
  hederaStar: Project;
  pauseRotation: boolean;
}> = ({ projects, onProjectClick, hederaStar, pauseRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // ทำให้กาแล็กซี่หมุนรอบแกน Y แต่จะหยุดเมื่อผู้ใช้กำลังเคลื่อนที่
  useFrame(() => {
    if (groupRef.current && !pauseRotation) {
      groupRef.current.rotation.y += 0.001; // ปรับความเร็วการหมุนตรงนี้
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Hedera star (center) - ไม่หมุนตามกาแล็กซี่เพราะอยู่ตรงกลาง */}
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
    </group>
  );
};

// Custom camera component instead of using PerspectiveCamera from drei
const Camera: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  const { set, size } = useThree((state) => state);
  const camera = useRef<THREE.PerspectiveCamera>(null);

  useEffect(() => {
    if (camera.current) {
      camera.current.aspect = size.width / size.height;
      camera.current.updateProjectionMatrix();
      set({ camera: camera.current });
    }
  }, [size, set]);

  return (
    <perspectiveCamera
      ref={camera}
      position={position}
      fov={75}
      near={0.1}
      far={1000}
    />
  );
};

// Custom Orbit Controls implementation (instead of using drei)
const CustomOrbitControls: React.FC<{
  onControlsChange: () => void;
  isWASDActive: boolean;
}> = ({ onControlsChange, isWASDActive }) => {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousTouch = useRef<{ x: number; y: number } | null>(null);
  const rotationSpeed = 0.005;
  const zoomSpeed = 0.1;
  const panSpeed = 0.5;
  
  useEffect(() => {
    const canvas = gl.domElement;

    // Mouse events for rotation
    const handleMouseDown = (e: MouseEvent) => {
      // ถ้ากำลังใช้ WASD อยู่ให้ไม่ทำงาน
      if (isWASDActive) return;
      
      if (e.button === 0) { // Left mouse button
        isDragging.current = true;
        onControlsChange();
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // ถ้ากำลังใช้ WASD อยู่ให้ไม่ทำงาน
      if (isWASDActive) return;
      
      if (!isDragging.current) return;
      
      // Rotate camera based on mouse movement
      camera.rotateY(-e.movementX * rotationSpeed);
      camera.rotateX(-e.movementY * rotationSpeed);
      
      // Keep the camera level
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(camera.quaternion);
      euler.z = 0;
      camera.quaternion.setFromEuler(euler);
    };
    
    // Mouse wheel for zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // ตรวจสอบทิศทางการซูม (deltaY > 0 คือซูมออก, deltaY < 0 คือซูมเข้า)
      const isZoomingOut = e.deltaY > 0;
      const currentDistance = camera.position.length();
      
      // ถ้ากำลังซูมออกและระยะห่างมากกว่าหรือเท่ากับค่าสูงสุดแล้ว ให้หยุดการซูม
      if (isZoomingOut && currentDistance >= MAX_ZOOM_DISTANCE) {
        return; // ไม่อนุญาตให้ซูมออกเพิ่ม
      }
      
      // คำนวณระยะทางที่จะเปลี่ยนแปลง
      const zoomDelta = camera.position.length() * zoomSpeed * (isZoomingOut ? 1 : -1);
      
      // คำนวณตำแหน่งกล้องใหม่
      const newPosition = camera.position.clone();
      const zoomDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
      newPosition.addScaledVector(zoomDirection, zoomDelta);
      
      // ตรวจสอบว่าการซูมออกจะทำให้เกินระยะสูงสุดหรือไม่
      if (isZoomingOut) {
        const newDistance = newPosition.length();
        if (newDistance > MAX_ZOOM_DISTANCE) {
          // ถ้าเกินระยะสูงสุด ให้ปรับตำแหน่งให้อยู่ที่ระยะสูงสุดพอดี
          const normalizedDirection = camera.position.clone().normalize();
          camera.position.copy(normalizedDirection.multiplyScalar(MAX_ZOOM_DISTANCE));
        } else {
          // ถ้าไม่เกิน ให้ใช้ตำแหน่งใหม่
          camera.position.copy(newPosition);
        }
      } else {
        // กรณีซูมเข้า ไม่มีข้อจำกัด
        camera.position.copy(newPosition);
      }
      
      onControlsChange();
    };
    
    // Panning with shift + mouse drag
    const handleMouseMoveWithShift = (e: MouseEvent) => {
      // ถ้ากำลังใช้ WASD อยู่ให้ไม่ทำงาน
      if (isWASDActive) return;
      
      if (!isDragging.current || !e.shiftKey) return;
      
      // Calculate pan amount based on mouse movement
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      
      // Pan camera
      camera.position.addScaledVector(right, -e.movementX * panSpeed * 0.05);
      camera.position.addScaledVector(up, e.movementY * panSpeed * 0.05);
      
      onControlsChange();
    };
    
    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      // ถ้ากำลังใช้ WASD อยู่ให้ไม่ทำงาน
      if (isWASDActive) return;
      
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousTouch.current = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        };
        onControlsChange();
      }
    };
    
    const handleTouchEnd = () => {
      isDragging.current = false;
      previousTouch.current = null;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // ถ้ากำลังใช้ WASD อยู่ให้ไม่ทำงาน
      if (isWASDActive) return;
      
      if (!isDragging.current || !previousTouch.current) return;
      
      const touch = e.touches[0];
      
      // Calculate movement
      const movementX = touch.clientX - previousTouch.current.x;
      const movementY = touch.clientY - previousTouch.current.y;
      
      // Update previous touch
      previousTouch.current = { 
        x: touch.clientX, 
        y: touch.clientY 
      };
      
      // Handle multi-touch for zooming
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        // TODO: Implement pinch zoom if needed
      } else {
        // Rotate camera based on touch movement
        camera.rotateY(-movementX * rotationSpeed);
        camera.rotateX(-movementY * rotationSpeed);
      }
      
      // Keep the camera level
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(camera.quaternion);
      euler.z = 0;
      camera.quaternion.setFromEuler(euler);
      
      onControlsChange();
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleMouseMoveWithShift);
    canvas.addEventListener('wheel', handleWheel);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove);
    
    // Clean up
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleMouseMoveWithShift);
      canvas.removeEventListener('wheel', handleWheel);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [camera, gl, onControlsChange, isWASDActive]);
  
  return null;
};

// Component for handling keyboard controls and camera reset
const KeyboardController: React.FC<{
  initialPosition: [number, number, number];
  onPositionChange: (position: THREE.Vector3) => void;
  onMovementChange: (isMoving: boolean) => void;
  onControlChange: () => void;
}> = ({ initialPosition, onPositionChange, onMovementChange, onControlChange }) => {
  const { camera } = useThree();
  const keysPressed = useRef<KeysPressed>({});
  const isMoving = useRef(false);

  // ฟังก์ชันรีเซ็ตกล้องกลับไปยังตำแหน่งเริ่มต้น
  const resetCamera = () => {
    // กำหนดตำแหน่งกล้องให้กลับไปจุดเริ่มต้น
    camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
    
    // หันกล้องกลับไปมองที่จุดศูนย์กลาง
    camera.lookAt(0, 0, 0);
    
    // อัพเดทค่าสถานะ
    onPositionChange(camera.position);
    
    // แจ้งว่ามีการเปลี่ยนแปลงคอนโทรล
    onControlChange();
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // เก็บทั้ง key และ keyCode/code เพื่อให้ทำงานได้กับทุกภาษา
      keysPressed.current[e.key.toLowerCase()] = true;
      keysPressed.current[e.code.toLowerCase()] = true;
      
      // ตรวจสอบการกด Space bar เพื่อรีเซ็ตกล้อง
      if (e.key === ' ' || e.code === 'Space') {
        resetCamera();
        return;
      }
      
      // ตรวจสอบว่ามีการกดปุ่มเคลื่อนที่หรือไม่ (รองรับทั้ง WASD และปุ่มลูกศร)
      const movementKeys = ['w', 'a', 's', 'd', 'keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
      const keyLower = e.key.toLowerCase();
      const codeLower = e.code.toLowerCase();
      
      if ((movementKeys.includes(keyLower) || movementKeys.includes(codeLower)) && !isMoving.current) {
        isMoving.current = true;
        onMovementChange(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // ลบทั้ง key และ keyCode/code
      keysPressed.current[e.key.toLowerCase()] = false;
      keysPressed.current[e.code.toLowerCase()] = false;
      
      // ตรวจสอบว่าปล่อยปุ่มเคลื่อนที่ทั้งหมดหรือไม่
      const movementKeys = ['w', 'a', 's', 'd', 'keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
      const keyLower = e.key.toLowerCase();
      const codeLower = e.code.toLowerCase();
      
      if (movementKeys.includes(keyLower) || movementKeys.includes(codeLower)) {
        // ตรวจสอบว่ายังมีปุ่มอื่นถูกกดอยู่หรือไม่
        const anyKeyPressed = movementKeys.some(key => keysPressed.current[key]);
        if (!anyKeyPressed && isMoving.current) {
          isMoving.current = false;
          onMovementChange(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera, onPositionChange, onMovementChange, onControlChange, initialPosition]);
  
  useFrame(() => {
    const moveSpeed = 1;
    const direction = new THREE.Vector3(0, 0, 0);
    
    // รองรับทั้ง key และ code (keyboard event) เพื่อทำงานกับทุกภาษา
    // WASD
    if (keysPressed.current['w'] || keysPressed.current['keyw'] || keysPressed.current['arrowup']) {
      direction.z -= moveSpeed;
    }
    if (keysPressed.current['s'] || keysPressed.current['keys'] || keysPressed.current['arrowdown']) {
      direction.z += moveSpeed;
    }
    if (keysPressed.current['a'] || keysPressed.current['keya'] || keysPressed.current['arrowleft']) {
      direction.x -= moveSpeed;
    }
    if (keysPressed.current['d'] || keysPressed.current['keyd'] || keysPressed.current['arrowright']) {
      direction.x += moveSpeed;
    }
    
    if (direction.length() > 0) {
      // ตรวจสอบการเคลื่อนที่ถอยหลัง (ซูมออก) ว่าจะเกินขีดจำกัดหรือไม่
      const movingDirection = direction.clone().applyQuaternion(camera.quaternion);
      const isMovingAway = movingDirection.z > 0;
      
      if (isMovingAway) {
        // ตรวจสอบระยะห่างหลังการเคลื่อนที่
        const newPosition = camera.position.clone().add(movingDirection);
        const newDistance = newPosition.length();
        
        if (newDistance > MAX_ZOOM_DISTANCE) {
          // ถ้าเกินขีดจำกัด ให้ไม่เคลื่อนที่ในแนว z หรือปรับให้อยู่ในขีดจำกัด
          const currentDistance = camera.position.length();
          const remainingDistance = MAX_ZOOM_DISTANCE - currentDistance;
          
          if (remainingDistance <= 0) {
            // ถ้าอยู่ที่ขีดจำกัดแล้ว ให้เคลื่อนที่เฉพาะแนวระนาบ x-y
            movingDirection.z = 0;
            camera.position.add(movingDirection);
          } else {
            // ถ้ายังเคลื่อนที่ได้อีกนิดหน่อย ให้เคลื่อนที่เท่าที่เหลือ
            const ratio = remainingDistance / movingDirection.length();
            camera.position.add(movingDirection.multiplyScalar(ratio));
          }
        } else {
          // ถ้าไม่เกินขีดจำกัด ให้เคลื่อนที่ได้ตามปกติ
          camera.position.add(movingDirection);
        }
      } else {
        // ถ้าไม่ใช่การถอยหลัง ให้เคลื่อนที่ได้ตามปกติ
        direction.applyQuaternion(camera.quaternion);
        camera.position.add(direction);
      }
      
      onPositionChange(camera.position);
    }
  });
  
  return null;
};

// Create simple background stars manually
const BackgroundStars: React.FC = () => {
  const stars = useRef<THREE.Points>(null);
  const rotationSpeed = 0.0001; // ความเร็วการหมุนพื้นหลัง (ช้ากว่ากาแล็กซี่หลัก)
  
  useEffect(() => {
    if (stars.current) {
      const geometry = new THREE.BufferGeometry();
      const count = 3000;
      const positions = new Float32Array(count * 3);
      
      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 500; // ขยายขนาดให้ใหญ่ขึ้น
        positions[i + 1] = (Math.random() - 0.5) * 500;
        positions[i + 2] = (Math.random() - 0.5) * 500;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      if (stars.current) {
        stars.current.geometry = geometry;
      }
    }
  }, []);
  
  // ทำให้พื้นหลังหมุนเล็กน้อย
  useFrame(() => {
    if (stars.current) {
      stars.current.rotation.y += rotationSpeed;
      stars.current.rotation.x += rotationSpeed / 2;
    }
  });
  
  return (
    <points ref={stars}>
      <bufferGeometry />
      <pointsMaterial size={0.5} color="#ffffff" sizeAttenuation />
    </points>
  );
};

// Main component for the 3D scene
interface MinimalSceneProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  showUI?: boolean; // เพิ่ม prop เพื่อควบคุมการแสดง UI
}

const MinimalScene: React.FC<MinimalSceneProps> = ({ 
  projects, 
  onProjectClick,
  showUI = false // ค่าเริ่มต้นเป็น false เพื่อไม่แสดง UI โดยอัตโนมัติ 
}) => {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 50]);
  const initialCameraPosition: [number, number, number] = [0, 0, 50]; // ตำแหน่งกล้องเริ่มต้น
  const [isUserMoving, setIsUserMoving] = useState(false);
  const [isOrbitControlActive, setIsOrbitControlActive] = useState(false);
  const [controlMode, setControlMode] = useState<'mouse' | 'keyboard'>('mouse');
  
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
  
  const handleCameraUpdate = (position: THREE.Vector3) => {
    setCameraPosition([position.x, position.y, position.z]);
  };
  
  const handleMovementChange = (isMoving: boolean) => {
    setIsUserMoving(isMoving);
    
    // ถ้ามีการใช้ WASD ให้เปลี่ยนโหมดเป็น keyboard
    if (isMoving) {
      setControlMode('keyboard');
    } else {
      // หลังจากหยุดเคลื่อนที่ 1 วินาที ให้กลับไปใช้เมาส์ได้
      setTimeout(() => setControlMode('mouse'), 1000);
    }
  };
  
  const handleControlsChange = () => {
    // เมื่อมีการใช้งาน CustomOrbitControls ให้หยุดการหมุนอัตโนมัติของกาแล็กซี่
    setIsOrbitControlActive(true);
    // เปลี่ยนโหมดเป็น mouse
    setControlMode('mouse');
    // รีเซ็ตสถานะเมื่อไม่มีการเคลื่อนไหวเป็นเวลา 2 วินาที
    setTimeout(() => setIsOrbitControlActive(false), 2000);
  };
  
  return (
    <div className="w-full h-screen relative">
      <Canvas>
        <Suspense fallback={null}>
          <TexturePreloader>
            <Camera position={cameraPosition} />
            
            {/* ใช้ CustomOrbitControls แทน OrbitControls จาก drei */}
            <CustomOrbitControls 
              onControlsChange={handleControlsChange} 
              isWASDActive={controlMode === 'keyboard'}
            />
            
            {/* ใช้ KeyboardController แทน CameraController เดิม */}
            <KeyboardController 
              initialPosition={initialCameraPosition}
              onPositionChange={handleCameraUpdate}
              onMovementChange={handleMovementChange}
              onControlChange={handleControlsChange}
            />
            
            {/* Ambient light for basic visibility */}
            <ambientLight intensity={0.2} />
            
            {/* Directional light to create some shadows and depth */}
            <directionalLight position={[10, 10, 10]} intensity={0.5} />
            
            {/* Background stars */}
            <BackgroundStars />
            
            {/* Rotating Galaxy */}
            <RotatingGalaxy 
              projects={projects}
              onProjectClick={onProjectClick}
              hederaStar={hederaStar}
              pauseRotation={isUserMoving || isOrbitControlActive} // หยุดการหมุนเมื่อใช้ controls ใดๆ
            />
          </TexturePreloader>
        </Suspense>
      </Canvas>
      
      {/* UI Elements - แสดงเฉพาะเมื่อ showUI เป็น true เท่านั้น */}
      {showUI && (
        <div id="galaxy-controls" className="absolute bottom-4 left-4">
          <div className="bg-black bg-opacity-60 rounded p-2 text-white text-opacity-90">
            <p className="text-sm">Use W, A, S, D or arrows to navigate | Mouse wheel to zoom | Drag to rotate</p>
            <p className="text-sm mt-1">Press Space bar to reset to center</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalScene; 