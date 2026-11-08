'use client';

import { useState } from 'react';
import ImageUploader from './ImageUploader';

/** Single-image upload field (no URL typing). Submits the uploaded URL under `name` in the surrounding <form>. */
export default function ImageField({ name, defaultValue = '', label }: { name: string; defaultValue?: string; label: string }) {
  const [images, setImages] = useState<string[]>(defaultValue ? [defaultValue] : []);
  return (
    <div>
      <span className="label-lux">{label}</span>
      <input type="hidden" name={name} value={images[0] ?? ''} />
      <ImageUploader value={images} onChange={(u) => setImages(u)} max={1} multiple={false} label={images.length ? 'Replace Image' : 'Upload Image'} />
    </div>
  );
}
