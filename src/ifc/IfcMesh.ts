import IfcGeometry from "./IfcGeometry";

interface IfcMesh {
    expressId: number;
    geometries: IfcGeometry[];
};

export default IfcMesh;