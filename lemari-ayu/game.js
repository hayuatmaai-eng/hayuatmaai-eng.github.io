import * as THREE from 'three';
import { GLTFLoader } from './lib/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, MToonMaterial } from '@pixiv/three-vrm';

const T = THREE, V3 = T.Vector3;

// ================= data =================
const SKIN = ['#FBE6DA', '#F0CDB4', '#DDAA86', '#C38A64', '#9A6544', '#6E4630'];
const HAIRC = ['#1C1210', '#3B2418', '#6B3F22', '#A8703C', '#D9B26F', '#9A3B3B', '#6C5B9A', '#E8B3C2'];
const HIJABC = ['#F4EDE4', '#D8B4B0', '#B5485D', '#7A8F7B', '#2F3A56', '#8FB3D9', '#E2C37A', '#1F1C24'];
const CLOTH = ['#F7F3EE', '#2A2730', '#B5485D', '#E7A6B5', '#3E5C8A', '#8FB3D9', '#5E7D4E', '#E2B547', '#C46A3A', '#6D4C8C', '#A68A64', '#5A3A2E'];
const ACCC = ['#D4AF37', '#C0C0C8', '#2A2730', '#B5485D', '#5A3A2E', '#F7F3EE'];
const HAIR = [['pendek', 'Pendek'], ['bob', 'Bob'], ['panjang', 'Panjang'], ['ekorkuda', 'Ekor kuda'], ['sanggul', 'Sanggul'], ['hijab', 'Hijab']];
const TOPS = [['kaos', 'Kaos'], ['tank', 'Tank top'], ['kemeja', 'Kemeja'], ['kebaya', 'Kebaya'], ['sweater', 'Sweter'], ['jaket', 'Jaket']];
const BOTTOMS = [['celanapanjang', 'Celana panjang'], ['celanapendek', 'Celana pendek'], ['rokpendek', 'Rok pendek'], ['rokpanjang', 'Rok panjang']];
const DRESSES = [['none', 'Tanpa gaun'], ['gaun', 'Gaun midi'], ['gamis', 'Gamis']];
const SHOES = [['none', 'Tanpa alas'], ['sneakers', 'Sneakers'], ['flats', 'Flat shoes'], ['heels', 'Hak tinggi'], ['boots', 'Bot'], ['sandal', 'Sandal']];
const ACCS = [['kacamata', 'Kacamata'], ['topi', 'Topi'], ['kalung', 'Kalung'], ['anting', 'Anting'], ['tas', 'Tas']];
const BGS = [['studio', 'Studio'], ['taman', 'Taman'], ['pantai', 'Pantai'], ['malam', 'Malam']];
const MOTIFS = [['polos', 'Polos'], ['batik', 'Batik'], ['garis', 'Garis'], ['bunga', 'Bunga']];
const ACTS = [['diam', 'Diam'], ['catwalk', 'Catwalk'], ['lambai', 'Melambai'], ['gaya', 'Bergaya'], ['menari', 'Menari']];
const EXPR = [['netral', 'Netral'], ['senyum', 'Senyum'], ['ceria', 'Ceria'], ['kaget', 'Kaget']];
const CAMS = [['penuh', 'Seluruh badan'], ['wajah', 'Wajah'], ['atas', 'Atasan'], ['bawah', 'Bawahan'], ['kaki', 'Sepatu']];
const BGDATA = {
  studio: { sky: '#EFE4EA', floor: '#D9C6D1' },
  taman: { sky: '#D3E6C8', floor: '#86AD70' },
  pantai: { sky: '#BFE3EE', floor: '#EAD7A4' },
  malam: { sky: '#221C38', floor: '#3A3152' }
};
const TAGS = {
  kaos: ['pantai', 'olahraga', 'santai'], tank: ['pantai', 'olahraga'], kemeja: ['kantor', 'santai'], kebaya: ['kondangan'],
  sweater: ['santai', 'olahraga'], jaket: ['kantor', 'santai'],
  celanapanjang: ['kantor', 'santai', 'olahraga'], celanapendek: ['pantai', 'olahraga'], rokpendek: ['santai', 'pantai'], rokpanjang: ['kondangan', 'kantor'],
  gaun: ['kondangan', 'pantai', 'santai'], gamis: ['kondangan', 'kantor', 'santai'],
  sneakers: ['olahraga', 'santai'], flats: ['kantor', 'santai', 'kondangan'], heels: ['kondangan', 'kantor'], boots: ['santai'], sandal: ['pantai'],
  kacamata: ['pantai', 'kantor', 'santai'], topi: ['pantai', 'olahraga'], kalung: ['kondangan', 'santai'], anting: ['kondangan', 'kantor'], tas: ['kantor', 'kondangan', 'santai']
};
const CH = [
  { id: 'kantor', name: 'Ke kantor', brief: 'Rapat pagi dengan klien. Tampil rapi dan sopan. Batik dapat nilai tambah.' },
  { id: 'pantai', name: 'Liburan ke pantai', brief: 'Siang terik di pinggir laut. Ringan, adem, dan santai.' },
  { id: 'kondangan', name: 'Kondangan', brief: 'Resepsi pernikahan sepupu. Anggun dan berbudaya. Batik dapat nilai tambah.' },
  { id: 'olahraga', name: 'Olahraga pagi', brief: 'Jogging keliling taman kota. Nyaman dan lincah.' },
  { id: 'santai', name: 'Nongkrong sore', brief: 'Ngopi bareng teman di kafe. Kasual tapi tetap gaya.' }
];
const label = (list, id) => (list.find(x => x[0] === id) || [id, id])[1];

const state = {
  skin: SKIN[1], hair: 'ekorkuda', hairColor: HAIRC[1], hijabColor: HIJABC[1],
  top: 'kaos', topColor: CLOTH[3], topMotif: 'polos',
  bottom: 'rokpendek', bottomColor: CLOTH[4], bottomMotif: 'polos',
  dress: 'none', dressColor: CLOTH[2], dressMotif: 'bunga',
  shoes: 'sneakers', shoesColor: CLOTH[0],
  acc: { kacamata: false, topi: false, kalung: false, anting: true, tas: false }, accColor: ACCC[0],
  bg: 'studio', act: 'diam', expr: 'senyum', cam: 'penuh'
};
let chIdx = 2, tab = 'atasan', spin = false;

