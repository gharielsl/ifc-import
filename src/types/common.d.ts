export type vec3 = {
    x: number,
    y: number,
    z: number
};

export type progress = (index: number, total: number) => void;

export type IfcMaterialLibrary = {
    [libraryName: string]: {
        [materialName: string]: {
            color?: string,
            normal?: string
        }
    }
};