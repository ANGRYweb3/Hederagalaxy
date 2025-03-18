'use client';

import React, { useRef, useEffect, useState, useCallback, Suspense, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Project } from '../lib/supabase';
import * as THREE from 'three';

// กำหนดค่าสูงสุดในการซูมออก (ระยะห่างสูงสุดจากจุดศูนย์กลาง)
const MAX_ZOOM_DISTANCE = 350;

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
  // ใช้ texture จาก context สำหรับดาว Hedera
  const hederaTexture = useHederaTexture();
  // เตรียม texture loader สำหรับดาวอื่นๆ
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [textureLoading, setTextureLoading] = useState(false);
  
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
  
  // โหลด texture จากรูปภาพของ project (ถ้ามี)
  useEffect(() => {
    if (!isHedera && project.image && !textureLoading && !texture) {
      setTextureLoading(true);
      
      // ตรวจสอบว่ารูปภาพเป็น base64 หรือ URL
      if (project.image.startsWith('data:image')) {
        // สร้าง texture จาก base64
        const loader = new THREE.TextureLoader();
        const newTexture = loader.load(project.image, (loadedTexture) => {
          try {
            (loadedTexture as any).colorSpace = THREE.SRGBColorSpace;
          } catch (e) {
            try {
              (loadedTexture as any).encoding = THREE.sRGBEncoding;
            } catch (err) {
              console.warn('Could not set texture encoding', err);
            }
          }
          loadedTexture.anisotropy = 16;
          setTexture(loadedTexture);
          setTextureLoading(false);
        }, undefined, () => {
          console.error('Error loading texture from base64');
          setTextureLoading(false);
        });
      } else {
        // โหลดจาก URL
        const loader = new THREE.TextureLoader();
        const newTexture = loader.load(project.image, (loadedTexture) => {
          try {
            (loadedTexture as any).colorSpace = THREE.SRGBColorSpace;
          } catch (e) {
            try {
              (loadedTexture as any).encoding = THREE.sRGBEncoding;
            } catch (err) {
              console.warn('Could not set texture encoding', err);
            }
          }
          loadedTexture.anisotropy = 16;
          setTexture(loadedTexture);
          setTextureLoading(false);
        }, undefined, () => {
          console.error('Error loading texture from URL');
          setTextureLoading(false);
        });
      }
    }
  }, [isHedera, project.image, texture, textureLoading]);
  
  // เพิ่มขนาดของดาว Hedera ให้ใหญ่ขึ้น
  const size = isHedera ? 15 : 5;
  const color = isHedera ? '#00ff7f' : (hovered ? '#ff9000' : '#ffffff');

  // ทำให้ดาวหมุนรอบตัวเอง
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += isHedera ? 0.001 : 0.002; // ดาว Hedera หมุนช้ากว่าเล็กน้อย
    }
  });
  
  return (
    <group>
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
            emissive="#00ff7f"
            emissiveIntensity={0.5}
          />
        ) : texture ? (
          // ดาวอื่นๆ ที่มี texture
          <meshStandardMaterial 
            map={texture}
            transparent={true}
            emissiveIntensity={0}
          />
        ) : (
          // ดาวอื่นๆ ที่ไม่มี texture
          <meshStandardMaterial 
            color="#ffffff"
            emissiveIntensity={0} 
          />
        )}
      </mesh>
      
      {/* แสงสว่างสำหรับดาว Hedera */}
      {isHedera && (
        <pointLight
          position={[project.x, project.y, project.z]}
          distance={30}
          intensity={1}
          color="#00ff7f"
        />
      )}
      
      {/* วงแหวนนีออนเฉพาะสำหรับดาว Hedera */}
      {isHedera && (
        <>
          <mesh 
            position={[project.x, project.y, project.z]}
            rotation={[Math.PI / 4, 0, 0]}
          >
            <torusGeometry args={[size * 1.5, 0.5, 16, 100]} />
            <meshBasicMaterial color="#00ff7f" transparent={true} opacity={0.7} />
          </mesh>
          <mesh 
            position={[project.x, project.y, project.z]}
            rotation={[0, Math.PI / 4, Math.PI / 2]}
          >
            <torusGeometry args={[size * 1.2, 0.3, 16, 100]} />
            <meshBasicMaterial color="#00ff7f" transparent={true} opacity={0.5} />
          </mesh>
        </>
      )}
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

// Component สำหรับสร้างดาวพื้นหลัง
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

