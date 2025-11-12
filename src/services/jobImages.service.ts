import { supabase } from '@/lib/supabase';
import { ApiResponse, JobImage } from '@/types';

/**
 * Job Images Service
 * Handles job service media (images and videos) uploads and metadata storage
 */

const TABLE_NAME = 'job_media';
const SERVICE_IMAGES_BUCKET = 'job_service_media'; // Will be renamed to job_service_media

/**
 * Upload a service media file (image or video) to Supabase Storage
 * @param uri - URI of the media file (local file path)
 * @param fileName - File name for the uploaded media
 * @param contentType - MIME type of the media (e.g., 'image/png', 'video/mp4')
 * @returns ApiResponse with public URL of uploaded media
 */
export const uploadServiceMedia = async (
  uri: string,
  fileName: string,
  contentType: string
): Promise<ApiResponse<string>> => {
  try {
    // Fetch the file from URI and convert to blob
    const response = await fetch(uri);
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
 * @param jobId - Job ID
 * @param technicianJobId - Technician job ID (optional)
 * @param uri - URI of the media file (local file path)
 * @param description - Media description
 * @param createdBy - User ID who created the media
 * @param mediaType - Type of media ('IMAGE' or 'VIDEO')
 * @param fileExtension - File extension (e.g., 'png', 'jpg', 'mp4', 'mov')
 * @returns ApiResponse with created job image record
 */
export const uploadMediaAndCreateRecord = async (
  jobId: string,
  technicianJobId: string | null,
  uri: string,
  description: string | null,
  createdBy: string,
  mediaType: 'IMAGE' | 'VIDEO',
  fileExtension: string = 'png'
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

    // Upload media to storage
    const uploadResult = await uploadServiceMedia(uri, fileName, contentType);

    if (uploadResult.error || !uploadResult.data) {
      return {
        data: null,
        error: uploadResult.error || {
          message: 'Failed to upload media',
        },
      };
    }

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
