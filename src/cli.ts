import fs from "fs";
import importIfc from "./import-ifc";
import exportIfc from "./export-ifc";

async function cli(args: string[]) {
    const ifc = await importIfc(fs.readFileSync(args[2]), {
        
    }, (index, total) => {
        console.log(`Progress: ${((index + 1) / total) * 100}%`);
    });
    const result = exportIfc(ifc, "node");
    result.glb().then((glb) => {
        fs.writeFileSync(args[3], glb);
        fs.writeFileSync(args[4], JSON.stringify(ifc.tree));
    });
}

cli(process.argv);
