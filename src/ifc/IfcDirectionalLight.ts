import { vec3 } from "common";
import IfcLight from "./IfcLight";

interface IfcDirectionalLight extends IfcLight {
    type: "IfcDirectionalLight";
    direction: vec3;
}

export default IfcDirectionalLight;