// ================= renderer =================
const cv = document.getElementById('cv'), stage = document.getElementById('stage');
const renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(28, 1, .05, 50);
const sun = new T.DirectionalLight('#ffffff', Math.PI * .85); sun.position.set(1.4, 2.6, 3.0); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -1.2, right: 1.2, top: 2, bottom: -.3, near: .5, far: 8 });
sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; scene.add(sun);
const hemi = new T.HemisphereLight('#ffffff', '#9c8a96', 1.1); scene.add(hemi);
const floor = new T.Mesh(new T.CircleGeometry(8, 64), new T.MeshStandardMaterial({ color: '#d9c6d1', roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const podium = new T.Mesh(new T.CylinderGeometry(.55, .58, .03, 64), new T.MeshStandardMaterial({ color: '#ffffff', roughness: .55 }));
podium.position.y = -.017; podium.receiveShadow = true; scene.add(podium);

// ================= helpers =================
function shade(hex, amt) { const c = new T.Color(hex); c.lerp(new T.Color(amt < 0 ? '#000' : '#fff'), Math.abs(amt)); return '#' + c.getHexString(); }
const texCache = new Map();
function patternTex(hex, motif, rep) {
  const key = hex + motif + rep; if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const dark = shade(hex, -.38), light = shade(hex, .5);
  x.fillStyle = hex; x.fillRect(0, 0, 256, 256);
  if (motif === 'batik') {
    for (let o = -512; o < 512; o += 64) {
      x.strokeStyle = dark; x.lineWidth = 3; x.beginPath(); x.moveTo(-10, o - 10 + 42); x.lineTo(300, o + 300 + 42); x.stroke();
      for (let t = -256; t < 512; t += 32) {
        x.save(); x.translate(t, t + o); x.rotate(Math.PI / 4);
        x.fillStyle = dark; x.beginPath(); x.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = light; x.beginPath(); x.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2); x.fill();
        x.restore();
        x.fillStyle = light; x.beginPath(); x.arc(t + 16, t + o + 48, 2.5, 0, Math.PI * 2); x.fill();
      }
    }
  } else if (motif === 'garis') {
    x.fillStyle = dark; for (let i = 0; i < 256; i += 32) x.fillRect(i, 0, 10, 256);
  } else if (motif === 'bunga') {
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
      const cx = k * 64 + (r % 2 ? 32 : 0) + 16, cy = r * 64 + 16;
      for (const [dx, dy] of [[-64, 0], [0, 0], [64, 0], [0, -256], [0, 256], [256, 0], [-256, 0]]) {
        x.fillStyle = light; for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; x.beginPath(); x.arc(cx + dx + Math.cos(a) * 8, cy + dy + Math.sin(a) * 8, 6, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = dark; x.beginPath(); x.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2); x.fill();
      }
    }
  }
  const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(rep, rep); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4;
  texCache.set(key, tx); return tx;
}
// MToon pair [main, outline] so garments match the model's cel look
const C = hex => new T.Color(hex);
function toon(hex, motif, rep, opts = {}) {
  const map = motif && motif !== 'polos' ? patternTex(hex, motif, rep || 8) : null;
  const base = {
    color: C(map ? '#ffffff' : hex), shadeColorFactor: C(map ? '#c9c2c6' : shade(hex, -.22)),
    map, shadeMultiplyTexture: map, shadingToonyFactor: .88, shadingShiftFactor: -.05, side: opts.side ?? T.FrontSide,
    outlineWidthMode: 'worldCoordinates', outlineWidthFactor: opts.outline ?? .0012, outlineColorFactor: C(shade(hex, -.65)), outlineLightingMixFactor: 1
  };
  const m = new MToonMaterial({ ...base });
  const o = new MToonMaterial({ ...base, isOutline: true, side: T.BackSide });
  return [m, o];
}
function withOutlineGroups(geo) {
  const n = geo.index ? geo.index.count : geo.attributes.position.count;
  geo.clearGroups(); geo.addGroup(0, n, 0); geo.addGroup(0, n, 1); return geo;
}
function mk(geo, mats, parent, p, r, s) {
  const m = new T.Mesh(withOutlineGroups(geo), mats);
  m.castShadow = true; if (p) m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s);
  parent.add(m); return m;
}

// ================= springs (bounciness) =================
// Pendulum: an object that lags behind the acceleration of its anchor, then settles.
class Pendulum {
  constructor(obj, { k = 60, c = 7, gain = .06, max = .6, axes = 'xz', invert = false } = {}) {
    Object.assign(this, { obj, k, c, gain, max, axes, invert });
    this.p = new T.Vector2(); this.v = new T.Vector2();
    this.prev = null; this.prevVel = new V3(); this.base = obj.rotation.clone();
  }
  step(dt) {
    const w = new V3(); this.obj.getWorldPosition(w);
    if (!this.prev) { this.prev = w.clone(); return; }
    const vel = w.clone().sub(this.prev).divideScalar(dt);
    const acc = vel.clone().sub(this.prevVel).divideScalar(dt);
    this.prev.copy(w); this.prevVel.copy(vel);
    // acceleration into the parent's frame
    const q = new T.Quaternion(); this.obj.parent.getWorldQuaternion(q);
    acc.applyQuaternion(q.invert()).clampLength(0, 40);
    const s = this.invert ? -1 : 1;
    // lagging: positive x-accel tilts the hanging object back toward -x (rotation about z)
    const fx = acc.x * this.gain * s, fz = -acc.z * this.gain * s;
    this.v.x += (-this.k * this.p.x - this.c * this.v.x + fx) * dt;
    this.v.y += (-this.k * this.p.y - this.c * this.v.y + fz) * dt;
    this.p.addScaledVector(this.v, dt);
    this.p.clampScalar(-this.max, this.max);
    this.obj.rotation.z = this.base.z + this.p.x;
    this.obj.rotation.x = this.base.x + this.p.y;
  }
}
// Chain spring for hair strands (verlet, like VRM spring bones)
class Chain {
  constructor(bones, { stiffness = .6, drag = .35, gravity = .9, colliders = [], maxAngle = 1.2 } = {}) {
    Object.assign(this, { bones, stiffness, drag, gravity, colliders, maxAngle });
    this.joints = [];
    for (let i = 0; i < bones.length; i++) {
      const b = bones[i], child = bones[i + 1];
      const tailLocal = child ? child.position.clone() : b.userData.tail.clone();
      this.joints.push({ b, rest: b.quaternion.clone(), dir: tailLocal.clone().normalize(), len: tailLocal.length(), cur: null, prev: null });
    }
  }
  reset() { for (const j of this.joints) j.cur = null; }
  step(dt) {
    const pq = new T.Quaternion(), head = new V3(), tmp = new V3();
    for (const j of this.joints) {
      j.b.quaternion.copy(j.rest); j.b.updateMatrixWorld(true);
      j.b.parent.getWorldQuaternion(pq);
      const wRest = pq.clone().multiply(j.rest);
      j.b.getWorldPosition(head);
      const restTail = j.dir.clone().applyQuaternion(wRest).multiplyScalar(j.len).add(head);
      if (!j.cur) { j.cur = restTail.clone(); j.prev = restTail.clone(); }
      const inertia = j.cur.clone().sub(j.prev).multiplyScalar(1 - this.drag);
      const stiff = restTail.clone().sub(j.cur).multiplyScalar(this.stiffness * Math.min(1, dt * 20));
      const next = j.cur.clone().add(inertia).add(stiff).add(tmp.set(0, -this.gravity * dt * dt * 9.8, 0));
      for (const c of this.colliders) {
        const center = c.center();
        const d = next.clone().sub(center); const r = c.r;
        if (d.length() < r) next.copy(center).add(d.normalize().multiplyScalar(r));
      }
      next.sub(head).normalize().multiplyScalar(j.len).add(head);
      // limit how far a strand can swing from rest
      const from = j.dir.clone().applyQuaternion(wRest), to = next.clone().sub(head).normalize();
      const ang = from.angleTo(to);
      if (ang > this.maxAngle) { to.lerpVectors(from, to, this.maxAngle / ang).normalize(); next.copy(head).addScaledVector(to, j.len); }
      j.prev.copy(j.cur); j.cur.copy(next);
      const delta = new T.Quaternion().setFromUnitVectors(from, to);
      const wNew = delta.multiply(wRest);
      j.b.quaternion.copy(pq.clone().invert().multiply(wNew));
      j.b.updateMatrixWorld(true);
    }
  }
}

// ================= model state =================
let vrm, body, hairMesh, rawBone, nb, skinMats = [], hairMat0, skeleton, bindMatrix, bodyParent;
let origIndex, vInfo, triCount;
let worn = [], pendulums = [], chains = [], skirt = null;
const root = new T.Group(); scene.add(root);

function rawB(n) { return vrm.humanoid.getRawBoneNode(n); }

