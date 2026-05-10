import { supabase } from '../../../lib/supabase';

export async function uploadRfqQuotePhotos(files: File[], userId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const uploadedPhotos: Array<{ path: string; publicUrl: string }> = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from('rfq-quote-photos')
      .upload(path, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from('rfq-quote-photos').getPublicUrl(path);

    uploadedPhotos.push({ path, publicUrl: data.publicUrl });
  }

  return uploadedPhotos;
}

export async function removeUploadedRfqQuotePhotos(paths: string[]) {
  if (!supabase || paths.length === 0) {
    return;
  }

  await supabase.storage.from('rfq-quote-photos').remove(paths);
}
