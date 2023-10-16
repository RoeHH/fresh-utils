import { join } from "https://deno.land/std@0.195.0/path/mod.ts";
import Prompt from "https://deno.land/x/prompt@v1.0.0/mod.ts";
import PromptError from "https://deno.land/x/prompt@v1.0.0/src/errors/PromptError.ts";

const options = await Prompt.prompts([
  { type: "confirm", name: "new", message: "Create new Fresh Project?", defaultValue: false },
  { type: "text", name: "name", message: "The directory in which it should be (empty = ./)", defaultValue: "./", when: (a) => a.new },
  { type: "confirm", name: "css", message: "Do you want to add a CSS Plugin?",  when: (a) => a.new, defaultValue: "true"},
  { type: "text", name: "cssFw", message: "{uno, tw}", defaultValue: "uno", when: (a) => a.css && a.new, validate(result: string) {
      if (!["uno", "tw"].includes(result)) {
        throw new PromptError("input must be [uno] or [tw]");
      }
    },
  },
  { type: "confirm", name: "unoCSS", message: "Do you want to add a the unoCSS Plugin?", when: (a) => !a.new, defaultValue: "true"},
]);

const additionalImportMapEntries: Array<string> = []

if(options.new){
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "-r", "https://fresh.deno.dev", options.name, "--vscode", "true", "--twind", options.cssFw == "tw" ? "true" : "false", "--force", "true" ],
  });
  const { stdout, stderr } = command.outputSync(); 
  console.log((new TextDecoder().decode(stderr) + new TextDecoder().decode(stdout)).split("\n").filter((a) => !a.startsWith("\u001b[0m\u001b[32mDownload\u001b[0m")).join("\n"));
}else{
  try { Deno.readFileSync(join(options.name || ".", "fresh.config.ts")) } catch (e) {
    throw new Error("fresh.config.ts not found thus not a fresh project", e);
  }
}

if(options.cssFw == "uno" || options.unoCSS == "true"){
  const FRESH_CONFIG_TS = `import { defineConfig } from "$fresh/server.ts";\nimport UnoCSSPlugin from "@roeh/fresh/unocss";\n\nexport default defineConfig({ plugins: [UnoCSSPlugin] });`;
  const CONFIG_TS_PATH = join(options.name || ".", "fresh.config.ts");
  await Deno.writeTextFile(CONFIG_TS_PATH, FRESH_CONFIG_TS);
  additionalImportMapEntries.push("@roeh/fresh/unocss: https://fresh.roeh.ch/plugins/unocss.ts");
  additionalImportMapEntries.push("@unocss/core: https://esm.sh/@unocss/core@0.45.24");
  additionalImportMapEntries.push("@unocss/preset-wind: https://esm.sh/@unocss/preset-wind@0.45.24?bundle&no-check");
  additionalImportMapEntries.push("@unocss/preset-web-fonts: https://esm.sh/@unocss/preset-web-fonts?bundle&no-check");
  additionalImportMapEntries.push("@unocss/preset-icons: https://esm.sh/@unocss/preset-icons?bundle&no-check");
}

const DENO_JSON_PATH = join(options.name || ".", "deno.json");

const DENO_JSON = JSON.parse(await Deno.readTextFile(DENO_JSON_PATH));
for (const entry of additionalImportMapEntries) {
  const [key, value] = entry.split(": ");
  
  DENO_JSON.imports[key] = value;
}

await Deno.writeTextFile(DENO_JSON_PATH, JSON.stringify(DENO_JSON, null, 2));