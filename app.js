/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
// var Promise = require('bluebird');
var deasync = require('deasync');
var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  'username': process.env.CONVERSATION_USERNAME,
  'password': process.env.CONVERSATION_PASSWORD,
  'version_date': '2017-05-26'
});

// var sendMessageToConversation = Promise.promisify(conversation.message.bind(conversation));

var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

var discovery = new DiscoveryV1({
  username: process.env.DISCOVERY_USERNAME,
  password: process.env.DISCOVERY_PASSWORD,
  version: 'v1',
  version_date: '2017-11-07'
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // sendMessageToConversation(payload);
  
  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  var discovery_response = null;
  if (!response.output) {
    response.output = {};
  }else if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    // if (intent.confidence >= 0.75) {
    //   responseText = 'I understood your intent was ' + intent.intent;
    // } else
    if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
      switch(intent.intent){

        case 'unSupportedSoftwareFeatureOf':

          dialog_response = JSON.parse(response.output.text[0]);
          aggregation_query = "nested(enriched_text.entities)";
          for(let entity of dialog_response.identified_intent){
            aggregation_query += ".filter(enriched_text.entities.type::" + entity + ")";
          }
          aggregation_query += ".term(enriched_text.entities.text,count:20)";

          discovery.query({ environment_id: process.env.DISCOVERY_ENVIRONMENT_ID,
            collection_id: process.env.DISCOVERY_COLLECTION_ID,
            configuration_id: process.env.DISCOVERY_CONFIGURATION_ID,
            query: "text: \"features\"",
            // aggregation: "nested(enriched_text.entities).filter(enriched_text.entities.type::UNSUPPORT_SOFWARE_FEATURES).term(enriched_text.entities.text,count:20)",
            aggregation: aggregation_query,
            // return: 'text',
            passages: true,
            highlight: true
            },
            function(error, data) {
              // console.log(JSON.stringify(data, null, 2));
              var keys = [];
              for(let item of data.aggregations[0].aggregations[0].aggregations[0].results){
                keys = keys.concat("• " + item.key);
              }
              discovery_response = keys;
              // var passage_results = [];
              // for(let passage of data.passages){
              //   passage_results = passage_results.concat(passage.passage_text);
              // }
              // discovery_response = passage_results;
          });

          while(discovery_response === null) {
            deasync.runLoopOnce();
          }

          responseText = discovery_response;
          break;
          
        default:
            responseText = response.output.text;
      }
    } else {
      responseText = 'I did not understand your intent';
    }
  }else{
    responseText = response.output.text;
  }

  response.output.text = responseText;
  return response;
}

module.exports = app;
