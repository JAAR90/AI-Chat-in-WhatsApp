import https from 'https';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_
});


export const handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const queryParams = event.queryStringParameters || {};
    const verifyToken = process.env.VERIFY_TOKEN;
    const mode = queryParams['hub.mode'];
    const token = queryParams['hub.verify_token'];
    const challenge = queryParams['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK_VERIFIED');
        const response = {
          statusCode: 200,
          body: challenge,
        };
        return response;
      } else {
        const response = {
          statusCode: 403,
          body: JSON.stringify('Forbidden'),
        };
        console.log('WEBHOOK_VALIO-1');
        return response;
      }
    }
  } else if (event.httpMethod === 'POST') {
      
      const requestBody = JSON.parse(event.body);
      console.log("Incoming Message:", JSON.stringify(requestBody, null, 2));

    if (requestBody.object) {
      console.log('WEBHOOK_1 paso ok');
      if(
        requestBody.entry &&
        requestBody.entry[0].changes &&
        requestBody.entry[0].changes[0] &&
        requestBody.entry[0].changes[0].value.messages &&
        requestBody.entry[0].changes[0].value.messages[0]
      ){
        console.log('WEBHOOK_2 paso ok');
        const phone_number_id = requestBody.entry[0].changes[0].value.metadata.phone_number_id;
        const from = requestBody.entry[0].changes[0].value.messages[0].from;

        const msg_body = requestBody.entry[0].changes[0].value.messages[0].text.body;

        const token = process.env.WHATSAPP_TOKEN;
        const completion = await openai.chat.completions.create ({
          
          model: "gpt-3.5-turbo",  //check the model, try first with the cheapest more basic
          messages: [
            { role: "user", content : `${msg_body}`},
          ]
        });
        console.log(JSON.stringify(completion, null, 2));
        const gpt_msg = completion.choices[0].message.content;
        
    
        const postData = JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: `${gpt_msg}` },
        });
    
        const options = {
          hostname: 'graph.facebook.com',
          path: `/v12.0/${phone_number_id}/messages?access_token=${token}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
          },
        };
        console.log('WEBHOOK_3 paso ok');
        const req = https.request(options, (res) => {
          res.on('data', (data) => {
            console.log('Received Data:', data.toString());
    // Handle received data if needed
          });

          res.on('end', () => {
    // Finalize response processing
          });
        });

        req.on('error', (error) => {
          console.error('Request Error:', error);
          });

// Send data using req.write()
        req.write(postData);

// Complete the request
        req.end();

        console.log('Request Sent');
        const response = {
          statusCode: 200,
          body: JSON.stringify('OK'),
        };
        return response;
  
      } else {
        
        console.log('WEBHOOK_nose');
        const response = {
          statusCode: 200,
          body: JSON.stringify('OK'),
        };
        return response;     
        }
        
  }  
  }
};  
    