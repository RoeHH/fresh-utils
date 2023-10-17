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
  { type: "confirm", name: "kvAdmin", message: "Do you want to add a the deno KVAdmin Plugin?", defaultValue: "true"},
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

// Fresh Config ts
let FRESH_CONFIG_TS = `import { defineConfig } from "$fresh/server.ts";\n`
const FRESH_CONFIG_PLUGINS = []

if(options.cssFw == "uno" || options.unoCSS == true){
  FRESH_CONFIG_TS += `import UnoCSSPlugin from "@roeh/fresh/unocss";\n`;
  FRESH_CONFIG_PLUGINS.push("UnoCSSPlugin")
  additionalImportMapEntries.push("@roeh/fresh/unocss: https://fresh.roeh.ch/plugins/unocss.ts");
  additionalImportMapEntries.push("@unocss/core: https://esm.sh/@unocss/core@0.45.24");
  additionalImportMapEntries.push("@unocss/preset-wind: https://esm.sh/@unocss/preset-wind@0.45.24?bundle&no-check");
  additionalImportMapEntries.push("@unocss/preset-web-fonts: https://esm.sh/@unocss/preset-web-fonts?bundle&no-check");
  additionalImportMapEntries.push("@unocss/preset-icons: https://esm.sh/@unocss/preset-icons?bundle&no-check");
}

if(options.kvAdmin == true){
  FRESH_CONFIG_TS += 'import KVAdminPlugin from "@roeh/fresh/kvAdmin";\n';
  FRESH_CONFIG_PLUGINS.push("KVAdminPlugin")
  additionalImportMapEntries.push("@roeh/fresh/kvAdmin: https://fresh.roeh.ch/plugins/kv-admin.ts");
}

FRESH_CONFIG_TS += `\nexport default defineConfig({ plugins: [${FRESH_CONFIG_PLUGINS.map(v=> ` ${v},`)} ] });`;
const CONFIG_TS_PATH = join(options.name || ".", "fresh.config.ts");
await Deno.writeTextFile(CONFIG_TS_PATH, FRESH_CONFIG_TS, {create:true});


// Import Map Addons

const DENO_JSON_PATH = join(options.name || ".", "deno.json");

const DENO_JSON = JSON.parse(await Deno.readTextFile(DENO_JSON_PATH));
for (const entry of additionalImportMapEntries) {
  const [key, value] = entry.split(": ");
  
  DENO_JSON.imports[key] = value;
}

await Deno.writeTextFile(DENO_JSON_PATH, JSON.stringify(DENO_JSON, null, 2));