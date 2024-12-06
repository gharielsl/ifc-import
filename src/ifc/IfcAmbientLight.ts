import IfcLight from "./IfcLight";

interface IfcAmbientLight extends IfcLight {
    type: "IfcAmbientLight";
};

export default IfcAmbientLight;