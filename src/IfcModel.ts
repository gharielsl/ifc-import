import { IfcMaterialLibrary } from "common";
import IfcLight from "./ifc/IfcLight";
import IfcMesh from "./ifc/IfcMesh";
import IfcTreeObject from "./ifc/IfcTreeObject";

class IfcModel {
    meshes: IfcMesh[] = [];
    lights: IfcLight[] = [];
    tree?: IfcTreeObject;
    materialLibraries?: IfcMaterialLibrary;
    materialLibrary?: string;

    constructor(meshes: Iterable<IfcMesh>, materialLibraries?: IfcMaterialLibrary, materialLibrary?: string) {
        for (const mesh of meshes) {
            this.meshes.push(mesh);
        }
        this.materialLibraries = materialLibraries;
        this.materialLibrary = materialLibrary;
    }
}

export default IfcModel;