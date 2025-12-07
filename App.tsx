import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { Button } from './components/Button';
import { generateVeoVideo } from './services/geminiService';
import { AspectRatio, VideoState } from './types';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [videoState, setVideoState] = useState<VideoState>({
    isLoading: false,
    progressMessage: '',
    videoUrl: null,
    error: null,
  });

  const handleGenerate = useCallback(async () => {
    if (!file) return;

    setVideoState({
      isLoading: true,
      progressMessage: 'Initializing authentication...',
      videoUrl: null,
      error: null,
    });

    try {
      // 1. Check/Request API Key
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          try {
            await window.aistudio.openSelectKey();
          } catch (err) {
            // User likely cancelled or popup blocked
            throw new Error("API Key selection is required to proceed.");
          }
        }
      }

      setVideoState(prev => ({ ...prev, progressMessage: 'Uploading image & starting generation...' }));
      
      // 2. Call Service
      const url = await generateVeoVideo(file, prompt, aspectRatio);

      setVideoState({
        isLoading: false,
        progressMessage: 'Done!',
        videoUrl: url,
        error: null,
      });

    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "An unexpected error occurred";

      // Handle specific "Requested entity was not found" error as per guidance
      if (errorMessage.includes("Requested entity was not found")) {
        setVideoState(prev => ({
          ...prev,
          isLoading: false,
          error: "API Key session invalid. Please try generating again to select a new key."
        }));
        // Force reset key selection if possible/needed, mostly just asking user to retry works as the check runs next time
        if (window.aistudio) {
             try { await window.aistudio.openSelectKey(); } catch(e) {}
        }
      } else {
        setVideoState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    }
  }, [file, prompt, aspectRatio]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Bring your images to <span className="text-green-600">life</span>.
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Upload a static image and use AI to transform it into a stunning animated video in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Input Controls */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full mr-2">1</span>
              Configure Animation
            </h2>

            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Image</label>
                <FileUpload onFileSelect={setFile} selectedFile={file} />
              </div>

              {/* Prompt Input */}
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Animation Prompt <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-xl p-3 bg-gray-50"
                  placeholder="Describe how the image should move (e.g., 'Cinematic camera pan, leaves rustling in the wind')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all ${
                      aspectRatio === AspectRatio.LANDSCAPE
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-200 text-gray-600'
                    }`}
                  >
                    <div className="w-12 h-7 border-2 border-current rounded-sm mb-2"></div>
                    <span className="text-sm font-medium">Landscape (16:9)</span>
                  </div>
                  <div
                    onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all ${
                      aspectRatio === AspectRatio.PORTRAIT
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-200 text-gray-600'
                    }`}
                  >
                    <div className="w-7 h-12 border-2 border-current rounded-sm mb-2"></div>
                    <span className="text-sm font-medium">Portrait (9:16)</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!file} 
                  isLoading={videoState.isLoading}
                  fullWidth
                >
                  Generate Video
                </Button>
                <p className="mt-3 text-xs text-center text-gray-400">
                  By generating, you agree to the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-green-600">Terms of Service</a>. Requires a paid project.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Output / Preview */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 sm:p-8 min-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full mr-2">2</span>
              Result
            </h2>
            
            <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden">
              
              {/* Empty State */}
              {!videoState.isLoading && !videoState.videoUrl && !videoState.error && (
                <div className="text-center p-6">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium">No video generated yet</h3>
                  <p className="text-gray-500 text-sm mt-1">Upload an image and click generate to see the magic.</p>
                </div>
              )}

              {/* Loading State */}
              {videoState.isLoading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Creating your video</h3>
                  <p className="text-gray-500 mt-2 animate-pulse">{videoState.progressMessage}</p>
                  <p className="text-xs text-gray-400 mt-4 max-w-xs">This usually takes about 1-2 minutes. Please don't close this tab.</p>
                </div>
              )}

              {/* Error State */}
              {videoState.error && (
                <div className="absolute inset-0 bg-red-50 z-10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-12 w-12 text-red-500 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-red-800 font-semibold mb-2">Generation Failed</h3>
                  <p className="text-red-600 text-sm">{videoState.error}</p>
                  <button 
                    onClick={() => setVideoState(prev => ({ ...prev, error: null }))}
                    className="mt-6 text-sm text-red-700 font-medium hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Success State (Video Player) */}
              {videoState.videoUrl && !videoState.isLoading && (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <video 
                    controls 
                    autoPlay 
                    loop 
                    className="max-h-full max-w-full"
                    src={videoState.videoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>

            {/* Download/Share Actions (Visible only when video exists) */}
            {videoState.videoUrl && (
              <div className="mt-6 flex justify-end gap-3">
                 <a 
                  href={videoState.videoUrl} 
                  download="veo-animation.mp4"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Veo Animator Demo. Powered by Google Gemini API.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;