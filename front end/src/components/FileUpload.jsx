import { useState } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFileSelect, isUploading, uploadedFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="file-upload-container">
      {!uploadedFile ? (
        <div
          className={`file-upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="file-upload-label">
            {isUploading ? (
              <>
                <div className="upload-spinner"></div>
                <p>Uploading...</p>
              </>
            ) : (
              <>
                <i className="material-icons">cloud_upload</i>
                <p>Drag & drop portfolio file or click to browse</p>
                <span>Supports .xlsx, .xls, .csv</span>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="file-uploaded">
          <i className="material-icons">check_circle</i>
          <span>{uploadedFile.name}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
