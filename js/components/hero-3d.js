import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function initHero3D(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07111F, 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.9);
    bloomPass.threshold = 0.3;
    bloomPass.strength = 0.8; // Softer bloom
    bloomPass.radius = 0.8;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Subtle ambient lighting
    const ambientLight = new THREE.AmbientLight(0x0F2B5B, 1.5);
    scene.add(ambientLight);

    // Warm Gold accent light
    const light1 = new THREE.PointLight(0xF4B400, 50, 40);
    light1.position.set(8, 5, 5);
    scene.add(light1);

    // Deep Blue accent light
    const light2 = new THREE.PointLight(0x0F2B5B, 80, 50);
    light2.position.set(-8, -5, 5);
    scene.add(light2);

    // Central soft light
    const centerLight = new THREE.PointLight(0x1F4A9E, 40, 20);
    scene.add(centerLight);

    // Connection Lines (Network)
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x1F4A9E,
        transparent: true,
        opacity: 0.15
    });

    const networkGroup = new THREE.Group();
    scene.add(networkGroup);
    
    // Create subtle geometric outlines
    for(let i=0; i<3; i++) {
        const icoGeo = new THREE.IcosahedronGeometry(6 + (i * 2), 1);
        const edges = new THREE.EdgesGeometry(icoGeo);
        const line = new THREE.LineSegments(edges, lineMaterial);
        line.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        
        line.userData = {
            rotSpeedX: (Math.random() - 0.5) * 0.002,
            rotSpeedY: (Math.random() - 0.5) * 0.002
        };
        networkGroup.add(line);
    }

    // Floating Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 400; // Reduced count
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.06,
        color: 0x60A5FA, // Soft light blue
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // Gold accent particles
    const goldParticlesGeo = new THREE.BufferGeometry();
    const goldParticlesCount = 50;
    const goldPosArray = new Float32Array(goldParticlesCount * 3);
    for(let i = 0; i < goldParticlesCount * 3; i++) {
        goldPosArray[i] = (Math.random() - 0.5) * 30;
    }
    goldParticlesGeo.setAttribute('position', new THREE.BufferAttribute(goldPosArray, 3));
    const goldParticlesMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xF4B400, // Gold
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const goldParticleSystem = new THREE.Points(goldParticlesGeo, goldParticlesMat);
    scene.add(goldParticleSystem);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.003; // Slower parallax
        mouseY = (event.clientY - windowHalfY) * 0.003;
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetX = mouseX * 2;
        targetY = mouseY * 2;
        camera.position.x += (targetX - camera.position.x) * 0.01;
        camera.position.y += (-targetY - camera.position.y) * 0.01;
        camera.lookAt(scene.position);

        // Slow rotation for network lines
        networkGroup.children.forEach(line => {
            line.rotation.x += line.userData.rotSpeedX;
            line.rotation.y += line.userData.rotSpeedY;
        });

        // Very slow ambient light movement
        light1.position.x = Math.sin(elapsedTime * 0.2) * 12;
        light1.position.z = Math.cos(elapsedTime * 0.2) * 12;
        
        light2.position.x = Math.sin(elapsedTime * 0.15 + Math.PI) * 12;
        light2.position.y = Math.cos(elapsedTime * 0.15 + Math.PI) * 12;

        particleSystem.rotation.y = elapsedTime * 0.005; // Very slow
        particleSystem.rotation.x = Math.sin(elapsedTime * 0.005) * 0.05;

        goldParticleSystem.rotation.y = -elapsedTime * 0.008;
        goldParticleSystem.rotation.z = Math.sin(elapsedTime * 0.008) * 0.05;

        composer.render();
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}
