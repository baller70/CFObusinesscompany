
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";
import * as fs from 'fs';
import * as path from 'path';

// Check if we should use local storage (when AWS credentials are not configured)
const USE_LOCAL_STORAGE = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || process.env.USE_LOCAL_STORAGE === 'true';
const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || '/tmp/cfo-uploads';

// Ensure local storage directory exists
if (USE_LOCAL_STORAGE && !fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  console.log(`[S3 Mock] Created local storage directory: ${LOCAL_STORAGE_DIR}`);
}

// Only create S3 client if we're not using local storage
const s3Client = USE_LOCAL_STORAGE ? null : createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Upload file - uses local storage mock when AWS credentials not available
 */
export async function uploadFile(buffer: Buffer, fileName: string, contentType?: string): Promise<string> {
  const key = `${folderPrefix}statements/${Date.now()}-${fileName}`;

  if (USE_LOCAL_STORAGE) {
    // Local storage mock
    const localPath = path.join(LOCAL_STORAGE_DIR, key.replace(/\//g, '_'));
    fs.writeFileSync(localPath, buffer);
    console.log(`[S3 Mock] File saved locally: ${localPath}`);
    return `local://${localPath}`; // Return local:// prefix to indicate local storage
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client!.send(command);
  return key; // Return the cloud_storage_path
}

// Upload with custom key (full path control)
export async function uploadFileWithKey(buffer: Buffer, key: string, contentType?: string): Promise<string> {
  const fullKey = `${folderPrefix}${key}`;

  if (USE_LOCAL_STORAGE) {
    const localPath = path.join(LOCAL_STORAGE_DIR, fullKey.replace(/\//g, '_'));
    fs.writeFileSync(localPath, buffer);
    console.log(`[S3 Mock] File saved locally with key: ${localPath}`);
    return `local://${localPath}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fullKey,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client!.send(command);
  return fullKey; // Return the cloud_storage_path
}

export async function downloadFile(key: string): Promise<string> {
  // Check if this is a local file (for testing)
  if (key.startsWith('local://')) {
    // Return the local file path as a file:// URL
    return key.replace('local://', 'file://');
  }

  if (USE_LOCAL_STORAGE) {
    console.log(`[S3 Mock] WARNING: Attempting to download from S3 but using local storage mode`);
    return key;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Generate a signed URL that expires in 1 hour
  const signedUrl = await getSignedUrl(s3Client!, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function downloadFileBuffer(key: string): Promise<Buffer> {
  // Check if this is a local file (for testing)
  if (key.startsWith('local://')) {
    const localPath = key.replace('local://', '');
    return fs.readFileSync(localPath);
  }

  if (USE_LOCAL_STORAGE) {
    throw new Error('[S3 Mock] Cannot download from S3 in local storage mode');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client!.send(command);

  if (!response.Body) {
    throw new Error('File not found in S3');
  }

  // Convert the stream to buffer
  const chunks: any[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

export async function deleteFile(key: string): Promise<void> {
  if (key.startsWith('local://')) {
    const localPath = key.replace('local://', '');
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`[S3 Mock] File deleted: ${localPath}`);
    }
    return;
  }

  if (USE_LOCAL_STORAGE) {
    console.log(`[S3 Mock] Skipping S3 delete in local storage mode`);
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client!.send(command);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't have a native rename, so we copy and delete
  // For simplicity, we'll just return a new key with updated name
  const timestamp = Date.now();
  const newFullKey = `${folderPrefix}statements/${timestamp}-${newKey}`;
  return newFullKey;
}
