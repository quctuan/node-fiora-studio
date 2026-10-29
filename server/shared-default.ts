import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from '@vercel/blob';
import { createSharedDefaultHandler } from './shared-default-handler';
import { PresetConflictError } from './preset-library';
import { validateSharedSettings } from './shared-default-validation';
function handlerFor(pathname: string) { return createSharedDefaultHandler({
  validate: value => {const parsed=validateSharedSettings(value);return parsed && (parsed.values["studio.tool"]??"beam")===(pathname.startsWith("fluid-tooltip/")?"fluid":"beam") ? parsed : null;},
  storage: {
    async read() {
      // Read the mutation API's version tag before the uncached body. A later change
      // causes conditional put to fail instead of replacing a newer snapshot.
      let metadata;
      try { metadata = await head(pathname); }
      catch (error) { if (error instanceof BlobNotFoundError) return { value: null, etag: null }; throw error; }
      const result = await get(pathname, { access: 'private', useCache: false });
      if (!result || !result.stream) return { value: null, etag: null };
      return { value: await new Response(result.stream).json(), etag: metadata.etag };
    },
    async write(library, etag) {
      try {
        await put(pathname, JSON.stringify(library), { access: 'private', addRandomSuffix: false, ...(etag ? { ifMatch: etag } : { allowOverwrite: false }), contentType: 'application/json', cacheControlMaxAge: 0 });
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) throw new PresetConflictError('Concurrent update.');
        throw error;
      }
    },
  },
 }); }
const beam=handlerFor('node-beam/shared-default.json');
export const fluidDefaultHandler=handlerFor('fluid-tooltip/shared-default.json');
const fluid=fluidDefaultHandler;
export default function handler(...args: Parameters<typeof beam>){const [req]=args;return new URL(req.url??'/', 'https://local').searchParams.get('tool')==='fluid'?fluid(...args):beam(...args);}
