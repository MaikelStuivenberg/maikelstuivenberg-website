import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cascadeLayers from "@csstools/postcss-cascade-layers";
import { transform, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import type { PluginCreator } from "postcss";

const stripAtProperty: PluginCreator<never> = () => ({
  postcssPlugin: "strip-at-property",
  AtRule: {
    property(atRule) {
      atRule.remove();
    },
  },
});
stripAtProperty.postcss = true;

const containerUnitsToViewport: PluginCreator<never> = () => ({
  postcssPlugin: "cqw-to-vw-fallback",
  Declaration(decl) {
    if (!decl.value.includes("cq")) return;
    decl.value = decl.value
      .replace(/([\d.]+)cqw/g, "$1vw")
      .replace(/([\d.]+)cqh/g, "$1vh");
  },
});
containerUnitsToViewport.postcss = true;

const expandInsetShorthand: PluginCreator<never> = () => ({
  postcssPlugin: "expand-inset",
  Declaration(decl) {
    if (decl.prop !== "inset") return;
    const v = decl.value.trim();
    const parts = v.split(/\s+/);
    const [top, right, bottom, left] =
      parts.length === 1
        ? [parts[0], parts[0], parts[0], parts[0]]
        : parts.length === 2
          ? [parts[0], parts[1], parts[0], parts[1]]
          : parts.length === 3
            ? [parts[0], parts[1], parts[2], parts[1]]
            : [parts[0], parts[1], parts[2], parts[3]];
    decl.cloneBefore({ prop: "top", value: top });
    decl.cloneBefore({ prop: "right", value: right });
    decl.cloneBefore({ prop: "bottom", value: bottom });
    decl.cloneBefore({ prop: "left", value: left });
    decl.remove();
  },
});
expandInsetShorthand.postcss = true;

const dvhToVh: PluginCreator<never> = () => ({
  postcssPlugin: "dvh-to-vh",
  Declaration(decl) {
    if (!decl.value.includes("dvh")) return;
    decl.value = decl.value.replace(/([\d.]+)dvh/g, "$1vh");
  },
});
dvhToVh.postcss = true;

const LEGACY_TARGETS = browserslistToTargets(
  browserslist(["chrome >= 69", "android >= 61", "safari >= 12"]),
);

/** Lower modern CSS for old embedded browsers (OPS player WebView). */
export async function processLegacyCss(css: string): Promise<string> {
  const lowered = transform({
    filename: "bundle.css",
    code: Buffer.from(css),
    targets: LEGACY_TARGETS,
    minify: false,
    errorRecovery: true,
  });

  const result = await postcss([
    cascadeLayers(),
    postcssPresetEnv({
      browsers: ["chrome >= 69", "android >= 61", "safari >= 12"],
      stage: 2,
      features: {
        "custom-properties": false,
        "nesting-rules": false,
      },
    }),
    stripAtProperty(),
    containerUnitsToViewport(),
    dvhToVh(),
    expandInsetShorthand(),
  ]).process(lowered.code.toString(), { from: "bundle.css" });

  return result.css;
}
