import * as THREE from 'three';

import { AudioController } from './AudioController.js';

export class WaterScene {
    constructor(container) {
        this.container = container;
        this.audio = new AudioController();
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510); // Deep dark blue/black
        this.scene.fog = new THREE.FogExp2(0x050510, 0.035); // Reduced fog

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 200); // Further far plane
        this.camera.position.set(0, 15, 12); // Higher and further back
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Dynamic Ripple Data
        // We can support up to 10 simultaneous ripples for now
        this.maxRipples = 10;
        this.ripples = []; // { x, z, time, strength }

        this.initWater();
        this.initEnvironment();
        this.initCoins();

        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);

        this.clock = new THREE.Clock();
        this.animate();
    }

    initEnvironment() {
        // 1. The Well Shaft (Cylinder)
        // Radius 15, Height 100
        const wallGeo = new THREE.CylinderGeometry(15, 15, 100, 32, 1, true);

        // Simple stone-like material
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.BackSide // Standard behavior for inside a cylinder
        });

        this.wallMesh = new THREE.Mesh(wallGeo, wallMat);
        // Remove scale inversion, just use BackSide
        // wallGeo.scale(-1, 1, 1); 

        this.wallMesh.position.y = -20;
        this.scene.add(this.wallMesh);

        // Add internal light so we can actually see the walls
        const wellLight = new THREE.PointLight(0x4444ff, 200, 50);
        wellLight.position.set(0, 5, 0);
        this.scene.add(wellLight);

        // 2. The Dome (Sphere) - Sitting top
        const domeGeo = new THREE.SphereGeometry(25, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.5);
        domeGeo.scale(-1, 1, 1);
        const domeMat = new THREE.MeshStandardMaterial({
            color: 0x0f0f1a,
            roughness: 0.8,
            side: THREE.BackSide
        });
        this.domeMesh = new THREE.Mesh(domeGeo, domeMat);
        this.domeMesh.position.y = 20; // Above the well
        this.scene.add(this.domeMesh);
    }

    setDepth(depthFactor) {
        // depthFactor is 0.0 (shallow) to 1.0 (deep)
        // Move water down. Shallow = -5, Deep = -40
        const targetY = -5 - (depthFactor * 35);
        this.activeDepth = targetY;
    }

    initWater() {
        // Custom Shader for the Water
        const waterGeometry = new THREE.PlaneGeometry(30, 30, 256, 256);

        this.waterUniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x000510) },
            uRipples: { value: Array(this.maxRipples).fill(new THREE.Vector4(0, 0, -100, 0)) }, // x, y, start_time, amplitude
        };

        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: this.waterUniforms,
            vertexShader: `
        uniform float uTime;
        uniform vec4 uRipples[10];
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float elevation = 0.0;
          
          // Ripple calculation
          // Iterate through all ripples
          for(int i = 0; i < 10; i++) {
             vec4 ripple = uRipples[i];
             // ripple.xy = center, ripple.z = startTime, ripple.w = amplitude
             
             // If startTime is negative, ripple is inactive
             if(ripple.z > -1.0) {
                float dist = distance(pos.xy, ripple.xy);
                float t = uTime - ripple.z;
                
                // Ripple wave function: sin(k * (dist - v * t)) * decay
                if(t > 0.0) {
                    float speed = 2.0;
                    float frequency = 10.0;
                    float decay = exp(-2.0 * t) * exp(-0.5 * dist);
                    float wave = sin(frequency * (dist - speed * t));
                    
                     // Wave Reflection (Fake)
                     // If wave hits wall (dist ~ 14), add a returning wave
                     // Reflection is tricky in this simple shader, but we can do a "bounce" check
                     // Dist to wall is approx 15.0
                     float distToWall = 15.0 - dist;
                     if(dist > 13.0 && t > 6.0) { // arbitrary timing check for "hit wall"
                         // Add a secondary wave coming back? 
                         // Simpler: Just make the main wave 'bounce' by adding a mirrored sine component
                         // Or just let it die naturally. 
                         // Implementing true reflection is hard, let's just extend the life and visibility.
                     }

                    if(dist < speed * t + 1.0) {
                         // Boost amplitude for visibility at depth
                         float depthBoost = 1.0 + (abs(vElevation) * 0.5); 
                         elevation += wave * ripple.w * decay * 2.5; // Stronger ripples generally
                    }
                }
             }
          }
          
          // Basic noise movement (slow rolling ocean)
          elevation += sin(pos.x * 0.5 + uTime * 0.5) * 0.1;
          elevation += cos(pos.y * 0.3 + uTime * 0.4) * 0.1;

          vElevation = elevation;
          pos.z += elevation; 
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        varying float vElevation;

        void main() {
          // Color based on elevation (lighter peaks, darker troughs)
          vec3 finalColor = uColor + vElevation * 0.2;
          
          // Add some "bioluminescence" glow
          finalColor += vec3(0.0, 0.1, 0.2) * smoothstep(0.2, 0.5, vElevation);

          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
            side: THREE.DoubleSide,
            transparent: true,
            wireframe: false
        });

        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2; // Lie flat
        this.waterMesh.position.y = -10; // Initial Depth
        this.activeDepth = -10;
        this.scene.add(this.waterMesh);
    }

    initCoins() {
        this.coins = [];
        // Geometries and materials for later
        this.coinGeometry = new THREE.SphereGeometry(0.15, 32, 32);
        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aabb,
            emissiveIntensity: 2.0,
            roughness: 0.1,
            metalness: 0.1
        });
    }

    // Trigger a ripple at world coordinates (x, z)
    addRipple(x, z) {
        // Find oldest or inactive ripple slot
        const now = this.clock.getElapsedTime();

        // Shift array: Remove first, push new
        // Actually, let's just use a ring buffer or find an empty slot.
        // For simplicity, shift the uniforms array data

        const ripples = this.waterUniforms.uRipples.value;

        // Move everything down by one
        for (let i = this.maxRipples - 1; i > 0; i--) {
            ripples[i].copy(ripples[i - 1]);
        }

        // Add new one at index 0
        // FIX: Plane is rotated -90 deg X. Local Y maps to World -Z.
        // So we need to pass -z to the shader to match locl coordinates.
        ripples[0].set(x, -z, now, 0.5); // Amplitude 0.5
    }

    // Drop a coin from the sky
    // Drop a coin from the sky
    tossCoin(text) {
        // 1. Create text texture or just a glowing orb for now
        // For MVP, just a glowing orb
        const coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial.clone());

        // Random position near center
        const xSide = (Math.random() - 0.5) * 2; // Slight horizontal spread

        // Spawn lower (at camera eye-level or slightly below)
        coin.position.set(0, 6, 8);
        this.scene.add(coin);

        this.coins.push({
            mesh: coin,
            velocity: new THREE.Vector3(
                xSide * 0.05,
                0.1,
                -0.25           // vz: MORE forward power to push it "up" the screen 
            ),
            active: true,
            rotSpeed: {
                x: Math.random() * 0.2,
                z: Math.random() * 0.2
            }
        });
    }

    animate() {
        requestAnimationFrame(this.animate);

        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        this.waterUniforms.uTime.value = time;

        // Smoothly interpolate water depth
        this.waterMesh.position.y += (this.activeDepth - this.waterMesh.position.y) * 0.1;

        // Animate Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (!c.active) continue;

            // Physics
            c.velocity.y -= 0.008; // Lower gravity for "floatier" cinematic feel
            c.mesh.position.add(c.velocity);

            c.mesh.rotation.x += c.rotSpeed.x;
            c.mesh.rotation.z += c.rotSpeed.z;

            // Hit water (dynamic height)
            if (c.mesh.position.y <= this.waterMesh.position.y) {
                // Splash!
                this.addRipple(c.mesh.position.x, c.mesh.position.z); // Note: Water is rotated, so z matches y dimension on plane logic roughly
                this.audio.playPlop();

                // Remove coin or sink it
                c.active = false;

                // Fade out animation could happen here, simpler to just remove for now
                this.scene.remove(c.mesh);
                this.coins.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }
}