async function load() {
  const loader = new GLTFLoader(); loader.register(p => new VRMLoaderPlugin(p));
  const bar = document.getElementById('loadBar'), txt = document.getElementById('loadTxt');
  const gltf = await loader.loadAsync('models/ayu.vrm', e => {
    if (e.total) { const p = e.loaded / e.total; bar.style.width = (p * 100).toFixed(0) + '%'; txt.textContent = 'Memuat model 3D · ' + Math.round(p * 100) + '%'; }
  });
  vrm = gltf.userData.vrm;
  VRMUtils.rotateVRM0(vrm);
  // the model ships a chest spring group; it is intentionally switched off
  vrm.springBoneManager = undefined;
  root.add(vrm.scene);
  vrm.lookAt.target = camera;
  vrm.scene.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
  const sk = []; vrm.scene.traverse(o => { if (o.isSkinnedMesh) sk.push(o); });
  body = sk.find(m => m.name.startsWith('Body') && !m.name.endsWith('_1'));
  hairMesh = sk.find(m => m.name.startsWith('Body') && m.name.endsWith('_1'));
  skeleton = body.skeleton; bindMatrix = body.bindMatrix; bodyParent = body.parent;
  for (const m of sk) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mt of mats) if (mt.name && mt.name.includes('_SKIN') && !mt.isOutline) skinMats.push(mt);
  }
  hairMat0 = (Array.isArray(hairMesh.material) ? hairMesh.material : [hairMesh.material]).filter(m => !m.isOutline);
  greyHairTexture();
  nb = n => vrm.humanoid.getNormalizedBoneNode(n);
  analyzeBody();
}

function greyHairTexture() {
  for (const m of hairMat0) {
    const img = m.map && m.map.image; if (!img) continue;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height); const a = d.data;
    let mx = 1; for (let i = 0; i < a.length; i += 4) mx = Math.max(mx, .3 * a[i] + .59 * a[i + 1] + .11 * a[i + 2]);
    for (let i = 0; i < a.length; i += 4) { const l = Math.min(255, (.3 * a[i] + .59 * a[i + 1] + .11 * a[i + 2]) / mx * 255 * 1.05); a[i] = a[i + 1] = a[i + 2] = l; }
    x.putImageData(d, 0, 0);
    const t = new T.CanvasTexture(c); t.flipY = false; t.colorSpace = T.SRGBColorSpace; t.wrapS = m.map.wrapS; t.wrapT = m.map.wrapT;
    m.map = t; if (m.shadeMultiplyTexture) m.shadeMultiplyTexture = t;
  }
  const outl = (Array.isArray(hairMesh.material) ? hairMesh.material : []).filter(m => m.isOutline);
  hairMat0.push(...outl.map(o => Object.assign(o, { __outline: true })));
}

// classify every body vertex by the bone that dominates it
function analyzeBody() {
  const g = body.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const boneGroup = skeleton.bones.map(b => {
    let o = b; while (o && !/^J_Bip/.test(o.name)) o = o.parent;
    const n = o ? o.name : 'J_Bip_C_Hips';
    if (/Hips/.test(n)) return 'hips';
    if (/Spine|Chest|Shoulder/.test(n)) return 'torso';
    if (/Neck/.test(n)) return 'neck';
    if (/Head/.test(n)) return 'head';
    if (/UpperArm/.test(n)) return 'uarm';
    if (/LowerArm/.test(n)) return 'larm';
    if (/Hand|Thumb|Index|Middle|Ring|Little/.test(n)) return 'hand';
    if (/UpperLeg/.test(n)) return 'uleg';
    if (/LowerLeg/.test(n)) return 'lleg';
    return 'foot';
  });
  const N = pos.count; const Y = new Float32Array(N), AX = new Float32Array(N), Z = new Float32Array(N), AT = new Float32Array(N); const G = new Array(N);
  for (let i = 0; i < N; i++) {
    let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
    G[i] = boneGroup[best]; Y[i] = pos.getY(i); AX[i] = Math.abs(pos.getX(i)); Z[i] = pos.getZ(i);
    AT[i] = (AX[i] - .109) / .434;
  }
  vInfo = { Y, AX, Z, AT, G };
  origIndex = g.index.array.slice(); triCount = origIndex.length / 3;
}

// ---------- garments generated from the body surface ----------
const isArm = g => g === 'uarm' || g === 'larm';
const band = (i, lo, hi) => { const { Y, G } = vInfo; return Y[i] > lo && Y[i] < hi && !isArm(G[i]) && G[i] !== 'hand' && G[i] !== 'head' && G[i] !== 'foot'; };
const sleeve = (i, t) => isArm(vInfo.G[i]) && vInfo.AT[i] < t;
const scoop = (i, y0, w) => vInfo.Y[i] > y0 && vInfo.Z[i] < -.01 && vInfo.AX[i] < w;
const vneck = i => { const { Y, Z, AX } = vInfo; return Y[i] > 1.13 && Z[i] < -.02 && AX[i] < (Y[i] - 1.13) * .55; };
let tuck = 0; // raised hem when the top is tucked into a skirt
const top = (i, lo) => { const { Y, G } = vInfo; return Y[i] > Math.max(lo, tuck) && (G[i] === 'torso' || G[i] === 'hips' || G[i] === 'uleg'); };
const collar = (i, hi) => vInfo.G[i] === 'neck' && vInfo.Y[i] < hi;
const REGIONS = {
  kaos: { off: .010, drape: true, f: i => top(i, .80) || sleeve(i, .33) },
  tank: { off: .010, drape: true, f: i => { const { Y, AX } = vInfo; return top(i, .80) && (Y[i] < 1.252 || (AX[i] > .04 && AX[i] < .1)); } },
  kemeja: { off: .011, drape: true, f: i => top(i, .79) || collar(i, 1.315) || sleeve(i, .96) },
  kebaya: { off: .013, drape: true, f: i => top(i, .74) || collar(i, 1.3) || sleeve(i, .96) },
  sweater: { off: .016, drape: true, f: i => top(i, .80) || collar(i, 1.31) || sleeve(i, .96) },
  jaket: { off: .021, drape: true, f: i => top(i, .77) || collar(i, 1.335) || sleeve(i, .975) },
  gauntop: { off: .010, drape: true, f: i => top(i, .86) || sleeve(i, .3) },
  gamistop: { off: .012, drape: true, f: i => top(i, .86) || collar(i, 1.31) || sleeve(i, .97) },
  celanapanjang: { off: .008, f: i => band(i, .105, .955) },
  celanapendek: { off: .009, f: i => band(i, .63, .955) },
  sneakers: { off: .013, f: i => { const { Y, G } = vInfo; return (G[i] === 'foot' || G[i] === 'lleg') && Y[i] < .115; } },
  boots: { off: .014, f: i => { const { Y, G } = vInfo; return (G[i] === 'foot' || G[i] === 'lleg') && Y[i] < .38; } },
  flats: { off: .009, f: i => vInfo.G[i] === 'foot' && vInfo.Y[i] < .05 },
  heels: { off: .009, f: i => vInfo.G[i] === 'foot' && vInfo.Y[i] < .048 },
  sandal: { off: .006, f: i => { const { Y, Z, G } = vInfo; return G[i] === 'foot' && (Y[i] < .013 || (Z[i] < -.05 && Z[i] > -.08 && Y[i] < .055)); } }
};
const regionCache = new Map();
function region(id) {
  const key = id + ':' + tuck; if (regionCache.has(key)) return regionCache.get(key);
  const { f, off } = REGIONS[id]; const g = body.geometry;
  const pass = new Uint8Array(g.attributes.position.count); for (let i = 0; i < pass.length; i++) pass[i] = f(i) ? 1 : 0;
  const keep = [], tris = [];
  for (let t = 0; t < triCount; t++) {
    const a = origIndex[t * 3], b = origIndex[t * 3 + 1], c = origIndex[t * 3 + 2];
    if (pass[a] && pass[b] && pass[c]) { keep.push(a, b, c); tris.push(t); }
  }
  const pos = g.attributes.position, nor = g.attributes.normal;
  const p = new Float32Array(pos.count * 3);
  const drape = REGIONS[id].drape;
  for (let i = 0; i < pos.count; i++) {
    p[i * 3] = pos.getX(i) + nor.getX(i) * off; p[i * 3 + 1] = pos.getY(i) + nor.getY(i) * off; p[i * 3 + 2] = pos.getZ(i) + nor.getZ(i) * off;
    // fabric falls straight from the chest instead of hugging the body (front is -z)
    if (drape) {
      const y = pos.getY(i), g = vInfo.G[i];
      if ((g === 'torso' || g === 'hips') && y > .9 && y < 1.17 && p[i * 3 + 2] < .02) {
        const env = -.13 - off + Math.max(0, 1.15 - y) * .12;
        const w = Math.min(1, Math.max(0, (1.17 - y) / .04)) * Math.min(1, Math.max(0, (.04 - pos.getX(i) ** 2 * 6 - (p[i * 3 + 2] + .02) * 0) * 25));
        if (p[i * 3 + 2] > env && pos.getZ(i) < -.02) p[i * 3 + 2] += (env - p[i * 3 + 2]) * Math.min(1, w + .6) * Math.min(1, (-.02 - pos.getZ(i)) * 30);
      }
    }
  }
  const ng = new T.BufferGeometry();
  ng.setAttribute('position', new T.BufferAttribute(p, 3));
  for (const k of ['uv', 'skinIndex', 'skinWeight']) ng.setAttribute(k, g.attributes[k]);
  ng.setAttribute('normal', g.attributes.normal);
  ng.setIndex(keep); withOutlineGroups(ng);
  const r = { geo: ng, tris }; regionCache.set(key, r); return r;
}
function wearRegion(id, mats, hide = true) {
  const r = region(id);
  const m = new T.SkinnedMesh(r.geo, mats); m.frustumCulled = false; m.castShadow = true;
  bodyParent.add(m); m.bind(skeleton, bindMatrix); worn.push({ obj: m, own: false });
  if (hide) for (const t of r.tris) hidden.add(t);
  return m;
}
let hidden = new Set();
function applyBodyHide() {
  const out = []; for (let t = 0; t < triCount; t++) if (!hidden.has(t)) out.push(origIndex[t * 3], origIndex[t * 3 + 1], origIndex[t * 3 + 2]);
  const g = body.geometry; g.setIndex(out);
  for (const gr of g.groups) { gr.start = 0; gr.count = out.length; }
}

