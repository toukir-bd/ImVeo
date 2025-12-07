import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-green-400'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg 
              className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} 
              aria-hidden="true" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 20 16"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500 font-medium">
              <span className="font-semibold text-green-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG or WEBP (Max 10MB)</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-md group">
          <img 
            src={URL.createObjectURL(selectedFile)} 
            alt="Preview" 
            className="w-full h-64 object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={handleClick}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-all"
            >
              Change Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};