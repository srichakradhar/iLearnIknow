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
  var responseText = "";
  var discovery_response = null;
  var count = 0;
  var entities_map = {"UNSUPPORT_SOFWARE_FEATURES": "Unsupported Software Features",
                      "UNSUPPORT_HARWARE_FEATURES": "Unsupported Hardware Features",
                      "SOFTWARE_FEATURE": "Software Features",
                      "HARDWARE_FEATURE": "Hardware Features"
                      }

  if (!response.output) {
    response.output = {text: 'Sorry. I couldn\'t understand that. Please try again.'};
  }else{
    try{
      var identified_response = JSON.parse(response.output.text[0]);

      // for(let response_data of response.output.text){
      //   identified_response = JSON.parse(response_data);
      // }
      var identified_intents = identified_response.identified_intent;
      var aggregation_query = "[";
      var entities_headings = [];
      
      for(let entity of identified_intents){
        aggregation_query += "nested(enriched_text.entities).filter(enriched_text.entities.type::\"" + entity.toUpperCase() + "\").term(enriched_text.entities.text,count:10),";
        var correct_entity = entities_map[entity];
        if(correct_entity == undefined){
          correct_entity = toTitleCase(entity);
        }
        entities_headings = entities_headings.concat(correct_entity);
      }
      aggregation_query = aggregation_query.substr(0,aggregation_query.length - 1) + "]";
      // var entities_string = entities_headings.join(", ")

      discovery.query({ environment_id: process.env.DISCOVERY_ENVIRONMENT_ID,
        collection_id: process.env.DISCOVERY_COLLECTION_ID,
        configuration_id: process.env.DISCOVERY_CONFIGURATION_ID,
        // query: "text: \"" + response.entities[0].text + '"',
        natural_language_query: "text: \"" + response.input.text + '"',
        // aggregation: "nested(enriched_text.entities).filter(enriched_text.entities.type::UNSUPPORT_HARDWARE_FEATURES).term(enriched_text.entities.text,count:20)",
        aggregation: aggregation_query,
        // return: 'text',
        passages: true,
        highlight: true
        },
        function(error, data) {
          // console.log(JSON.stringify(data, null, 2));
          var intermediate_response = [];
          // var results = data.aggregations[0].aggregations[0].aggregations[0].results;
          var results = [];
          for(var index = 0; index < data.aggregations.length; index++){
            var keys = [];
            results = data.aggregations[index].aggregations[0].aggregations[0].results;
            if(results !== undefined && results.length > 0){
              for(let item of results){
                keys = keys.concat("• " + item.key);
              }
              intermediate_response = intermediate_response.concat(entities_headings[index] + ":<br>")
              intermediate_response = intermediate_response.concat(keys)
            }
          }
          // if (data.passages.length > 0) {
          //   intermediate_response = intermediate_response.concat("Search Results:");
          // }
          // for(let passage of data.passages){
          //   intermediate_response = intermediate_response.concat(passage.passage_text);
          // }
          // discovery_response = intermediate_response;
          // intermediate_response = entities_headings.concat(intermediate_response)

          if (intermediate_response.length ==  0) {
            discovery.query({ environment_id: process.env.DISCOVERY_ENVIRONMENT_ID,
              collection_id: process.env.DISCOVERY_COLLECTION_ID,
              configuration_id: process.env.DISCOVERY_CONFIGURATION_ID,
              // query: "text: \"" + response.entities[0].value + '"',
              natural_language_query: "text: \"" + response.input.text + '"',
              // return: 'text',
              passages: true,
              highlight: true
              },
              function(error, data) {
                if (data.passages.length > 0) {
                  // intermediate_response = intermediate_response.concat("Search Results:");
                }else{
                  intermediate_response = "Sorry.. We are not able to find any results. Try again."
                }
                for(let passage of data.passages){
                  intermediate_response = intermediate_response.concat(passage.passage_text);
                }
                discovery_response = intermediate_response;
              });
          }else{
            discovery_response = intermediate_response;
          }
      });

      deasync.loopWhile(function(){return discovery_response === null});
      responseText = discovery_response;
    }catch(err){
      // for(let response_data of response.output.text){
      //   try{
      //     JSON.parse(response_data);
      //   }catch(err){
      //     responseText = response_data;
      //   }
      // }
      responseText = response.output.text[0];
    }
    
  }
  if (responseText.length == 0) {
    responseText += "Sorry.. We are not able to find any result. Please try again."
  }
  response.output.text = responseText;
  return response;
}

function toTitleCase(str) {
    str = str.toLowerCase();
    return str.replace(/(?:^|_)\w/g, function(match) {
    return match.toUpperCase().replace(/_/g, ' ');
  });
}

module.exports = app;