// ---------- skirt: skinned to hips and legs, with morph targets for bounce ----------
function buildSkirt(len, rBot, mats) {
  const S = 48, R = 14, yTop = .975, yBot = yTop - len, cz = -.008, rxT = .148, rzT = .122;
  const hipsI = skeleton.bones.findIndex(b => /Hips$/.test(b.name));
  const lI = skeleton.bones.findIndex(b => /L_UpperLeg$/.test(b.name)), rI = skeleton.bones.findIndex(b => /R_UpperLeg$/.test(b.name));
  const pos = [], uv = [], si = [], sw = [], mX = [], mZ = [], mF = [], idx = [];
  for (let j = 0; j <= R; j++) {
    const t = j / R, y = yTop - len * t;
    const e = Math.sqrt(t) * .55 + t * .45;
    const rx = rxT + (rBot - rxT) * e + .012, rz = rzT + (rBot * .88 - rzT) * e + .012;
    for (let i = 0; i <= S; i++) {
      const a = i / S * Math.PI * 2, sx = Math.sin(a), cz2 = Math.cos(a);
      pos.push(sx * rx, y, cz - cz2 * rz);
      uv.push(i / S * 6, t * 3);
      const legW = Math.min(.8, t * .95), u = (sx + 1) / 2; // u: 0 at raw -x (left leg), 1 at +x (right leg)
      si.push(hipsI, lI, rI, 0); sw.push(1 - legW, legW * (1 - u), legW * u, 0);
      const k = t * t;
      mX.push(.09 * k, 0, 0); mZ.push(0, 0, .09 * k); mF.push(sx * .07 * k, .025 * k, -cz2 * .07 * k);
    }
  }
  for (let j = 0; j < R; j++) for (let i = 0; i < S; i++) {
    const a = j * (S + 1) + i, b = a + S + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
  g.setIndex(idx); g.computeVertexNormals();
  g.morphAttributes.position = [new T.Float32BufferAttribute(mX, 3), new T.Float32BufferAttribute(mZ, 3), new T.Float32BufferAttribute(mF, 3)];
  g.morphTargetsRelative = true; withOutlineGroups(g);
  for (const m of mats) if (!m.isOutline) m.side = T.DoubleSide;
  const m = new T.SkinnedMesh(g, mats); m.frustumCulled = false; m.castShadow = true; m.morphTargetInfluences = [0, 0, 0];
  bodyParent.add(m); m.bind(skeleton, bindMatrix); worn.push({ obj: m, own: true });
  // waistband
  skirt = { mesh: m, p: new T.Vector2(), v: new T.Vector2(), flare: 0, prev: null, prevVel: new V3() };
  return m;
}
function stepSkirt(dt, spinVel) {
  if (!skirt) return;
  const hips = rawB('hips');
  const w = new V3(0, -.35, 0).applyMatrix4(hips.matrixWorld);
  if (!skirt.prev) { skirt.prev = w.clone(); return; }
  const vel = w.clone().sub(skirt.prev).divideScalar(dt), acc = vel.clone().sub(skirt.prevVel).divideScalar(dt);
  skirt.prev.copy(w); skirt.prevVel.copy(vel);
  const q = new T.Quaternion(); hips.getWorldQuaternion(q); acc.applyQuaternion(q.invert()).clampLength(0, 30);
  const k = 70, c = 8, gain = .045;
  skirt.v.x += (-k * skirt.p.x - c * skirt.v.x - acc.x * gain) * dt;
  skirt.v.y += (-k * skirt.p.y - c * skirt.v.y - acc.z * gain) * dt;
  skirt.p.addScaledVector(skirt.v, dt); skirt.p.clampScalar(-1, 1);
  const fl = Math.min(1, Math.abs(spinVel) * .22 + vel.length() * .6);
  skirt.flare += (fl - skirt.flare) * Math.min(1, dt * 4);
  const mi = skirt.mesh.morphTargetInfluences;
  mi[0] = skirt.p.x * 3; mi[1] = skirt.p.y * 3; mi[2] = skirt.flare;
}

// ---------- hair strands (skinned to a small bone chain) ----------
function strand({ len, n = 4, r0, r1, arc, radial = 14 }, mats) {
  const geo = arc
    ? new T.CylinderGeometry(r0, r1, len, radial, n * 4, true, arc[0], arc[1])
    : new T.CylinderGeometry(r0, r1, len, radial, n * 4, false);
  geo.translate(0, -len / 2, 0);
  const p = geo.attributes.position, si = [], sw = [];
  for (let i = 0; i < p.count; i++) {
    const f = Math.min(n - .0001, Math.max(0, -p.getY(i) / len * n)); const a = Math.floor(f), w = f - a;
    si.push(a, Math.min(n - 1, a + 1), 0, 0); sw.push(1 - w, w, 0, 0);
  }
  geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
  withOutlineGroups(geo);
  if (arc) for (const m of mats) if (!m.isOutline) m.side = T.DoubleSide;
  const bones = []; for (let i = 0; i < n; i++) { const b = new T.Bone(); if (i) b.position.y = -len / n; bones.push(b); if (i) bones[i - 1].add(b); }
  bones[n - 1].userData.tail = new V3(0, -len / n, 0);
  const m = new T.SkinnedMesh(geo, mats); m.add(bones[0]); m.bind(new T.Skeleton(bones));
  m.frustumCulled = false; m.castShadow = true;
  return { mesh: m, bones };
}

// head-local frame (raw bone axes): front is -z, up is +y
const HEADC = new V3(0, .088, .005);
function colliders() {
  const head = rawB('head'), chest = rawB('upperChest'), hips = rawB('hips');
  return [
    { r: .118, center: () => HEADC.clone().applyMatrix4(head.matrixWorld) },
    { r: .135, center: () => new V3(0, .0, .03).applyMatrix4(chest.matrixWorld) },
    { r: .12, center: () => new V3(0, -.06, .03).applyMatrix4(chest.matrixWorld) },
    { r: .15, center: () => new V3(0, -.03, .02).applyMatrix4(hips.matrixWorld) }
  ];
}
function own(obj) { worn.push({ obj, own: true }); return obj; }

function buildHair() {
  const head = rawB('head');
  const h = state.hair, hex = h === 'hijab' ? state.hijabColor : state.hairColor;
  // tint the painted hair cap
  const hc = new T.Color(state.hairColor);
  for (const m of hairMat0) {
    if (m.__outline) { if (m.uniforms?.outlineColorFactor) m.uniforms.outlineColorFactor.value.copy(new T.Color(shade(state.hairColor, -.6))); continue; }
    m.uniforms.litFactor.value.copy(hc); m.uniforms.shadeColorFactor.value.copy(new T.Color(shade(state.hairColor, -.35)));
  }
  hairMesh.visible = h !== 'hijab';
  const mats = () => toon(hex, null, 1, { outline: .001 });
  if (h === 'hijab') {
    const hood = mk(new T.SphereGeometry(.136, 40, 24, Math.PI * 1.5 + .32 * Math.PI, Math.PI * 1.36, 0, Math.PI * .76), toon(hex, null, 1, { side: T.DoubleSide }), head, [0, .086, .012], 0, [1.02, 1.06, 1.08]);
    own(hood);
    own(mk(new T.SphereGeometry(.137, 40, 16, 0, Math.PI * 2, 0, Math.PI * .36), mats(), head, [0, .086, .012], 0, [1.02, 1.06, 1.08]));
    const chest = rawB('upperChest');
    const pivot = new T.Group(); pivot.position.set(0, .18, .0); chest.add(pivot); own(pivot);
    const prof = [[.275, -.27], [.27, -.25], [.22, -.17], [.15, -.09], [.09, -.03], [.07, 0]].map(([r, y]) => new T.Vector2(r, y));
    mk(new T.LatheGeometry(prof, 48), toon(hex, null, 1, { side: T.DoubleSide }), pivot, [0, 0, -.018], 0, [1, 1, .95]);
    pendulums.push(new Pendulum(pivot, { k: 90, c: 10, gain: .02, max: .15 }));
    return;
  }
  if (h === 'bob') {
    const piv = new T.Group(); piv.position.copy(HEADC); head.add(piv); own(piv);
    mk(new T.SphereGeometry(.13, 40, 20, Math.PI * 1.5 + .36 * Math.PI, Math.PI * 1.28, Math.PI * .28, Math.PI * .45), toon(hex, null, 1, { side: T.DoubleSide }), piv, [0, 0, .004], 0, [1.08, 1.02, 1.06]);
    pendulums.push(new Pendulum(piv, { k: 120, c: 9, gain: .012, max: .12 }));
  }
  if (h === 'panjang') {
    const s = strand({ len: .55, n: 4, r0: .105, r1: .17, arc: [-.58 * Math.PI, 1.16 * Math.PI], radial: 28 }, mats());
    s.mesh.position.set(0, .115, .018); head.add(s.mesh); own(s.mesh);
    chains.push(new Chain(s.bones, { stiffness: .35, drag: .25, gravity: .6, colliders: [], maxAngle: .35 }));
  }
  if (h === 'ekorkuda') {
    own(mk(new T.SphereGeometry(.026, 14, 10), toon(shade(hex, -.25)), head, [0, .17, .118]));
    const s = strand({ len: .38, n: 5, r0: .042, r1: .012 }, mats());
    s.mesh.position.set(0, .168, .13); s.mesh.rotation.x = -.45; head.add(s.mesh); own(s.mesh);
    chains.push(new Chain(s.bones, { stiffness: .25, drag: .18, gravity: 1, colliders: colliders(), maxAngle: 1.3 }));
  }
  if (h === 'sanggul') {
    const piv = new T.Group(); piv.position.set(0, .06, .12); head.add(piv); own(piv);
    mk(new T.SphereGeometry(.056, 24, 18), mats(), piv, [0, 0, .03], 0, [1.25, .85, 1]);
    mk(new T.CylinderGeometry(.004, .004, .13, 6), toon("#D4AF37"), piv, [0, .02, .05], [0, 0, 1.15]);
    pendulums.push(new Pendulum(piv, { k: 160, c: 10, gain: .01, max: .1 }));
  }
}

function buildAcc() {
  const a = state.acc, c = state.accColor, head = rawB('head');
  if (a.kacamata) {
    const g = new T.Group(); g.position.set(0, .05, -.118); head.add(g); own(g);
    const fm = toon(c, null, 1, { outline: .0005 });
    for (const sx of [-1, 1]) {
      mk(new T.TorusGeometry(.03, .0045, 8, 28), fm, g, [sx * .046, 0, 0]);
      const lens = new T.Mesh(new T.CircleGeometry(.03, 24), new T.MeshBasicMaterial({ color: '#2a2a3a', transparent: true, opacity: .28 }));
      lens.position.set(sx * .046, 0, -.001); lens.rotation.y = Math.PI; g.add(lens);
      mk(new T.BoxGeometry(.005, .005, .11), fm, g, [sx * .102, .006, .055]);
    }
    mk(new T.BoxGeometry(.03, .005, .005), fm, g, [0, .008, 0]);
  }
  if (a.topi) {
    const hm = toon(c === '#D4AF37' ? '#E6CF9A' : c);
    const g = new T.Group(); g.position.set(0, .155, .012); g.rotation.x = .1; head.add(g); own(g);
    mk(new T.CylinderGeometry(.21, .21, .01, 48), hm, g, [0, 0, 0]);
    mk(new T.CylinderGeometry(.118, .128, .085, 40), hm, g, [0, .045, 0]);
    mk(new T.CylinderGeometry(.13, .13, .022, 40), toon('#B5485D'), g, [0, .012, 0]);
  }
  if (a.anting && state.hair !== 'hijab') {
    for (const sx of [-1, 1]) {
      const piv = new T.Group(); piv.position.set(sx * .096, .045, .022); head.add(piv); own(piv);
      mk(new T.SphereGeometry(.006, 10, 8), toon(c), piv, [0, 0, 0]);
      mk(new T.CylinderGeometry(.0015, .0015, .025, 6), toon(c), piv, [0, -.014, 0]);
      mk(new T.SphereGeometry(.011, 12, 10), toon(c), piv, [0, -.03, 0]);
      pendulums.push(new Pendulum(piv, { k: 45, c: 3.5, gain: .09, max: .9 }));
    }
  }
  if (a.kalung) {
    const chest = rawB('upperChest');
    const g = new T.Group(); g.position.set(0, .1, .0); chest.add(g); own(g);
    mk(new T.TorusGeometry(1, .045, 8, 64), toon(c, null, 1, { outline: 0 }), g, [0, 0, -.012], [Math.PI / 2 - .55, 0, 0], [.088, .12, .088]);
    const piv = new T.Group(); piv.position.set(0, -.064, -.115); g.add(piv);
    mk(new T.SphereGeometry(.012, 14, 10), toon(c), piv, [0, -.012, 0]);
    pendulums.push(new Pendulum(piv, { k: 70, c: 5, gain: .05, max: .5 }));
  }
  if (a.tas) {
    const bc = c === '#D4AF37' || c === '#C0C0C8' ? '#5A3A2E' : c;
    const chest = rawB('upperChest'), hips = rawB('hips');
    const pts = [[.1, 1.33, .03], [.085, 1.29, -.07], [.04, 1.2, -.165], [-.03, 1.1, -.162], [-.1, .99, -.13], [-.15, .93, -.08]]
      .map(p => new V3(...p));
    // points above are in the model's own space; convert them into chest space
    vrm.scene.updateMatrixWorld(true);
    const inv = chest.matrixWorld.clone().invert(), sceneM = vrm.scene.matrixWorld;
    const local = pts.map(p => p.clone().applyMatrix4(sceneM).applyMatrix4(inv));
    const strap = new T.Mesh(withOutlineGroups(new T.TubeGeometry(new T.CatmullRomCurve3(local), 40, .006, 6)), toon(bc, null, 1, { outline: .0006 }));
    strap.castShadow = true; chest.add(strap); own(strap);
    const piv = new T.Group(); piv.position.set(-.155, .03, -.06); hips.add(piv); own(piv);
    const bm = toon(bc);
    mk(new T.BoxGeometry(.17, .13, .055), bm, piv, [-.01, -.1, 0], [0, .35, 0]);
    mk(new T.BoxGeometry(.172, .05, .057), toon(shade(bc, -.2)), piv, [-.01, -.06, -.001], [0, .35, 0]);
    mk(new T.SphereGeometry(.011, 10, 8), toon('#D4AF37'), piv, [.008, -.08, -.03]);
    pendulums.push(new Pendulum(piv, { k: 30, c: 4, gain: .07, max: .7 }));
  }
}

function clearOutfit() {
  for (const w of worn) {
    w.obj.parent && w.obj.parent.remove(w.obj);
    if (w.own) w.obj.traverse(o => { if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } });
    else (Array.isArray(w.obj.material) ? w.obj.material : [w.obj.material]).forEach(m => m.dispose());
  }
  worn = []; pendulums = []; chains = []; skirt = null; hidden = new Set();
}

