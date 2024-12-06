interface IfcTreeObject {
    expressId: number;
    parentExpressId?: number;
    type: string;
    children: IfcTreeObject[];
    properties?: any;
};

export default IfcTreeObject;