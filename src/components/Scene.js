import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { texturesConfig, skillsScreenTexture, assetsPaths } from '../data/textures';
import { projects } from '../data/projects';
import { socialLinks } from '../data/social';

gsap.registerPlugin(ScrollTrigger);

class NightBakeScene extends THREE.Scene {
  constructor() {
    super();
    const boxGeo = new THREE.BoxGeometry();
    boxGeo.deleteAttribute('uv');
    const matBack = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    const matBasic = new THREE.MeshBasicMaterial();
    const pointLight = new THREE.PointLight(0xffffff, 900, 28, 2);
    pointLight.position.set(0.418, 16.199, 0.3);
    this.add(pointLight);

    const r = new THREE.Mesh(boxGeo, matBack);
    r.position.set(-0.757, 13.219, 0.717);
    r.scale.set(31.713, 28.305, 28.591);
    this.add(r);

    const a = new THREE.Mesh(boxGeo, matBasic);
    a.position.set(-10.906, 2.009, 1.846);
    a.rotation.set(0, -0.195, 0);
    a.scale.set(2.328, 7.905, 4.651);
    this.add(a);

    const s = new THREE.Mesh(boxGeo, matBasic);
    s.position.set(-5.607, -0.754, -0.758);
    s.rotation.set(0, 0.994, 0);
    s.scale.set(1.97, 1.534, 3.955);
    this.add(s);

    const o = new THREE.Mesh(boxGeo, matBasic);
    o.position.set(6.167, 0.857, 7.803);
    o.rotation.set(0, 0.561, 0);
    o.scale.set(3.927, 6.285, 3.687);
    this.add(o);

    const l = new THREE.Mesh(boxGeo, matBasic);
    l.position.set(-2.017, 0.018, 6.124);
    l.rotation.set(0, 0.333, 0);
    l.scale.set(2.002, 4.566, 2.064);
    this.add(l);

    const c = new THREE.Mesh(boxGeo, matBasic);
    c.position.set(2.291, -0.756, -2.621);
    c.rotation.set(0, -0.286, 0);
    c.scale.set(1.546, 1.552, 1.496);
    this.add(c);

    const u = new THREE.Mesh(boxGeo, matBasic);
    u.position.set(-2.193, -0.369, -5.547);
    u.rotation.set(0, 0.516, 0);
    u.scale.set(3.875, 3.487, 2.986);
    this.add(u);

    function emissiveMat(val) {
      const mat = new THREE.MeshBasicMaterial();
      mat.color.setScalar(val);
      return mat;
    }

    const h = new THREE.Mesh(boxGeo, emissiveMat(50));
    h.position.set(-16.116, 14.37, 8.208);
    h.scale.set(0.1, 2.428, 2.739);
    this.add(h);

    const d = new THREE.Mesh(boxGeo, emissiveMat(50));
    d.position.set(-16.109, 18.021, -8.207);
    d.scale.set(0.1, 2.425, 2.751);
    this.add(d);

    const p = new THREE.Mesh(boxGeo, emissiveMat(17));
    p.position.set(14.904, 12.198, -1.832);
    p.scale.set(0.15, 4.265, 6.331);
    this.add(p);

    const f = new THREE.Mesh(boxGeo, emissiveMat(43));
    f.position.set(-0.462, 8.89, 14.52);
    f.scale.set(4.38, 5.441, 0.088);
    this.add(f);

    const m = new THREE.Mesh(boxGeo, emissiveMat(20));
    m.position.set(3.235, 11.486, -12.541);
    m.scale.set(2.5, 2, 0.1);
    this.add(m);

    const g = new THREE.Mesh(boxGeo, emissiveMat(100));
    g.position.set(0, 20, 0);
    g.scale.set(1, 0.1, 1);
    this.add(g);
  }
}

function randomFloats(min, max, count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.random() * (max - min) + min);
  }
  return result;
}

