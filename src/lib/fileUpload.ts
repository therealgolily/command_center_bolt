import { supabase } from './supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export type UploadResult = {
  url: string;
  name: string;
};

export async function uploadAttachment(
  file: File,
  userId: string,
  type: 'income' | 'expenses'
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Please upload PDF, JPG, PNG, XLSX, or DOCX files.');
  }

  const timestamp = Date.now();
  const fileName = `${userId}/${type}/${timestamp}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('attachments')
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    name: file.name,
  };
}

export async function deleteAttachment(url: string): Promise<void> {
  if (!url) return;

  try {
    const path = url.split('/attachments/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('attachments')
      .remove([path]);

    if (error) {
      console.error('Failed to delete attachment:', error);
    }
  } catch (error) {
    console.error('Error deleting attachment:', error);
  }
}
