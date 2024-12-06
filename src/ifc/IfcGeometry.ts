import { Color } from "web-ifc";

interface IfcGeometry {
    expressId: number;
    vertexArray: Float32Array;
    indexArray: Uint16Array;
    surfaceStyleName: string;
    color: Color;
};

export default IfcGeometry;