function rebuild() {
  if (!vrm) return;
  clearOutfit();
  // skin
  const sc = new T.Color(state.skin), base = new T.Color('#FBE6DA');
  const tint = new T.Color(Math.min(1, sc.r / base.r), Math.min(1, sc.g / base.g), Math.min(1, sc.b / base.b));
  for (const m of skinMats) { m.uniforms.litFactor.value.copy(tint); m.uniforms.shadeColorFactor.value.copy(tint.clone().multiplyScalar(.82)); }
  const skirtOn = state.dress !== 'none' || state.bottom === 'rokpendek' || state.bottom === 'rokpanjang';
  tuck = skirtOn ? .935 : 0;
  if (state.dress === 'none') {
    wearRegion(state.top, toon(state.topColor, state.topMotif, 9));
    const b = state.bottom;
    if (b === 'celanapanjang' || b === 'celanapendek') wearRegion(b, toon(state.bottomColor, state.bottomMotif, 9));
    else buildSkirt(b === 'rokpendek' ? .33 : .85, b === 'rokpendek' ? .2 : .25, toon(state.bottomColor, state.bottomMotif, 1));
  } else {
    wearRegion(state.dress === 'gaun' ? 'gauntop' : 'gamistop', toon(state.dressColor, state.dressMotif, 9));
    buildSkirt(state.dress === 'gaun' ? .52 : .87, state.dress === 'gaun' ? .24 : .27, toon(state.dressColor, state.dressMotif, 1));
  }
  if (state.shoes !== 'none') {
    wearRegion(state.shoes, toon(state.shoesColor, null, 1, { outline: .0008 }));
    if (state.shoes === 'heels') for (const s of ['leftFoot', 'rightFoot']) own(mk(new T.CylinderGeometry(.009, .006, .055, 10), toon(shade(state.shoesColor, -.4)), rawB(s), [0, -.062, .045]));
  }
  if (state.dress === 'none' && state.top === 'kebaya') {
    const chest = rawB('upperChest');
    for (let k = 0; k < 3; k++) own(mk(new T.SphereGeometry(.011 - k * .002, 12, 10), toon('#D4AF37', null, 1, { outline: .0004 }), chest, [0, .07 - k * .06, -.145 + k * .012]));
  }
  applyBodyHide();
  buildHair(); buildAcc();
  const bg = BGDATA[state.bg];
  scene.background = new T.Color(bg.sky); scene.fog = new T.Fog(bg.sky, 7, 16);
  floor.material.color.set(bg.floor); stage.style.background = bg.sky;
  sun.intensity = state.bg === 'malam' ? Math.PI * .45 : Math.PI * .85; hemi.intensity = state.bg === 'malam' ? .55 : 1.1;
  vrm.scene.updateMatrixWorld(true);
  for (const c of chains) c.reset();
}

