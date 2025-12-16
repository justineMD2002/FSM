import { supabase } from '@/lib/supabase';
import { ApiResponse, JobImage } from '@/types';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Image, Video } from 'react-native-compressor';

/**
 * Job Images Service
 * Handles job service media (images and videos) uploads and metadata storage
 * Now with automatic compression for images and videos
 */

const TABLE_NAME = 'job_media';
const SERVICE_IMAGES_BUCKET = 'job_service_media';

// Compression settings
const IMAGE_COMPRESSION_OPTIONS = {
  compressionMethod: 'auto' as const,
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8, // 80% quality
};

const VIDEO_COMPRESSION_OPTIONS = {
  compressionMethod: 'auto' as const,
  maxSize: 1920, // Max width/height
  minimumFileSizeForCompress: 0, // Compress all videos
};

/**
 * Compress an image before upload
 * @param uri - Original image URI
 * @returns Compressed image URI
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    console.log('Compressing image...');
    const compressedUri = await Image.compress(uri, IMAGE_COMPRESSION_OPTIONS);
    
    // Get file sizes for logging
    const originalInfo = await FileSystem.getInfoAsync(uri);
    const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
    
    if (originalInfo.exists && compressedInfo.exists) {
      const originalSize = (originalInfo.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedInfo.size / 1024 / 1024).toFixed(2);
      const savings = (((originalInfo.size - compressedInfo.size) / originalInfo.size) * 100).toFixed(1);
      console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB (${savings}% reduction)`);
    }
    
    return compressedUri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original URI if compression fails
    return uri;
  }
};

/**
 * Compress a video before upload
 * @param uri - Original video URI
 * @returns Compressed video URI
 */
const compressVideo = async (uri: string): Promise<string> => {
  try {
    console.log('Compressing video (this may take a moment)...');
    const compressedUri = await Video.compress(
      uri,
      VIDEO_COMPRESSION_OPTIONS,
      (progress) => {
        console.log(`Video compression progress: ${(progress * 100).toFixed(0)}%`);
      }
    );
    
    // Get file sizes for logging
    const originalInfo = await FileSystem.getInfoAsync(uri);
    const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
    
    if (originalInfo.exists && compressedInfo.exists) {
      const originalSize = (originalInfo.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedInfo.size / 1024 / 1024).toFixed(2);
      const savings = (((originalInfo.size - compressedInfo.size) / originalInfo.size) * 100).toFixed(1);
      console.log(`Video compressed: ${originalSize}MB → ${compressedSize}MB (${savings}% reduction)`);
    }
    
    return compressedUri;
  } catch (error) {
    console.error('Error compressing video:', error);
    // Return original URI if compression fails
    return uri;
  }
};

/**
 * Upload a service media file (image or video) to Supabase Storage
 * Automatically compresses media before upload
 * @param uri - URI of the media file (local file path)
 * @param fileName - File name for the uploaded media
 * @param contentType - MIME type of the media (e.g., 'image/png', 'video/mp4')
 * @param shouldCompress - Whether to compress the media (default: true)
 * @returns ApiResponse with public URL of uploaded media
 */
