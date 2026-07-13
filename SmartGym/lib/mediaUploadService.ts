/**
 * mediaUploadService.ts
 * Image / GIF / video upload to Supabase Storage with validation.
 */

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from './supabase';
import type { MediaItem } from './supabaseTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB
const BUCKET = 'exercise-media';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'];

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaPickType = 'image' | 'gif' | 'video';

export interface UploadResult {
  mediaItem: MediaItem;
  publicUrl: string;
}

// ─── Permission helper ────────────────────────────────────────────────────────

async function ensureMediaPermission(): Promise<void> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission is required to upload files.');
  }
}

// ─── Picker ───────────────────────────────────────────────────────────────────

/**
 * Opens the device image picker.
 * Returns the picked asset, or null if the user cancelled.
 */
export async function pickMedia(
  type: MediaPickType
): Promise<ImagePicker.ImagePickerAsset | null> {
  await ensureMediaPermission();

  const isVideo = type === 'video';
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: isVideo
      ? ImagePicker.MediaTypeOptions.Videos
      : ImagePicker.MediaTypeOptions.Images,
    allowsEditing: !isVideo,
    quality: isVideo ? 0.8 : 0.9,
    base64: false,
    exif: false,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateAsset(
  asset: ImagePicker.ImagePickerAsset,
  type: MediaPickType
): void {
  const maxBytes = type === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (asset.fileSize && asset.fileSize > maxBytes) {
    const maxMB = maxBytes / 1024 / 1024;
    throw new Error(
      `File is too large. Maximum size for ${type} is ${maxMB}MB.`
    );
  }

  const mimeType = asset.mimeType ?? '';
  const allowedTypes = type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  if (mimeType && !allowedTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a picked asset to Supabase Storage.
 * Storage path: {userId}/{exerciseId}/{type}-{timestamp}.{ext}
 */
export async function uploadMedia(
  asset: ImagePicker.ImagePickerAsset,
  userId: string,
  exerciseId: string,
  type: MediaPickType
): Promise<UploadResult> {
  validateAsset(asset, type);

  const ext = getExtension(asset.mimeType, type);
  const timestamp = Date.now();
  const storagePath = `${userId}/${exerciseId}/${type}-${timestamp}.${ext}`;
  const contentType = asset.mimeType ?? getDefaultMimeType(type);

  // Use FormData for reliable file upload on both iOS and Android
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: storagePath.split('/').pop(),
    type: contentType,
  } as any);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, formData, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  let thumbnailUrl: string | undefined;

  // Generate thumbnail for videos
  if (type === 'video') {
    try {
      const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
        time: 500, // Capture at 0.5s
        quality: 0.7,
      });

      const thumbPath = `${userId}/${exerciseId}/thumb-${timestamp}.jpg`;
      const thumbFormData = new FormData();
      thumbFormData.append('file', {
        uri: thumbUri,
        name: `thumb-${timestamp}.jpg`,
        type: 'image/jpeg',
      } as any);

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(BUCKET)
        .upload(thumbPath, thumbFormData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
    } catch (e) {
      console.warn('Could not generate video thumbnail:', e);
    }
  }

  const mediaType: MediaItem['type'] =
    type === 'gif' ? 'gif' : type === 'video' ? 'video' : 'image';

  const mediaItem: MediaItem = {
    url: publicUrl,
    type: mediaType,
    thumbnailUrl,
    storagePath,
  };

  return { mediaItem, publicUrl };
}

/** Delete a media file from storage */
export async function deleteMedia(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(mimeType: string | undefined | null, type: MediaPickType): string {
  if (!mimeType) return type === 'video' ? 'mp4' : 'jpg';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'video/mp4') return 'mp4';
  if (mimeType === 'video/quicktime') return 'mov';
  return type === 'video' ? 'mp4' : 'jpg';
}

function getDefaultMimeType(type: MediaPickType): string {
  if (type === 'video') return 'video/mp4';
  if (type === 'gif') return 'image/gif';
  return 'image/jpeg';
}
