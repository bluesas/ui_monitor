// show_view.js

var scene, camera, renderer;
var geometry, material, mesh;
var controls;
var texture;

var totalWidth = 0;
var totalHeight = 0;
var zOffset = 0;
var zSpace = 400;
var sameLevelSpace = 0; // todo
var minDistance = 1000;
var maxDistance = 5000;

var scatter = 1.5;

var meshs = []; // saved by level

// border
var composer, outlinePass;

// click
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var moved = false;

var selectedObjects;

var totalLevels = -1;
var levelMeshs = [];
var displayed = false;

var moved = false;

init();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 200000);
    camera.position.z = 5000;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xcccccc, 1);

    //controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.maxPolarAngle = Math.PI * 0.7;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.minAzimuthAngle = - Math.PI; // radians
    controls.maxAzimuthAngle = Math.PI; // radians
    controls.enablePan = true;
    controls.zoomSpeed = 0.5;
    controls.target.set(0, 0, 0);

    var onLoad = function (texture) {
        outlinePass.patternTexture = texture;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    };

    var loader = new THREE.TextureLoader();
    loader.load('screencap.png', function (texture) {

        if (viewTreeData === null && viewTreeData === undefined) {
            return;
        }

        texture.minFilter = THREE.LinearFilter;
        var rootNode = viewTreeData.__children[0];

        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        totalWidth = texture.image.width;
        totalHeight = texture.image.height;

        showView(rootNode, material);

        document.body.appendChild(renderer.domElement);
        animate();

    });

    window.addEventListener('resize', onWindowResize, false);

    renderer.domElement.addEventListener('mousedown', function () {
        moved = false;
    }, false);
    renderer.domElement.addEventListener('mousemove', function () {
        moved = true;
    }, false);
    renderer.domElement.addEventListener('mouseup', function (event) {
        if (!moved) {

            // if (animateCount < animateLength) {
            // animateViewMove();
            // } else {
            onClick(event);
            // }
        }
    }, false);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function reset() {
    controls.target.set(0, 0, 0);
}

function onClick(event) {

    var vector = new THREE.Vector3();

    // 获取鼠标点击点在 camera 观察平面上的位置
    vector.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        - (event.clientY / window.innerHeight) * 2 + 1,
        0.5);

    // 转换为 canvas 3d 坐标
    vector.unproject(camera);

    // 计算从 camera 到 点击点的单位方向向量
    var dir = vector.sub(camera.position).normalize();

    // 计算 方向向量 和 它通过 原点 的 法平面 的 交点 
    var m = camera.position.clone();
    var t = -(m.x * dir.x + m.y * dir.y + m.z * dir.z);
    var pos = new THREE.Vector3().set(
        m.x + dir.x * t,
        m.y + dir.y * t,
        m.z + dir.z * t
    );

    // 设置 交点位置不要太远
    pos = pos.clampLength(0, totalLevels * zSpace);

    // 将交点作为新的 旋转中心
    controls.target = pos;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update();
    renderer.render(scene, camera);
}

// 坐标变换
// 从 android 坐标系变成 uv 坐标系
// android 坐标系 是 
// o 
//   ┌--------------> x
//   | 
//   |
//   |
//   |
//   |
// y ∨
// 
// uv 坐标系 是 
// y ∧
//   | 
//   |
//   |
//   |
//   |
//   └--------------> x
// o
function androidRect2UVRect(x1, y1, x2, y2, totalWidth, totalHeight) {
    var uvX1 = x1;
    var uvX2 = x2;
    var uvY1 = totalHeight - y2;
    var uvY2 = totalHeight - y1;

    return [uvX1, uvY1, uvX2, uvY2];
}

