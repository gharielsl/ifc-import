import { Document, Material, NodeIO, WebIO, Buffer, Scene, Texture } from "@gltf-transform/core";
import { KHRLightsPunctual } from "@gltf-transform/extensions";
import IfcModel from "./IfcModel";
import IfcGeometry from "./ifc/IfcGeometry";
import IfcPointLight from "./ifc/IfcPointLight";

function createPrimative(document: Document, ifcGeometry: IfcGeometry, material: Material, buffer: Buffer) {
    const primative = document.createPrimitive();
    primative.setMaterial(material);
    const positionAccessor = document.createAccessor("position");
    const indexAccessor = document.createAccessor("index");
    positionAccessor.setType("VEC3");
    positionAccessor.setArray(ifcGeometry.vertexArray);
    positionAccessor.setBuffer(buffer);
    indexAccessor.setType("SCALAR");
    indexAccessor.setArray(ifcGeometry.indexArray);
    indexAccessor.setBuffer(buffer);
    primative.setMode(4);
    primative.setIndices(indexAccessor);
    primative.setAttribute("POSITION", positionAccessor);
    return primative;
}

function addLights(document: Document, scene: Scene, ifcModel: IfcModel, lightsExtension: KHRLightsPunctual) {
    const lightsNode = document.createNode("Lights");
    ifcModel.lights.forEach((light, index) => {
        if (light.type === "IfcPointLight") {
            const pointLight = light as IfcPointLight;
            const gltfLight = lightsExtension.createLight("Light_" + index);
            gltfLight.setColor([pointLight.color.x, pointLight.color.y, pointLight.color.z]);
            gltfLight.setType("point");
            gltfLight.setIntensity(pointLight.intensity);
            const lightNode = document.createNode("Light_Node_" + index);
            lightNode.setTranslation([pointLight.position.x, pointLight.position.y, pointLight.position.z]);
            lightNode.setExtension("KHR_lights_punctual", gltfLight);
            lightsNode.addChild(lightNode);
        }
    });
    scene.addChild(lightsNode);
}

function exportIfc(ifcModel: IfcModel, ioType: "node" | "web") {
    const document = new Document();
    const scene = document.createScene();
    const lightsExtension = document.createExtension(KHRLightsPunctual);
    addLights(document, scene, ifcModel, lightsExtension);
    const buffer = document.createBuffer();
    const io = ioType === "node" ? new NodeIO() : new WebIO();
    io.registerExtensions([ KHRLightsPunctual ])

    for (const ifcMesh of ifcModel.meshes) {
        const node = document.createNode("Node_" + ifcMesh.expressId);
        for (const ifcGeometry of ifcMesh.geometries) {
            const mesh = document.createMesh("Geometry_" + ifcGeometry.expressId);
            const material = document.createMaterial("Material_" + ifcGeometry.expressId);
            material.setBaseColorFactor([
                ifcGeometry.color.x,
                ifcGeometry.color.y,
                ifcGeometry.color.z,
                ifcGeometry.color.w
            ]);
            if (ifcModel.materialLibraries && ifcModel.materialLibrary) {
                const materialIndex = ifcModel.materialLibraries[ifcModel.materialLibrary][ifcGeometry.surfaceStyleName];
                if (materialIndex?.color) {
                    const color = document.createTexture();
                    color.setURI(materialIndex.color);
                    material.setBaseColorTexture(color);
                }
                if (materialIndex?.normal) {
                    const normal = document.createTexture();
                    normal.setURI(materialIndex.normal);
                    material.setNormalTexture(normal);
                }
            }
            mesh.setExtras({
                ifc: {
                    ifcMeshExpressId: ifcMesh.expressId,
                    ifcGeometryExpressId: ifcGeometry.expressId,
                    ifcSurfaceStyleName: ifcGeometry.surfaceStyleName
                }
            });
            const primative = createPrimative(document, ifcGeometry, material, buffer);
            mesh.addPrimitive(primative);
            const meshNode = document.createNode("Node_Geometry_" + ifcGeometry.expressId);
            meshNode.setMesh(mesh);
            node.addChild(meshNode);
        }
        scene.addChild(node);
    }

    return {
        glb: () => io.writeBinary(document),
        gltf: () => io.writeJSON(document)
    }
}

export default exportIfc;