export const uploadServiceMedia = async (
  uri: string,
  fileName: string,
  contentType: string,
  shouldCompress: boolean = true
): Promise<ApiResponse<string>> => {
  try {
    let uploadUri = uri;
    const isVideo = contentType.startsWith('video/');
    
    // Compress media if on mobile and compression is enabled
    if (shouldCompress && Platform.OS !== 'web') {
      if (isVideo) {
        uploadUri = await compressVideo(uri);
      } else {
        uploadUri = await compressImage(uri);
      }
    }
    
    if (Platform.OS === 'web') {
      // Web: Use fetch to get blob directly
      const response = await fetch(uploadUri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from(SERVICE_IMAGES_BUCKET)
        .upload(fileName, blob, {
          contentType,
          upsert: false,
        });

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            details: error,
          },
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(SERVICE_IMAGES_BUCKET)
        .getPublicUrl(data.path);

      return {
        data: publicUrlData.publicUrl,
        error: null,
      };
    } else {
      // Mobile: Use optimized approach based on file type
      if (isVideo) {
        // For videos: Use FileSystem upload directly (avoids memory issues)
        const uploadUrl = await getUploadUrl(fileName, contentType);
        
        if (!uploadUrl) {
          throw new Error('Failed to get upload URL');
        }

        // Use FileSystem.uploadAsync for efficient large file uploads
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, uploadUri, {
          httpMethod: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        if (uploadResult.status !== 200) {
          throw new Error(`Upload failed with status ${uploadResult.status}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(SERVICE_IMAGES_BUCKET)
          .getPublicUrl(fileName);

        return {
          data: publicUrlData.publicUrl,
          error: null,
        };
      } else {
        // For images: Use base64 approach (works well for smaller files)
        const base64Data = await FileSystem.readAsStringAsync(uploadUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const arrayBuffer = decode(base64Data);

        const { data, error } = await supabase.storage
          .from(SERVICE_IMAGES_BUCKET)
          .upload(fileName, arrayBuffer, {
            contentType,
            upsert: false,
          });

        if (error) {
          return {
            data: null,
            error: {
              message: error.message,
              details: error,
            },
          };
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(SERVICE_IMAGES_BUCKET)
          .getPublicUrl(data.path);

        return {
          data: publicUrlData.publicUrl,
          error: null,
        };
      }
    }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Get a signed upload URL from Supabase Storage
 * This allows direct file upload without loading entire file into memory
 */
const getUploadUrl = async (
  fileName: string,
  contentType: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(SERVICE_IMAGES_BUCKET)
      .createSignedUploadUrl(fileName);

    if (error || !data) {
      console.error('Error getting upload URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getUploadUrl:', error);
    return null;
  }
};

/**
 * Convert URI to base64 string
 * Works on both web and mobile without using blob
 * @deprecated - Only used for image uploads now
 */
const uriToBase64 = async (uri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    // Web: Use fetch and FileReader
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // Mobile: Use expo-file-system legacy API (no blob needed!)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  }
};

/**
 * @deprecated Use uploadServiceMedia instead
 * Upload a service image to Supabase Storage
 */
export const uploadServiceImage = uploadServiceMedia;

/**
 * Delete a service image from Supabase Storage
 * @param filePath - Path to the file in storage
 * @returns ApiResponse with success status
 */
export const deleteServiceImage = async (
  filePath: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase.storage
      .from(SERVICE_IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          details: error,
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Get all images for a specific job
 * @param jobId - Job ID
 * @returns ApiResponse with array of job images
 */
export const getImagesByJobId = async (
  jobId: string
): Promise<ApiResponse<JobImage[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('job_id', jobId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: data as JobImage[],
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Create a new job image record
 * @param image - Job image data
 * @returns ApiResponse with created job image
 */
export const createJobImage = async (
  image: Omit<JobImage, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<ApiResponse<JobImage>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([image])
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: data as JobImage,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Update a job image
 * @param imageId - Job image ID
 * @param updates - Partial job image data to update
 * @returns ApiResponse with updated job image
 */
export const updateJobImage = async (
  imageId: string,
  updates: Partial<Omit<JobImage, 'id' | 'job_id' | 'created_by' | 'created_at' | 'updated_at' | 'deleted_at'>>
): Promise<ApiResponse<JobImage>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: data as JobImage,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Delete a job image (soft delete)
 * @param imageId - Job image ID
 * @returns ApiResponse with success status
 */
export const deleteJobImage = async (
  imageId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', imageId);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Upload media (image or video) to storage and create database record
 * Automatically compresses media before upload for optimal storage and bandwidth
 * @param jobId - Job ID
 * @param technicianJobId - Technician job ID (optional)
 * @param uri - URI of the media file (local file path)
 * @param description - Media description
 * @param createdBy - User ID who created the media
 * @param mediaType - Type of media ('IMAGE' or 'VIDEO')
 * @param fileExtension - File extension (e.g., 'png', 'jpg', 'mp4', 'mov')
 * @param shouldCompress - Whether to compress the media (default: true)
 * @returns ApiResponse with created job image record
 */
export const uploadMediaAndCreateRecord = async (
  jobId: string,
  technicianJobId: string | null,
  uri: string,
  description: string | null,
  createdBy: string,
  mediaType: 'IMAGE' | 'VIDEO',
  fileExtension: string = 'png',
  shouldCompress: boolean = true
): Promise<ApiResponse<JobImage>> => {
  try {
    // Generate unique file name
    const fileName = `${jobId}_${Date.now()}.${fileExtension}`;

    // Determine content type
    let contentType: string;
    if (mediaType === 'VIDEO') {
      contentType = fileExtension === 'mov' ? 'video/quicktime' : `video/${fileExtension}`;
    } else {
      contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    }

    console.log(`Uploading ${mediaType}: ${fileName} (${contentType})`);

    // Upload media to storage (with automatic compression)
    const uploadResult = await uploadServiceMedia(uri, fileName, contentType, shouldCompress);

    if (uploadResult.error || !uploadResult.data) {
      return {
        data: null,
        error: uploadResult.error || {
          message: 'Failed to upload media',
        },
      };
    }

    console.log(`${mediaType} uploaded successfully:`, uploadResult.data);

    // Create database record
    const imageRecord: Omit<JobImage, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> = {
      job_id: jobId,
      technician_job_id: technicianJobId,
      image_url: uploadResult.data,
      description,
      media_type: mediaType,
      created_by: createdBy,
    };

    const createResult = await createJobImage(imageRecord);

    return createResult;
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * @deprecated Use uploadMediaAndCreateRecord instead
 * Upload image to storage and create database record
 */
export const uploadImageAndCreateRecord = async (
  jobId: string,
  technicianJobId: string | null,
  uri: string,
  description: string | null,
  createdBy: string
): Promise<ApiResponse<JobImage>> => {
  return uploadMediaAndCreateRecord(jobId, technicianJobId, uri, description, createdBy, 'IMAGE', 'png');
};