// ================= poses =================
const POSE_BONES = ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand',
  'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot'];
const ARM = new Set(['leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand']);
const cur = {}; for (const b of POSE_BONES) cur[b] = [0, 0, 0]; cur.hipsPos = [0, 0, 0];
let hipsRest = null;
function idle(t) {
  const br = Math.sin(t * 1.7), sw = Math.sin(t * .55);
  return {
    leftUpperArm: [.06, 0, -1.22 + .02 * br], rightUpperArm: [.06, 0, 1.22 - .02 * br],
    leftLowerArm: [0, -.18, 0], rightLowerArm: [0, .18, 0], leftHand: [0, 0, -.12], rightHand: [0, 0, .12],
    hips: [0, 0, .03 * sw], hipsPos: [.012 * sw, 0, 0], spine: [0, 0, -.02 * sw], upperChest: [.018 * br, 0, 0],
    neck: [0, 0, .012 * sw], head: [0, 0, 0],
    leftUpperLeg: [0, 0, -.03 * sw], rightUpperLeg: [0, 0, -.03 * sw], leftFoot: [0, 0, .03 * sw], rightFoot: [0, 0, .03 * sw]
  };
}
function pose(act, t) {
  const p = idle(t);
  if (act === 'catwalk') {
    const f = t * 4.6, s = Math.sin(f), c = Math.cos(f);
    const L = -s * .42, R = s * .42;
    const kL = .75 * Math.max(0, c) ** 1.5 + .08, kR = .75 * Math.max(0, -c) ** 1.5 + .08;
    Object.assign(p, {
      leftUpperLeg: [L, 0, 0], rightUpperLeg: [R, 0, 0], leftLowerLeg: [kL, 0, 0], rightLowerLeg: [kR, 0, 0],
      leftFoot: [-(L + kL) * .6, 0, 0], rightFoot: [-(R + kR) * .6, 0, 0],
      leftUpperArm: [.32 * s, 0, -1.25], rightUpperArm: [-.32 * s, 0, 1.25],
      hips: [0, .14 * s, .06 * s], spine: [0, -.08 * s, -.03 * s], head: [0, -.04 * s, 0],
      hipsPos: [.018 * s, -.012 + .014 * Math.abs(c), 0]
    });
  } else if (act === 'lambai') {
    Object.assign(p, {
      rightUpperArm: [-.15, 0, -.25], rightLowerArm: [0, .25, -1.2 + .35 * Math.sin(t * 8)], rightHand: [0, 0, -.1],
      head: [0, .05, .08], spine: [0, 0, .03]
    });
  } else if (act === 'gaya') {
    Object.assign(p, {
      leftUpperArm: [.12, 0, -.85], leftLowerArm: [0, -.35, -1.55], leftHand: [0, 0, -.3],
      hips: [0, .12, .08], hipsPos: [.03, -.006, 0], spine: [0, -.08, -.06], upperChest: [0, -.04, -.03], head: [0, .1, .12],
      rightUpperLeg: [-.12, -.1, .06], rightLowerLeg: [.22, 0, 0], rightFoot: [-.08, 0, 0], leftUpperLeg: [0, 0, -.06]
    });
  } else if (act === 'menari') {
    const f = t * 4.2, s = Math.sin(f), b = Math.abs(Math.sin(f));
    Object.assign(p, {
      leftUpperArm: [-.2, 0, .35 + .25 * s], leftLowerArm: [0, -.4, .9], rightUpperArm: [-.2, 0, -.35 + .25 * s], rightLowerArm: [0, .4, -.9],
      hips: [0, .1 * s, .1 * s], hipsPos: [.03 * s, -.025 * b, 0], spine: [0, -.06 * s, -.06 * s], head: [0, .08 * s, .1 * s],
      leftUpperLeg: [-.12 * b, 0, -.04], rightUpperLeg: [-.12 * b, 0, .04], leftLowerLeg: [.24 * b, 0, 0], rightLowerLeg: [.24 * b, 0, 0],
      leftFoot: [-.12 * b, 0, 0], rightFoot: [-.12 * b, 0, 0]
    });
  }
  return p;
}
function applyPose(dt, t) {
  const tgt = pose(state.act, t), k = Math.min(1, dt * 7);
  for (const b of POSE_BONES) {
    const v = tgt[b] || [0, 0, 0], c = cur[b];
    for (let i = 0; i < 3; i++) c[i] += (v[i] - c[i]) * k;
    const n = nb(b); if (!n) continue;
    if (ARM.has(b)) n.rotation.set(c[0], -c[1], -c[2]); else n.rotation.set(c[0], c[1], c[2]);
  }
  const hp = tgt.hipsPos || [0, 0, 0];
  for (let i = 0; i < 3; i++) cur.hipsPos[i] += (hp[i] - cur.hipsPos[i]) * k;
  const h = nb('hips'); if (!hipsRest) hipsRest = h.position.clone();
  h.position.set(hipsRest.x + cur.hipsPos[0], hipsRest.y + cur.hipsPos[1], hipsRest.z + cur.hipsPos[2]);
}
// expressions + blinking
const exprCur = { happy: 0, relaxed: 0, Surprised: 0, blink: 0, aa: 0 };
let blinkT = 2;
function applyExpr(dt, t) {
  const tgt = { happy: 0, relaxed: 0, Surprised: 0, aa: 0 };
  if (state.expr === 'senyum') tgt.relaxed = .9;
  if (state.expr === 'ceria') tgt.happy = 1;
  if (state.expr === 'kaget') { tgt.Surprised = 1; }
  if (state.act === 'lambai' && state.expr === 'netral') tgt.relaxed = .6;
  const k = Math.min(1, dt * 8);
  for (const n in tgt) { exprCur[n] += (tgt[n] - exprCur[n]) * k; vrm.expressionManager.setValue(n, exprCur[n]); }
  blinkT -= dt; let bl = 0;
  if (blinkT < .14) bl = Math.sin((1 - blinkT / .14) * Math.PI); if (blinkT < 0) blinkT = 2.5 + Math.random() * 3;
  vrm.expressionManager.setValue('blink', state.expr === 'ceria' ? 0 : bl);
}

