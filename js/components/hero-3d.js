import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function initHero3D(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clean any existing canvas
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    try {
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js not loaded');
        }
        initThreeHero(container);
    } catch (err) {
        console.warn('Initializing 2D network canvas fallback:', err);
        initFallbackCanvas(container);
    }
}

function initThreeHero(container) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.8, 0.4, 0.9);
    bloomPass.threshold = 0.35;
    bloomPass.strength = 0.55;
    bloomPass.radius = 0.6;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Subtle ambient lighting
    const ambientLight = new THREE.AmbientLight(0x0B1733, 1.8);
    scene.add(ambientLight);

    // Warm Gold accent light
    const light1 = new THREE.PointLight(0xF5B800, 35, 35);
    light1.position.set(8, 5, 5);
    scene.add(light1);

    // Deep Blue accent light
    const light2 = new THREE.PointLight(0x4F9CF9, 50, 45);
    light2.position.set(-8, -5, 5);
    scene.add(light2);

    // Connection Lines (Network)
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x4F9CF9,
        transparent: true,
        opacity: 0.11
    });

    const networkGroup = new THREE.Group();
    scene.add(networkGroup);
    
    // Create subtle geometric outlines
    for (let i = 0; i < 3; i++) {
        const icoGeo = new THREE.IcosahedronGeometry(6 + (i * 2.2), 1);
        const edges = new THREE.EdgesGeometry(icoGeo);
        const line = new THREE.LineSegments(edges, lineMaterial);
        line.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        
        line.userData = {
            rotSpeedX: (Math.random() - 0.5) * 0.0008,
            rotSpeedY: (Math.random() - 0.5) * 0.0008
        };
        networkGroup.add(line);
    }

    // Floating Particles (Soft Blue)
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 280;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 45;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x4F9CF9,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // Gold accent particles (Warm Gold)
    const goldParticlesGeo = new THREE.BufferGeometry();
    const goldParticlesCount = 35;
    const goldPosArray = new Float32Array(goldParticlesCount * 3);
    for (let i = 0; i < goldParticlesCount * 3; i++) {
        goldPosArray[i] = (Math.random() - 0.5) * 28;
    }
    goldParticlesGeo.setAttribute('position', new THREE.BufferAttribute(goldPosArray, 3));
    const goldParticlesMat = new THREE.PointsMaterial({
        size: 0.06,
        color: 0xF5B800,
        transparent: true,
        opacity: 0.7,
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

    if (!prefersReducedMotion) {
        window.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.001;
            mouseY = (event.clientY - windowHalfY) * 0.001;
        }, { passive: true });
    }

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        
        if (prefersReducedMotion) {
            composer.render();
            return;
        }

        const elapsedTime = clock.getElapsedTime();

        targetX = mouseX * 1.2;
        targetY = mouseY * 1.2;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Slow rotation for network lines
        networkGroup.children.forEach(line => {
            line.rotation.x += line.userData.rotSpeedX;
            line.rotation.y += line.userData.rotSpeedY;
        });

        // Ambient point light movements
        light1.position.x = Math.sin(elapsedTime * 0.15) * 8;
        light1.position.z = Math.cos(elapsedTime * 0.15) * 8;
        
        light2.position.x = Math.sin(elapsedTime * 0.12 + Math.PI) * 8;
        light2.position.y = Math.cos(elapsedTime * 0.12 + Math.PI) * 8;

        particleSystem.rotation.y = elapsedTime * 0.003;
        particleSystem.rotation.x = Math.sin(elapsedTime * 0.003) * 0.03;

        goldParticleSystem.rotation.y = -elapsedTime * 0.004;
        goldParticleSystem.rotation.z = Math.sin(elapsedTime * 0.004) * 0.03;

        composer.render();
    }

    const handleResize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    animate();
}

function initFallbackCanvas(container) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
        width = canvas.width = container.clientWidth || window.innerWidth;
        height = canvas.height = container.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const count = 55;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() < 0.15 ? 2.5 : 1.5,
            isGold: Math.random() < 0.2
        });
    }

    function render() {
        ctx.clearRect(0, 0, width, height);

        // Draw connecting network lines
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    const alpha = (1 - dist / 130) * 0.18;
                    ctx.strokeStyle = `rgba(79, 156, 249, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        for (let i = 0; i < count; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.fillStyle = p.isGold ? 'rgba(245, 184, 0, 0.75)' : 'rgba(79, 156, 249, 0.65)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

