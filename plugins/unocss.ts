import type { Preset, UserConfig  } from "@unocss/core";
import { UnoGenerator } from "@unocss/core";
import presetWind from "@unocss/preset-wind";
import presetWebFonts from "@unocss/preset-web-fonts";
import presetIcons from '@unocss/preset-icons'
import { PluginAsyncRenderContext, PluginRenderResult } from "$fresh/server.ts";

/*
Example Versions:
"@unocss/core": "https://esm.sh/@unocss/core@0.45.24",
"@unocss/preset-wind": "https://esm.sh/@unocss/preset-wind@0.45.24?bundle&no-check",
"@unocss/preset-web-fonts": "https://esm.sh/@unocss/preset-web-fonts@0.45.24?bundle&no-check",
"@unocss/preset-icons": "https://esm.sh/@unocss/preset-icons@0.45.24?bundle&no-check"
*/

const defaultUnoConfig: UserConfig = {
  presets: [
    presetWind() as unknown as Preset,
    presetWebFonts({
      provider: "google", // default provider
      fonts: {
        // these will extend the default theme
        sans: "Nunito",
        mono: "Fira Code",
      },
    }) as unknown as Preset,
    presetIcons({
      cdn: 'https://esm.sh/',
    })
  ],
};

const unoResetCSS = `
  /* reset */
  *,:before,:after{box-sizing:border-box;border:0 solid}html{-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;line-height:1.5}body{line-height:inherit;margin:0}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;background-color:#0000;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{margin:0;padding:0;list-style:none}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}
  `;

export class UnoCSS {
  uno: UnoGenerator;

  constructor() {
    this.uno = new UnoGenerator(defaultUnoConfig);
  }

  async render(renderBody: string): Promise<string[]> {
    const { css } = await this.uno.generate(renderBody);
    return [
      unoResetCSS,
      css,
    ];
  }
}

const unoCSS = new UnoCSS();

export const UnoCSSPlugin: Plugin = {
  name: "UnoCss Plugin",
  renderAsync: async (ctx: PluginAsyncRenderContext) =>{
    const renderResult = await ctx.renderAsync()
    const unoCSSOutput = await unoCSS.render(renderResult.htmlText);    
    return {
      styles: [{ cssText: unoCSSOutput.join("\n")}],
    } as PluginRenderResult;
  }
}

export default UnoCSSPlugin;