// Component สำหรับการควบคุมด้วยคีย์บอร์ด
const KeyboardController: React.FC<{
  initialPosition: [number, number, number];
  onPositionChange: (position: THREE.Vector3) => void;
  onMovementChange: (isMoving: boolean) => void;
  onControlChange: () => void;
  isFormOpen: boolean;
}> = ({ initialPosition, onPositionChange, onMovementChange, onControlChange, isFormOpen }) => {
  const { camera } = useThree();
  const keysPressed = useRef<KeysPressed>({});
  const moveRef = useRef(false);
  
  useEffect(() => {
    // ถ้าฟอร์มเปิดอยู่ ให้เคลียร์ปุ่มที่กดทั้งหมด
    if (isFormOpen) {
      keysPressed.current = {};
      moveRef.current = false;
      onMovementChange(false);
    }
  }, [isFormOpen, onMovementChange]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ไม่รับ keyboard event ถ้าฟอร์มกำลังเปิดอยู่
      if (isFormOpen) return;
      
      // ไม่รับ keyboard event ถ้ากำลังพิมพ์ข้อความอยู่ในกล่องข้อความหรือ textarea
      if (
        document.activeElement instanceof HTMLInputElement || 
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      // เก็บทั้ง key และ keyCode/code เพื่อให้ทำงานได้กับทุกภาษา
      keysPressed.current[e.key.toLowerCase()] = true;
      keysPressed.current[e.code.toLowerCase()] = true;
      
      // ตรวจสอบการกด Space bar เพื่อรีเซ็ตกล้อง
      if (e.key === ' ' || e.code === 'Space') {
        camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
        camera.lookAt(0, 0, 0);
        onPositionChange(camera.position);
        onControlChange();
        return;
      }
      
      // ตรวจสอบว่ามีการกดปุ่มเคลื่อนที่หรือไม่ (รองรับทั้ง WASD และปุ่มลูกศร)
      const movementKeys = ['w', 'a', 's', 'd', 'keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
      const keyLower = e.key.toLowerCase();
      const codeLower = e.code.toLowerCase();
      
      if ((movementKeys.includes(keyLower) || movementKeys.includes(codeLower)) && !moveRef.current) {
        moveRef.current = true;
        onMovementChange(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // ไม่รับ keyboard event ถ้าฟอร์มกำลังเปิดอยู่
      if (isFormOpen) return;
      
      // ลบทั้ง key และ keyCode/code
      keysPressed.current[e.key.toLowerCase()] = false;
      keysPressed.current[e.code.toLowerCase()] = false;
      
      // ตรวจสอบว่าปล่อยปุ่มเคลื่อนที่ทั้งหมดหรือไม่
      const movementKeys = ['w', 'a', 's', 'd', 'keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
      
      // ตรวจสอบว่ายังมีปุ่มอื่นถูกกดอยู่หรือไม่
      const anyKeyPressed = movementKeys.some(key => keysPressed.current[key]);
      if (!anyKeyPressed && moveRef.current) {
        moveRef.current = false;
        onMovementChange(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera, onPositionChange, onMovementChange, onControlChange, initialPosition, isFormOpen]);
  
  useFrame(() => {
    // ถ้าฟอร์มเปิดอยู่ ไม่ต้องทำอะไร
    if (isFormOpen) return;
    
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
      // แปลงทิศทางการเคลื่อนที่ให้เข้ากับมุมกล้อง
      const movingDirection = direction.clone().applyQuaternion(camera.quaternion);
      
      // คำนวณตำแหน่งใหม่หลังการเคลื่อนที่
      const newPosition = camera.position.clone().add(movingDirection);
      
      // ตรวจสอบระยะห่างหลังการเคลื่อนที่
      const newDistance = newPosition.length();
      
      // ถ้าระยะห่างใหม่เกิน MAX_ZOOM_DISTANCE แสดงว่ากำลังเคลื่อนที่ออกนอกขอบเขต
      if (newDistance > MAX_ZOOM_DISTANCE) {
        // ปรับตำแหน่งให้อยู่บนเส้นขอบของขอบเขตที่กำหนด
        const direction = newPosition.clone().normalize();
        camera.position.copy(direction.multiplyScalar(MAX_ZOOM_DISTANCE));
      } else {
        // ถ้าไม่เกินขีดจำกัด ให้เคลื่อนที่ได้ตามปกติ
        camera.position.add(movingDirection);
      }
      
      onPositionChange(camera.position);
    }
  });
  
  return null;
};

// Custom Orbit Controls implementation (instead of using drei)
const CustomOrbitControls: React.FC<{
  onControlsChange: () => void;
  isWASDActive: boolean;
  enabled: boolean;
  onFollowModeChange?: (isFollowing: boolean) => void;
}> = ({ onControlsChange, isWASDActive, enabled, onFollowModeChange }) => {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousTouch = useRef<{ x: number; y: number } | null>(null);
  const rotationSpeed = 0.005;
  const zoomSpeed = 0.1;
  const panSpeed = 0.5;
  const [followMouse, setFollowMouse] = useState(false); // เพิ่ม state สำหรับติดตามโหมด follow mouse
  
  // แจ้งการเปลี่ยนแปลงโหมด follow mouse กลับไปยัง parent component
  useEffect(() => {
    if (onFollowModeChange) {
      onFollowModeChange(followMouse);
    }
  }, [followMouse, onFollowModeChange]);
  
  useEffect(() => {
    const canvas = gl.domElement;

    // Mouse events for rotation
    const handleMouseDown = (e: MouseEvent) => {
      // ถ้า enabled เป็น false ให้ไม่ทำงาน (แต่ไม่ตรวจสอบ isWASDActive แล้ว)
      if (!enabled) return;

      if (e.button === 0) { // Left mouse button
        if (followMouse) {
          // ถ้ากำลังอยู่ในโหมด follow mouse อยู่แล้ว การคลิกจะเป็นการปิดโหมดนี้
          setFollowMouse(false);
        } else {
          // ถ้ายังไม่ได้อยู่ในโหมด follow mouse ให้เปิดโหมดนี้
          setFollowMouse(true);
          onControlsChange();
        }
      }
    };
    
    const handleMouseUp = () => {
      // ไม่ต้องปิด followMouse แล้วเพราะจะปิดเมื่อมีการคลิกซ้ำเท่านั้น
      isDragging.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // ถ้า enabled เป็น false ให้ไม่ทำงาน (แต่ไม่ตรวจสอบ isWASDActive แล้ว)
      if (!enabled) return;
      
      // ตรวจสอบว่าอยู่ในโหมด follow mouse หรือกำลังลากเมาส์อยู่
      if (followMouse || isDragging.current) {
        // Rotate camera based on mouse movement
        camera.rotateY(-e.movementX * rotationSpeed);
        camera.rotateX(-e.movementY * rotationSpeed);
        
        // Keep the camera level
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        euler.z = 0;
        camera.quaternion.setFromEuler(euler);
      }
    };
    
    // Right click + drag for panning
    const handleMouseMoveWithShift = (e: MouseEvent) => {
      // ถ้า enabled เป็น false ให้ไม่ทำงาน (แต่ไม่ตรวจสอบ isWASDActive แล้ว)
      if (!enabled) return;
      
      if (e.buttons !== 2) return; // Only right mouse button
      
      // Pan camera based on mouse movement
      const panSpeed = 0.1;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      
      // Extract right and up vectors from camera matrix
      camera.matrix.extractBasis(right, up, new THREE.Vector3());
      
      // Calculate pan direction
      right.multiplyScalar(-e.movementX * panSpeed);
      up.multiplyScalar(e.movementY * panSpeed);
      
      // Apply pan
      camera.position.add(right);
      camera.position.add(up);
      
      onControlsChange();
    };
    
    // Mouse wheel for zoom
    const handleWheel = (e: WheelEvent) => {
      // ถ้า enabled เป็น false ให้ไม่ทำงาน (แต่ไม่ตรวจสอบ isWASDActive แล้ว)
      if (!enabled) return;
      
      e.preventDefault();
      
      // ตรวจสอบทิศทางการซูม (deltaY > 0 คือซูมออก, deltaY < 0 คือซูมเข้า)
      const isZoomingOut = e.deltaY > 0;
      const currentDistance = camera.position.length();
      
      // ถ้ากำลังซูมออกและระยะห่างมากกว่าหรือเท่ากับค่าสูงสุดแล้ว ให้หยุดการซูม
      if (isZoomingOut && currentDistance >= MAX_ZOOM_DISTANCE) {
        return; // ไม่อนุญาตให้ซูมออกเพิ่ม
      }
      
      // คำนวณระยะทางที่จะเปลี่ยนแปลง
      const zoomSpeed = 0.05;
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
    
    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      // ถ้า enabled เป็น false ให้ไม่ทำงาน (แต่ไม่ตรวจสอบ isWASDActive แล้ว)
      if (!enabled) return;
      
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
      // ถ้า enabled เป็น false ให้ไม่ทำงาน (แต่ไม่ตรวจสอบ isWASDActive แล้ว)
      if (!enabled) return;
      
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
  }, [camera, gl, onControlsChange, enabled]);
  
  return null;
};

// Main component for the 3D scene
interface MinimalSceneProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  showUI?: boolean; // เพิ่ม prop เพื่อควบคุมการแสดง UI
  hederaStar: Project; // เพิ่ม prop สำหรับดาว Hedera
  isFormOpen?: boolean; // เพิ่ม prop เพื่อรับสถานะว่าฟอร์มเปิดอยู่หรือไม่
}

const MinimalScene: React.FC<MinimalSceneProps> = ({ 
  projects, 
  onProjectClick,
  showUI = false, // ค่าเริ่มต้นเป็น false เพื่อไม่แสดง UI โดยอัตโนมัติ
  hederaStar,
  isFormOpen = false // ค่าเริ่มต้นเป็น false
}) => {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 50]);
  const initialCameraPosition: [number, number, number] = [0, 0, 50]; // ตำแหน่งกล้องเริ่มต้น
  const [isUserMoving, setIsUserMoving] = useState(false);
  const [isOrbitControlActive, setIsOrbitControlActive] = useState(false);
  const [controlMode, setControlMode] = useState<'mouse' | 'keyboard'>('mouse');
  const [isFollowingMouse, setIsFollowingMouse] = useState(false);
  
  const handleCameraUpdate = (position: THREE.Vector3) => {
    setCameraPosition([position.x, position.y, position.z]);
  };
  
  const handleMovementChange = (isMoving: boolean) => {
    setIsUserMoving(isMoving);
    
    // ไม่ต้องเปลี่ยนโหมดเมื่อใช้งาน WASD แล้ว เพื่อให้ใช้เมาส์ได้พร้อมกัน
    // เอาออกเพื่อให้ใช้ WASD และเมาส์พร้อมกันได้
    /* 
    if (isMoving) {
      setControlMode('keyboard');
    } else {
      // หลังจากหยุดเคลื่อนที่ 1 วินาที ให้กลับไปใช้เมาส์ได้
      setTimeout(() => setControlMode('mouse'), 1000);
    }
    */
  };
  
  const handleControlsChange = () => {
    // เมื่อมีการใช้งาน CustomOrbitControls ให้หยุดการหมุนอัตโนมัติของกาแล็กซี่
    setIsOrbitControlActive(true);
    // เปลี่ยนโหมดเป็น mouse
    setControlMode('mouse');
    // รีเซ็ตสถานะเมื่อไม่มีการเคลื่อนไหวเป็นเวลา 2 วินาที
    setTimeout(() => setIsOrbitControlActive(false), 2000);
  };
  
  const handleFollowModeChange = (isFollowing: boolean) => {
    setIsFollowingMouse(isFollowing);
  };
  
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: cameraPosition }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} />
        
        <TexturePreloader>
          <Suspense fallback={null}>
            <RotatingGalaxy
              projects={projects}
              onProjectClick={onProjectClick}
              hederaStar={hederaStar}
              pauseRotation={false} // ไม่ต้องหยุดการหมุนของกาแล็กซี่ไม่ว่าจะอยู่ในโหมดไหน
            />
          </Suspense>
        </TexturePreloader>
        
        <BackgroundStars />
        
        <CustomOrbitControls
          onControlsChange={handleControlsChange}
          isWASDActive={false} // ปรับเป็น false เสมอเพื่อให้สามารถใช้เมาส์ได้ตลอดเวลา
          enabled={!isFormOpen}
          onFollowModeChange={handleFollowModeChange}
        />
        
        <Camera position={cameraPosition} />
        
        <KeyboardController
          initialPosition={cameraPosition}
          onPositionChange={handleCameraUpdate}
          onMovementChange={handleMovementChange}
          onControlChange={handleControlsChange}
          isFormOpen={isFormOpen}
        />
      </Canvas>
      
      {showUI && (
        <div className="absolute bottom-4 left-4 text-white text-opacity-70 text-sm">
          <p>WASD: Move | Click + Mouse: Rotate | Right Click: Pan | Scroll: Zoom | Space: Return to center</p>
          {isFollowingMouse && (
            <p className="text-green-400">Mouse Follow Mode: Enabled (Click to disable) - Mouse will automatically rotate view</p>
          )}
          {!isFollowingMouse && (
            <p>Mouse Follow Mode: Disabled (Click to enable) - Hold mouse button to rotate view</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MinimalScene; 