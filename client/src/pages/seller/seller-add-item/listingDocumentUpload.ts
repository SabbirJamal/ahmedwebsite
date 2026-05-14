import { supabase } from '../../../lib/supabase';

type UploadKind = 'driver-card' | 'vehicle-registration';

const allowedDocumentTypes = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function uploadListingDocument(
  file: File,
  userId: string,
  kind: UploadKind,
) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (kind === 'driver-card' && !file.type.startsWith('image/')) {
    throw new Error('Passport/resident card must be an image.');
  }

  if (kind === 'vehicle-registration') {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const hasAllowedType = allowedDocumentTypes.has(file.type);
    const hasAllowedExtension = extension && ['doc', 'docx', 'pdf'].includes(extension);

    if (!hasAllowedType && !hasAllowedExtension) {
      throw new Error('Vehicle registration must be a PDF, DOC, or DOCX file.');
    }
  }

  const extension = file.name.split('.').pop() || 'file';
  const path = `${userId}/${kind}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('listing-documents')
    .upload(path, file);

  if (error) {
    throw error;
  }

  return { path };
}

export async function removeUploadedListingDocuments(paths: string[]) {
  if (!supabase || paths.length === 0) {
    return;
  }

  await supabase.storage.from('listing-documents').remove(paths);
}
