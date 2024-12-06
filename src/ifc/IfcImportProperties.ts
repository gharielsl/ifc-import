import { IfcMaterialLibrary } from "common";
import IfcLight from "./IfcLight";

interface IfcImportProperties {
    defaultLight?: IfcLight,
    materialLibraries?: IfcMaterialLibrary,
    materialLibrary?: string
}

export default IfcImportProperties;