// ================= camera =================
const CAMP = {
  penuh: { y: .86, d: 3.7, h: .08 }, wajah: { y: 1.47, d: .72, h: .0 }, atas: { y: 1.12, d: 1.45, h: .05 },
  bawah: { y: .52, d: 2.0, h: .12 }, kaki: { y: .14, d: 1.0, h: .28 }
};
const camState = { y: .82, d: 3.5, h: .1, zoom: 1, yaw: 0 };
const TAB_CAM = { kulit: 'penuh', rambut: 'wajah', atasan: 'atas', bawahan: 'bawah', gaun: 'penuh', sepatu: 'kaki', aksesori: 'wajah', gaya: 'penuh', latar: 'penuh' };
function updateCamera(dt) {
  const p = CAMP[state.cam], k = Math.min(1, dt * 3.2);
  const aspect = camera.aspect, wide = aspect < .75 ? .75 / aspect : 1;
  camState.y += (p.y - camState.y) * k; camState.d += (p.d * Math.min(1.6, wide) - camState.d) * k; camState.h += (p.h - camState.h) * k;
  const d = camState.d * camState.zoom;
  camera.position.set(Math.sin(camState.yaw) * d, camState.y + camState.h * d, Math.cos(camState.yaw) * d);
  camera.lookAt(0, camState.y, 0);
}

// ================= UI =================
const $ = id => document.getElementById(id);
const TABS = [['kulit', 'Kulit'], ['rambut', 'Rambut'], ['atasan', 'Atasan'], ['bawahan', 'Bawahan'], ['gaun', 'Gaun'], ['sepatu', 'Sepatu'], ['aksesori', 'Aksesori'], ['gaya', 'Pose'], ['latar', 'Latar']];
function chips(title, list, curv, onPick, multi) {
  const s = document.createElement('div'); s.className = 'sect';
  s.innerHTML = `<h3>${title}</h3>`; const w = document.createElement('div'); w.className = 'chips';
  for (const [id, lab] of list) {
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = lab;
    b.setAttribute('aria-pressed', multi ? !!curv[id] : curv === id); b.onclick = () => onPick(id); w.appendChild(b);
  }
  s.appendChild(w); return s;
}
function swatches(title, list, curv, onPick) {
  const s = document.createElement('div'); s.className = 'sect';
  s.innerHTML = `<h3>${title}</h3>`; const w = document.createElement('div'); w.className = 'sw';
  for (const hex of list) {
    const b = document.createElement('button'); b.className = 'swatch'; b.style.background = hex;
    b.setAttribute('aria-label', 'Warna ' + hex); b.setAttribute('aria-pressed', curv === hex); b.onclick = () => onPick(hex); w.appendChild(b);
  }
  s.appendChild(w); return s;
}
const LOOK = ['act', 'expr', 'cam'];
function set(patch) {
  const outfit = Object.keys(patch).some(k => !LOOK.includes(k));
  Object.assign(state, patch); if (outfit) rebuild(); renderTab(); renderCams();
}
function note(t) { const p = document.createElement('p'); p.className = 'note'; p.textContent = t; return p; }
function renderTabs() {
  const el = $('tabs'); el.innerHTML = '';
  for (const [id, lab] of TABS) {
    const b = document.createElement('button'); b.className = 'tab'; b.setAttribute('role', 'tab'); b.textContent = lab;
    b.setAttribute('aria-selected', tab === id);
    b.onclick = () => { tab = id; state.cam = TAB_CAM[id]; renderTabs(); renderTab(); renderCams(); }; el.appendChild(b);
  }
}
function renderCams() {
  const el = $('cams'); el.innerHTML = '';
  for (const [id, lab] of CAMS) {
    const b = document.createElement('button'); b.className = 'tbtn'; b.textContent = lab; b.setAttribute('aria-pressed', state.cam === id);
    b.onclick = () => set({ cam: id }); el.appendChild(b);
  }
  $('bWalk').setAttribute('aria-pressed', state.act === 'catwalk');
}
function renderTab() {
  const el = $('tabBody'); el.innerHTML = ''; const add = n => el.appendChild(n);
  if (tab === 'kulit') add(swatches('Warna kulit', SKIN, state.skin, v => set({ skin: v })));
  if (tab === 'rambut') {
    add(chips('Gaya', HAIR, state.hair, v => set({ hair: v })));
    if (state.hair === 'hijab') add(swatches('Warna hijab', HIJABC, state.hijabColor, v => set({ hijabColor: v })));
    else add(swatches('Warna rambut', HAIRC, state.hairColor, v => set({ hairColor: v })));
  }
  if (tab === 'atasan') {
    if (state.dress !== 'none') add(note('Ayu sedang memakai gaun. Memilih atasan akan melepas gaunnya.'));
    add(chips('Model', TOPS, state.dress === 'none' ? state.top : '', v => set({ top: v, dress: 'none' })));
    add(swatches('Warna', CLOTH, state.topColor, v => set({ topColor: v, dress: 'none' })));
    add(chips('Motif', MOTIFS, state.topMotif, v => set({ topMotif: v, dress: 'none' })));
  }
  if (tab === 'bawahan') {
    if (state.dress !== 'none') add(note('Ayu sedang memakai gaun. Memilih bawahan akan melepas gaunnya.'));
    add(chips('Model', BOTTOMS, state.dress === 'none' ? state.bottom : '', v => set({ bottom: v, dress: 'none' })));
    add(swatches('Warna', CLOTH, state.bottomColor, v => set({ bottomColor: v, dress: 'none' })));
    add(chips('Motif', MOTIFS, state.bottomMotif, v => set({ bottomMotif: v, dress: 'none' })));
  }
  if (tab === 'gaun') {
    add(chips('Model', DRESSES, state.dress, v => set({ dress: v })));
    const d = state.dress === 'none' ? 'gaun' : state.dress;
    add(swatches('Warna', CLOTH, state.dressColor, v => set({ dressColor: v, dress: d })));
    add(chips('Motif', MOTIFS, state.dressMotif, v => set({ dressMotif: v, dress: d })));
    add(note('Gaun menggantikan atasan dan bawahan. Putar Ayu untuk melihat roknya mengembang.'));
  }
  if (tab === 'sepatu') {
    add(chips('Model', SHOES, state.shoes, v => set({ shoes: v })));
    add(swatches('Warna', CLOTH, state.shoesColor, v => set({ shoesColor: v })));
  }
  if (tab === 'aksesori') {
    add(chips('Pakai (boleh lebih dari satu)', ACCS, state.acc, v => set({ acc: { ...state.acc, [v]: !state.acc[v] } }), true));
    add(swatches('Warna aksesori', ACCC, state.accColor, v => set({ accColor: v })));
    if (state.hair === 'hijab' && state.acc.anting) add(note('Anting tertutup hijab.'));
  }
  if (tab === 'gaya') {
    add(chips('Aktivitas', ACTS, state.act, v => set({ act: v })));
    add(chips('Ekspresi', EXPR, state.expr, v => set({ expr: v })));
    add(note('Mata Ayu mengikuti kamera. Geser layar untuk memutar badannya.'));
  }
  if (tab === 'latar') add(chips('Lokasi', BGS, state.bg, v => set({ bg: v })));
}

