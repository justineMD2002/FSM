import { supabase } from '@/lib/supabase';
import { ApiResponse, JobImage } from '@/types';
import { decode } from 'base64-arraybuffer';

/**
 * Job Images Service
 * Handles job service image uploads and metadata storage
 */

const TABLE_NAME = 'job_images';
const SERVICE_IMAGES_BUCKET = 'job_service_images';

/**
 * Upload a service image to Supabase Storage
 * @param base64Image - Base64 encoded image string
 * @param fileName - File name for the uploaded image
 * @returns ApiResponse with public URL of uploaded image
 */
export const uploadServiceImage = async (
  base64Image: string,
  fileName: string
): Promise<ApiResponse<string>> => {
  try {
    // Remove data:image/png;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const arrayBuffer = decode(base64Data);

    const { data, error } = await supabase.storage
      .from(SERVICE_IMAGES_BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: 'image/png',
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
 * Upload image to storage and create database record
 * @param jobId - Job ID
 * @param technicianJobId - Technician job ID (optional)
 * @param base64Image - Base64 encoded image
 * @param description - Image description
 * @param createdBy - User ID who created the image
 * @returns ApiResponse with created job image record
 */
export const uploadImageAndCreateRecord = async (
  jobId: string,
  technicianJobId: string | null,
  base64Image: string,
  description: string | null,
  createdBy: string
): Promise<ApiResponse<JobImage>> => {
  try {
    // Generate unique file name
    const fileName = `${jobId}_${Date.now()}.png`;

    // Upload image to storage
    const uploadResult = await uploadServiceImage(base64Image, fileName);

    if (uploadResult.error || !uploadResult.data) {
      return {
        data: null,
        error: uploadResult.error || {
          message: 'Failed to upload image',
        },
      };
    }

    // Create database record
    const imageRecord: Omit<JobImage, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> = {
      job_id: jobId,
      technician_job_id: technicianJobId,
      image_url: uploadResult.data,
      description,
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
