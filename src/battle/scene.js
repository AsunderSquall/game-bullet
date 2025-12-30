import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  // Remove the flat background color to allow for 3D background elements
  // scene.background = new THREE.Color(0x222222);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Add main directional light (sun-like) - will be animated
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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

  // Add additional lights for better atmosphere - will be animated
  const backLight = new THREE.DirectionalLight(0x4444ff, 0.3);
  backLight.position.set(-200, -100, -300);
  scene.add(backLight);

  // Add a third light for more dynamic lighting
  const sideLight = new THREE.DirectionalLight(0xffaa44, 0.3);
  sideLight.position.set(300, 200, 0);
  scene.add(sideLight);

  // Store lights in the scene for animation
  scene.userData = {
    lights: {
      main: directionalLight,
      back: backLight,
      side: sideLight
    }
  };

  // Create background image (farthest back)
  createBackgroundImage(scene);

  // Create starfield background (in front of background image)
  createStarfield(scene);

  // Create distant environment (distant stars, planets, etc.)
  createDistantEnvironment(scene);

  // Create mid-ground elements
  createMidgroundElements(scene);

  // Create floor with more interesting material
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x445566,
    roughness: 0.8,
    metalness: 0.2,
    wireframe: false
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);


  // Add a subtle floor grid for reference
  const gridHelper = new THREE.GridHelper(1000, 20, 0x444466, 0x222244);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  return scene;
}

// Function to create a spherical starfield in the background
function createStarfield(scene) {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    transparent: true,
    opacity: 0.8
  });

  // Create stars in a spherical distribution around the player
  const starVertices = [];
  const radius = 1500; // Radius of the star sphere
  const starCount = 5000;

  for (let i = 0; i < starCount; i++) {
    // Use spherical coordinates to distribute stars evenly on a sphere
    const theta = Math.random() * Math.PI * 2; // 0 to 2π
    const phi = Math.acos(2 * Math.random() - 1); // 0 to π, uniform distribution
    const r = radius;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Store star data for dynamic updates
  stars.userData = {
    starCount: starCount,
    radius: radius,
    positions: starVertices
  };
}

// Function to create a background image using a panoramic texture
function createBackgroundImage(scene) {
  // Create a background using a panoramic image
  // You'll need to place your panoramic image in the assets folder
  const textureLoader = new THREE.TextureLoader();

  // Create a large sphere geometry for the background image (inverted normals so we see inside)
  const bgGeometry = new THREE.SphereGeometry(2000, 64, 64); // Larger than starfield
  bgGeometry.scale(-1, 1, 1); // Invert the sphere so we see inside

  // Create a basic material with a placeholder color
  const bgMaterial = new THREE.MeshBasicMaterial({
    color: 0x111122, // Dark blue as fallback
    side: THREE.BackSide, // Render only the inside of the sphere
    transparent: true,
    opacity: 0.7,
    depthWrite: false // Don't write to depth buffer to ensure it's always in the back
  });

  const background = new THREE.Mesh(bgGeometry, bgMaterial);
  background.renderOrder = -1; // Render first, behind everything else
  scene.add(background);

  // Load the background image from the specified location
  textureLoader.load('picture/background_battle.png', (texture) => {
    // Ensure texture is properly configured for background use
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Create new material with the loaded texture
    const texturedMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide, // Render only the inside of the sphere
      transparent: true,
      opacity: 0.7,
      depthWrite: false // Don't write to depth buffer
    });

    // Update the existing background mesh with the new material
    background.material = texturedMaterial;
    console.log('Background image loaded successfully');
  }, (progress) => {
    console.log('Background image loading progress:', progress);
  }, (err) => {
    console.warn('Could not load background image, using fallback color:', err);
    // Keep the fallback colored background if image fails to load
  });
}

// Function to create distant environment (spherical arrangement)
function createDistantEnvironment(scene) {
  // Create distant stars/glowing points instead of cone objects
  const distantGeometry = new THREE.SphereGeometry(1, 8, 8);
  const distantMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffaa,
    transparent: true,
    opacity: 0.7
  });

  // Create several distant objects in a spherical pattern
  for (let i = 0; i < 50; i++) {
    const distantObj = new THREE.Mesh(distantGeometry, distantMaterial);

    // Position them in a spherical pattern around the player
    const theta = Math.random() * Math.PI * 2; // 0 to 2π
    const phi = Math.acos(2 * Math.random() - 1); // 0 to π, uniform distribution
    const r = 1000; // Distance from center

    distantObj.position.x = r * Math.sin(phi) * Math.cos(theta);
    distantObj.position.y = r * Math.sin(phi) * Math.sin(theta);
    distantObj.position.z = r * Math.cos(phi);

    // Randomize size
    const scale = 0.5 + Math.random() * 3;
    distantObj.scale.set(scale, scale, scale);

    scene.add(distantObj);
  }
}

// Function to create mid-ground elements that move at different speeds
function createMidgroundElements(scene) {
  // Create floating particles or debris
  const particleCount = 200;
  const particleGeometry = new THREE.BufferGeometry();
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x88aadd,
    size: 3,
    transparent: true,
    opacity: 0.6
  });

  const particleVertices = [];
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a volume in front of the player but behind the action
    const x = (Math.random() - 0.5) * 800;
    const y = (Math.random() - 0.5) * 400;
    const z = -200 - Math.random() * 300; // Between player and far distance
    particleVertices.push(x, y, z);
  }

  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particleVertices, 3));
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}