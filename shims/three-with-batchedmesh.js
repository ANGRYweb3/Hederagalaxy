// Shim for adding BatchedMesh to THREE
import * as THREE from 'three';

// Add BatchedMesh class if it doesn't exist
if (!THREE.BatchedMesh) {
  THREE.BatchedMesh = class BatchedMesh {
    constructor() {
      console.warn('BatchedMesh is not available in this version of three.js. Using a placeholder.');
    }
  };
}

export default THREE; 