const { glob, globSync, globStream, globStreamSync, Glob } = require("glob");
const { minify } = require("terser");
const fs = require("fs");
const path = require("path");

async function main() {
    try {
        const files = await glob("components/**/*.js", { ignore: "node_modules/**" });

        console.log(files);
        let combinedCode = "";

        files.forEach((file) => {
            const code = fs.readFileSync(file, "utf8");
            combinedCode += code + "\n"; // Concatenate the code
        });

        // create dist folder if not exists
        if (!fs.existsSync("dist")) {
            fs.mkdirSync("dist");
        }

        minify(combinedCode).then((minified) => {
            fs.writeFileSync("dist/vc_uitoolkits.min.js", minified.code);
            console.log("All files minified and bundled into dist/vc_uitoolkits.min.js");
        });
    } catch (err) {
        console.error(err);
    }
}

main();
