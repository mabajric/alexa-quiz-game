'use strict';
module.change_code = 1;
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'db4free.net',
    user: 'mysql_alexa_user',
    password: 'ePdD2V7Jb8y#$&Gxfv9wg&gg',
    database: 'alexa_quiz'
});

const answerLetters = [
    'a',
    'b',
    'c',
    'd'
];

function mySqlQuery(query, ...parametersForEscape) {
    return new Promise((resolve, reject) => {
        const queryObject = {};
        queryObject.sql = query;
        if (parametersForEscape) {
            queryObject.values = parametersForEscape;
        }

        connection.query(queryObject, function (error, results) {
            if (error) reject(error);
            resolve(results);
        });
    });
}

function QuestionsDataHelper() {
}

QuestionsDataHelper.prototype.questionAndAnswerData = {
    'question_id': 0,
    'answers_array': [],
    'correct_answer_id': 0
};

QuestionsDataHelper.prototype.getQuestionsIdsArray = async function () {
    let queryResultObject = await mySqlQuery('SELECT question_id FROM questions ORDER BY RAND()');
    return queryResultObject.map((row) => row.question_id);
};

QuestionsDataHelper.prototype.getQuestion = async function (question_id, req, res) {
    this.questionAndAnswerData.question_id = question_id;

    let dataForQuestion = await mySqlQuery("SELECT" +
        " q.question_id, q.question, a.answer, (a.answer_id = ca.answer_id) as is_correct" +
        " FROM questions q" +
        " JOIN answers a ON a.question_id = q.question_id" +
        " JOIN correct_answers ca ON ca.question_id = q.question_id" +
        " WHERE q.question_id = ?"
        , question_id);

    res.say(dataForQuestion[0].question);

    res.say('You have the following answers: ');
    this.questionAndAnswerData.answers_array = dataForQuestion.map((row) => ({
        answer: row.answer,
        is_correct: row.is_correct
    }));
    this.questionAndAnswerData.answers_array.forEach((answer, answerIndex) => {
        if (answerIndex > 0) res.say(", ");
        res.say(answerLetters[answerIndex] + ': ' + answer.answer);

        if (answer.is_correct) {
            this.questionAndAnswerData.correct_answer_id = answerIndex;
        }
    });

    return this.questionAndAnswerData;
};

QuestionsDataHelper.prototype.alexaJoker = function (correctAnswer, req, res) {
    res.say('I hope I can help you, but remember, I am not google... I will give you the percentage for each answer.')
    answerLetters.forEach((item, answerIndex) => {
        if (answerIndex > 0) res.say(", ");
        if (item === correctAnswer) {
            res.say(item + ': 70 percent');
        } else {
            res.say(item + ': 10 percent')
        }
    })
};

QuestionsDataHelper.prototype.correctAnswerExample = function (userAnswer) {
    return userAnswer.length < 3 && answerLetters.includes(userAnswer[0].toLowerCase());
};

module.exports = QuestionsDataHelper;