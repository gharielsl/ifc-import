import { vec3 } from "common";
import IfcLight from "./IfcLight";

interface IfcPointLight extends IfcLight {
    type: "IfcPointLight";
    position: vec3;
}

export default IfcPointLight;