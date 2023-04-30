import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useHistory from react-router-dom

function Settings() {
  const [isEditing, setIsEditing] = useState(false);
  const isValidApiKey = true; // Replace this with your own logic to check if the API key is valid
  const navigate = useNavigate(); // use useHistory hook to access browser history

  const handleBackButtonClick = () => {
    navigate(-1); // Go back by navigating back one entry in the browser history
  };

  return (
    <div className="grid wrapper">
      <div className="cs1 ce12">
        <h3 className="h3" id="headings">
          Step 1:{' '}
          <img className="openailogo" src="/assets/openailogo.png" alt="" /> API Key ✅
        </h3>
      </div>
      <span className="cs1 ce10">
        <p className="p-small" id="keyfield">
          sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        </p>
      </span>
      <span className="cs11 ce12">
        <button
          className="button button-secondary button-small"
          type="button"
          onClick={() => {
            setIsEditing(true);
          }}
        >
          ✏️
        </button>
      </span>
      {isValidApiKey && <div className="status-text">✅ Valid API Key</div>}
      {/* Add a back button */}
      <button className="button button-primary" type="button" onClick={handleBackButtonClick}>
        Go Back
      </button>
    </div>
  );
}

export default Settings;
