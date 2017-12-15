 
 'use strict';

var dvlaInfo = require('dvla-vehicle-information');
var aws = require('aws-sdk');
var carColour = '';
var carMake = '';
var carAge;
let duplicateEmailPreventionFlag = 'notYetSent';

let speechOutput;
let reprompt;
const welcomeOutput = "Hello, Lets add a vehicle; let me know the number plate please";
const welcomeReprompt = "Can you give me the number plate please?";
const tripIntro = [
   "OK, let's recap then, ",
   "Here's what I heard,  ",
   "Thank you, "
 ];

// adding in the functions I've written at the top ...

function getVehicleMake(vehicleInfo) {
  console.log('in getVehicleMake - heres what the dvla gave us ...');
  console.log(vehicleInfo);
  carMake = vehicleInfo['Vehicle make'];
  carColour = vehicleInfo['Vehicle colour'];
  carAge = (2017 - parseInt(vehicleInfo['Year of manufacture']));
}

function mailSent(msg){
    console.log('in mailSent function');
    let duplicateEmailPreventionFlag = 'mailSent';
    console.log(msg);
}

function sendMessage(NumberPlate, GenusRefFirstFour, GenusRefLastFour, InceptionDate, callback) {   
    // should probably nest the below in a function ... sorry    
    console.log('in sendMessage');

    const subject = 'Alexa MTA Confirmation ' + NumberPlate;
    const bodyText = 'Hello \n' + 'Alexa has added vehicle: ' + NumberPlate + ' to policy: 9' + GenusRefFirstFour + GenusRefLastFour + ' . \nThe inception date is: ' + InceptionDate + ' .\n \nIf any of these details are incorrect please reply to this email. \n \n Kind Regards \n \n Alexa';
    const params = {
      Source: 'edge@msamlin.com',
      Destination: { ToAddresses: ['chris.lovick@msAmlin.com','philippe.houtakkers@msamlin.com']},
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: bodyText } }
         }
      };

    console.log('sending message to ' + params.Destination.ToAddresses.toString());
  
    var AWS = require('aws-sdk');
    AWS.config.update({region: 'us-east-1'});
    var SES = new AWS.SES();
    console.log('sending the email');
   
    SES.sendEmail(params, function(err, data){
        if (err) console.log(err, err.stack);
        callback('message sent');
    });

}


 // addding in some functions here, they should be in the sdk ... but trying this instead to make them fire, read that dialogue model may not work 

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    console.log('in buildSpeechletResponse');
     
