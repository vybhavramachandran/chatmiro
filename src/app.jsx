import * as React from 'react';
import {createRoot} from 'react-dom/client';
import { useState,useEffect } from 'react';
import { retreiveMindMapFromOpenAI } from './api.jsx';
import { FaSpinner } from 'react-icons/fa';
import tinycolor from 'tinycolor2';
import Modal from 'react-modal';
import Settings from './settings.jsx';
import { TwitterMentionButton} from "react-twitter-embed";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  BrowserRouter
} from "react-router-dom";


const App = () => {

  const [apiKey, setApiKey] = useState('');
  const [isValidApiKey, setIsValidApiKey] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [isEditing, setIsEditing] = useState(false)
  var [lastYPos, setLastYPos] = useState(0)
  var [userPrompt,setUserPrompt]=useState("")
  var [buttonText,setButtonText]=useState("Generate Mindmap ⚡️")
  var [isDrawingMindMap,setIsDrawingMindMap]=useState(false)
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingModalOpen, setSettingModalOpen] = useState(false);

  Modal.setAppElement('#root');

  const handleToggle = () => {
    setIsChecked(!isChecked);
  };
  useEffect(() => {
    //console.log(`lastYPos: ${lastYPos}`);
  }, [lastYPos]);

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  const handleSettingModalOpen = () => {
    setSettingModalOpen(true);
  };
  const handleSettingModalClose = () => {
    setSettingModalOpen(false);
  };

  function validateApiKey(apiKey) {
    const apiKeyRegex = /^sk-[a-zA-Z0-9]{48}$/;
    const isValid = apiKeyRegex.test(apiKey.trim());
    setIsValidApiKey(isValid);
  }

  const handleSubmit = () => {
    if (apiKey.trim() === '') {
      setError(true);
    } else if (!isValidApiKey) {
      setError(true);
      setApiKey('');
    } else {
      try {
        localStorage.setItem('chatMiroAPIKey', apiKey.trim());
        setSuccess(true);
        setEditable(false);
        setError(false);
      } catch (e) {
        console.error('Error saving API key to local storage:', e);
        setError(true);
        setApiKey('');
      }
    }
  };

