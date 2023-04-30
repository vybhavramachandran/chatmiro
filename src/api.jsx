import axios from 'axios';

const API_BASE_URL = 'https://api.openai.com/v1/';
const API_KEY = localStorage.getItem('chatMiroAPIKey');

let cancelTokenSource; // To store the axios cancel token source

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };
  

  async function checkGPT4Access(apiKey) {
    try {
      const response = await axios.get('https://api.openai.com/v1/models/gpt-4', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
  
      if (response.data.id === 'gpt-4') {
        console.log('You have access to GPT-4');
        return true;
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 'model_not_found') {
        console.log('You do not have access to GPT-4');
        return false;
      } else {
        console.error('Error checking GPT-4 access:', error);
        throw error;
      }
    }
  }

  const retreiveMindMapFromOpenAI = async (prompt,isChecked) => {
    cancelTokenSource = axios.CancelToken.source();

    var data = {
      model: isChecked?'gpt-4':'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `
      You are an expert in everything and your goal is to help me visually learn a topic. Be as descriptive as possible. Go as broad or deep as needed so that I fully learn a concept.
  
      When I provide a prompt, return a response in JSON format that generates a mindmap of topics inside it. 
      
      I don't want you to return a JSON, but the response should be structured like a JSON. 
      
      Note:
      1. No other data, except the JSON structured data should be present in the response. All returned response must be inside the JSON.
      2. Don't include any quotes inside the text content
      
      The PROMPT is "Generate a detailed mindmap for ${prompt}". Go atleast 4 levels deep. Try to explain as much as possible.
      
      Here's a sample structure.
      {
      "root": {
      "text": "Root Node",
      "children": [
      {
      "text": "Child Node",
      "children": []
      },
      {
      "text": "Child Node",
      "children": [
      {
      "text": "Child Node",
      "children": [
        {
          "text": "Child Node",
          "children": []
          },
          {
            "text": "Child Node",
            "children": [
              {
                "text": "Child Node",
                "children": []
                },
                {
                  "text": "Child Node",
                  "children": []
                  },
            ]
            },
      ]
      },
      {
      "text": "Child Node",
      "children": []
      }
      ]
      }
      ]
      }
      }` }],
      temperature: 0.7
    };
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        data,
        {
          headers,
          cancelToken: cancelTokenSource.token, // Add the cancel token
        }
      );
      cancelTokenSource = null;

      //console.log(response.data);
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled');
      }
      else{
        console.error(error);
        throw error;
      }
      
    }
  };


const cancelRequest =()=> {
  if (cancelTokenSource) {
    cancelTokenSource.cancel('Request canceled by the user');
  }
}


export { retreiveMindMapFromOpenAI, cancelRequest, checkGPT4Access};
