// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Expo SDK 57 ships eslint-plugin-react-hooks v7, which enables the new
    // React Compiler rules as errors. Two of them produce false positives in
    // this codebase and are disabled intentionally:
    //
    //  • react-hooks/immutability — flags `sharedValue.value = withTiming(...)`,
    //    which is the *documented, correct* Reanimated API, not a React state
    //    mutation. Used throughout (Button, Card, GlassSurface, tab bar, the
    //    active-workout screen, etc.).
    //  • react-hooks/refs — flags reading `ref.current` during render for the
    //    stable id-generation pattern in GlowOrb (SVG gradient ids) and the
    //    guided tour. These reads are pure and safe.
    //
    // Re-evaluate when Reanimated / the React Compiler lint rules interoperate.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);
