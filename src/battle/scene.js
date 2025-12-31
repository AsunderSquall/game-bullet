import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  // Remove the flat background color to allow for 3D background elements
  // scene.background = new THREE.Color(0x222222);

  // Add ambient light with a subtle reddish tint to complement the blood moon
  const ambientLight = new THREE.AmbientLight(0xffcccc, 0.5);
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

  // Create blood moon
  createBloodMoon(scene);

  // Create sky sphere (farthest back)
  createSkySphere(scene);

  // Create starfield background (in front of background image)
  createStarfield(scene);

  // Create distant environment (distant stars, planets, etc.)
  createDistantEnvironment(scene);

  // Create mid-ground elements
  createMidgroundElements(scene);


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

// Function to create a sky sphere background
function createSkySphere(scene) {
  // Create a sphere for the sky - not too large to avoid clipping issues
  const skyGeometry = new THREE.SphereGeometry(1100, 64, 64); // Smaller size to fit within view frustum

  // Load sky texture
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('picture/sky.jpg', (texture) => {
    // Configure texture for skybox use
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Create material with the loaded texture
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide, // Render only the inside of the sphere
      fog: false // Disable fog for the sky
    });

    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skySphere);

    // Ensure the sky renders first (behind everything else)
    skySphere.renderOrder = -1;

    // Store reference to sky for potential updates
    scene.userData.skySphere = skySphere;

    console.log('Sky texture loaded successfully');
  }, undefined, (err) => {
    console.warn('Could not load sky texture, using fallback color:', err);

    // Fallback: Create a dark material for the sky (not affected by scene lighting)
    const fallbackMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e, // Dark blue-purple color
      side: THREE.BackSide, // Render only the inside of the sphere
      fog: false // Disable fog for the sky
    });

    const skySphere = new THREE.Mesh(skyGeometry, fallbackMaterial);
    scene.add(skySphere);

    // Ensure the sky renders first (behind everything else)
    skySphere.renderOrder = -1;

    // Store reference to sky for potential updates
    scene.userData.skySphere = skySphere;
  });
}

// Function to create a blood moon
function createBloodMoon(scene) {
  // Create moon geometry
  const moonGeometry = new THREE.SphereGeometry(50, 32, 32);

  // Load a texture for the blood moon
  const textureLoader = new THREE.TextureLoader();
  const moonTexture = textureLoader.load('picture/bloodmoon.png'); // Using existing background image

  // Create a material for the blood moon with texture
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture, // Apply the texture
    color: 0xff3300, // Tint the texture with red color
    emissive: 0xff3300, // Make it emit red light
    emissiveIntensity: 0.5,
    roughness: 0.8,
    metalness: 0.2
  });

  const moon = new THREE.Mesh(moonGeometry, moonMaterial);

  // Position the moon in the side-front of the scene (not behind the player)
  moon.position.set(-200, 150, -100); // Position it to the left-front side of the player

  scene.add(moon);

  // Store reference to moon for animation updates
  scene.userData.bloodMoon = moon;

  // Add a point light to simulate the moon's glow affecting the scene
  const moonLight = new THREE.PointLight(0xff4400, 0.7, 1500); // Reddish light with medium intensity
  moonLight.position.copy(moon.position);
  scene.add(moonLight);

  // Store reference to moon light
  scene.userData.moonLight = moonLight;
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