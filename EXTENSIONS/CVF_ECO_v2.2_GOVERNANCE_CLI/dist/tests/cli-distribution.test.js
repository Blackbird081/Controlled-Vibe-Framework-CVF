"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const vitest_1 = require("vitest");
(0, vitest_1.describe)("CLI distribution contract", () => {
    (0, vitest_1.it)("declares cvf and cvf-guard package binaries", () => {
        const pkg = JSON.parse((0, node_fs_1.readFileSync)("package.json", "utf8"));
        (0, vitest_1.expect)(pkg.bin).toMatchObject({
            cvf: "dist/src/bin/cvf.js",
            "cvf-guard": "dist/src/bin/cvf.js",
        });
        (0, vitest_1.expect)(pkg.scripts?.build).toBe("tsc -p tsconfig.json");
        (0, vitest_1.expect)(pkg.scripts?.["smoke:bin"]).toContain("node dist/src/bin/cvf.js help --json");
    });
});
