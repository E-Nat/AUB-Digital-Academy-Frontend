import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function initHero3D(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050914, 0.03);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 1.0,
        thickness: 2.0,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide
    });

    const sphereGeo = new THREE.SphereGeometry(3, 64, 64);
    const centralOrb = new THREE.Mesh(sphereGeo, glassMaterial);
    scene.add(centralOrb);

    const shapes = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const icoGeo = new THREE.IcosahedronGeometry(0.8, 0);
    
    const shapeGroup = new THREE.Group();
    scene.add(shapeGroup);

    for(let i = 0; i < 20; i++) {
        const isBox = Math.random() > 0.5;
        const mesh = new THREE.Mesh(isBox ? boxGeo : icoGeo, glassMaterial);
        
        const radius = 5 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
        mesh.position.z = radius * Math.cos(phi);
        
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        
        const scale = 0.5 + Math.random() * 1.5;
        mesh.scale.set(scale, scale, scale);
        
        mesh.userData = {
            originPosition: mesh.position.clone(),
            offset: Math.random() * Math.PI * 2,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            }
        };
        
        shapeGroup.add(mesh);
        shapes.push(mesh);
    }

    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0x06b6d4, 100, 50);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x8b5cf6, 100, 50);
    light2.position.set(-5, -5, 5);
    scene.add(light2);

    const centerLight = new THREE.PointLight(0x3b82f6, 50, 15);
    scene.add(centerLight);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.005;
        mouseY = (event.clientY - windowHalfY) * 0.005;
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetX = mouseX * 2;
        targetY = mouseY * 2;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        centralOrb.rotation.y += 0.002;
        centralOrb.rotation.x += 0.001;

        bloomPass.strength = 1.0 + Math.sin(elapsedTime * 1.5) * 0.3;

        shapeGroup.rotation.y = elapsedTime * 0.05;
        shapeGroup.rotation.z = Math.sin(elapsedTime * 0.05) * 0.1;

        shapes.forEach(shape => {
            const ud = shape.userData;
            shape.position.y = ud.originPosition.y + Math.sin(elapsedTime * 2 + ud.offset) * 0.5;
            shape.rotation.x += ud.rotationSpeed.x;
            shape.rotation.y += ud.rotationSpeed.y;
            shape.rotation.z += ud.rotationSpeed.z;
        });

        light1.position.x = Math.sin(elapsedTime * 0.5) * 10;
        light1.position.z = Math.cos(elapsedTime * 0.5) * 10;
        
        light2.position.x = Math.sin(elapsedTime * 0.3 + Math.PI) * 10;
        light2.position.y = Math.cos(elapsedTime * 0.3 + Math.PI) * 10;

        particleSystem.rotation.y = elapsedTime * 0.02;
        particleSystem.rotation.x = Math.sin(elapsedTime * 0.01) * 0.1;

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
