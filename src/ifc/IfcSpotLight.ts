import { vec3 } from "common";
import IfcLight from "./IfcLight";

interface IfcSpotLight extends IfcLight {
    type: "IfcSpotLight";
    position: vec3;
    direction: vec3;
    beamSpreadAngle: number;
    beamRadius: number;
}

export default IfcSpotLight;