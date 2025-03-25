import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import FileUploader from './components/FileUploader';
import AudioHelper from './components/AudioHelper';


import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from the Java backend
    axios.get('http://localhost:8080/api/hello')
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div className="App">
      <h1>Welcome to Hintify</h1>
      <p>Meeting Assistant: {message}</p>
      <div className='hintify-content-flyout'>
        <div className='hintify-content-display'>
          <div className='hintify-content-form'>
            <FileUploader />
            <AudioHelper />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
