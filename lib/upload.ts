import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const DEFAULT_UPLOAD_URL_PREFIX = "/uploads";

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim().length > 0
    ? process.env.UPLOAD_DIR
    : DEFAULT_UPLOAD_DIR;

export const UPLOAD_URL_PREFIX =
  process.env.UPLOAD_URL_PREFIX && process.env.UPLOAD_URL_PREFIX.trim().length > 0
    ? process.env.UPLOAD_URL_PREFIX
    : DEFAULT_UPLOAD_URL_PREFIX;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

export function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function generateFilename(originalName: string) {
  const extension = path.extname(originalName).toLowerCase();
  return `${randomUUID()}${ALLOWED_EXTENSIONS.has(extension) ? extension : ".jpg"}`;
}

export function getFilePath(filename: string) {
  return path.join(UPLOAD_DIR, filename);
}

export function getFileUrl(filename: string) {
  return `${UPLOAD_URL_PREFIX}/${filename}`;
}

export function deleteFile(filename: string) {
  try {
    fs.unlinkSync(getFilePath(filename));
  } catch {
    // Ignore missing files.
  }
}
