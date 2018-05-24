'use strict';
module.change_code = 1;
const Alexa = require('alexa-app');
const app = new Alexa.app('AlexaQuizGame');
const QuestionDataHelper = require('./questions');
const questionHelper = new QuestionDataHelper();

const currentIntent = {
    'name': null,
    'step': 0
};
let currentPrice = 0;
let questionAndAnswerData = {
    'question_id': 0,
    'answers_array': [],
    'correct_answer_id': 0
};
let questions_ids_array = [];
let current_question_id = 0;
let number_of_questions = 0;

const answerLetters = [
    'a',
    'b',
    'c',
    'd'
];

const correctAnwserAlexaResponse = [
    'Your answer is CORRECT! Should we go to the next question?',
    'That is CORRECT! Should we go on?',
    'The question was too easy. Next will be more difficult if you continue playing. Do you want to?'
];

const answerIndexes = answerLetters
    .reduce((accumulator, letter, letterIndex) => ({
        ...accumulator,
        [letter]: letterIndex
    }), {});

app.launch(async function (req, res) {
    const prompt = 'Welcome to Alexa quiz game';
    res.say(prompt).reprompt(prompt).shouldEndSession(false);

    questions_ids_array = await questionHelper.getQuestionsIdsArray();
    number_of_questions = questions_ids_array.length;
});

app.intent('game', {
    'utterances': ['{start the game} ']
},
    function (req, res) {
        currentIntent.step = 0;
        currentIntent.name = req.data.request.intent.name;
        res.say('Good luck, I hope it will be better then your math exam. Are you ready?')
            .shouldEndSession(false)
            .send();
        currentIntent.step++;
    }
);

app.intent('kidding', {
    'utterances': ['{Are you kidding me}']
},
    function (req, res) {
        res.say('Ha Ha Ha, bad luck... but I think you know the correct answer.')
            .shouldEndSession(false)
            .send();
    }
);

app.intent('other_question', {
    'utterances': ['{Can I get some other question please}']
},
    function (req, res) {
        currentIntent.name = req.data.request.intent.name;
        res.say('No, you can not. Are you afraid of your ex...?')
            .shouldEndSession(false)
            .send();
    }
);


app.intent('repeat', {
    'utterances': ['{Can you repeat the question please}']
},
    async function (req, res) {
        currentIntent.name = 'game';
        questionAndAnswerData = await questionHelper.getQuestion(current_question_id, req, res);
        res.shouldEndSession(false);
        res.send();
    }
);


app.intent('alexa_joker', {
    'utterances': ['{I would like to use the Alexa joker please}']
},
    function (req, res) {
        currentIntent.name = 'game';
        questionHelper.alexaJoker(answerLetters[questionAndAnswerData.correct_answer_id], req, res);
        res.shouldEndSession(false);
        res.send();
    }
);

app.intent('affirmatives', {
    'utterances': ['{yes please} ']
},
    async function (req, res) {
        switch (currentIntent.name) {
            case 'game':
                current_question_id = questions_ids_array.pop();
                questionAndAnswerData = await questionHelper.getQuestion(current_question_id, req, res);
                break;
        }
        res.shouldEndSession(false);
        res.send();
    });


app.intent('negatives', {
    'utterances': ['{no}']
},
    function (req, res) {
        switch (currentIntent.name) {
            case 'game':
                res.say('Well, I wish you were more brave... However, congratulations, you won ' + currentPrice + ' dollars.')
                    .shouldEndSession(true)
                    .send();
                currentIntent.step = 0;
                break;
            case 'other_question':
                res.say('Then be a man and answer the question!')
                    .shouldEndSession(false)
                    .send();
                break;
        }
    });

app.intent('user_answer', {
    'slots': {
        'ANSWER': 'ANSWERCHOICE'
    },
    'utterances': ['{My final answer is} {-|ANSWER}']
},
    function (req, res) {
        currentIntent.name = 'game';

        if (questionHelper.correctAnswerExample(req.slot('ANSWER'))) {

            if (answerIndexes[req.slot('ANSWER')[0].toLowerCase()] === questionAndAnswerData.correct_answer_id) {
                currentPrice += 100;
                if (currentIntent.step === number_of_questions) {
                    res.say('That is correct.');
                    res.say('Congratulations, that was the last question, you won ' + currentPrice + ' dollars. You are the smartest man on the world now.');
                    res.say('Please do not spend all your money on alcohol.')
                        .shouldEndSession(true)
                        .send();
                    currentPrice = 0;
                    currentIntent.step = 0;
                } else {
                    res.say(correctAnwserAlexaResponse[Math.floor(Math.random() * correctAnwserAlexaResponse.length)])
                        .shouldEndSession(false)
                        .send();
                }
                currentIntent.step++;
            } else {
                res.say('Your answer is WRONG! Shame on your knowledge.');
                res.say('Please try never again').shouldEndSession(true).send();
                currentPrice = 0;
                currentIntent.step = 0;
            }
        } else {
            res.say('The answer format is incorrect. Please try to answer like: My answer is: a')
                .shouldEndSession(false)
                .send();
        }
    }
);




//hack to support custom utterances in utterance expansion string
const utterancesMethod = app.utterances;
app.utterances = function () {
    return utterancesMethod().replace(/{-\|/g, '{');
};

module.exports = app;

