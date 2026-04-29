import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';

export default function FileUpload({ files, setFiles, disabled }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, [disabled, setFiles]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    if (disabled) return;
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <div 
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all text-center
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 
            isDragging 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload').click()}
      >
        <input 
          id="file-upload"
          type="file" 
          multiple 
          accept=".pdf"
          className="hidden" 
          onChange={handleFileChange}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              PDF files only (Max 10MB per file)
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex items-center overflow-hidden">
                <File className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                disabled={disabled}
                className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