// challenge & scoring
function getBest(id) { try { return +(localStorage.getItem('lemari-ayu-best-' + id) || 0); } catch (e) { return 0; } }
function setBest(id, v) { try { localStorage.setItem('lemari-ayu-best-' + id, v); } catch (e) { } }
function renderCh() {
  const c = CH[chIdx]; $('chName').textContent = c.name; $('chBrief').textContent = c.brief;
  const b = getBest(c.id); $('chBest').textContent = b ? 'Terbaik: ' + b : '';
}
function score() {
  const c = CH[chIdx], id = c.id, notes = []; let s = 0;
  const fits = k => (TAGS[k] || []).includes(id);
  if (state.dress !== 'none') {
    const n = label(DRESSES, state.dress);
    if (fits(state.dress)) { s += 60; notes.push(['ok', n + ' pas untuk ' + c.name.toLowerCase()]); } else notes.push(['no', n + ' kurang cocok untuk ' + c.name.toLowerCase()]);
  } else {
    for (const [k, list, w] of [[state.top, TOPS, 'Atasan'], [state.bottom, BOTTOMS, 'Bawahan']]) {
      if (fits(k)) { s += 30; notes.push(['ok', w + ': ' + label(list, k).toLowerCase() + ' cocok']); } else notes.push(['no', w + ': ' + label(list, k).toLowerCase() + ' kurang pas']);
    }
  }
  if (state.shoes === 'none') notes.push(['no', 'Jangan lupa alas kaki']);
  else if (fits(state.shoes)) { s += 25; notes.push(['ok', label(SHOES, state.shoes) + ' tepat']); }
  else notes.push(['no', label(SHOES, state.shoes) + ' kurang sesuai']);
  let ap = 0; const good = [];
  for (const [k, n] of ACCS) if (state.acc[k] && fits(k) && !(k === 'anting' && state.hair === 'hijab')) { ap += 5; good.push(n.toLowerCase()); }
  s += Math.min(15, ap);
  notes.push(good.length ? ['ok', 'Aksesori pas: ' + good.join(', ')] : ['no', 'Tambahkan aksesori yang sesuai']);
  const batik = state.dress !== 'none' ? state.dressMotif === 'batik' : (state.topMotif === 'batik' || state.bottomMotif === 'batik');
  if ((id === 'kantor' || id === 'kondangan') && batik) { s += 10; notes.push(['ok', 'Bonus motif batik +10']); }
  s = Math.min(100, s);
  const verdict = s >= 90 ? 'Sempurna! Ayu siap tampil.' : s >= 70 ? 'Keren, tinggal sedikit lagi.' : s >= 45 ? 'Lumayan, masih bisa lebih pas.' : 'Belum pas. Coba ganti beberapa item.';
  return { s, notes, verdict };
}
function showScore() {
  const c = CH[chIdx], r = score(); if (r.s > getBest(c.id)) setBest(c.id, r.s);
  $('rTheme').textContent = c.name; $('rScore').innerHTML = r.s + '<small> / 100</small>';
  const st = Math.round(r.s / 20); $('rStars').textContent = '★'.repeat(st) + '☆'.repeat(5 - st);
  $('rTitle').textContent = r.verdict; $('rNotes').innerHTML = '';
  for (const [k, t] of r.notes) { const li = document.createElement('li'); li.className = k; li.textContent = t; $('rNotes').appendChild(li); }
  $('result').hidden = false; renderCh();
  if (r.s >= 70) { state.expr = 'ceria'; state.act = state.act === 'diam' ? 'lambai' : state.act; renderTab(); renderCams(); }
  $('rClose').focus();
}
const nextCh = () => { chIdx = (chIdx + 1) % CH.length; renderCh(); };
$('bScore').onclick = showScore; $('bNextCh').onclick = nextCh;
$('rClose').onclick = () => $('result').hidden = true;
$('rNext').onclick = () => { $('result').hidden = true; nextCh(); };
const pick = a => a[Math.floor(Math.random() * a.length)];
$('bRand').onclick = () => {
  const acc = {}; for (const [k] of ACCS) acc[k] = Math.random() < .35;
  set({
    hair: pick(HAIR)[0], hairColor: pick(HAIRC), hijabColor: pick(HIJABC),
    top: pick(TOPS)[0], topColor: pick(CLOTH), topMotif: Math.random() < .6 ? 'polos' : pick(MOTIFS)[0],
    bottom: pick(BOTTOMS)[0], bottomColor: pick(CLOTH), bottomMotif: Math.random() < .6 ? 'polos' : pick(MOTIFS)[0],
    dress: Math.random() < .3 ? pick(DRESSES.slice(1))[0] : 'none', dressColor: pick(CLOTH), dressMotif: pick(MOTIFS)[0],
    shoes: pick(SHOES.slice(1))[0], shoesColor: pick(CLOTH), acc, accColor: pick(ACCC)
  });
};
$('bSpin').onclick = e => { spin = !spin; e.currentTarget.setAttribute('aria-pressed', spin); };
$('bWalk').onclick = () => set({ act: state.act === 'catwalk' ? 'diam' : 'catwalk' });

// drag to turn Ayu, wheel / pinch to zoom
let rotY = .3, rotTarget = .3, rotVel = 0; const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
cv.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = camState.zoom; } });
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  if (ptrs.size === 1) rotTarget += (e.clientX - p.x) * .012;
  p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) camState.zoom = Math.max(.5, Math.min(1.8, zoom0 * pinch0 / d)); }
});
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', e => { e.preventDefault(); camState.zoom = Math.max(.5, Math.min(1.8, camState.zoom * (1 + e.deltaY * .0012))); }, { passive: false });

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

// ================= loop =================
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new T.Clock();
function loop() {
  const dt = Math.min(1 / 30, Math.max(1 / 240, clock.getDelta())), t = clock.elapsedTime;
  if (spin) rotTarget += dt * 2.4;
  const prevRot = rotY;
  rotY += (rotTarget - rotY) * Math.min(1, dt * 9); root.rotation.y = rotY;
  rotVel = (rotY - prevRot) / dt;
  if (vrm) {
    applyPose(dt, reduce ? 0 : t); applyExpr(dt, t);
    vrm.update(dt);
    root.updateMatrixWorld(true);
    for (const p of pendulums) p.step(dt);
    for (const c of chains) c.step(dt);
    stepSkirt(dt, rotVel);
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ================= boot =================
renderTabs(); renderTab(); renderCams(); renderCh(); resize();
requestAnimationFrame(loop);
load().then(() => {
  rebuild(); $('loading').hidden = true; window.__ready = true;
}).catch(err => {
  console.error(err); $('loadTxt').textContent = 'Model gagal dimuat. Muat ulang halaman untuk mencoba lagi.';
});
window.__game = { state, set, camState, setRot: v => { rotTarget = rotY = v; }, get spin() { return spin; }, set spin(v) { spin = v; } };
