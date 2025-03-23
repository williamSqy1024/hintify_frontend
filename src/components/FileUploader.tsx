import React, { useState, ChangeEvent } from 'react';

const FileUploader: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isFilesPicked, setIsFilesPicked] = useState<boolean>(false);

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files); // Convert FileList to an array
      setSelectedFiles(fileList);
      setIsFilesPicked(true);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      const formData = new FormData();

      // Append each file to the FormData object
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file); // Use the same key for all files
      });

      try {
        const response = await fetch('http://localhost:8080/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Upload success:', result);
          alert('Files uploaded successfully!');
        } else {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          alert('File upload failed.');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('File upload failed.');
      }
    }
  };

  return (
    <div>
      <h2>File Uploader</h2>
      <input type="file" onChange={handleFileChange} multiple />
      {isFilesPicked && selectedFiles.length > 0 && (
        <div>
          <h3>Selected Files:</h3>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                {file.name} ({file.type}, {file.size} bytes)
              </li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={handleUpload} disabled={!isFilesPicked}>
        Upload
      </button>
    </div>
  );
}

export default FileUploader;