import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

export async function uploadContractFile(filePath: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
  const { data, error } = await supabase.storage.from('contracts').upload(filePath, fileBuffer, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw new Error(`Storage Upload Failed: ${error.message}`);
  return data.path;
}

export async function downloadContractFile(filePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from('contracts').download(filePath);
  if (error) throw new Error(`Storage Download Failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}
