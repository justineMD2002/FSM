import { supabase } from '@/lib/supabase';
import { JobSignature, ApiResponse } from '@/types';
import { decode } from 'base64-arraybuffer';

/**
 * Job Signatures Service
 * Handles all job signature and image upload operations
 */

const TABLE_NAME = 'job_signatures';
const SIGNATURE_BUCKET = 'job_customer_signatures';

/**
 * Upload a signature image to Supabase Storage
 * @param base64Signature - Base64 encoded signature image string
 * @param fileName - File name for the uploaded signature
 * @returns ApiResponse with public URL of uploaded signature
 */
export const uploadSignatureImage = async (
  base64Signature: string,
  fileName: string
): Promise<ApiResponse<string>> => {
  try {
    // Remove data:image/png;base64, prefix if present
    const base64Data = base64Signature.replace(/^data:image\/\w+;base64,/, '');
    const arrayBuffer = decode(base64Data);

    const { data, error } = await supabase.storage
      .from(SIGNATURE_BUCKET)
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
      .from(SIGNATURE_BUCKET)
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
 * Delete a signature image from Supabase Storage
 * @param filePath - Path to the signature file in storage
 * @returns ApiResponse with success status
 */
export const deleteSignatureImage = async (
  filePath: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase.storage
      .from(SIGNATURE_BUCKET)
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
 * Create a job signature record
 * @param signature - Job signature data
 * @returns ApiResponse with created signature
 */
export const createJobSignature = async (
  signature: Omit<JobSignature, 'id' | 'created_at'>
): Promise<ApiResponse<JobSignature>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([signature])
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
      data: data as JobSignature,
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
 * Get job signature by technician job ID
 * @param technicianJobId - Technician job ID
 * @returns ApiResponse with job signature
 */
export const getJobSignatureByTechnicianJobId = async (
  technicianJobId: string
): Promise<ApiResponse<JobSignature | null>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('technician_job_id', technicianJobId)
      .maybeSingle();

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
      data: data as JobSignature | null,
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
 * Upload signature and create signature record
 * @param technicianJobId - Technician job ID
 * @param base64Signature - Base64 encoded signature image
 * @param customerName - Customer name
 * @param customerFeedback - Optional customer feedback
 * @returns ApiResponse with created signature record
 */
export const uploadSignatureAndCreateRecord = async (
  technicianJobId: string,
  base64Signature: string,
  customerName: string,
  customerFeedback?: string
): Promise<ApiResponse<JobSignature>> => {
  try {
    // Generate unique file name
    const fileName = `${technicianJobId}_${Date.now()}.png`;

    // Upload signature image to signature bucket
    const uploadResult = await uploadSignatureImage(base64Signature, fileName);

    if (uploadResult.error || !uploadResult.data) {
      return {
        data: null,
        error: uploadResult.error || {
          message: 'Failed to upload signature image',
        },
      };
    }

    // Create signature record
    const signatureRecord: Omit<JobSignature, 'id' | 'created_at'> = {
      technician_job_id: technicianJobId,
      signature_image_url: uploadResult.data,
      customer_name: customerName,
      customer_feedback: customerFeedback || null,
      signed_at: new Date().toISOString(),
    };

    const createResult = await createJobSignature(signatureRecord);

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
