import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const nextVitals = require("eslint-config-next/core-web-vitals");
const nextTypeScript = require("eslint-config-next/typescript");

export default [
  ...nextVitals,
  ...nextTypeScript,
  {
    // Dívidas preexistentes do frontend; remover as exceções quando o código for corrigido.
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];
