import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
  directionalLight.position.set(100, 400, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 1000;
  directionalLight.shadow.camera.left = -600;
  directionalLight.shadow.camera.right = 600;
  directionalLight.shadow.camera.top = 600;
  directionalLight.shadow.camera.bottom = -600;
  scene.add(directionalLight);

  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888, 
    roughness: 0.7, 
    metalness: 0 
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), wallMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), wallMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 500;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  const wallHeight = 500;
  const wallHalfHeight = wallHeight / 2;

  const wallFront = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, wallHeight), 
    wallMaterial
  );
  wallFront.position.set(0, wallHalfHeight, -500);
  scene.add(wallFront);

  const wallBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, wallHeight), 
    wallMaterial
  );
  wallBack.rotation.y = Math.PI;
  wallBack.position.set(0, wallHalfHeight, 500);
  scene.add(wallBack);

  const wallLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, wallHeight), 
    wallMaterial
  );
  wallLeft.rotation.y = Math.PI / 2;
  wallLeft.position.set(-500, wallHalfHeight, 0);
  scene.add(wallLeft);

  const wallRight = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, wallHeight), 
    wallMaterial
  );
  wallRight.rotation.y = -Math.PI / 2;
  wallRight.position.set(500, wallHalfHeight, 0);
  scene.add(wallRight);

  return scene;
}