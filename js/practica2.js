// Variables globales que van siempre
var renderer, scene, camera, cameraControls;
var angulo = -0.01;

// 1-inicializa 
init();
// 2-Crea una escena
loadScene();
// 3-renderiza
render();

function init()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 75, aspectRatio , 0.1, 2000 );
  camera.position.set(300, 250, 350);

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 80, 0 );

  window.addEventListener('resize', updateAspectRatio );
  window.addEventListener('keydown', onKeyDown);

}


function loadScene()
{
	// Añade el objeto grafico a la escena
  // Ángulos de rotación de las distintas articulaciones

  params = {
    anguloVerticalBrazo: 0,
    anguloVerticalRotula: 0,
    anguloHorizontalRotula: 0,
    anguloVerticalPinzas: 0,
    anguloAperturaPinzas: 0,
    alambres: false
  }

  gui = new lil

  // Base
  let baseRadius = 50;
  let baseHeight = 15;

  let base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32), 
    new THREE.MeshBasicMaterial({ color: 0x00ff00 , transparent: true, opacity: 0.5 })) // Verde );
  base.position.set(0, 0, 0);
  scene.add(base);

  // Brazo -> Eje + Esparrago + Rotula + Antebrazo
  let brazo = new THREE.Object3D();

  let ejeRadius = 20;
  let ejeHeight = 18;

  // Eje
  let eje = new THREE.Mesh(
    new THREE.CylinderGeometry(ejeRadius, ejeRadius, ejeHeight, 32),
    new THREE.MeshBasicMaterial({ color: 0x0000ff , transparent: true, opacity: 0.5 })) // Azul );
  eje.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  eje.position.set(0, 0, 0);
  brazo.add(eje);

  // Esparrago
  let esparragoWidth = 18;
  let esparragoHeight = 120;
  let esparragoDepth = 12;
  let esparragoPosY = esparragoHeight / 2;

  let esparrago = new THREE.Mesh(
    new THREE.BoxGeometry(esparragoWidth, esparragoHeight, esparragoDepth), 
    new THREE.MeshBasicMaterial({ color: 0xff0000 , transparent: true, opacity: 0.5 })) // Rojo );
  esparrago.position.set(0, esparragoPosY, 0);
  brazo.add(esparrago);

  // Rotula
  let rotulaRadius = 20;
  let rotulaWidthSegments = 64;
  let rotulaHeightSegments = 64;
  let rotulaPosY = esparragoHeight;

  let rotula = new THREE.Mesh(
    new THREE.SphereGeometry(rotulaRadius, rotulaWidthSegments, rotulaHeightSegments),
    new THREE.MeshBasicMaterial({ color: 0xffff00 , transparent: true, opacity: 0.5 })) // Amarillo );
  rotula.position.set(0, rotulaPosY, 0);
  brazo.add(rotula);

  // Antebrazo -> Disco + Nervios + Mano
  let antebrazo = new THREE.Object3D();

  // Disco
  let discoRadius = 22;
  let discoHeight = 6;
  let antebrazoPosY = rotulaPosY;

  let disco = new THREE.Mesh(
    new THREE.CylinderGeometry(discoRadius, discoRadius, discoHeight, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffff , transparent: true, opacity: 0.5 })) // Cyan );
  antebrazo.add(disco);
  let brazoPosY = baseHeight / 2;

  // Nervios
  let nervios = new THREE.Object3D();
  let nervioHeight = 80;
  let nervioWidth = 4;
  let nervioDepth = 4;
  let nervioPosY = nervioHeight / 2 + discoHeight / 2;
  let nerviosPosXZ = 8;
  let posiciones = [
    [nerviosPosXZ, nervioPosY, nerviosPosXZ],
    [-nerviosPosXZ, nervioPosY, nerviosPosXZ],
    [nerviosPosXZ, nervioPosY, -nerviosPosXZ],
    [-nerviosPosXZ, nervioPosY, -nerviosPosXZ],
  ];

  let nervioGeometry = new THREE.BoxGeometry(nervioWidth, nervioHeight, nervioDepth);
  let nervioMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff , transparent: true, opacity: 0.5 }); // Magenta );

  for (let pos of posiciones) {
    let nervio = new THREE.Mesh(nervioGeometry, nervioMaterial);
    nervio.position.set(pos[0], pos[1], pos[2]);
    nervios.add(nervio);
  }

  antebrazo.add(nervios);

  // Mano -> Base + Pinzas
  let mano = new THREE.Object3D();

  // Base de la mano
  let manoBaseRadius = 15;
  let manoBaseHeight = 40;
  let manoBasePosY = nervioHeight + discoHeight;

  let manoBase = new THREE.Mesh(
    new THREE.CylinderGeometry(manoBaseRadius, manoBaseRadius, manoBaseHeight, 32),
    new THREE.MeshBasicMaterial({ color: 0x808080 , transparent: true, opacity: 0.5 })) // Gris );
  manoBase.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  manoBase.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  mano.add(manoBase);

  // Pinzas -> PinzaIz + PinzaDer
  let pinzas = new THREE.Object3D();
  let W = 38; // Pinza Width
  let H = 20; // Pinza Initial Height
  let h = 10; // Pinza Final Height
  let D = 4; // Pinza Initial Depth
  let d = 2; // Pinza Final Depth

  // Pinza Izquierda
  let geometriaIz = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    0,0,0,
    0,0,D,
    0,H,D,
    0,H,0,

    W/2,0,0,
    W/2,0,D,
    W/2,H,D,
    W/2,H,0,

    W,(H/2)-(H-h)/2, (D/2)-(D-d)/2,
    W,(H/2)-(H-h)/2, (D/2)+(D-d)/2,
    W,(H/2)+(H-h)/2, (D/2)+(D-d)/2,
    W,(H/2)+(H-h)/2, (D/2)-(D-d)/2,
  ]);

  geometriaIz.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  var indices = new Uint16Array([
    // Cara 1
    0,1,2,
    0,2,3,
    // Cara 2
    3,2,6,
    3,6,7,
    // Cara 3
    0,5,1,
    0,4,5,
    // Cara 4
    1,6,2,
    1,5,6,
    // Cara 5
    3,7,0,
    0,7,4,
    // Cara 6
    7,11,4,
    4,11,8,
    // Cara 7
    6,5,10,
    5,9,10,
    // Cara 8
    7,6,10,
    7,10,11,
    // Cara 9
    4,8,9,
    4,9,5,
    // Cara 10
    8,11,9,
    9,11,10
  ]);

  geometriaIz.setIndex(new THREE.BufferAttribute(indices, 1));
  geometriaIz.computeVertexNormals();

  let pinzaIzMesh = new THREE.Mesh(
    geometriaIz, 
    new THREE.MeshBasicMaterial({ color: 0x000000 , transparent: true, opacity: 0.5 }) // Black
  );

  pinzaIzMesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);

  // Pinza Derecha (espejo de la izquierda)
  let pinzaDer = pinzaIzMesh.clone();
  pinzaIzMesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -anguloAperturaPinzas);
  pinzaIzMesh.position.set(6, 0, 0);
  pinzaDer.rotateOnAxis(new THREE.Vector3(0, 1, 0), anguloAperturaPinzas);
  pinzaDer.position.set(-10, 0, 0);
  pinzas.add(pinzaIzMesh);
  pinzas.add(pinzaDer);
  pinzas.position.set(0, -H/2, 0);
  mano.rotateOnAxis(new THREE.Vector3(1, 0, 0), anguloVerticalPinzas);
  mano.add(pinzas);
  mano.position.set(0, manoBasePosY, 0);

  antebrazo.add(mano);

  antebrazo.position.set(0, antebrazoPosY);
  antebrazo.rotateOnAxis(new THREE.Vector3(1, 0, 0), anguloVerticalRotula);
  antebrazo.rotateOnAxis(new THREE.Vector3(0, 0, 1), anguloHorizontalRotula);
  brazo.add(antebrazo);
  brazo.position.set(0, brazoPosY, 0);
  brazo.rotateOnAxis(new THREE.Vector3(1, 0, 0), anguloVerticalBrazo);

  scene.add(brazo);

}


function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update()
{
  // Cambios para actualizar la camara segun mvto del raton
  cameraControls.update();
}

function render()
{
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}