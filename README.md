# IFC parsing using web-ifc
Tool for converting ifc files into GLB/GLTF and JSON files.

### Using the CLI
`ifc-import ./path/to/file.ifc ./path/to/output.glb ./path/to/output.json`

### Using code
```js
const fs = require("fs");
const importIfc = require("ifc-import/import-ifc");
const exportIfc = require("ifc-import/export-ifc");

const ifcFile = fs.readFileSync("file.ifc");
const properties = { };

const ifc = importIfc(ifcFile, properties, (index, total) => {
	console.log("Progrss: ", ((index + 1) / total) * 100 + "%");
});

const result = exportIfc(ifc, "node");
```

### NPM Package
https://www.npmjs.com/package/ifc-import

run `npm i ifc-import`
