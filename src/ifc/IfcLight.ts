import { Color } from "web-ifc";

interface IfcLight {
    color: Color;
    intensity: number;
    type: "IfcPointLight" | "IfcSpotLight" | "IfcDirectionalLight" | "IfcAmbientLight";
}

export default IfcLight;