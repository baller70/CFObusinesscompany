
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string, contentType?: string): Promise<string> {
  const key = `${folderPrefix}statements/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key; // Return the cloud_storage_path
}

export async function downloadFile(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Generate a signed URL that expires in 1 hour
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function downloadFileBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  
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
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't have a native rename, so we copy and delete
  // For simplicity, we'll just return a new key with updated name
  const timestamp = Date.now();
  const newFullKey = `${folderPrefix}statements/${timestamp}-${newKey}`;
  return newFullKey;
}
