// ===== Globales =====
var renderer, scene, camera, cameraControls;
var robot, base, brazo, antebrazo, mano, pinzaIzMesh, pinzaDerMesh;
var gui, params, animando = false, t0 = 0;
var paso = 5; // movimiento con flechas

// 1) inicializa
init();
// 2) escena
loadScene();
// 3) render
render();

function init()
{
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color(0xFFFFFF));
  document.getElementById('container').appendChild(renderer.domElement);

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 2000);
  camera.position.set(300, 250, 350);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 80, 0);

  window.addEventListener('resize', updateAspectRatio);
  window.addEventListener('keydown', onKeyDown);

  // --- Parámetros (TODO en radianes) ---
  params = {
    anguloVerticalBrazo: 0,         // [-π/3, π/3]
    anguloVerticalRotula: 0,        // [-π/4, π/4]
    anguloHorizontalRotula: 0,      // [-π/4, π/4]
    anguloVerticalPinzas: 0,        // [-π/4, π/2]
    anguloAperturaPinzas: 0,        // [-π/15, π/8]
    anguloHorizontalRobot: 0,       // [-π, π] (giro base Y)
    alambres: false,
    Anima: function(){ animando = true; t0 = performance.now(); }
  };

  // --- GUI ---
  gui = new lil.GUI({ title: 'Controles' });
  gui.add(params, 'anguloVerticalBrazo',     -Math.PI/3, Math.PI/3, 0.01).name('Vertical Brazo');
  gui.add(params, 'anguloVerticalRotula',    -Math.PI/4, Math.PI/4, 0.01).name('Vertical Rótula');
  gui.add(params, 'anguloHorizontalRotula',  -Math.PI/4, Math.PI/4, 0.01).name('Horizontal Rótula');
  gui.add(params, 'anguloVerticalPinzas',    -Math.PI/4, Math.PI/2, 0.01).name('Vertical Pinzas');
  gui.add(params, 'anguloAperturaPinzas',    -Math.PI/15, Math.PI/8, 0.01).name('Apertura Pinzas');
  gui.add(params, 'anguloHorizontalRobot',   -Math.PI,   Math.PI,   0.01).name('Giro base Y');
  gui.add(params, 'alambres').name('Ver alambres').onChange(setWireframe);
  gui.add(params, 'Anima').name('Iniciar Animación');
}

function loadScene()
{
  robot = new THREE.Object3D();
  scene.add(robot);

  // suelo
  var suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshBasicMaterial({ color:0x99cc99, wireframe:true, opacity:0.35, transparent:true })
  );
  suelo.rotation.x = -Math.PI/2;
  scene.add(suelo);

  // Base
  var baseRadius = 50, baseHeight = 15;
  base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32),
    new THREE.MeshBasicMaterial({ color:0x00ff00, transparent:true, opacity:0.5 })
  );
  base.position.set(0, 0, 0);
  robot.add(base);

  // Brazo -> Eje + Esparrago + Rótula + Antebrazo
  brazo = new THREE.Object3D();

  // Eje
  var eje = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 20, 18, 32),
    new THREE.MeshBasicMaterial({ color:0x0000ff, transparent:true, opacity:0.5 })
  );
  eje.rotation.z = Math.PI / 2;
  eje.position.set(0, 0, 0);
  brazo.add(eje);

  // Esparrago
  var esparragoWidth = 18, esparragoHeight = 120, esparragoDepth = 12;
  var esparragoPosY = esparragoHeight / 2;
  var esparrago = new THREE.Mesh(
    new THREE.BoxGeometry(esparragoWidth, esparragoHeight, esparragoDepth),
    new THREE.MeshBasicMaterial({ color:0xff0000, transparent:true, opacity:0.5 })
  );
  esparrago.position.set(0, esparragoPosY, 0);
  brazo.add(esparrago);

  // Rótula
  var rotulaPosY = esparragoHeight;
  var rotula = new THREE.Mesh(
    new THREE.SphereGeometry(20, 64, 64),
    new THREE.MeshBasicMaterial({ color:0xffff00, transparent:true, opacity:0.5 })
  );
  rotula.position.set(0, rotulaPosY, 0);
  brazo.add(rotula);

  // Antebrazo -> Disco + Nervios + Mano
  antebrazo = new THREE.Object3D();

  // Disco
  var disco = new THREE.Mesh(
    new THREE.CylinderGeometry(22, 22, 6, 32),
    new THREE.MeshBasicMaterial({ color:0x00ffff, transparent:true, opacity:0.5 })
  );
  antebrazo.add(disco);

  var brazoPosY = baseHeight / 2;

  // Nervios
  var nervios = new THREE.Object3D();
  var nervioHeight = 80, nervioWidth = 4, nervioDepth = 4;
  var nervioPosY = nervioHeight / 2 + 6 / 2;
  var nerviosPosXZ = 8;
  var posiciones = [
    [ nerviosPosXZ,  nervioPosY,  nerviosPosXZ],
    [-nerviosPosXZ,  nervioPosY,  nerviosPosXZ],
    [ nerviosPosXZ,  nervioPosY, -nerviosPosXZ],
    [-nerviosPosXZ,  nervioPosY, -nerviosPosXZ],
  ];
  var nervioGeometry = new THREE.BoxGeometry(nervioWidth, nervioHeight, nervioDepth);
  var nervioMaterial = new THREE.MeshBasicMaterial({ color:0xff00ff, transparent:true, opacity:0.5 });

  posiciones.forEach(function(pos){
    var n = new THREE.Mesh(nervioGeometry, nervioMaterial);
    n.position.set(pos[0], pos[1], pos[2]);
    nervios.add(n);
  });
  antebrazo.add(nervios);

  // Mano -> Base + Pinzas
  mano = new THREE.Object3D();

  // Base de la mano
  var manoBaseRadius = 15, manoBaseHeight = 40;
  var manoBasePosY = nervioHeight + 6;
  var manoBase = new THREE.Mesh(
    new THREE.CylinderGeometry(manoBaseRadius, manoBaseRadius, manoBaseHeight, 32),
    new THREE.MeshBasicMaterial({ color:0x808080, transparent:true, opacity:0.5 })
  );
  manoBase.rotation.x = Math.PI / 2;
  manoBase.rotation.z = Math.PI / 2;
  mano.add(manoBase);

  // Pinzas -> PinzaIz + PinzaDer
  var W = 38, H = 20, h = 10, D = 4, d = 2;

  var geometriaIz = new THREE.BufferGeometry();
  var vertices = new Float32Array([
    0,0,0,  0,0,D,  0,H,D,  0,H,0,
    W/2,0,0,  W/2,0,D,  W/2,H,D,  W/2,H,0,
    W,(H/2)-(H-h)/2, (D/2)-(D-d)/2,
    W,(H/2)-(H-h)/2, (D/2)+(D-d)/2,
    W,(H/2)+(H-h)/2, (D/2)+(D-d)/2,
    W,(H/2)+(H-h)/2, (D/2)-(D-d)/2,
  ]);
  geometriaIz.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  var indices = new Uint16Array([
    0,1,2, 0,2,3,
    3,2,6, 3,6,7,
    0,5,1, 0,4,5,
    1,6,2, 1,5,6,
    3,7,0, 0,7,4,
    7,11,4, 4,11,8,
    6,5,10, 5,9,10,
    7,6,10, 7,10,11,
    4,8,9, 4,9,5,
    8,11,9, 9,11,10
  ]);
  geometriaIz.setIndex(new THREE.BufferAttribute(indices, 1));
  geometriaIz.computeVertexNormals();

  pinzaIzMesh = new THREE.Mesh(
    geometriaIz,
    new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.5 })
  );
  pinzaIzMesh.rotation.y = Math.PI / 2; // orientación base
  pinzaIzMesh.position.set(6, -H/2, 0);

  pinzaDerMesh = pinzaIzMesh.clone();
  pinzaDerMesh.position.set(-10, -H/2, 0);

  // Montaje jerárquico
  mano.add(pinzaIzMesh);
  mano.add(pinzaDerMesh);
  mano.position.set(0, manoBasePosY, 0);

  antebrazo.add(mano);
  antebrazo.position.set(0, rotulaPosY);

  brazo.add(antebrazo);
  brazo.position.set(0, brazoPosY, 0);

  robot.add(brazo);

  // aplicar estado inicial de alambres
  setWireframe(false);
}

