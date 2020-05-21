const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();

var MongoClient = require('mongodb').MongoClient;
var url = "<insert mongo url here>";

var levenshtein = require('fast-levenshtein');
var distance;

var initials = require("initials");

var q = "";
var a = "";

var shorta = [];
var completeq = [];

var input = "";

var speedcheck = "";
var printeda = "";

var reference = 0;

var servers = [];
var currentq = [];
var currenta = [];
var currentcat = [];
var corrindex;

var catinput = "";
var cats = ["History", "Literature", "Science", "Current Events", "Fine Arts", "Geography", "Mythology", "Philosophy", "Religion", "Social Science"];
var catids = [18, 15, 17, 26, 21, 20, 14, 25, 19, 22];
var catindex;
var catnum = 0;

client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {
    if (message.content.startsWith(`${prefix}q`)) {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("quizbowldb");
            if (currentcat[servers.indexOf(message.guild.id)] != undefined) {
                dbo.collection("tossups").aggregate([ { $match: { category_id: currentcat[servers.indexOf(message.guild.id)] } }, { $sample: { size: 1 } } ]).toArray(function(err, result) {
                    if (err) throw err;

                    q = result[0].text;
                    a = result[0].answer;
                    reference = result[0].id;

                    if (servers.includes(message.guild.id)) {
                        corrindex = servers.indexOf(message.guild.id);
                        currentq.splice(corrindex, 1, q);
                        currenta.splice(corrindex, 1, a);
                    } else {
                        servers.push(message.guild.id);
                        corrindex = servers.indexOf(message.guild.id);
                        currentq.splice(corrindex, 1, q);
                        currenta.splice(corrindex, 1, a);
                    }

                    sendQ(message);
                    db.close();
                });
            } else {
                dbo.collection("tossups").aggregate([ { $sample: { size: 1 } } ]).toArray(function(err, result) {
                    if (err) throw err;
                    
                    q = result[0].text;
                    a = result[0].answer;
                    reference = result[0].id;

                    if (servers.includes(message.guild.id)) {
                        corrindex = servers.indexOf(message.guild.id);
                        currentq.splice(corrindex, 1, q);
                        currenta.splice(corrindex, 1, a);
                    } else {
                        servers.push(message.guild.id);
                        corrindex = servers.indexOf(message.guild.id);
                        currentq.splice(corrindex, 1, q);
                        currenta.splice(corrindex, 1, a);
                    }

                    sendQ(message);
                    db.close();
                });
            }
        });
    }
    
    if (message.content.startsWith(`${prefix}a`)) {
        input = message.content;
        input = input.slice(3);
        
        shorta = currenta[servers.indexOf(message.guild.id)];

        shorta = shorta.split(" [");
        shorta = shorta[0].split(" (");
        shorta = shorta[0].split(" &lt;");

        printeda = shorta[0];
        distance = levenshtein.get(input, printeda, { useCollator: true });
        
        if (distance <= 3) {
            message.channel.send("Correct! The answer is `" + printeda + "`.");
        } else if (input.length >= 4 && printeda.toLowerCase().includes(input)) {
            message.channel.send("Correct! The answer is `" + printeda + "`.");
        } else if (printeda.includes(" ") && levenshtein.get(input, initials(printeda), { useCollator: true }) <= 1) {
            message.channel.send("Correct! The answer is `" + printeda + "`.");
        } else {
            message.channel.send("Incorrect! The answer is `" + printeda + "`.");
        }
    }

    if (message.content.startsWith(`${prefix}category`)) {
        catinput = message.content;
        catinput = catinput.slice(10);
        catinput = catinput.charAt(0).toUpperCase() + catinput.slice(1);

        if (catinput == "Current events") {
            catinput = "Current Events";
        }
        if (catinput == "Fine arts") {
            catinput = "Fine Arts";
        }
        if (catinput == "Social science") {
            catinput = "Social Science";
        }

        if (cats.includes(catinput)) {
            catindex = cats.indexOf(catinput);
            catnum = catids[catindex];
            currentcat.splice(corrindex, 1, catnum);
            message.channel.send("*Selected the **" + cats[catindex] + "** category.*");
        } else if (catinput == "Reset") {
            currentcat.splice(corrindex, 1, undefined);
            message.channel.send("*Questions reset to normal.*");
        } else {
            message.channel.send("I don't recognize that. Here are the categories I recognize: " + "`" + cats + "`");
        }
    }

    if (message.content.startsWith(`${prefix}help`)) {
        const helpembed = new Discord.MessageEmbed()
            .setTitle("Neg 5 Guide")
            .addFields(
                { name: 'Question', value: 'Use .q for Neg 5 to ask you a question.' },
                { name: 'Answer', value: "Use .a and give your answer, which is separated by a space (ex, '.a estonia')." },
                { name: 'Change Category', value: "Use .category and state the category (ex. '.category literature'). If you'd like to reset to the normal distribution, use '.category reset'" },
            )
            .setFooter('Special thanks to Crypthes for crucial feedback during the development of Neg 5!');
        message.channel.send(helpembed);
    }


    function sendQ(message) {
        if (q.includes("10 points")) {
            completeq = currentq[servers.indexOf(message.guild.id)].split("10 points");
        }
        if (q.includes("FTP")) {
            completeq = currentq[servers.indexOf(message.guild.id)].split("FTP");
        }

        speedcheck = completeq[1];

        if (speedcheck.slice(0, 3) == "Each" || speedcheck.slice(0, 3) == "each") {
            speedcheck = speedcheck.slice(4);
        }
        if (speedcheck.charAt(0) == ",") {
            speedcheck = speedcheck.slice(1);
        }
        if (speedcheck.charAt(0) == " ") {
            speedcheck = speedcheck.slice(1);
        }
        if (speedcheck.charAt(0) == "—") {
            speedcheck = speedcheck.slice(1);
        }
        if (speedcheck.charAt(0) == "Â") {
            speedcheck = speedcheck.slice(1);
        }
        if (speedcheck.charAt(0) == "-") {
            speedcheck = speedcheck.slice(1);
        }
        if (speedcheck.charAt(0) == "each") {
            speedcheck = speedcheck.slice(4);
        }
        if (speedcheck.charAt(0) == "ANSWER:") {
            speedcheck = speedcheck.slice(7);
        }
        if (speedcheck.charAt(0) == "Answer:") {
            speedcheck = speedcheck.slice(7);
        }
        if (speedcheck.charAt(0) == "–") {
            speedcheck = speedcheck.slice(1);
        }
        
        speedcheck = speedcheck.charAt(0).toUpperCase() + speedcheck.slice(1);
        message.channel.send(speedcheck);
    }
})

client.login(token);