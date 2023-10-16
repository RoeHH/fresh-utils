import { serveDir } from "https://deno.land/std@0.202.0/http/file_server.ts";
import { walk } from "https://deno.land/std@0.202.0/fs/walk.ts";

Deno.serve(async (req: Request) => {
  const { pathname, origin } = new URL(req.url);

  if (req.headers.get("User-Agent")?.slice(0, 4) === "Deno") {
    return serveDir(req, {
      fsRoot: "",
      urlRoot: "",
    });
  } else {
    try {
        return new Response(Deno.readFileSync("."+pathname))
    } catch {
      const files = []
      for await (const file of walk(".", { exts: [".ts", ".tsx"] }))
        files.push(file)    
      return new Response(JSON.stringify(files.map(f=> origin + "/" + f.path)), {
          status: 404,
      });
    }
  }
});