//    if (shouldEndSession) {console.log('MID - Could send email from here - SouldEndSession is true' + output)};

      return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    console.log("Responding with " + JSON.stringify(speechletResponse));
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function buildSpeechletResponseWithDirectiveNoIntent() {
    console.log("in buildSpeechletResponseWithDirectiveNoIntent");
    return {
      "outputSpeech" : null,
      "card" : null,
      "directives" : [ {
        "type" : "Dialog.Delegate"
      } ],
      "reprompt" : null,
      "shouldEndSession" : false
    }
  }

  function buildSpeechletResponseDelegate(shouldEndSession) {
      return {
          outputSpeech:null,
          directives: [
                  {
                      "type": "Dialog.Delegate",
                      "updatedIntent": null
                  }
              ],
         reprompt: null,
          shouldEndSession: shouldEndSession
      }
  }


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    console.log("in welcomeResponse");
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = "Hello, Please give me the vehicle numberplate that you wish to add";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = "please try that number plate again";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function MTA(request, session, callback){
    console.log("in MTA function");
    console.log("request: "+JSON.stringify(request));
    var sessionAttributes={};
    var filledSlots = delegateSlotCollection(request, sessionAttributes, callback);

    //compose speechOutput that simply reads all the collected slot values
    var speechOutput = randomPhrase(tripIntro);

    var NP1=request.intent.slots.NumberPlateCharacterOne.value;
    var NP2=request.intent.slots.NumberPlateCharacterTwo.value;
    var NP3=request.intent.slots.NumberPlateCharacterThree.value;
    var NP4=request.intent.slots.NumberPlateCharacterFour.value;
    var NP5=request.intent.slots.NumberPlateCharacterFive.value;
    var NP6=request.intent.slots.NumberPlateCharacterSix.value;
    var NP7=request.intent.slots.NumberPlateCharacterSeven.value;

    var GenusRefFirstFour=request.intent.slots.GenusRefFirstFour.value;
    var GenusRefLastFour=request.intent.slots.GenusRefLastFour.value;
    var InceptionDate=request.intent.slots.InceptionDate.value;
    
    var NumberPlate = NP1[0]+NP2[0]+NP3[0]+NP4[0]+NP5[0]+NP6[0]+NP7[0];
    
    console.log(NumberPlate);
    dvlaInfo(NumberPlate, getVehicleMake);
        
    speechOutput+= " We will add a " + carColour + " " + carAge + " year old " + carMake
    speechOutput+= " registration " + NP1[0]+' '+NP2[0]+' '+NP3[0]+' '+NP4[0]+' '+NP5[0]+' '+NP6[0]+' '+NP7[0]; 
    speechOutput+= " to policy reference, Nine "
    speechOutput+= GenusRefFirstFour[0]+ ' ' + GenusRefFirstFour[1]+ ' ' + GenusRefFirstFour[2]+ ' ' + GenusRefFirstFour[3] + ' '
    speechOutput+= GenusRefLastFour[0]+ ' ' + GenusRefLastFour[1]+ ' ' + GenusRefLastFour[2]+ ' ' + GenusRefLastFour[3]
    speechOutput+= " on "+ InceptionDate;
    speechOutput+= ". Thankyou, these details have been emailed to you, and the updated policy documentation will magically appear"
   
   // send the email - unfortunately does this twice if nested here...
   console.log ('duplicate email flag - before '+ duplicateEmailPreventionFlag); 
   if (duplicateEmailPreventionFlag == 'notYetSent') {sendMessage(NumberPlate, GenusRefFirstFour, GenusRefLastFour, InceptionDate, mailSent);};
   console.log ('duplicate email flag - after '+ duplicateEmailPreventionFlag);
    //say the results
   callback(sessionAttributes,
        buildSpeechletResponse("MTA ", speechOutput, "", true));

}


function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thanks. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


function delegateSlotCollection(request, sessionAttributes, callback){
  console.log("in delegateSlotCollection");
  console.log("  current dialogState: "+JSON.stringify(request.dialogState));

    if (request.dialogState === "STARTED") {
      console.log("in started");
      console.log("  current request: "+JSON.stringify(request));
      var updatedIntent=request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else if (request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      console.log("  current request: "+JSON.stringify(request));
      // return a Dialog.Delegate directive with no updatedIntent property.
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else {
      console.log("in completed");
      console.log("  current request: "+JSON.stringify(request));
      console.log("  returning: "+ JSON.stringify(request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return request.intent;
    }
}

function randomPhrase(array) {
    // the argument is an array [] of words or phrases
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(request, session, callback) {
    //console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);
    console.log("in launchRequest");
    console.log("  request: "+JSON.stringify(request));
    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(request, session, callback) {
    //console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);
    console.log("in onIntent");
    console.log("  request: "+JSON.stringify(request));

    const intent = request.intent;
    const intentName = request.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'MTA') {
        MTA(request, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        // console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);
console.log('_______________________________________________________________________________________________');
console.log('_______________________________________________________________________________________________');
console.log('_______________________________________________________________________________________________');

        console.log("EVENT=====" + JSON.stringify(event));
 //       if (event.session.application.applicationId !== 'amzn1.ask.skill.5c36cb4c-8b6e-4a99-8c4e-f23fefe47e8b') { Philippe's dot
        if (event.session.application.applicationId !== 'amzn1.ask.skill.153712f7-e1ab-4041-9651-e69c20ed7056') {
             console.log('Invalid application ID');
             callback('Invalid Application ID');
        }

        if (event.session.new) {
            console.log('in event session new');
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            console.log('calling launch request ...');
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            console.log('calling Intent Request ...');
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }

// could put the email code down here? this is a bit of a test...
// sendMessage(speechOutput, mailSent);
/// console.log('END spot - could send email from here:' + speechOutput)
console.log('=================================================================================================');
console.log('=================================================================================================');
console.log('=================================================================================================');

    } catch (err) {
        callback(err);
    }
};
