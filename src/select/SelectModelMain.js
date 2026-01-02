import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { storage } from '../utils/storage.js';
import { Info } from '../ui/info.js';

export async function SelectModelMain() {
    const characters = [
        { name: "铃仙", path: "models/project_-_reisen_udongein_inaba_fumo_model.glb", baseScale: 2.9 },
        { name: "帝", path: "models/project_-_tewi_fumo_model.glb", baseScale: 11.0 },
        { name: "哆来咪", path: "models/project_-_doremy_sweet_fumo_model.glb", baseScale: 3.4 },
        { name: "恋", path: "models/project_-_koishi_komeiji_fumo_v2.glb", baseScale: 4.4 },
        { name: "米斯蒂亚", path: "models/project_-_mystia_lorelei_fumo_model.glb", baseScale: 2.9 },
        { name: "灵梦", path: "models/project_-_reimu_hakurei_fumo_model.glb", baseScale: 3.0 },
    ];

    let currentIndex = 0;
    let tempMultiplier = 0.8; // 初始缩放比例设为 0.8
    const modelGap = 15;
    const loadedModels = [];

    // --- 1. UI 结构 ---
    const uiContainer = document.createElement('div');
    uiContainer.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: radial-gradient(circle, #222, #000);
        display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
        padding-bottom: 30px; color: white; font-family: sans-serif;
        overflow: hidden;
    `;
    
    uiContainer.innerHTML = `
        <h1 style="position:absolute; top:20px; pointer-events:none; z-index:20;">角色陈列室</h1>
        
        <div id="model-preview" style="
            width:100%; 
            height:calc(100% + 200px); 
            position:absolute; 
            top:100px; 
            left:0;
        "></div>
        
        <div style="z-index:10; background: rgba(0,0,0,0.7); padding: 20px; border-radius: 15px; text-align:center; margin-bottom: 20px; border: 1px solid #444;">
            <h2 id="char-name" style="margin:0 0 10px 0; color: gold;">准备中...</h2>
            
            <div style="margin-bottom: 15px;">
                <label>预览缩放微调: </label>
                <input type="range" id="temp-scale-range" min="0.1" max="2.0" step="0.1" value="0.8">
                <span id="scale-value">0.8</span>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="prev-btn" style="padding:10px 20px; cursor:pointer;">上一个</button>
                <button id="select-btn" style="padding:10px 25px; background:gold; color:black; font-weight:bold; cursor:pointer; border:none; border-radius:5px;">选定该角色</button>
                <button id="next-btn" style="padding:10px 20px; cursor:pointer;">下一个</button>
            </div>
        </div>
        <button id="back-btn" style="position:absolute; top:20px; right:20px; padding:10px; z-index:20; cursor:pointer;">返回菜单</button>
    `;
    document.body.appendChild(uiContainer);

    // --- 2. Three.js 场景初始化 ---
    const container = document.getElementById('model-preview');
    const scene = new THREE.Scene();
    
    // 使用容器的实际尺寸
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight + 200), 0.1, 1000);
    camera.position.set(0, 5, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight + 200);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 10, 10);
    scene.add(sun);

    const loader = new GLTFLoader();
    
    characters.forEach((char, index) => {
        loader.load(char.path, (gltf) => {
            const model = gltf.scene;
            model.position.x = index * modelGap;
            model.position.y = 0;
            // 初始化时应用 0.8 的缩放倍率
            model.scale.setScalar(char.baseScale * tempMultiplier);
            scene.add(model);
            loadedModels[index] = model;

            if (index === currentIndex) {
                document.getElementById('char-name').textContent = characters[currentIndex].name;
            }
        }, undefined, (err) => console.error("加载失败:", char.path, err));
    });

    // --- 3. 交互逻辑 ---
    function switchCharacter(direction) {
        currentIndex = (currentIndex + direction + characters.length) % characters.length;
        document.getElementById('char-name').textContent = characters[currentIndex].name;
    }

    document.getElementById('prev-btn').onclick = () => switchCharacter(-1);
    document.getElementById('next-btn').onclick = () => switchCharacter(1);

    document.getElementById('temp-scale-range').oninput = (e) => {
        tempMultiplier = parseFloat(e.target.value);
        document.getElementById('scale-value').textContent = tempMultiplier.toFixed(1);
        
        loadedModels.forEach((model, index) => {
            if (model) {
                model.scale.setScalar(characters[index].baseScale * tempMultiplier);
            }
        });
    };

    document.getElementById('select-btn').onclick = async () => {
        const char = characters[currentIndex];
        const globalData = await storage.load_global('global.json') || {};
        
        globalData.modelPath = char.path;
        globalData.modelScale = char.baseScale; 
        
        await storage.save_global('global.json', globalData);
        Info.alert(`✔ 角色已锁定: ${char.name}\n基础缩放: ${char.baseScale}`);
    };

    document.getElementById('back-btn').onclick = () => {
        renderer.dispose();
        scene.clear();
        location.reload();
    };

    // --- 4. 渲染循环 ---
    function animate() {
        requestAnimationFrame(animate);

        loadedModels.forEach(m => {
            if (m) m.rotation.y += 0.01;
        });

        const targetX = currentIndex * modelGap;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
        camera.lookAt(camera.position.x, 3, 0);

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight + 200;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}