function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onKeyDown(e){
  // movimiento del robot en el plano XZ
  switch(e.key){
    case 'ArrowUp':    robot.position.z -= paso; break;
    case 'ArrowDown':  robot.position.z += paso; break;
    case 'ArrowLeft':  robot.position.x -= paso; break;
    case 'ArrowRight': robot.position.x += paso; break;
  }
}

function aplicarParametros(){
  // *** TODOS LOS PARÁMETROS ESTÁN EN RADIANES ***
  robot.rotation.y        = params.anguloHorizontalRobot;

  brazo.rotation.x       = params.anguloVerticalBrazo;

  antebrazo.rotation.x   = params.anguloVerticalRotula;
  antebrazo.rotation.z   = params.anguloHorizontalRotula;

  mano.rotation.x        = params.anguloVerticalPinzas;

  // Apertura simétrica respecto a orientación base (π/2)
  var a = params.anguloAperturaPinzas; // [0..π/4]
  pinzaIzMesh.rotation.y  = Math.PI/2 - a;
  pinzaDerMesh.rotation.y = Math.PI/2 + a;
}

function lerpSin(min, max, t) {
  // devuelve un valor oscilando suavemente entre [min,max]
  return min + (max - min) * (0.5 + 0.5 * Math.sin(t));
}

function update(){
  cameraControls.update();

  if (animando){
    var t = (performance.now() - t0) / 1000;

    // límites reales (radianes)
    params.anguloVerticalBrazo    = lerpSin(-Math.PI/3,  Math.PI/3,  t * 0.6);
    params.anguloVerticalRotula   = lerpSin(-Math.PI/4,  Math.PI/4,  t * 0.8);
    params.anguloHorizontalRotula = lerpSin(-Math.PI/4,  Math.PI/4,  t * 0.7);
    params.anguloVerticalPinzas   = lerpSin(-Math.PI/4,  Math.PI/2,  t * 0.9);
    params.anguloAperturaPinzas   = lerpSin(-Math.PI/15, Math.PI/8,  t * 1.2);
    params.anguloHorizontalRobot  = lerpSin(-Math.PI/4,  Math.PI/4,  t * 0.4);

    // refrescar GUI
    if (gui && gui.controllers) gui.controllers.forEach(function(c){ c.updateDisplay(); });

    // detener tras 10 s (si quieres que sea continua, elimina esta línea)
    if (t > 10) animando = false;
  }

  aplicarParametros();
}

function setWireframe(flag){
  var value = (typeof flag === 'boolean') ? flag : params.alambres;
  scene.traverse(function(obj){
    if (obj.isMesh){
      if (Array.isArray(obj.material)) obj.material.forEach(function(m){ m.wireframe = value; m.needsUpdate = true; });
      else { obj.material.wireframe = value; obj.material.needsUpdate = true; }
    }
  });
}

function render()
{
  requestAnimationFrame(render);
  update();
  renderer.render(scene, camera);
}