function createMesh(androidViewBounds, material) {

    // 转换坐标系
    var bounds = androidRect2UVRect(
        androidViewBounds[0],
        androidViewBounds[1],
        androidViewBounds[2],
        androidViewBounds[3],
        totalWidth,
        totalHeight);

    // uv 比例变换
    var uvs = [
        bounds[0] / totalWidth,
        bounds[1] / totalHeight,
        bounds[2] / totalWidth,
        bounds[3] / totalHeight
    ];

    // 定义 uv 点
    // 3 (0,1)        2 (1,1)
    //   ┌---------┐
    //   |         |
    //   |         |
    //   |         |
    //   └---------┘
    // 0 (0,0)        1 (1,0)
    var block = [
        new THREE.Vector2(uvs[0], uvs[1]),
        new THREE.Vector2(uvs[2], uvs[1]),
        new THREE.Vector2(uvs[2], uvs[3]),
        new THREE.Vector2(uvs[0], uvs[3])
    ];

    var width = bounds[2] - bounds[0];
    var height = bounds[3] - bounds[1];
    var geometry = new THREE.PlaneGeometry(width, height);

    // uv 贴图
    geometry.faceVertexUvs[0] = [];
    geometry.faceVertexUvs[0][0] = [block[3], block[0], block[2]];
    geometry.faceVertexUvs[0][1] = [block[0], block[1], block[2]];

    var mesh = new THREE.Mesh(geometry, material);
    mesh.width = bounds[2] - bounds[0];
    mesh.height = bounds[3] - bounds[1];
    mesh.bounds = bounds;
    return mesh;
}

function getZ(level) {
    return zSpace * level + zOffset;
}

function commitLevel(level) {
    var material = new THREE.MeshPhongMaterial({
        color: 0x000000
    });

    var textMesh = createTextMesh("Level " + level);
    textMesh.position.x = -totalWidth / 2 * scatter;
    textMesh.position.y = totalHeight / 2 * scatter + 10;
    textMesh.position.z = getZ(level);
    levelMeshs.push(textMesh);
    scene.add(textMesh);
}

function createTextMesh(text) {
    var canvas1 = document.createElement('canvas');
    var context1 = canvas1.getContext('2d');
    context1.font = "Bold 40px Arial";
    context1.fillStyle = "rgba(255,100,0,0.95)";
    context1.fillText(text, 0, 50);

    var texture1 = new THREE.Texture(canvas1)
    texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial({ map: texture1, side: THREE.DoubleSide });
    material1.transparent = true;

    var mesh1 = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        material1
    );
    return mesh1;
}
///////// 展示 view tree ////////

var nodeStack = [];
function showView(rootNode, material) {

    nodeStack.push(rootNode);

    var node;
    while (nodeStack.length > 0) {
        node = nodeStack.pop();
        showNode(node, material);
        if (node.__children !== null
            && node.__children !== undefined
            && node.__children.length > 0) {
            nodeStack = nodeStack.concat(node.__children.reverse());
        }
    }

    if (totalLevels > 0) {

        var totalZ = totalLevels * zSpace;
        zOffset = - 0.45 * totalZ;
        controls.minDistance = zOffset;
        controls.maxDistance = totalZ + 5000;

        levelMeshs.forEach(function (levelMesh) {
            levelMesh.position.z = levelMesh.position.z + zOffset;
        }, this);
        meshs.forEach(function (level) {
            level.forEach(function (nodeMesh) {
                nodeMesh.position.z = nodeMesh.position.z + zOffset;
            }, this);
        }, this);
    }

}

var animateCount = 0;
var animateLength = 3000;
function animateViewMove() {
    animateCount++;

    meshs.forEach(function (levelMesh) {
        levelMesh.forEach(function (mesh) {
            var currentPos = mesh.position.clone();
            var targetPos = mesh.targetPosition.clone();
            mesh.position.add(targetPos.sub(currentPos).addScalar(animateCount / animateLength));

            mesh.position.needsUpdate = true;

        }, this);
    }, this);

    if (animateCount <= animateLength) {
        requestAnimationFrame(animateViewMove);
    }
}

function showNode(node, material) {

    var viewBounds = [];
    var arrays = node.__attributes.bounds.match(/\[\d+,\d+\]/g);

    for (i = 0; i < arrays.length; i++) {
        viewBounds = viewBounds.concat(JSON.parse(arrays[i]));
    }

    var levelMeshs;
    if (node.__level > totalLevels) {
        commitLevel(node.__level);
        totalLevels = node.__level;
        levelMeshs = [];
        meshs.push(levelMeshs);
    } else {
        levelMeshs = meshs[meshs.length - 1];
    }

    var mesh = createMesh(viewBounds, material);
    levelMeshs.push(mesh);

    // 设置扩散
    mesh.position.x = (mesh.bounds[0] + mesh.bounds[2] - totalWidth) / 2 * scatter;
    mesh.position.y = (mesh.bounds[1] + mesh.bounds[3] - totalHeight) / 2 * scatter;

    mesh.position.z = getZ(node.__level) + levelMeshs.length * sameLevelSpace;
    mesh.node = node;
    scene.add(mesh);

}
