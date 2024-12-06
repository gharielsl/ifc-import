import THREE from "three";
import { IfcAPI } from "web-ifc";
import * as WebIFC from "web-ifc";
import IfcModel from "./IfcModel";
import IfcGeometry from "./ifc/IfcGeometry";
import IfcTreeObject from "./ifc/IfcTreeObject";
import { progress } from "common";
import IfcImportProperties from "./ifc/IfcImportProperties";
import IfcLight from "./ifc/IfcLight";

const DEFAULT_IMPORT_PROPERTIES = {
    defaultLight: {
        type: "IfcPointLight",
        color: {
            x: 1,
            y: 1,
            z: 1,
            w: 1
        },
        intensity: 1
    } as IfcLight
};

function findIfcStyledItem(geometryExpressId: number, modelId: number, ifcApi: IfcAPI) {
    const lines = ifcApi.GetLineIDsWithType(modelId, WebIFC.IFCSTYLEDITEM);
    for (let i = 0; i < lines.size(); i++) {
        const line = lines.get(i);
        const properties = ifcApi.GetLine(modelId, line);
        if (properties?.Item?.value === geometryExpressId) {
            return properties;
        }
    }
}

function findIfcSurfaceStyleName(geometryExpressId: number, modelId: number, ifcApi: IfcAPI) {
    const styledItem = findIfcStyledItem(geometryExpressId, modelId, ifcApi);
    if (styledItem?.Styles?.length === 0) {
        return;
    }
    const lines = ifcApi.GetLineIDsWithType(modelId, WebIFC.IFCSURFACESTYLE);
    for (let i = 0; i < lines.size(); i++) {
        const surfaceStyle = lines.get(i);
        if (surfaceStyle === styledItem?.Styles?.[0].value) {
            return ifcApi.GetLine(modelId, surfaceStyle).Name.value;
        }
    }
}

function createTreeObject(modelId: number, ifcApi: IfcAPI, expressId: number) {
    const properties = ifcApi.GetLine(modelId, expressId);
    return {
        properties,
        expressId,
        type: properties.constructor.name,
        children: []
    } as IfcTreeObject;
}

function findRelationObjects(modelId: number, ifcApi: IfcAPI, expressId: number, relation: string, related: string, type: number, parent?: IfcTreeObject, ifcProject?: IfcTreeObject) {
    let treeObject: IfcTreeObject;
    let existingObjects: IfcTreeObject[] = [];
    if (parent) {
        existingObjects = parent.children.filter((child) => child.expressId === expressId);
    }
    if (ifcProject) {
        treeObject = ifcProject;
    } else if (existingObjects.length !== 0) {
        treeObject = existingObjects[0];
    } else {
        treeObject = createTreeObject(modelId, ifcApi, expressId);
    }
    if (!ifcProject && parent) {
        treeObject.parentExpressId = parent.expressId;
        if (!parent.children.includes(treeObject)) {
            parent.children.push(treeObject);
        }
    }
    const linesWithType = ifcApi.GetLineIDsWithType(modelId, type);
    for (let i = 0; i < linesWithType.size(); i++) {
        const relationElement = linesWithType.get(i);
        const relationElementProperties = ifcApi.GetLine(modelId, relationElement);
        const relationElements = relationElementProperties[relation];
        let foundElements = false;
        if (Array.isArray(relationElements)) {
            foundElements = relationElements.map((el) => el.value).includes(expressId);
        } else {
            foundElements = relationElements.value === expressId;
        }
        if (foundElements) {
            const relatedElements = relationElementProperties[related];
            let relatedElemetntsIds: number[] = [];
            if (Array.isArray(relatedElements)) {
                relatedElemetntsIds = relatedElements.map((el) => el.value);
            } else if (relatedElements) {
                relatedElemetntsIds = [relatedElements.value];
            }
            relatedElemetntsIds.forEach((childExpressId) => {
                parseIfcElement(modelId, ifcApi, childExpressId, treeObject);
            });
        }
    }
}

function parseIfcElement(modelId: number, ifcApi: IfcAPI, expressId: number, parentTreeObject?: IfcTreeObject, ifcProject?: IfcTreeObject) {
    findRelationObjects(modelId, ifcApi, expressId, "RelatingObject", "RelatedObjects", WebIFC.IFCRELAGGREGATES, parentTreeObject, ifcProject);
    findRelationObjects(modelId, ifcApi, expressId, "RelatingStructure", "RelatedElements", WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, parentTreeObject, ifcProject);
}

function parseIfcTree(modelId: number, ifcApi: IfcAPI) {
    const projects = ifcApi.GetLineIDsWithType(modelId, WebIFC.IFCPROJECT);
    const project = projects.get(0);
    const ifcProjectTreeObject = createTreeObject(modelId, ifcApi, project);
    parseIfcElement(modelId, ifcApi, project, undefined, ifcProjectTreeObject);
    return ifcProjectTreeObject;
}

function parseLights(modelId: number, ifcApi: IfcAPI, properties: IfcImportProperties) {
    const lights: IfcLight[] = [];
    return lights;
}

async function importIfc(ifc: Uint8Array, properties?: IfcImportProperties, progress?: progress) {
    properties = { ...DEFAULT_IMPORT_PROPERTIES, ...properties };
    const data = ifc;
    const ifcApi = new IfcAPI();
    await ifcApi.Init();
    const modelId = ifcApi.OpenModel(data, {
        OPTIMIZE_PROFILES: true
    });
    const ifcModel = new IfcModel([], properties.materialLibraries, properties.materialLibrary);
    ifcModel.tree = parseIfcTree(modelId, ifcApi);
    ifcModel.lights = parseLights(modelId, ifcApi, properties);
    ifcApi.StreamAllMeshes(modelId, (mesh, index, total) => {
        if (progress) {
            progress(index, total);
        }
        const meshExpressId = mesh.expressID;
        const geometries: IfcGeometry[] = [];
        for (let i = 0; i < mesh.geometries.size(); i++) {
            const placedGeometry = mesh.geometries.get(i);
            const geometry = ifcApi.GetGeometry(modelId, placedGeometry.geometryExpressID);
            const indexPointer = geometry.GetIndexData();
            const vertexPointer = geometry.GetVertexData();
            const indexArray = ifcApi.GetIndexArray(indexPointer, geometry.GetIndexDataSize());
            const vertexAndNormalArray = ifcApi.GetVertexArray(vertexPointer, geometry.GetVertexDataSize());
            const vertexArray = [];
            for (let j = 0; j < vertexAndNormalArray.length; j += 6) {
                const position = new THREE.Vector3(vertexAndNormalArray[j], vertexAndNormalArray[j + 1], vertexAndNormalArray[j + 2]);
                position.applyMatrix4(new THREE.Matrix4().fromArray(placedGeometry.flatTransformation));
                vertexArray.push(position.x);
                vertexArray.push(position.y);
                vertexArray.push(position.z);
            }
            const surfaceStyleName = findIfcSurfaceStyleName(placedGeometry.geometryExpressID, modelId, ifcApi);
            const color = placedGeometry.color;
            geometries.push({
                expressId: placedGeometry.geometryExpressID,
                vertexArray: new Float32Array(vertexArray),
                indexArray: new Uint16Array(indexArray),
                surfaceStyleName,
                color
            });
        }
        ifcModel.meshes.push({
            expressId: meshExpressId,
            geometries: geometries
        });
    });
    ifcApi.CloseModel(modelId);
    return ifcModel;
}

export default importIfc;
