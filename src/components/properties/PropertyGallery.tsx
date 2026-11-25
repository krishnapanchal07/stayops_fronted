import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { imageUrl, propertyService } from '@/services/property/propertyService';
import type { PropertyImage } from '@/types/property';

export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGES = 12;

export function PropertyPhoto({ image, large = false }: { image?: PropertyImage | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <div className="flex aspect-video items-center justify-center rounded-xl bg-primary/10 text-sm text-text-secondary">No property photograph available</div>;
  return <img src={imageUrl(large ? image.medium : image.thumbnail)}
    srcSet={`${imageUrl(image.thumbnail)} ${image.variants.thumbnail.width}w, ${imageUrl(image.medium)} ${image.variants.medium.width}w, ${imageUrl(image.large)} ${image.variants.large.width}w`}
    sizes={large ? '(max-width: 768px) 100vw, 50vw' : '240px'}
    width={image.width} height={image.height} alt={image.filename} loading="lazy" decoding="async"
    onError={() => setFailed(true)} className="aspect-video w-full rounded-xl object-cover" />;
}

export function ImageSelection({ files, onChange, existing = 0, disabled = false }: { files: File[]; onChange: (files: File[]) => void; existing?: number; disabled?: boolean }) {
  const [error, setError] = useState('');
  return <div className="space-y-3">
    <label className="block text-sm font-medium">Property images (JPG, PNG or WebP; each less than 4 MB; maximum {MAX_IMAGES})
      <input aria-label="Property images" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled}
        className="mt-2 block w-full text-sm" onChange={event => {
          const selected = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length + existing + selected.length > MAX_IMAGES) { setError(`Select at most ${MAX_IMAGES - existing - files.length} more images.`); return; }
          const errors: string[] = [];
          const valid = selected.filter(file => {
            const reason = !file.size ? 'File is empty.' : file.size >= MAX_IMAGE_SIZE_BYTES ? 'This image must be smaller than 4 MB. Please choose a smaller image.' : !['image/jpeg','image/png','image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name) ? 'Unsupported image format. Upload JPG, PNG, or WebP.' : '';
            if (reason) errors.push(`${file.name}: ${reason}`);
            return !reason;
          });
          setError(errors.join(' ')); onChange([...files, ...valid]);
        }} />
    </label>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{files.map((file, index) => <div key={`${file.name}-${index}`}>
      <FilePreview file={file} />
      <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(files.filter((_, i) => i !== index))}>Remove {file.name}</Button>
    </div>)}</div>
  </div>;
}

export function PropertyGallery({ propertyId, images, editable, onChange }: { propertyId: string; images: PropertyImage[]; editable: boolean; onChange: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [opened, setOpened] = useState<PropertyImage | null>(null);
  const act = async (operation: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await operation(); onChange(); }
    catch (cause) { setError(axios.isAxiosError(cause) ? cause.response?.data?.error?.message ?? 'Image operation failed. Please retry.' : cause instanceof Error ? cause.message : 'Image operation failed.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">Property gallery</h2>
    {error && <p role="alert" className="text-danger">{error}</p>}
    {!images.length && <p>No photographs uploaded yet.</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => <div key={image.id}>
      <button type="button" className="w-full" onClick={() => setOpened(image)} aria-label={`Open ${image.filename}`}><PropertyPhoto image={image} /></button>
      {image.isCover && <p className="text-sm font-semibold text-primary">Cover image</p>}
      {editable && <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy || image.isCover} onClick={() => act(() => propertyService.cover(propertyId, image.id))}>Set cover</Button>
        <Button size="sm" variant="outline" disabled={busy || !index} onClick={() => act(() => { const ids=images.map(i=>i.id); [ids[index-1],ids[index]]=[ids[index],ids[index-1]]; return propertyService.order(propertyId,ids); })}>Move earlier</Button>
        <Button size="sm" variant="danger" disabled={busy} onClick={() => act(() => propertyService.deleteImage(propertyId,image.id))}>Delete image</Button>
      </div>}
    </div>)}</div>
    {editable && <><ImageSelection files={files} onChange={setFiles} existing={images.length} disabled={busy} />
      <Button disabled={busy || !files.length} onClick={() => act(async () => { await propertyService.upload(propertyId,files); setFiles([]); })}>{busy ? 'Saving…' : 'Upload images'}</Button></>}
    {opened && <div role="dialog" aria-modal="true" aria-label="Property photograph" className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-5" onClick={() => setOpened(null)}>
      <Button onClick={() => setOpened(null)}>Close photograph</Button>
      <img src={imageUrl(opened.large)} alt={opened.filename} className="mx-auto mt-4 max-h-[85dvh] max-w-full object-contain" />
    </div>}
  </section>;
}

function FilePreview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={file.name} className="aspect-video w-full rounded-lg object-cover" />;
}