const generateRandomColor = (parentColor) => {
  if (!parentColor) {
    // If parentColor is empty, generate a random color
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 20) + 80;
    const brightness = Math.floor(Math.random() * 20) + 80;
    return tinycolor({h: hue, s: saturation, l: brightness}).toHexString();
  }

  // If parentColor is not empty, use it to generate a new color
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 20) + 80;
  const brightness = Math.floor(Math.random() * 20) + 80;
  const parentColorObj = tinycolor(parentColor);
  const newColorObj = parentColorObj.spin(hue).saturate(saturation).lighten(brightness);
  return newColorObj.toHexString();
};


  async function createMindMapFromResponse(response) {
    setLastYPos(0);
    //console.log('response', response.root)
    if (response && Object.keys(response).length > 0) {
      const rootNodeName = response.root.text;
      const rootNode = await miro.board.createShape({
        shape: 'round_rectangle',
        content: rootNodeName,
        x: 0,
        y: 0,
        style: {
          color:'#ffffff',
          fillColor:'#36A8EF',
          borderWidth:2,
          borderColor:'#0056FF'
        }
      });
      await miro.board.viewport.zoomTo(rootNode);
      await miro.board.viewport.setZoom(1);
      const childNodes = response.root.children;
      if (childNodes) {
        const createChildNodes = async (parentNode, childNodes, isLeft, currentYPos, parentColor,isRoot) => {
          //console.log('currentYPos:', currentYPos);

          if (!childNodes) {
            return currentYPos;
          }
          const childNodeNames = Object.keys(childNodes);
          const childCount = childNodeNames.length;
          const totalChildHeight = childCount * 100; // adjust this value as needed
          const spacing = totalChildHeight / childCount;
          const sideMultiplier = isLeft ? -1 : 1;
          const sideOffset = isLeft ? -150 : 150;
          
          for (let i = 0; i < childNodeNames.length; i++) {
            const childNodeName = childNodeNames[i];
            const childNodeColor = isRoot ? generateRandomColor() : generateRandomColor(parentColor); // generate random color based on parent color
            //console.log("childNodeName ",childNodes[childNodeName].text);
            const childNode = await miro.board.createShape({
              shape: 'round_rectangle',
              content: childNodes[childNodeName].text || '',
              x: parentNode.x + sideOffset,
              y: currentYPos + spacing * i,
              style: {
                fillColor: childNodeColor // set the fill color of the child node
              }
            });
            await miro.board.createConnector({
              shape: 'elbowed',
              style: {
                endStrokeCap: 'stealth',
                strokeStyle: 'dotted',
                strokeColor: '#ff00ff',
                strokeWidth: 2,
              },
              start: {
                item: parentNode.id,
                position: {
                  x: isLeft ? 0.0 : 1.0,
                  y: 0.5,
                },
              },
              end: {
                item: childNode.id,
                snapTo: isLeft ? 'right' : 'left',
              }
            });
            const nextYPos = await createChildNodes(childNode, childNodes[childNodeName].children, isLeft, currentYPos + spacing * i, childNodeColor,false); // pass the child color to the next level of descendants
            currentYPos = Math.max(currentYPos, nextYPos);
          }
          return currentYPos;
        };
        const leftChildren = {};
        const rightChildren = {};
        Object.keys(childNodes).forEach((childNodeName, index) => {
          const childNode = childNodes[childNodeName];
          if (index % 2 == 0) {
            leftChildren[childNodeName] = childNode;
          } else {
            rightChildren[childNodeName] = childNode;
          }
        });
        const maxLeftYPos = await createChildNodes(rootNode, leftChildren, true, 0,"#36A8EF",true);
        const maxRightYPos = await createChildNodes(rootNode, rightChildren, false,0,"#36A8EF",true);
        setLastYPos(Math.max(maxLeftYPos, maxRightYPos));
        setIsDrawingMindMap(false);
      } else {
        console.error('Invalid response from API');
      }
    }
  }
  
  

  
  React.useEffect(() => {
    const storedApiKey = localStorage.getItem('chatMiroAPIKey');
    //console.log("Retreived key ",storedApiKey);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      //console.log("Key set ",apiKey);
      setSuccess(true);
    }
  }, []);

  return (
<BrowserRouter>
    <div className="grid wrapper">
      <div className="cs1 ce12">
        <img src="/assets/gptmindmap.png" alt="" />
      </div>
      <div className="cs1 ce12">
      <p class="p-large">
            With <b>GPT-Mindmap</b>, you can create mindmaps using the power of OpenAI's ChatGPT! <img src="assets/openailogosmall.png" class="openailogosmall"></img>
          </p>
      </div>
      {success ? (
        <div class="cs1 ce12 grid">
          <div class="cs1 ce12">
        
            </div>
         
          <div class="cs1 ce12">
          <h3 class="h3" id="headings">What would you like to learn about?</h3>
          <div class="form-group">
	<textarea
		class="textarea"
   value={userPrompt}
   onChange={(event) => {
     setUserPrompt(event.target.value);
   }}
  type="text" placeholder="What would you like to know about?" id="example-1"/>
</div>
<div class="cs1 ce12" id="buttonclass">
          <button
          type="button"
          disabled = {!userPrompt || isDrawingMindMap}
          className="cs1 ce12 button button-secondary "
          onClick={async () => {
            setIsDrawingMindMap(true)
            const mindmapText = await retreiveMindMapFromOpenAI(userPrompt,isChecked);
            await createMindMapFromResponse(JSON.parse(mindmapText));

          }}
        >
          		{!isDrawingMindMap?"⚡️ Generate Mindmap ":<FaSpinner className="loadingIcon"/>}

        </button>
      
        </div>
          </div>
          <div class="cs1 ce12" id="modelToggle">
            <div id="cs1 ce6 leftgroup-modelToggle">
            <Link to="/settings"><button class="button-icon button-icon-small icon-settings" type="button"
           
            ></button></Link>

            
          
            <button class="button-icon button-icon-small icon-comment-feedback" type="button"
            onClick={handleModalOpen}
            ></button>
             <Modal
              isOpen={isSettingModalOpen}
              onRequestClose={handleSettingModalClose}
              className="modal"
              overlayClassName="modal-overlay"
            >
              <p class="p-large">👋🏼 I'm <a decoration="none" href="https://twitter.com/vybhavram">Vybhav</a>! </p>
              <p class="p-medium">I'm a visual thinker, so I built GPT-Mindmap to quickly generate mindmaps to visualize any topic.</p>
              <p class="p-medium">I'd love to know what you think! </p>
              
              <TwitterMentionButton
    screenName={'vybhavram'}
    placeholder="loading.."

  />

              {/* <a class="twitter-mention-button" data-show-count="false" href="https://twitter.com/intent/tweet?screen_name=vybhavram&ref_src=twsrc%5Etfw" >Say Hi!</a> */}
              {/* <a href="https://gpt-mindmap.xyz" class="website"><p class="p-small">gpt-mindmap.xyz</p></a> */}
    </Modal>
          
            <Modal
              isOpen={isModalOpen}
              onRequestClose={handleModalClose}
              className="modal"
              overlayClassName="modal-overlay"
            >
              <p class="p-large">👋🏼 I'm <a decoration="none" href="https://twitter.com/vybhavram">Vybhav</a>! </p>
              <p class="p-medium">I'm a visual thinker, so I built GPT-Mindmap to quickly generate mindmaps to visualize any topic.</p>
              <p class="p-medium">I'd love to know what you think! </p>
              
              <TwitterMentionButton
    screenName={'vybhavram'}
    placeholder="loading.."

  />

              {/* <a class="twitter-mention-button" data-show-count="false" href="https://twitter.com/intent/tweet?screen_name=vybhavram&ref_src=twsrc%5Etfw" >Say Hi!</a> */}
              {/* <a href="https://gpt-mindmap.xyz" class="website"><p class="p-small">gpt-mindmap.xyz</p></a> */}
    </Modal>

            {/* <button class="button-icon button-icon-small icon-comment-feedback" type="button"
            
            onClick={()=>{

            }}
            ></button> */}

      {/* <span class="icon-close"></span> */}
  </div>
  <label className="toggle">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={handleToggle}
      tabIndex="0"
    />
    {
      isChecked?<span id="boldify">GPT-4</span>:<span>GPT-4</span>
    }
  </label>
</div>

        </div>
      ) : (
        <form className="cs1 ce12 form-example--main-content">
          <div className="form-group">
          <h3 class="h3" id="headings"> {isEditing? "Step 1 : OpenAI API Key ✏️" :"1️⃣ : OpenAI API Key "} </h3>

            <p className="p-small">
              <a href="https://platform.openai.com/account/api-keys" target="_blank">
                Get your API key from OpenAI dashboard
              </a>
            </p>
            <textarea

              className="textarea key"
              // type="text"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                validateApiKey(event.target.value);
              }}
              onBlur={() => validateApiKey(apiKey)}
              disabled={success && !isEditing}
            />
  
            {isValidApiKey && <div className="status-text">✅ Valid API Key</div>}
          </div>
          
      
        </form>
        
      )}
      {!success ? (
        <button
          type="button"
          className="cs1 ce12 button button-primary"
          onClick={handleSubmit}
          disabled={!isValidApiKey}
        >
          Save API Key
        </button>
      ) : (
        <span/>
      )}
      {isEditing && (
        <span class="cs1 ce12">
        <button
          type="button"
          className="cs1 ce12 button button-secondary"
          onClick={() => {
            setIsEditing(false);
            setIsValidApiKey(false);
            setSuccess(true);
          }}
        >
          		<span class="icon-close"></span>

        </button>
        <button
          type="button"
          className="cs1 ce12 button button-secondary"
          disabled={!isValidApiKey}
          onClick={() => {
            setIsEditing(false);
            setIsValidApiKey(false);
            localStorage.setItem("chatMiroAPIKey", apiKey.trim());
            setSuccess(true);
          }}
        >
          💾 Save
        </button>
        </span>
      )}
      
    </div>
          <Routes>
    <Route path="/settings" element={<Settings/>}>
        </Route></Routes>
    </BrowserRouter>
  
  );
  
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