export class AnimationManager {
  constructor(gltf, isMobile, scene) {
    this.mixers = [];
    gsap.registerPlugin(ScrollTrigger);
    this.tl = gsap.timeline({
      scrollTrigger: {
        id: 'triggers',
        trigger: '#proxy-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      },
      duration: 1
    });
    this.gltf = gltf;
    this.isMobile = isMobile;
    this.scene = scene;
    this.setupAnimations();
  }

  setupAnimations() {
    // TV overlay: one CSS3D plane over the TV screen, slides driven by timeline progress.
    // Rendered at 2x pixel size and half the world scale so text stays crisp.
    const tvScreen = document.getElementById('tvScreen');
    if (tvScreen) {
      const tvObj = new CSS3DObject(tvScreen);
      tvObj.scale.setScalar(0.0057 / 2);
      tvObj.rotation.y = -Math.PI / 2;
      tvObj.position.set(1.7084245681762695, 1.175346851348877, -1.3662960529327393);
      this.scene.add(tvObj);

      this.tvScreen = tvScreen;
      this.tvSlides = Array.from(tvScreen.querySelectorAll('.tv-slide')).map((el) => ({
        el,
        from: parseFloat(el.dataset.from),
        to: parseFloat(el.dataset.to)
      }));
      this.tvWindow = {
        from: Math.min(...this.tvSlides.map((s) => s.from)),
        to: Math.max(...this.tvSlides.map((s) => s.to))
      };
      this.tvOn = false;
      this.tvActive = -1;
    }

    if (this.gltf.animations) {
      this.gltf.animations.forEach((clip) => {
        const mixer = new THREE.AnimationMixer(this.gltf.scene);
        const action = mixer.clipAction(clip);
        action.play();

        if (clip.name === 'Pendel') action.timeScale = 0.7;
        if (clip.name === 'WaterAction') action.timeScale = 0.04;
        if (clip.name.includes('ShipAction')) action.timeScale = 0.2;
        if (clip.name.includes('BirdsAction')) action.timeScale = 0.5;

        if (
          clip.name === 'CameraGroupAction.001' ||
          clip.name === 'CameraMobileAction' ||
          clip.name.includes('Polygon') ||
          clip.name.includes('TVBackground') ||
          clip.name.includes('Airplane') ||
          clip.name.includes('PopCorn') ||
          clip.name.includes('PS5_Controller') ||
          clip.name.includes('Text')
        ) {
          const proxyObj = {
            get time() {
              return mixer.time;
            },
            set time(val) {
              action.paused = false;
              mixer.setTime(val);
              action.paused = true;
            }
          };
          proxyObj.time = 0;
          this.tl.to(proxyObj, { time: 19, duration: 1 }, 0);
        } else {
          this.mixers.push(mixer);
        }
      });
    }
    ScrollTrigger.refresh();
  }

  updateMixers(delta) {
    this.mixers.forEach((mixer) => mixer.update(delta));
  }

  updateTvScreen() {
    if (!this.tvScreen) return;
    const p = this.tl.progress();
    const on = p >= this.tvWindow.from && p < this.tvWindow.to;
    if (on !== this.tvOn) {
      this.tvScreen.classList.toggle('is-on', on);
      this.tvOn = on;
    }
    if (!on) return;

    const active = this.tvSlides.findIndex((s) => p >= s.from && p < s.to);
    if (active !== this.tvActive) {
      this.tvSlides.forEach((s, i) => s.el.classList.toggle('is-active', i === active));
      this.tvActive = active;
    }
    if (active !== -1) {
      const s = this.tvSlides[active];
      s.el.style.setProperty('--progress', ((p - s.from) / (s.to - s.from)).toFixed(3));
    }
  }
}

export function createSceneController() {
  let camera, vrCamera, scene, renderer, cssRenderer, animManager;
  let dayEnvTexture, nightEnvTexture;
  let sky;
  let clockHandHour, clockHandMinute, clockHandSecond;
  let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  let isVR = false;
  let gltfModel;
  let nightTextures = [];
  let dayTextures = [];
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const interactableObjects = [];
  const clock = new THREE.Clock();

  function getDefaultTimeMode() {
    const hours = new Date().getHours();
    return hours >= 6 && hours < 18 ? 'day' : 'night';
  }

  function setDayMode(immediate = false) {
    if (!renderer || !scene) return;

    const applyDay = () => {
      dayTextures.forEach((item) => {
        const obj = gltfModel?.scene?.getObjectByName(item.name);
        if (obj) {
          obj.material.map = item.day;
          obj.material.color = new THREE.Color(0xffffff);
          obj.material.needsUpdate = true;
        }
      });

      scene.environment = dayEnvTexture;
      if (scene.environmentRotation) scene.environmentRotation.set(0, 2, 0);
      scene.background = new THREE.Color(0xebf2f8);
      if (scene.fog) scene.fog.color.set(0xebf2f8);
      const dirL = scene.getObjectByName('mainDirLight');
      if (dirL) dirL.intensity = 2.2;

      const stars = scene.getObjectByName('starsGroup');
      if (stars) stars.visible = false;

      const obj38 = gltfModel?.scene?.getObjectByName('Object_38002_3');
      if (obj38) {
        obj38.material.emissiveIntensity = 1;
        obj38.material.color = new THREE.Color(15198183);
      }

      const water = gltfModel?.scene?.getObjectByName('Water');
      if (water) {
        water.material.transparent = true;
        water.material.opacity = 1;
        water.material.roughness = 0;
        water.material.color = new THREE.Color(9549055);
      }

      ['Ship001', 'Ship002', 'Lighthouse001'].forEach((name) => {
        const item = gltfModel?.scene?.getObjectByName(name);
        if (item) {
          item.traverse((child) => {
            if (child.isMesh) {
              child.material.transparent = true;
              child.material.opacity = 1;
            }
          });
        }
      });

      const lightHouseLight = gltfModel?.scene?.getObjectByName('LightHouseLight');
      if (lightHouseLight) lightHouseLight.visible = false;

      const birds = gltfModel?.scene?.getObjectByName('Birds');
      if (birds) birds.visible = true;
      const birds001 = gltfModel?.scene?.getObjectByName('Birds001');
      if (birds001) birds001.visible = true;

      if (sky) {
        sky.material.uniforms.turbidity.value = 1.1;
        sky.material.uniforms.rayleigh.value = 0.362;
        sky.material.uniforms.mieCoefficient.value = 0.005;
        sky.material.uniforms.mieDirectionalG.value = 0.717;
      }

      if (immediate) {
        if (scene.fog) {
          scene.fog.near = 10;
          scene.fog.far = 60;
        }
        renderer.toneMappingExposure = 0.7;
      } else {
        setTimeout(() => {
          if (scene.fog) {
            gsap.to(scene.fog, { near: 10, far: 60, duration: 1 });
          }
          gsap.to(renderer, { toneMappingExposure: 0.7, duration: 1 });
        }, 500);
      }
    };

    if (immediate) {
      applyDay();
    } else {
      gsap.to(renderer, {
        toneMappingExposure: 0,
        duration: 1,
        onComplete: applyDay
      });
    }
  }

  function setNightMode(immediate = false) {
    if (!renderer || !scene) return;

    const applyNight = () => {
      nightTextures.forEach((item) => {
        const obj = gltfModel?.scene?.getObjectByName(item.name);
        if (obj) {
          if (item.name === 'SofaMesh') {
            obj.material.map = null;
            obj.material.color = new THREE.Color(0x182030);
          } else {
            obj.material.map = item.night;
          }
          obj.material.needsUpdate = true;
        }
      });

      scene.environment = nightEnvTexture;
      if (scene.environmentRotation) scene.environmentRotation.set(0, 0, 0);
      scene.background = new THREE.Color(0x05070c);
      if (scene.fog) scene.fog.color.set(0x05070c);
      const dirL = scene.getObjectByName('mainDirLight');
      if (dirL) dirL.intensity = 0.3;

      const stars = scene.getObjectByName('starsGroup');
      if (stars) stars.visible = true;

      const obj38 = gltfModel?.scene?.getObjectByName('Object_38002_3');
      if (obj38) {
        obj38.material.emissiveIntensity = 0.05;
        obj38.material.color = new THREE.Color(16776960);
      }

      const water = gltfModel?.scene?.getObjectByName('Water');
      if (water) {
        water.material.transparent = true;
        water.material.envMap = dayEnvTexture;
        water.material.envMapIntensity = 0.2;
        water.material.color = new THREE.Color(1314862);
      }

      ['Ship001', 'Ship002'].forEach((name) => {
        const item = gltfModel?.scene?.getObjectByName(name);
        if (item) {
          item.traverse((child) => {
            if (child.isMesh) {
              child.material.transparent = true;
              child.material.opacity = 0.2;
            }
          });
        }
      });

      const lighthouse = gltfModel?.scene?.getObjectByName('Lighthouse001');
      if (lighthouse) {
        lighthouse.traverse((child) => {
          if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 0.8;
          }
        });
      }

      const lightHouseLight = gltfModel?.scene?.getObjectByName('LightHouseLight');
      if (lightHouseLight) lightHouseLight.visible = true;

      const birds = gltfModel?.scene?.getObjectByName('Birds');
      if (birds) birds.visible = false;
      const birds001 = gltfModel?.scene?.getObjectByName('Birds001');
      if (birds001) birds001.visible = false;

      if (sky) {
        sky.material.uniforms.turbidity.value = 0;
        sky.material.uniforms.rayleigh.value = 0;
        sky.material.uniforms.mieCoefficient.value = 0;
        sky.material.uniforms.mieDirectionalG.value = 0;
      }

      if (immediate) {
        if (scene.fog) {
          scene.fog.near = 100;
          scene.fog.far = 200;
        }
        renderer.toneMappingExposure = 1;
      } else {
        setTimeout(() => {
          gsap.to(renderer, { toneMappingExposure: 1, duration: 1 });
        }, 500);
      }
    };

    if (scene.fog) {
      if (immediate) {
        scene.fog.near = 100;
        scene.fog.far = 200;
      } else {
        gsap.to(scene.fog, { near: 100, far: 200, duration: 1 });
      }
    }

    if (immediate) {
      applyNight();
    } else {
      gsap.to(renderer, {
        toneMappingExposure: 0,
        duration: 1,
        onComplete: applyNight
      });
    }
  }

