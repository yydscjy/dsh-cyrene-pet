/**
 * @cyrene/dsh-pet — node half.
 *
 * Host loader entry for the browser pet plugin. Provides no host-side
 * behavior beyond serving the Spine model assets (skeleton / atlas /
 * textures) to the browser over a dedicated webServer route, so the client
 * bundle can load them from the same origin.
 */
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = normalize(join(here, '..', 'assets'));

const MIME = {
  '.skel': 'application/octet-stream',
  '.atlas': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/** Required services (cordis fiber inject). */
export const inject = ['webServer'];

/**
 * Register the /pet-assets route serving the model files.
 * @param ctx - host root context.
 */
export function apply(ctx) {
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: '/pet-assets',
      handler: (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const rel = decodeURIComponent(url.pathname).replace(/^\/pet-assets\/?/, '');
          const file = normalize(join(assetsDir, rel));
          // Path containment: never serve files outside assets/.
          if (!file.startsWith(assetsDir + sep) && file !== assetsDir) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('forbidden');
            return;
          }
          const ext = extname(file).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME[ext] ?? 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
          });
          createReadStream(file).pipe(res);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('not found');
        }
      },
    });
    return dispose;
  }, 'cyrene-pet: model asset route');
}
