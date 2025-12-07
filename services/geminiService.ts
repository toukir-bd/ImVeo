import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateVeoVideo = async (
  imageFile: File,
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  
  // Create instance right before call to ensure API key is fresh
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);

  console.log("Starting video generation...");
  
  // Initial request to start operation
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || "Animate this image cinematically", // Fallback prompt if empty
    image: {
      imageBytes: imagePart.data,
      mimeType: imagePart.mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p', // Veo fast preview often defaults to this, specific resolution might be model dependent but 720p is safe for preview
      aspectRatio: aspectRatio,
    }
  });

  console.log("Operation created, polling for completion...");

  // Polling loop
  while (!operation.done) {
    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("Polling operation status...");
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message || 'Unknown error'}`);
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!videoUri) {
    throw new Error("No video URI returned from the API.");
  }

  // Append API key for download access as per documentation
  return `${videoUri}&key=${process.env.API_KEY}`;
};