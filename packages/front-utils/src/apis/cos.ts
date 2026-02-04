import axios from "axios";
import { request } from "../request";
import type { ApiCosTypes } from "@yisu/shared";

type progressCallback = (progress: number) => void;

interface UploadRequest {
  signedUrl: string;
  file: Blob;
  onProgress?: progressCallback;
}

const upload = (request: UploadRequest) =>
  axios.put(request.signedUrl, request.file, {
    method: "PUT",
    onUploadProgress: (progress) => {
      if (!progress.total) {
        request.onProgress?.(0);
        return;
      }
      const percentCompleted = Math.round((progress.loaded * 100) / progress.total);
      request.onProgress?.(percentCompleted);
    },
    headers: {
      "Content-Type": request.file.type ?? "application/octet-stream",
    },
  });

const getSignedUrl = (data: ApiCosTypes['GeneratePresignedUrl']) =>
  request<{
    accessUrl: string;
    presignedUrl: string;
  }>({
    url: "/cos/generate-presigned-url",
    method: "POST",
    data,
  });

export const CosRequest = {
  uploadCosFile: async (
    request: ApiCosTypes['GeneratePresignedUrl'] & Omit<UploadRequest, 'signedUrl'>
  ) => {
    const { presignedUrl: signedUrl, accessUrl } = await getSignedUrl(
      request
    );
    await upload({ signedUrl, file: request.file, onProgress: request.onProgress });
    return {
      url: accessUrl,
    };
  }
}