  async function init({
    canvas,
    proxyContainer,
    testContainer,
    onProgress,
    onLoad,
    onProjectClick,
    initialTimeMode
  }) {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xebf2f8, 10, 60);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 2, 0);
    scene.add(camera);

    vrCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    vrCamera.position.set(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? window.devicePixelRatio / 2 : window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;

    renderer.xr.addEventListener('sessionstart', () => {
      isVR = true;
    });
    renderer.xr.addEventListener('sessionend', () => {
      isVR = false;
    });

    const vrBtn = VRButton.createButton(renderer);
    vrBtn.id = 'VRButton';
    vrBtn.style.display = 'none';
    document.body.appendChild(vrBtn);

    cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.className = 'canvas';
    cssRenderer.domElement.style.position = 'fixed';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    cssRenderer.domElement.style.pointerEvents = 'none';
    cssRenderer.domElement.style.zIndex = '0';
    document.body.appendChild(cssRenderer.domElement);

    scene.background = new THREE.Color(0xebf2f8);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight.position.set(5, 15, 8);
    dirLight.castShadow = true;
    dirLight.name = 'mainDirLight';
    scene.add(dirLight);

    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => {
      onProgress(Math.round((loaded / total) * 100));
    };
    manager.onLoad = () => {
      onLoad();
      setTimeout(handleResize, 2000);
    };

    // Load HDRI
    const rgbeLoader = new RGBELoader(manager);
    dayEnvTexture = await new Promise((resolve) => {
      rgbeLoader.load(assetsPaths.hdri, (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        resolve(tex);
      });
    });

    // Draco Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./draco/');

    const gltfLoader = new GLTFLoader(manager);
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfModel = await new Promise((resolve, reject) => {
      gltfLoader.load(assetsPaths.model, resolve, undefined, reject);
    });

    scene.add(gltfModel.scene);

    const glassObj = gltfModel.scene.getObjectByName('Glass_Glass_0');
    if (glassObj) {
      glassObj.material = new THREE.MeshPhysicalMaterial({
        color: 8026746,
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 0,
        envMapIntensity: 1,
        transparent: true,
        opacity: 1,
        ior: 1.55,
        reflectivity: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0
      });
    }

    // Completely remove legacy 3D text meshes so they never render
    const text001 = gltfModel.scene.getObjectByName('Text.001');
    if (text001) {
      text001.visible = false;
      text001.removeFromParent();
    }
    const artistic = gltfModel.scene.getObjectByName('Artistic');
    if (artistic) {
      artistic.visible = false;
      artistic.removeFromParent();
    }

    gltfModel.scene.traverse((child) => {
      if (child.type === 'PerspectiveCamera') {
        if (window.innerWidth > 600) {
          if (child.name === 'Camera') camera = child;
        } else {
          if (child.name === 'CameraMobile') camera = child;
        }
      } else if (child.isMesh) {
        if (
          child.name.includes('Frame') ||
          child.name.includes('Image') ||
          child.name.includes('Social')
        ) {
          if (child.parent) {
            child.parent.userData.z = child.parent.position.z;
            interactableObjects.push(child);
          }
        }
      }
      child.frustumCulled = false;
    });

    // Stars group for night
    const starXs = randomFloats(-40, 50, 500);
    const starYs = randomFloats(1, 20, 500);
    const starsGroup = new THREE.Group();
    starsGroup.name = 'starsGroup';
    scene.add(starsGroup);

    const starGeo = new THREE.SphereGeometry(0.03, 2, 2);
    const starPalette = [0xffffff, 0x00f5d4, 0xffffff, 0x38bdf8, 0xa78bfa];
    for (let i = 0; i < starXs.length; i++) {
      const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: starPalette[i % starPalette.length] }));
      star.position.set(starXs[i], starYs[i], -50);
      starsGroup.add(star);
    }

    // Textures loader
    const texLoader = new THREE.TextureLoader(manager);
    texturesConfig.forEach((item) => {
      if (item.night) {
        const tex = texLoader.load(item.night);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        nightTextures.push({ name: item.name, night: tex });
      }
      if (item.day) {
        const tex = texLoader.load(item.day);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        dayTextures.push({ name: item.name, day: tex });
      }
    });

    // PMREMGenerator for night bake
    const pmremGen = new THREE.PMREMGenerator(renderer);
    nightEnvTexture = pmremGen.fromScene(new NightBakeScene()).texture;

    // Sky shader
    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms.turbidity.value = 1.1;
    skyUniforms.rayleigh.value = 0.362;
    skyUniforms.mieCoefficient.value = 0.005;
    skyUniforms.mieDirectionalG.value = 0.717;

    const sun = new THREE.Vector3();
    const elevation = 10;
    const azimuth = 180;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms.sunPosition.value.copy(sun);

    // Initial time mode setup
    if (initialTimeMode === 'day') {
      setDayMode(true);
    } else {
      setNightMode(true);
    }

    // Wall clock hands
    clockHandHour = gltfModel.scene.getObjectByName('Clock_Hand_Hour');
    clockHandMinute = gltfModel.scene.getObjectByName('Clock_Hand_Minute');
    clockHandSecond = gltfModel.scene.getObjectByName('Clock_Hand_Second');

    // Animation & Scroll timeline
    animManager = new AnimationManager(gltfModel, isMobile, scene);

    // Project image textures on meshes
    projects.forEach((proj) => {
      const mesh = gltfModel.scene.getObjectByName(proj.id);
      if (mesh) {
        const pTex = texLoader.load(proj.image);
        pTex.colorSpace = THREE.SRGBColorSpace;
        pTex.flipY = false;
        mesh.material.map = pTex;
        mesh.material.needsUpdate = true;
      }
    });

    // Computer screen texture
    const compScreen = gltfModel.scene.getObjectByName('CompScreen');
    if (compScreen) {
      const skillsTex = texLoader.load(skillsScreenTexture);
      skillsTex.colorSpace = THREE.SRGBColorSpace;
      skillsTex.flipY = false;
      compScreen.material.map = skillsTex;
      compScreen.material.needsUpdate = true;
    }

    // Phone screen social icon textures (GitHub, TikTok, Gmail)
    const phoneSocialMaps = [
      { name: 'SocialLinkedIn', url: './bilal/Assets/Textures/Social/github.webp' },
      { name: 'SocialTwitter', url: './bilal/Assets/Textures/Social/tiktok.webp' },
      { name: 'SocialGmail', url: './bilal/Assets/Textures/Social/gmail.webp' }
    ];

    phoneSocialMaps.forEach(({ name, url }) => {
      const mesh = gltfModel.scene.getObjectByName(name);
      if (mesh) {
        const sTex = texLoader.load(url);
        sTex.colorSpace = THREE.SRGBColorSpace;
        sTex.flipY = false;
        mesh.material.map = sTex;
        mesh.material.needsUpdate = true;
      }
    });

    window.__threeDebug = {
      camera,
      scene,
      renderer,
      gltfModel,
      animManager
    };

    let loggedOnce = false;
    // Render loop
    renderer.setAnimationLoop(() => {
      if (!loggedOnce && camera) {
        console.log('CAMERA DEBUG: ' + JSON.stringify({
          name: camera.name,
          parent: camera.parent ? camera.parent.name : null,
          pos: [camera.position.x, camera.position.y, camera.position.z],
          rot: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
          near: camera.near,
          far: camera.far,
          fov: camera.fov,
          exposure: renderer.toneMappingExposure,
          sceneChildren: scene.children.length
        }));
        loggedOnce = true;
      }
      if (isVR) {
        renderer.render(scene, vrCamera);
      } else {
        renderer.render(scene, camera);
        cssRenderer.render(scene, camera);
      }

      const delta = clock.getDelta();
      if (animManager) {
        animManager.updateMixers(delta);
        animManager.updateTvScreen();
      }

      // Scroll loop (seamless infinite journey)
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        const trig = ScrollTrigger.getById('triggers');
        if (trig) trig.disable();
        window.scrollTo(0, 0);
        if (trig) trig.enable();
      }

      // Update 3D clock hands
      if (clockHandHour && clockHandMinute && clockHandSecond) {
        const now = new Date();
        const sec = now.getSeconds();
        const min = now.getMinutes();
        const hr = now.getHours();
        const ms = now.getMilliseconds();
        clockHandHour.rotation.set(0, ((2 * Math.PI) / 12) * (hr + min / 60), 0);
        clockHandMinute.rotation.set(0, ((2 * Math.PI) / 60) * (min + sec / 60), 0);
        clockHandSecond.rotation.set(0, ((2 * Math.PI) / 60) * (sec + ms / 1000), 0);
      }

      // Subtle mouse camera parallax on desktop
      if (!isMobile && camera) {
        camera.rotation.x += 0.1 * (0.01 * mouse.y - 1.570796 - camera.rotation.x);
        camera.rotation.y += 0.1 * (0.01 * mouse.x - camera.rotation.y);
      }
    });

    // Event listeners
    if (!isMobile && proxyContainer) {
      proxyContainer.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactableObjects);
        if (intersects[0]) {
          const hit = intersects[0].object;
          if (hit.name.includes('Social')) {
            gsap.to(hit.position, { y: 0.953, duration: 0.5, ease: 'power2.out' });
            interactableObjects.forEach((item) => {
              if (item.name.includes('Social') && item.name !== hit.name) {
                gsap.to(item.position, { y: 0.94532, duration: 0.5, ease: 'power2.out' });
              }
            });
          } else {
            if (hit.parent) {
              gsap.to(hit.parent.position, { z: 2.28, duration: 0.5, ease: 'power2.out' });
              interactableObjects.forEach((item) => {
                if (item.parent && item.parent.name !== hit.parent.name) {
                  gsap.to(item.parent.position, {
                    z: item.parent.userData.z,
                    duration: 0.5,
                    ease: 'power2.out'
                  });
                }
              });
            }
          }
        } else {
          interactableObjects.forEach((item) => {
            if (item.name.includes('Social')) {
              gsap.to(item.position, { y: 0.94532, duration: 0.5, ease: 'power2.out' });
            } else if (item.parent) {
              gsap.to(item.parent.position, {
                z: item.parent.userData.z,
                duration: 0.5,
                ease: 'power2.out'
              });
            }
          });
        }
      });
    }

    if (proxyContainer) {
      proxyContainer.addEventListener('pointerdown', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactableObjects);
        if (intersects[0]) {
          const hit = intersects[0].object;
          if (hit.name.includes('Social')) {
            if (hit.name === 'SocialGmail') window.open(socialLinks.mail);
            else if (hit.name === 'SocialLinkedIn') window.open(socialLinks.github, '_blank');
            else if (hit.name === 'SocialTwitter') window.open(socialLinks.tiktok, '_blank');
          } else if (hit.parent && hit.parent.name) {
            const lastChar = hit.parent.name[hit.parent.name.length - 1];
            const projIdx = parseInt(lastChar, 10);
            if (!isNaN(projIdx)) {
              onProjectClick(projIdx);
            }
          }
        }
      });
    }

    function handleResize() {
      const height = testContainer?.clientHeight || window.innerHeight;
      renderer.setSize(window.innerWidth, height);
      cssRenderer.setSize(window.innerWidth, height);
      camera.aspect = window.innerWidth / height;
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', handleResize);
  }

  return {
    init,
    setDayMode,
    setNightMode,
    getDefaultTimeMode
  };
}
