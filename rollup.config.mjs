import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/loyalty-cards-card.js",
  output: {
    file: "custom_components/loyalty_cards/www/loyalty-cards-card.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    terser({ format: { comments: false } }),
  ],
};
