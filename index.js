// Libraries
const Discord = require('discord.js');
const request = require('request-promise');
const Enmap = require('enmap');
const AsciiTable = require("ascii-table");
const DiscordBotList = require('dblapi.js');
const BOATS = require("boats.js");

// JSON Files
const secrets = require('./secrets.json');

const Boats = new BOATS(secrets.boats);

// Client
const client = new Discord.Client();

const dbl = new DiscordBotList(secrets.dbl);

// Prefix
const prefix = "nba ";

// Enmaps
const bets = new Enmap({
    name: "bets"
});
client.points = new Enmap({name: "points"});
const serverList =  new Enmap({name: "serverConfigurations"});

let clientReady = false;

let currentScoreboard,
    currentDate,
    seasonScheduleYear,
    players = {},
    teams = {},
    jerseyNumbers = {},
    nicknames = {},
    triCodes = {},
    lowerCaseNicknames = {};

const teamLogoURLs = {
    ATL: "http://loodibee.com/wp-content/uploads/nba-atlanta-hawks-logo-300x300.png",
    BOS: "http://loodibee.com/wp-content/uploads/nba-boston-celtics-logo-300x300.png",
    BKN: "http://loodibee.com/wp-content/uploads/nba-brooklyn-nets-logo-300x300.png",
    CHA: "http://loodibee.com/wp-content/uploads/nba-charlotte-hornets-logo-300x300.png",
    CHI: "http://loodibee.com/wp-content/uploads/nba-chicago-bulls-logo-300x300.png",
    CLE: "http://loodibee.com/wp-content/uploads/nba-cleveland-cavaliers-logo-300x300.png",
    DAL: "http://loodibee.com/wp-content/uploads/nba-dallas-mavericks-logo-300x300.png",
    DEN: "http://loodibee.com/wp-content/uploads/nba-denver-nuggets-logo-2018-300x300.png",
    DET: "http://loodibee.com/wp-content/uploads/nba-detroit-pistons-logo-300x300.png",
    GSW: "http://loodibee.com/wp-content/uploads/nba-golden-state-warriors-logo-300x300.png",
    HOU: "http://loodibee.com/wp-content/uploads/nba-houston-rockets-logo-300x300.png",
    IND: "http://loodibee.com/wp-content/uploads/nba-indiana-pacers-logo-300x300.png",
    LAC: "http://loodibee.com/wp-content/uploads/nba-la-clippers-logo-png-300x300.png",
    LAL: "http://loodibee.com/wp-content/uploads/nba-los-angeles-lakers-logo-300x300.png",
    MEM: "http://loodibee.com/wp-content/uploads/nba-memphis-grizzlies-logo-300x300.png",
    MIA: "http://loodibee.com/wp-content/uploads/nba-miami-heat-logo-300x300.png",
    MIL: "http://loodibee.com/wp-content/uploads/nba-milwaukee-bucks-logo-300x300.png",
    MIN: "http://loodibee.com/wp-content/uploads/nba-minnesota-timberwolves-logo-300x300.png",
    NOP: "http://loodibee.com/wp-content/uploads/nba-new-orleans-pelicans-logo-300x300.png",
    NYK: "http://loodibee.com/wp-content/uploads/nba-new-york-knicks-logo-300x300.png",
    OKC: "http://loodibee.com/wp-content/uploads/nba-oklahoma-city-thunder-logo-300x300.png",
    ORL: "http://loodibee.com/wp-content/uploads/nba-orlando-magic-logo-300x300.png",
    PHI: "http://loodibee.com/wp-content/uploads/nba-philadelphia-76ers-logo-300x300.png",
    PHX: "http://loodibee.com/wp-content/uploads/nba-phoenix-suns-logo-300x300.png",
    POR: "http://loodibee.com/wp-content/uploads/nba-portland-trail-blazers-logo-300x300.png",
    SAC: "http://loodibee.com/wp-content/uploads/nba-sacramento-kings-logo-300x300.png",
    SAS: "http://loodibee.com/wp-content/uploads/nba-san-antonio-spurs-logo-300x300.png",
    TOR: "http://loodibee.com/wp-content/uploads/nba-toronto-raptors-logo-300x300.png",
    UTA: "http://loodibee.com/wp-content/uploads/nba-utah-jazz-logo-300x300.png",
    WAS: "http://loodibee.com/wp-content/uploads/nba-washington-wizards-logo-300x300.png",
}

function msToTime(e) {
    parseInt(e % 1e3 / 100);
    var n = parseInt(e / 1e3 % 60),
        r = parseInt(e / 6e4 % 60),
        s = parseInt(e / 36e5 % 24),
        t = parseInt(e / 864e5 % 7);
    return (t = t < 10 ? "0" + t : t) + "d:" + (s = s < 10 ? "0" + s : s) + "h:" + (r = r < 10 ? "0" + r : r) + "m:" + (n = n < 10 ? "0" + n : n) + "s."
}

function swap(json) {
    var ret = {};
    for (var key in json) {
        ret[json[key].tricode] = json[key].teamId;
    }
    return ret;
}

client.once('ready', () => {
    console.log(client.user.tag + " is ready!");
    clientReady = true;

    request({
        uri: "http://data.nba.net/10s/prod/v1/today.json",
        json: true
    }, (e, r, b) => {
        seasonScheduleYear = b.seasonScheduleYear;
        request({
            uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players.json',
            json: true
        }, (e, r, b) => {
            for (var i = 0; i < b.league.standard.length; i++) {
                players[b.league.standard[i].personId] = b.league.standard[i].firstName + " " + b.league.standard[i].lastName;
                jerseyNumbers[b.league.standard[i].personId] = b.league.standard[i].jersey;
            }
        });
        request({
            uri: "http://data.nba.net/10s/prod/v1/" + seasonScheduleYear + "/teams.json",
            json: true
        }, (e, r, b) => {
            for (var i = 0; i < b.league.standard.length; i++) {
                if (b.league.standard[i].isNBAFranchise) {
                	if (b.league.standard[i].nickname == "Trail Blazers") b.league.standard[i].nickname = "Blazers";
                    teams[b.league.standard[i].teamId] = b.league.standard[i];
                    nicknames[b.league.standard[i].tricode] = b.league.standard[i].nickname;
                    triCodes[b.league.standard[i].nickname.toLowerCase()] = b.league.standard[i].tricode;
                    lowerCaseNicknames[b.league.standard[i].tricode] = b.league.standard[i].nickname.toLowerCase();
                }
            }
        });
    });

    request({
        uri: "http://data.nba.net/10s/prod/v1/today.json",
        json: true
    }, (e, r, b) => {
        currentDate = b.links.currentDate;
    });

    client.user.setActivity("nba help | nbabot.js.org | " + client.guilds.size + " servers, thanks for 250! :)", {
        type: "PLAYING"
    });
});

client.on('message', async message => {

    if (!message.guild) return;

    serverList.ensure(message.guild.id, {
        prefix: "nba "
    });

    if (message.content == "stop") message.channel.stopTyping();

    if (message.content.split(' ')[0].toLowerCase() != "nba") return;

    bets.ensure(message.author.id, {});
    client.points.ensure(message.author.id, {
        id: message.author.id,
        points: 0,
        correct: 0,
        wrong: 0
    })

    // Logging user messages
    console.log(message.guild.name + ' (' + message.author.tag + ') ' + message.content);

    const args = message.content.slice(prefix.length).split(' ');
    // const args = message.content.split(' ').shift()
    const command = args.shift().toLowerCase();

    let sendEmbed = false,
        eTitle = "",
        eDescription = "",
        eThumbnail = "",
        eImage = "",
        user,
        me,
        playerFound;

    switch (command) {

        case 'help':
        case 'commands':
        case 'cmds':

            if (!args[0]) {
                embed = new Discord.RichEmbed()
                    .setTitle("Help for NBABot:")
                    .setColor(0xff4242)
                    .setFooter("nba help")
                    .setTimestamp()
                    .addField("NBA Commands", "`nba scores`\n`nba player-info [player]`\n`nba player-stats [player]`\n`nba boxscore [team]`\n`nba teams`\n`nba standings`\n`nba standings [east/west]`\n`nba roster [team]`")
                    .addField("Betting Commands", "Type `nba betting-help` to view a guide on the betting process.")
                    .addField("Other Commands", "`nba help` `nba ping` `nba uptime` `nba invite` `nba vote` `nba github` `nba bot-stats` `nba support`")
                    .setDescription("To view detailed usage, visit [nbabot.js.org](https://nbabot.js.org/) or use `nba help detailed`.\nYou can join the support server [here](https://discord.gg/Bk8xATx)")
                message.channel.send(embed);
            } else if (args[0]) {
                message.channel.send("Sent you a DM containing help information.");
                embed = new Discord.RichEmbed()
                    .setTitle("Help for NBABot:")
                    .setColor(0xff4242)
                    .setFooter("nba help")
                    .setTimestamp()
                    .setDescription("You can join the support server [here](https://discord.gg/Bk8xATx)")
                    // .addField("NBA Commands", "`nba scores`\nShows you the live scores for today.\n`nba player-info [player]`\nShows you basic stats on the players on that team in the game today. E.g. nba boxscore PHX\n`nba player-stats [player]`\nShows you stats on that player. E.g. nba player-stats LeBron James\n`nba boxscore [team]`\nShows you basic information on that player like height, weight and draft pick. E.g. nba player-info LeBron James\n`nba teams`\nShows you the teams for the current season.\n`nba standings`\nShows you the current league standings.\n`nba standings [east/west]`\nShows you the current east/west standings.\n`nba roster [team]`\nShows you the current roster for that team. E.g. nba roster PHX")
                    .addField("nba scores", "Shows you the live scores for today.")
                    .addField("nba boxscore [team]", "Shows you basic stats on the players on that team in the game today. E.g. nba boxscore PHX.")
                    .addField("nba player-stats [player]", "Shows you stats on that player. E.g. nba player-stats LeBron James")
                    .addField("nba player-info [player]", "Shows you basic information on that player like height, weight and draft pick. E.g. nba player-info LeBron James")
                    .addField("nba standings", "Shows you the current league standings.")
                    .addField("nba standings west/east", "Shows you the current west/east standings.")
                    .addField("nba roster [team]", "Shows you the current roster for that team. E.g. nba roster PHX")
                    .addField("Other Commands", "`nba help` `nba ping` `nba uptime` `nba invite` `nba vote` `nba github` `nba bot-stats` `nba support`")
                message.author.send(embed);
            }
            break;

        case 'ping':
            const m = await message.channel.send("Ping?");
            m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
            break;

        case "uptime":
            sendEmbed = true;
            eTitle = "Uptime";
            eDescription = "This session of NBABot has been online for\n```" + msToTime(client.uptime) + "```";
            break;

        case 'invite':
            sendEmbed = true;
            eTitle = "Invite NBABot to your servers.";
            eDescription = "https://discordbots.org/bot/544017840760422417";
            break;

        case 'vote':
            sendEmbed = true;
            eTitle = "Vote for NBABot";
            eDescription = "NBABot is and will be completely free. To support this bot, add it to your discord servers and make sure to vote for my bot as much as possible so it gains popularity and more people discover this bot.\nhttps://discordbots.org/bot/544017840760422417/vote";
            break;

        case 'website':
            message.channel.send("**https://nbabot.js.org/**");
            break;

        case 'github':
            message.channel.send("**https://github.com/EliotChignell/NBABot**");
            break;

        case 'bot-stats':
            embed = new Discord.RichEmbed()
                .setTitle("Stats on NBABot:")
                .setColor(0xff4242)
                .setFooter("nba help")
                .setTimestamp()
                .setDescription("Development started Feb 10 2019.")
                .addField("Servers", client.guilds.size, true)
                .addField("Channels", client.channels.size, true)
                .addField("Users", client.users.size, true);
            message.channel.send(embed);
            break;

        case 'eval':
            if (message.author.id == 401649168948396032) message.channel.send("```" + eval(args.join(' ')) + "```");
            break;

        case 'servers':
            if (message.author.id == 401649168948396032) {
                client.guilds.forEach(g => {
                    message.author.send(g.name + " " + g.members.size);
                });
            }
            break;

        case 'support':
            message.channel.send("https://discord.gg/Bk8xATx");
            break;

        case 'scores':
        case 'today':
        case 'games':
        case 'scoreboard':
        case 'score':
        case 's':
        case 'live':

            if (!args[0]) {
                me = await message.channel.send(":timer: Loading...");

                embed = new Discord.RichEmbed()
                    .setTitle("Scores for today:")
                    .setColor(0xff4242)
                    .setFooter("nba help")
                    .setTimestamp();

                request({
                    uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/scoreboard.json",
                    json: true
                }, (e, r, b) => {
                    for (var i = 0; i < b.games.length; i++) {

                        let str = "";
                        let str2 = "";

                        if (b.games[i].statusNum == 2) str += ":red_circle: ";

                        b.games[i].hTeam.triCode = nicknames[b.games[i].hTeam.triCode];
                        b.games[i].vTeam.triCode = nicknames[b.games[i].vTeam.triCode];

                        if (b.games[i].statusNum == 3) {
                            if (parseInt(b.games[i].hTeam.score) > parseInt(b.games[i].vTeam.score)) { // hTeam won
                                // console.log(b.games[i].hTeam.triCode+" won, "+b.games[i].hTeam.score+" > "+b.games[i].vTeam.score);
                                str += b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - **" + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode + "**";
                            } else if (parseInt(b.games[i].vTeam.score) > parseInt(b.games[i].hTeam.score)) { // vTeam won
                                // console.log(b.games[i].vTeam.triCode+" won, "+b.games[i].vTeam.score+" > "+b.games[i].hTeam.score);
                                str += "**" + b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + "** - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode;
                            }
                        } else {
                            str += b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode;
                        }

                        if (b.games[i].statusNum == 1) {
                            if (new Date(b.games[i].startTimeUTC).getTime() - new Date().getTime() < 0) {
                                str2 += "Starting soon"
                            } else {
                                str2 += "Starts in `" + msToTime(new Date(b.games[i].startTimeUTC).getTime() - new Date().getTime()) + "`";
                            }
                        } else if (b.games[i].statusNum == 2) {
                            str += " | Q" + b.games[i].period.current + " " + b.games[i].clock;
                        } else {
                            str += " | FINAL";
                        }
                        if (!b.games[i].nugget.text && str2 == "") {
                            str2 = "...";
                        } else if (b.games[i].nugget.text) {
                            str2 += "\n" + b.games[i].nugget.text;
                        }

                        if (b.games[i].seasonStageId == 4) {
                            if (b.games[i].statusNum == 3) {
                                if (parseInt(b.games[i].hTeam.score) > parseInt(b.games[i].vTeam.score)) { // hTeam won
                                    b.games[i].hTeam.seriesWin++;
                                } else if (parseInt(b.games[i].vTeam.score) > parseInt(b.games[i].hTeam.score)) { // vTeam won
                                    b.games[i].vTeam.seriesWin++;
                                }
                            }
                            if (parseInt(b.games[i].hTeam.seriesWin) > parseInt(b.games[i].vTeam.seriesWin)) { // hTeam leading series
                                if (parseInt(b.games[i].hTeam.seriesWin) == 4) {
                                    str += " | " + b.games[i].hTeam.triCode + " won series, " + b.games[i].hTeam.seriesWin + "-" + b.games[i].vTeam.seriesWin;
                                } else {
                                    str += " | " + b.games[i].hTeam.triCode + " leads series, " + b.games[i].hTeam.seriesWin + "-" + b.games[i].vTeam.seriesWin;
                                }
                            } else if (parseInt(b.games[i].hTeam.seriesWin) < parseInt(b.games[i].vTeam.seriesWin)) { // vTeam leading series
                                if (parseInt(b.games[i].vTeam.seriesWin) == 4) {
                                    str += " | " + b.games[i].vTeam.triCode + " won series, " + b.games[i].vTeam.seriesWin + "-" + b.games[i].hTeam.seriesWin;
                                } else {
                                    str += " | " + b.games[i].vTeam.triCode + " leads series, " + b.games[i].vTeam.seriesWin + "-" + b.games[i].hTeam.seriesWin;
                                }
                            } else if (parseInt(b.games[i].hTeam.seriesWin) == parseInt(b.games[i].vTeam.seriesWin)) {// Series tied
                                str += " | Series tied, " + b.games[i].hTeam.seriesWin + "-" + b.games[i].vTeam.seriesWin;
                            }
                        }
                        try {
                            embed.addField(str, str2);

                        } catch (e) {
                            continue;
                        }
                    }
                    embed.addField("Want to view the scores from another date?","Use `nba scores yyyy/mm/dd`.");
                    me.edit(embed);
                });
            } else if (args[0]) {
                // Is it a valid date?
                if (!args[0].split('').includes('/') || args[0].length != 10) return message.channel.send(":x: Error: Please provide a valid date. E.g. `nba scores 2019/03/02` (yyyy/mm/dd).");
                if (args[0].split('/')[0].length != 4 || args[0].split('/')[1].length != 2 || args[0].split('/')[2].length != 2) return message.channel.send(":x: Error: Please provide a valid date. E.g. `nba scores 2019/03/02` (yyyy/mm/dd).");
                if (parseInt(args[0].split('/')[1]) > 12 || parseInt(args[0].split('/')[2]) > 31) return message.channel.send(":x: Error: Please provide a valid date. E.g. `nba scores 2019/03/02` (yyyy/mm/dd).");

                let date = args[0].split('/').join('');

                me = await message.channel.send(":timer: Loading...");

                embed = new Discord.RichEmbed()
                    .setTitle("Scores for the date "+args[0]+":")
                    .setColor(0xff4242)
                    .setFooter("nba help")
                    .setTimestamp();

                request({
                    uri: "http://data.nba.net/10s/prod/v1/" + date + "/scoreboard.json",
                    json: true
                }, (e, r, b) => {
                    if (e) return me.edit(":x: Error: Unfortunately, the NBA API does not have anything to show on that date. The API only supports from the 2014-15 season onwards.");
                    if (b == undefined) return me.edit(":x: Error: Unfortunately, the NBA API does not have anything to show on that date. The API only supports from the 2014-15 season onwards.");
                    for (var i = 0; i < b.games.length; i++) {

                        let str = "";
                        let str2 = "";

                        if (b.games[i].statusNum == 2) str += ":red_circle: ";

                        b.games[i].hTeam.triCode = nicknames[b.games[i].hTeam.triCode];
                        b.games[i].vTeam.triCode = nicknames[b.games[i].vTeam.triCode];

                        if (b.games[i].statusNum == 3) {
                            if (parseInt(b.games[i].hTeam.score) > parseInt(b.games[i].vTeam.score)) { // hTeam won
                                console.log(b.games[i].hTeam.triCode+" won, "+b.games[i].hTeam.score+" > "+b.games[i].vTeam.score);
                                str += b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - **" + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode + "**";
                            } else if (parseInt(b.games[i].vTeam.score) > parseInt(b.games[i].hTeam.score)) { // vTeam won
                                console.log(b.games[i].vTeam.triCode+" won, "+b.games[i].vTeam.score+" > "+b.games[i].hTeam.score);
                                str += "**" + b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + "** - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode;
                            }
                        } else {
                            str += b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode;
                        }

                        if (b.games[i].statusNum == 1) {
                            if (new Date(b.games[i].startTimeUTC).getTime() - new Date().getTime() < 0) {
                                str2 += "Starting soon"
                            } else {
                                str2 += "Starts in `" + msToTime(new Date(b.games[i].startTimeUTC).getTime() - new Date().getTime()) + "`";
                            }
                        } else if (b.games[i].statusNum == 2) {
                            str += " | Q" + b.games[i].period.current + " " + b.games[i].clock;
                        } else {
                            str += " | FINAL";
                        }
                        if (!b.games[i].nugget.text && str2 == "") {
                            str2 = "...";
                        } else if (b.games[i].nugget.text) {
                            str2 += "\n" + b.games[i].nugget.text;
                        }
                        if (b.games[i].seasonStageId == 4) {
                            if (b.games[i].statusNum == 3) {
                                if (parseInt(b.games[i].hTeam.score) > parseInt(b.games[i].vTeam.score)) { // hTeam won
                                    b.games[i].hTeam.seriesWin++;
                                } else if (parseInt(b.games[i].vTeam.score) > parseInt(b.games[i].hTeam.score)) { // vTeam won
                                    b.games[i].vTeam.seriesWin++;
                                }
                            }
                            if (parseInt(b.games[i].hTeam.seriesWin) > parseInt(b.games[i].vTeam.seriesWin)) { // hTeam leading series
                                if (parseInt(b.games[i].hTeam.seriesWin) == 4) {
                                    str += " | " + b.games[i].hTeam.triCode + " won series, " + b.games[i].hTeam.seriesWin + "-" + b.games[i].vTeam.seriesWin;
                                } else {
                                    str += " | " + b.games[i].hTeam.triCode + " leads series, " + b.games[i].hTeam.seriesWin + "-" + b.games[i].vTeam.seriesWin;
                                }
                            } else if (parseInt(b.games[i].hTeam.seriesWin) < parseInt(b.games[i].vTeam.seriesWin)) { // vTeam leading series
                                if (parseInt(b.games[i].vTeam.seriesWin) == 4) {
                                    str += " | " + b.games[i].vTeam.triCode + " won series, " + b.games[i].vTeam.seriesWin + "-" + b.games[i].hTeam.seriesWin;
                                } else {
                                    str += " | " + b.games[i].vTeam.triCode + " leads series, " + b.games[i].vTeam.seriesWin + "-" + b.games[i].hTeam.seriesWin;
                                }
                            } else if (parseInt(b.games[i].hTeam.seriesWin) == parseInt(b.games[i].vTeam.seriesWin)) {// Series tied
                                str += " | Series tied, " + b.games[i].hTeam.seriesWin + "-" + b.games[i].vTeam.seriesWin;
                            }
                        }
                        try {
                            embed.addField(str, str2);

                        } catch (e) {
                            continue;
                        }
                    }
                    me.edit(embed);
                });
            }
            break;

        case 'player-info':

            me = await message.channel.send(":timer: Loading...");

            if (!args[0] || !args[1] || args[0].split('').includes("[") || args[1].split('').includes("]")) return me.edit("Please specifiy a player, e.g. `nba player-info lebron james`");
            playerFound = false;


            request({
                uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players.json',
                json: true
            }, (e, r, b) => {
                for (var i = 0; i < b.league.standard.length; i++) {
                    if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
                        playerFound = true;
                        let draftStr = "#" + b.league.standard[i].draft.pickNum + " (" + b.league.standard[i].draft.seasonYear + ")";
                        if (draftStr == "# ()") draftStr = "Undrafted";
                        let schoolStr = b.league.standard[i].collegeName;
                        if (schoolStr == "") schoolStr = "Unlisted";
                        let embed = new Discord.RichEmbed()
                            .setTitle("🏀 Basic Information for `" + b.league.standard[i].firstName + " " + b.league.standard[i].lastName + "`:")

                            .setColor(0xff4242)
                            // .setDescription("Jersey Number: `" + b.league.standard[i].jersey + "`\nPosition: `" + b.league.standard[i].pos + "`\nHeight: `" + b.league.standard[i].heightFeet + "'" + b.league.standard[i].heightInches + '" (' + b.league.standard[i].heightMeters + "m)`\nWeight: `" + b.league.standard[i].weightKilograms + "kg`\nDate of Birth: `" + b.league.standard[i].dateOfBirthUTC + "`\nDrafted: " + draftStr + "\n\n_Type `nba player-stats " + args[0] + " " + args[1] + "` to view stats on that player._")
                            .setFooter("nba help")
                            .setTimestamp()
                            .addField("**Jersey Number**", b.league.standard[i].jersey, true)
                            .addField("**Position**", b.league.standard[i].pos, true)
                            .addField("**Height**", b.league.standard[i].heightFeet + "'" + b.league.standard[i].heightInches + '" (' + b.league.standard[i].heightMeters + "m)", true)
                            .addField("**Weight**", b.league.standard[i].weightKilograms + "kg", true)
                            .addField("**Date of Birth**", b.league.standard[i].dateOfBirthUTC, true)
                            .addField("**Drafted**", draftStr, true)
                            .addField("**College**", schoolStr, true)
                            .setThumbnail("https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/"+b.league.standard[i].teamId+"/"+ seasonScheduleYear +"/260x190/"+ b.league.standard[i].personId + ".png")
                            .addField("...", "Type `nba player-stats " + args.join(' ') + "` to view stats on that player.");

                        me.edit(embed);

                        break;
                    }
                }
            }).then(() => {
                if (!playerFound) me.edit(":x: Error: Player not found.");
            });

            break;

        case 'player-stats':
            if (!args[0] || !args[1] || args[0].split('').includes("[") || args[1].split('').includes(']')) return message.channel.send("Please specifiy a player, e.g. `nba player-stats lebron james`");
            playerFound = false;

            me = await message.channel.send(":timer: Loading...");

            request({
                uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players.json',
                json: true
            }, (e, r, b) => {

                for (var i = 0; i < b.league.standard.length; i++) {

                    let desiredName;

                    /*

                    if (args.length == 3) {
                        if (args[2].toLowerCase == "-c" || args[2].toLowerCase == "-r") {
                            desiredName = args[0] + " " + args[1];
                        } else {
                            desiredName = args[0] + " " + args[1] + " " + args[2];
                        }
                    } else if (args.length == 4) {
                        desiredName = args[0] + " " + args[1] + " " + args[2];
                    } else if (args.length == 2) {
                        desiredName = args[0] + " " + args[1];
                    }

                    */

                    if (args[args.length-1].toLowerCase() == "-c" || args[args.length-1].toLowerCase() == "-r") {
                        args.pop();
                        desiredName = args.join(' ');
                    } else {
                        desiredName = args.join(' ');
                    }

                    if ((b.league.standard[i].firstName.toLowerCase() + " " + b.league.standard[i].lastName.toLowerCase()) == desiredName.toLowerCase()) {
                        playerFound = true;
                        let playerName = b.league.standard[i].firstName + " " + b.league.standard[i].lastName;
                        console.log(b.league.standard[i].personId);

                        request({
                            uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players/' + b.league.standard[i].personId + '_profile.json',
                            json: true
                        }, (e, r, b) => {

                            // Determing what type of season the user is requesting

                            // console.log(b.league.standard.stats.latest.ppg+" "+b.league.standard.stats.latest.seasonStageId);

                            let season, player;

                            if (args[2]) {
                                if (args[2].toLowerCase() == "-c") {
                                    player = b.league.standard.stats.careerSummary;
                                    season = "Career";
                                } else if (args[2].toLowerCase() == "-r") {
                                    if (b.league.standard.stats.regularSeason.season[0].teams.length > 1) {
                                        player = b.league.standard.stats.regularSeason.season[0].teams[0];
                                        season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                    } else {
                                        player = b.league.standard.stats.regularSeason.season[0].total;
                                        season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                    }
                                } else {
                                    if (b.league.standard.stats.regularSeason.season[0].teams.length > 1) {
                                        player = b.league.standard.stats.regularSeason.season[0].teams[0];
                                        season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                    } else {
                                        player = b.league.standard.stats.regularSeason.season[0].total;
                                        season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                    }
                                }
                            } else if (b.league.standard.stats.latest.ppg == "-1") { // This means it's the playoffs and that player isn't in the playoffs. :(
                                if (b.league.standard.stats.regularSeason.season[0].teams.length > 1) {
                                    player = b.league.standard.stats.regularSeason.season[0].teams[0];
                                    season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                } else {
                                    player = b.league.standard.stats.regularSeason.season[0].total;
                                    season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                }
                            } else if (b.league.standard.stats.latest.ppg != "-1" && b.league.standard.stats.latest.seasonStageId == 4) {
                                player = b.league.standard.stats.latest;
                                season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Playoff";
                            } else if (args[3]) {
                                if (args[3].toLowerCase() == "-c") {
                                    player = b.league.standard.stats.careerSummary;
                                    season = "Career";
                                } else if (args[3].toLowerCase() == "-r") {
                                    if (b.league.standard.stats.regularSeason.season[0].teams.length > 1) {
                                        player = b.league.standard.stats.regularSeason.season[0].teams[0];
                                        season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                    } else {
                                        player = b.league.standard.stats.regularSeason.season[0].total;
                                        season = b.league.standard.stats.latest.seasonYear + "-" + (parseInt(b.league.standard.stats.latest.seasonYear) + 1) + " Regular season";
                                    }
                                }
                            } else {
                                player = b.league.standard.stats.latest;
                                season = "";
                            }

                            // console.log(player);

                            let embed = new Discord.RichEmbed()
                                .setTitle(season + " stats on the player `" + playerName + "`:")
                                .setColor(0xff4242)
                                // .setDescription("PPG: `" + player.ppg + "`\nAPG: `" + player.apg + "`\nRPG: `" + player.rpg + "`\nMPG: `" + player.mpg + "`\nTOPG: `" + player.topg + "`\nSPG: `" + player.spg + "`\nFT%: `" + player.ftp + "%`\nFG%: `" + player.fgp + "%`\n+/-: `" + player.plusMinus + "`\n\n_Type `nba player-info " + args[0] + " " + args[1] + "` to view info on that player._")
                                .addField("PPG", player.ppg, true)
                                .addField("APG", player.apg, true)
                                .addField("RPG", player.rpg, true)
                                .addField("MPG", player.mpg, true)
                                .addField("TOPG", player.topg, true)
                                .addField("SPG", player.spg, true)
                                .addField("FT%", player.ftp + " (" + player.ftm + "/" + player.fta + ")", true)
                                .addField("FG%", player.fgp + " (" + player.fgm + "/" + player.fga + ")", true)
                                .addField("3P%", player.tpp + " (" + player.tpm + "/" + player.tpa + ")", true)
                                .addField("Total +/-", player.plusMinus, true)
                                .addField("Useful Tips", "Type `nba player-info " + args[0] + " " + args[1] + "` to view basic information on that player.\nType `nba player-stats " + args[0] + " " + args[1] + " -c` to view career stats on that player.\nType `nba player-stats " + args[0] + " " + args[1] + " -r` to view the latest regular season stats on that player if it defaults to playoff stats.")
                                .setFooter("nba help")
                                .setTimestamp();
                            me.edit(embed);
                        });
                    }
                }
            }).then(() => {
                if (!playerFound) me.edit(":x: Error: Player not found.");
            });

            break;

        case 'boxscore':
        case 'box':
        case 'b':
        case 'bs':

            if (!args[0]) return message.channel.send("Please specify a team. E.g. `nba boxscore PHX` or `nba boxscore Suns`.");
            if (!Object.keys(nicknames).includes(args[0].toUpperCase()) && !Object.values(lowerCaseNicknames).includes(args[0].toLowerCase())) return message.channel.send("Please specify a valid team. E.g. `nba boxscore PHX` or `nba boxscore Suns`.");
            if (Object.values(lowerCaseNicknames).includes(args[0].toLowerCase())) args[0] = triCodes[args[0].toLowerCase()];
            let gameFound = false;

            me = await message.channel.send(":timer: Loading...");

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/scoreboard.json",
                json: true
            }, (e, r, b) => {
                for (var i = 0; i < b.games.length; i++) {
                    let team, otherTeam, vTeam, hTeam, gameId, gameStartedAt;

                    gameId = b.games[i].gameId;
                    let randomDateObject = new Date(b.games[i].startTimeUTC);
                    gameStartedAt = randomDateObject.getFullYear() + "-" + (randomDateObject.getMonth() + 1) + "-" + randomDateObject.getDate();

                    if (args[0].toLowerCase() == b.games[i].hTeam.triCode.toLowerCase()) {
                        gameFound = true;
                        if (b.games[i].statusNum == 1) return me.edit("That game has not started yet.");
                        team = "h";
                        otherTeam = "v";
                    } else if (args[0].toLowerCase() == b.games[i].vTeam.triCode.toLowerCase()) {
                        gameFound = true;
                        if (b.games[i].statusNum == 1) return me.edit("That game has not started yet.");
                        team = "v";
                        otherTeam = "h";
                    } else {
                        continue;
                    }

                    vTeam = b.games[i].vTeam.triCode;
                    hTeam = b.games[i].hTeam.triCode;

                    request({
                        uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/" + gameId + "_boxscore.json",
                        json: true
                    }, (e, r, b) => {

                        let description, vTeamId, hTeamId;

                        vTeamId = b.basicGameData.vTeam.teamId;
                        hTeamId = b.basicGameData.hTeam.teamId;

                        embed = new Discord.RichEmbed()
                            .setTitle(vTeam + " " + b.basicGameData.vTeam.score + " - " + b.basicGameData.hTeam.score + " " + hTeam + "\nGame Played on `" + gameStartedAt + "`")
                            .setColor(0xff4242)
                            .setFooter("nba help")
                            .setTimestamp();

                        if (team == "h") embed.setThumbnail(teamLogoURLs[hTeam]);
                        if (team == "v") embed.setThumbnail(teamLogoURLs[vTeam]);

                        description = "";

                        let playerNames = "";
                        let playerStats = "";

                        let gameInfoStr = b.basicGameData.vTeam.triCode + " " + b.basicGameData.vTeam.score + " - " + b.basicGameData.hTeam.score + " " + b.basicGameData.hTeam.triCode;
                        if (b.basicGameData.statusNum == 2) gameInfoStr += " | Q" + b.basicGameData.period.current + " " + b.basicGameData.clock;
                        if (b.basicGameData.statusNum == 3) gameInfoStr += " | FINAL";

                        let table = new AsciiTable(gameInfoStr);
                        table
                            .setHeading('"Name', 'MINS', 'PTS', 'FG%', '3P%', 'REB', 'AST', 'TOV', 'STL', 'BLK', 'PF', '+/-"')
                            .setBorder(" ", "-", " ", " ");

                        for (var i = 0; i < b.stats.activePlayers.length; i++) {
                            if ((b.stats.activePlayers[i].teamId == vTeamId && team == "v") || (b.stats.activePlayers[i].teamId == hTeamId && team == "h")) {
                                if (args[1] == "-m" || args[1] == "mobile") description += players[b.stats.activePlayers[i].personId].split(' ')[1] + ": " + b.stats.activePlayers[i].points + " pts, " + b.stats.activePlayers[i].totReb + " trb, " + b.stats.activePlayers[i].assists + " ast\n";
                                table.addRow(players[b.stats.activePlayers[i].personId].split(' ')[1], b.stats.activePlayers[i].min, b.stats.activePlayers[i].points, b.stats.activePlayers[i].fgp, b.stats.activePlayers[i].tpp, b.stats.activePlayers[i].totReb, b.stats.activePlayers[i].assists, b.stats.activePlayers[i].turnovers, b.stats.activePlayers[i].steals, b.stats.activePlayers[i].blocks, b.stats.activePlayers[i].pFouls, b.stats.activePlayers[i].plusMinus);
                            }
                        }

                        if (args[1] == "-m" || args[1] == "mobile") {
                            embed.setDescription(description);
                            me.edit(embed);
                        } else {
                            me.edit("```ml\n" + table.toString() + "```**On Mobile?** Use `nba boxscore " + args[0] + " -m` or try rotating your device to landscape mode.");
                        }

                    });

                }
            }).then(() => {
                if (!gameFound) me.edit("That team aren't playing today or that team doesn't exist. For example, `nba boxscore PHX`.");
            });

            break;


        case 'teams':
            embed = new Discord.RichEmbed()
                .setTitle("Teams for the " + seasonScheduleYear + "/" + (parseInt(seasonScheduleYear) + 1) + " season:")
                .setColor(0xff4242)
                .setFooter("nba help")
                .setTimestamp();

            let cDescription = "";
            for (var key in teams) {
                cDescription += "`" + teams[key].tricode + "` ";
            }
            embed.setDescription(cDescription);
            message.channel.send(embed);
            break;

        case 'standings':

            me = await message.channel.send(":timer: Loading...");

            if (!args[0]) {
                // League Standings
                request({
                    uri: "http://data.nba.net/10s/prod/v1/current/standings_all_no_sort_keys.json",
                    json: true
                }, (e, r, b) => {
                    embed = new Discord.RichEmbed()
                        .setTitle("League Standings:")
                        .setColor(0xff4242)
                        .setFooter("nba help")
                        .setTimestamp();

                    let sDescription = "`";

                    for (var i = 0; i < b.league.standard.teams.length; i++) {
                        if (i <= 8) {
                            sDescription += "0" + (i + 1) + ". ";
                        } else {
                            sDescription += (i + 1) + ". ";
                        } // b.league.standard.teams[i]
                        sDescription += " " + teams[b.league.standard.teams[i].teamId].tricode + " " + b.league.standard.teams[i].win + "-" + b.league.standard.teams[i].loss + " (" + b.league.standard.teams[i].winPct + ") GB: " + b.league.standard.teams[i].gamesBehind + "\n";
                    }

                    sDescription += "`\nYou can use `nba standings west` or `nba standings east` too.";

                    embed.setDescription(sDescription);
                    me.edit(embed);
                });
            } else if (args[0].toLowerCase() == "west" || args[0].toLowerCase() == "w") {
                // West Standings
                request({
                    uri: "http://data.nba.net/10s/prod/v1/current/standings_conference.json",
                    json: true
                }, (e, r, b) => {
                    embed = new Discord.RichEmbed()
                        .setTitle("West Standings:")

                        .setColor(0xff4242)
                        .setFooter("nba help")
                        .setTimestamp();

                    let sDescription = "`";

                    for (var i = 0; i < b.league.standard.conference.west.length; i++) {
                        if (i <= 8) {
                            sDescription += "0" + (i + 1) + ". ";
                        } else {
                            sDescription += (i + 1) + ". ";
                        }
                        sDescription += " " + teams[b.league.standard.conference.west[i].teamId].tricode + " " + b.league.standard.conference.west[i].win + "-" + b.league.standard.conference.west[i].loss + " (" + b.league.standard.conference.west[i].winPct + ")\n";
                    }

                    sDescription += "`";

                    embed.setDescription(sDescription);
                    me.edit(embed);

                });
            } else if (args[0].toLowerCase() == "east" || args[0].toLowerCase() == "e") {
                // East Standings
                request({
                    uri: "http://data.nba.net/10s/prod/v1/current/standings_conference.json",
                    json: true
                }, (e, r, b) => {
                    embed = new Discord.RichEmbed()
                        .setTitle("East Standings:")

                        .setColor(0xff4242)
                        .setFooter("nba help")
                        .setTimestamp();

                    let sDescription = "`";

                    for (var i = 0; i < b.league.standard.conference.east.length; i++) {
                        if (i <= 8) {
                            sDescription += "0" + (i + 1) + ". ";
                        } else {
                            sDescription += (i + 1) + ". ";
                        }
                        sDescription += " " + teams[b.league.standard.conference.east[i].teamId].tricode + " " + b.league.standard.conference.east[i].win + "-" + b.league.standard.conference.east[i].loss + " (" + b.league.standard.conference.east[i].winPct + ")\n";
                    }

                    sDescription += "`";

                    embed.setDescription(sDescription);
                    me.edit(embed);

                });
            } else {
                // Invalid
                me.edit("Please use the command correctly. E.g. `nba standings west` or `nba standings east` or `nba standings` (full league standings).");
            }
            break;

        case 'roster':

            me = await message.channel.send(":timer: Loading...");

            if (!args[0]) return me.edit("Please specify a team. E.g. `nba roster PHX`.");
            if (!Object.keys(nicknames).includes(args[0].toUpperCase()) && !Object.values(lowerCaseNicknames).includes(args[0].toLowerCase())) return message.channel.send("Please specify a valid team. E.g. `nba roster PHX` or `nba roster Suns`.");
            if (Object.values(lowerCaseNicknames).includes(args[0].toLowerCase())) args[0] = triCodes[args[0].toLowerCase()];

            let teamIdd = swap(teams)[args[0].toUpperCase()];

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + seasonScheduleYear + "/teams/" + teamIdd + "/roster.json",
                json: true
            }, (e, r, b) => {
                embed = new Discord.RichEmbed()
                    .setTitle("Roster for the " + (seasonScheduleYear + "-" + (parseInt(seasonScheduleYear) + 1)) + " team of " + args[0].toUpperCase() + ":")
                    .setColor(0xff4242)
                    .setFooter("nba help")
                    .setThumbnail(teamLogoURLs[teams[teamIdd].tricode])
                    .setTimestamp();

                var rosterTable = new AsciiTable()
                rosterTable
                    .setHeading('Number','Name')

                eDescription = "`";
                let playerNumbers = "";
                let playerNamez = "";

                for (var i = 0; i < b.league.standard.players.length; i++) {
                    // playerNamez += players[b.league.standard.players[i].personId] + "\n";
                    // playerNumbers += jerseyNumbers[b.league.standard.players[i].personId] + "\n";
                    rosterTable.addRow(jerseyNumbers[b.league.standard.players[i].personId], players[b.league.standard.players[i].personId]);
                }

                eDescription += "`";
                // embed.setDescription(eDescription);
                // embed.addField("Number", playerNumbers, true);
                // embed.addField("Name", playerNamez, true);
                embed.setDescription("```" + rosterTable.toString() + "```");
                me.edit(embed);
            });

            break;

        case 'bet':

            me = await message.channel.send(":timer: Loading...");

            if (!args[0]) return me.edit(":x: Error: Please specify a team. For example, `nba bet TOR` or `nba bet Raptors`.");
            if (!Object.keys(nicknames).includes(args[0].toUpperCase()) && !Object.values(lowerCaseNicknames).includes(args[0].toLowerCase())) return message.channel.send("Please specify a valid team. E.g. `nba bet PHX` or `nba bet Suns`.");
            if (Object.values(lowerCaseNicknames).includes(args[0].toLowerCase())) args[0] = triCodes[args[0].toLowerCase()];

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/scoreboard.json",
                json: true
            }, (e, r, b) => {

                let teamFound = false;

                for (var i = 0; i < b.games.length; i++) {
                    if (b.games[i].hTeam.triCode == args[0].toUpperCase()) { // Betted hTeam
                        teamFound = true;
                        if (b.games[i].statusNum == 1) { // :white_check_mark:
                            if (!bets.get(message.author.id, currentDate)) bets.set(message.author.id, [], currentDate);
                            if (bets.get(message.author.id, currentDate).includes(b.games[i].vTeam.triCode)) bets.remove(message.author.id, b.games[i].vTeam.triCode, currentDate);
                            bets.push(message.author.id, b.games[i].hTeam.triCode, currentDate);
                            embed = new Discord.RichEmbed()
                                .setColor(0x4BB543)
                                .setTitle(":white_check_mark: Success! You have betted on " + b.games[i].hTeam.triCode + " to win against " + b.games[i].vTeam.triCode + ". Remember to `nba claim` once the game has finished.")
                            return me.edit(embed);
                        } else {
                            return me.edit(":x: Error: That team has already started playing. Use `nba betting-scores` to find out the teams which you can bet on.");
                        }
                    } else if (b.games[i].vTeam.triCode == args[0].toUpperCase()) { // Betted vTeam
                        teamFound = true;
                        if (b.games[i].statusNum == 1) { // :white_check_mark:
                            if (!bets.get(message.author.id, currentDate)) bets.set(message.author.id, [], currentDate);
                            if (bets.get(message.author.id, currentDate).includes(b.games[i].hTeam.triCode)) bets.remove(message.author.id, b.games[i].hTeam.triCode, currentDate);
                            bets.push(message.author.id, b.games[i].vTeam.triCode, currentDate);
                            embed = new Discord.RichEmbed()
                                .setColor(0x4BB543)
                                .setTitle(":white_check_mark: Success! You have betted on " + b.games[i].vTeam.triCode + " to win against " + b.games[i].hTeam.triCode + ". Remember to `nba claim` once the game has finished.")
                            return me.edit(embed);
                        } else {
                            return me.edit(":x: Error: That team has already started playing. Use `nba betting-scores` to find out the teams which you can bet on.");
                        }
                    }
                }

                if (!teamFound) return me.edit(":x: Error: That team either doesn't exist or isn't playing today. This bot _currently_ operates on a system where the teams are represented by 3 letter codes. Use `nba teams` to familiarise yourself with these teams.");
            });

            break;

        case 'placedbets':
        case 'unclaimedbets':
            if (!bets.get(message.author.id)) return message.channel.send(":x: Error: You haven't placed any bets yet.");
            if (Object.keys(bets.get(message.author.id)).length < 1) return message.channel.send(":x: Error: You have no bets to claim.");

            embed = new Discord.RichEmbed()
                .setColor(0xff4242)
                .setTitle("Your unclaimed bets:")
                .setFooter("nba help")
                .setTimestamp();

            let teamsBetted = "";
            for (var key in bets.get(message.author.id)) {
                teamsBetted += (key.substring(0, 4) + "/" + key.substring(4, 6) + "/" + key.substring(6, 8)) + ": " + bets.get(message.author.id)[key].join(", ") + "\n";
            }

            embed.setDescription(teamsBetted);
            message.channel.send(embed);
            break;

        case 'claim':
            if (!bets.get(message.author.id)) return message.channel.send(":x: Error: You haven't placed any bets yet.");
            if (Object.keys(bets.get(message.author.id)).length < 1) return message.channel.send(":x: Error: You have no bets to claim.");

            let betsPlaced = bets.get(message.author.id);

            let sentSomething = false;

            for (var key in betsPlaced) {
                if (betsPlaced[key].length == 0) {
                    bets.delete(message.author.id, key);
                    continue;
                }
                request({
                    uri: "http://data.nba.net/10s/prod/v1/" + key + "/scoreboard.json",
                    json: true
                }, (e,r,b) => {

                    let resultStr = "__"+(key.substring(0, 4) + "/" + key.substring(4, 6) + "/" + key.substring(6, 8))+"__\n";
                    let teamsDone = [];

                    for (var i=0;i<betsPlaced[key].length;i++) {

                        for (var j=0;j<b.games.length;j++) {

                            if (b.games[j].statusNum != 3) continue;

                            let hTeamScore = parseInt(b.games[j].hTeam.score);
                            let vTeamScore = parseInt(b.games[j].vTeam.score);

                            if ((betsPlaced[key][i] == b.games[j].hTeam.triCode) && b.games[j].statusNum == 3) { // Guessed hTeam
                                message.channel.send("Sent you a DM with your results!");
                                if (hTeamScore > vTeamScore) { // Guessed Correctly
                                    client.points.inc(message.author.id, "correct");
                                    client.points.inc(message.author.id, "points");
                                    resultStr += b.games[j].hTeam.triCode+" guessed correctly (+1 pts)\n";
                                } else if (vTeamScore > hTeamScore) { // Guessed Incorrectly
                                    client.points.inc(message.author.id, "wrong");
                                    resultStr += b.games[j].hTeam.triCode+" guessed incorrectly (+0 pts)\n";
                                }
                                bets.remove(message.author.id, betsPlaced[key][i], key);
                            } else if ((betsPlaced[key][i] == b.games[j].vTeam.triCode) && b.games[j].statusNum == 3) { // Guessed vTeam
                                message.channel.send("Sent you a DM with your results!");
                                if (vTeamScore > hTeamScore) { // Guessed Correctly
                                    client.points.inc(message.author.id, "correct");
                                    client.points.inc(message.author.id, "points");
                                    resultStr += b.games[j].vTeam.triCode+" guessed correctly (+1 pts)\n";
                                } else if (hTeamScore > vTeamScore) { // Guessed Incorrectly
                                    client.points.inc(message.author.id, "wrong");
                                    resultStr += b.games[j].vTeam.triCode+" guessed incorrectly (+0 pts)\n";
                                }
                                bets.remove(message.author.id, betsPlaced[key][i], key);
                            }

                        }

                        if (resultStr == "__"+(key.substring(0, 4) + "/" + key.substring(4, 6) + "/" + key.substring(6, 8))+"__\n") resultStr = "";

                    }

                    if (resultStr != "") {
                        message.author.send(resultStr);
                    }
                });

                if (betsPlaced[key].length == 0) {
                    bets.delete(message.author.id, key);
                    continue;
                }
            }

            break;

        case 'balance':
        case 'bal':
        case 'profile':

            if (!args[0]) {
                embed = new Discord.RichEmbed()
                    .setColor(0xFFD700)
                    .setTitle("Balance for user "+message.author.tag)
                    .setThumbnail(message.author.avatarURL)
                    .setFooter("nba help")
                    .setTimestamp()
                    .addField("Correct",client.points.get(message.author.id, "correct"), true)
                    .addField("Wrong",client.points.get(message.author.id, "wrong"), true)
                    .addField("Accuracy",Math.floor((client.points.get(message.author.id, "correct")/(client.points.get(message.author.id, "correct")+client.points.get(message.author.id, "wrong")))*100)+"%", true)
                    .addField("Total Points",client.points.get(message.author.id, "points"), true)
                    message.channel.send(embed);
            } else if (args[0]) {
                if (!message.mentions.users.first()) return message.channel.send(':x: Error: Please mention a valid user. E.g. `nba bal @chig#4519`.');
                let user = message.mentions.users.first() || client.users.get(args[0]);
                if (!client.points.has(user.id)) return message.channel.send(':x: Error: That user does not exist on my database, therefore that user has not betted before using NBABot.');

                embed = new Discord.RichEmbed()
                    .setColor(0xFFD700)
                    .setTitle("Balance for user "+client.users.get(user.id).tag)
                    .setThumbnail(client.users.get(user.id).avatarURL)
                    .setFooter("nba help")
                    .setTimestamp()
                    .addField("Correct",client.points.get(user.id, "correct"), true)
                    .addField("Wrong",client.points.get(user.id, "wrong"), true)
                    .addField("Accuracy",Math.floor((client.points.get(user.id, "correct")/(client.points.get(user.id, "correct")+client.points.get(user.id, "wrong")))*100)+"%", true)
                    .addField("Total Points",client.points.get(user.id, "points"), true)
                    message.channel.send(embed);
            }
            break;

        case 'leaderboard':
        case 'board':
        case 'top':
        case 'ranks':

            embed = new Discord.RichEmbed()
                .setColor(0xff4242)
                .setFooter("nba help")
                .setTimestamp();

            if (!args[0]) { // Server leaderboard

                let foundUsers = [];
                let guildIDs = [];

                message.guild.members.forEach(member => {
                    if (client.points.has(member.id)) guildIDs.push(member.id);
                });

                let sorted = client.points.array().filter(p => guildIDs.includes(p.id)).sort((a, b) => a.points - b.points).reverse().splice(0,10);

                embed.setTitle("The Top 10 of the server `"+message.guild.name+"`:");

                let counter = 1;
                for (const data of sorted) {
                    embed.addField(counter+". "+client.users.get(data.id).tag,"  "+data.points+" points ("+(Math.floor((client.points.get(data.id, "correct")/(client.points.get(data.id, "correct")+client.points.get(data.id, "wrong")))*100)+"%")+" accuracy)");
                    counter++;
                }

                embed.addField("...","Type `nba leaderboard global` to view the global top 10.");
                message.channel.send(embed);

            } else if (args[0]) { // Global Leaderboard
                let sorted = client.points.array().sort((a, b) => a.points - b.points).reverse().splice(0,10);
                console.log(sorted);
                embed.setTitle("The Global Top 10:");
                for (var i=0;i<sorted.length;i++) {
                    // if (client.users.get(sorted[i].id)) rDescription += "\n- "+client.users.get(sorted[i].id).tag+"\n+ "+sorted[i].points+" credits";
                    if (client.users.get(sorted[i].id)) embed.addField((i+1)+". "+client.users.get(sorted[i].id).tag,client.points.get(sorted[i].id, "points")+" points ("+(Math.floor((client.points.get(sorted[i].id, "correct")/(client.points.get(sorted[i].id, "correct")+client.points.get(sorted[i].id, "wrong")))*100)+"%")+" accuracy)");
                }
                message.channel.send(embed);
            }
            break;

        case 'betting-help':
            embed = new Discord.RichEmbed()
                .setColor(0xff4242)
                .setTitle("Betting Help")
                .setFooter("nba help")
                .setTimestamp()
                .addField("nba betting-help","Shows you this message.")
                .addField("nba betting-scores","Shows you the `nba scores` command but crosses out all games which haven't started.")
                .addField("nba bet TEAM","If that team hasn't played today, you will bet on that team. If that team wins, you gain a point and if it doesn't, you don't gain any points.")
                .addField("nba placedbets","Shows you your unclaimed bets.")
                .addField("nba claim","Claims your unclaimed rewards. Unfortunately I cannot make this process automatic as it would be an intensive task for the bot.")
                .addField("nba bal","Shows you your points as well as your accuracy.")
                .addField("nba bal @user#1234","Shows the balance for that user.")
                .addField("nba board","Shows the leaderboard for the server which you are currently in.")
                .addField("nba board global","Shows the global leaderboard.")
                message.channel.send(embed);
            break;

        case 'betting-scores':

            me = await message.channel.send(":timer: Loading...");

            embed = new Discord.RichEmbed()
                .setTitle("Games available to bet on:")
                .setColor(0xff4242)
                .setFooter("nba help")
                .setTimestamp();

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/scoreboard.json",
                json: true
            }, (e, r, b) => {
                for (var i = 0; i < b.games.length; i++) {

                    let str = "";
                    let str2 = "";

                    if (b.games[i].statusNum == 2) str += ":red_circle: ";

                    if (b.games[i].statusNum == 3) {
                        if (parseInt(b.games[i].hTeam.score) > parseInt(b.games[i].vTeam.score)) { // hTeam won
                            str += "~~"+b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - **" + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode + "**~~";
                        } else if (parseInt(b.games[i].vTeam.score) > parseInt(b.games[i].hTeam.score)) { // vTeam won
                            str += "~~**" + b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + "** - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode+"~~";
                        }
                    } else if (b.games[i].statusNum == 2) {
                        str += "~~"+b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode+"~~";
                    } else if (b.games[i].statusNum == 1) {
                        str += b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode;
                    }

                    if (b.games[i].statusNum == 1) {
                        if (new Date(b.games[i].startTimeUTC).getTime() - new Date().getTime() < 0) {
                            str2 += "Starting soon"
                        } else {
                            str2 += "Starts in `" + msToTime(new Date(b.games[i].startTimeUTC).getTime() - new Date().getTime()) + "`";
                        }
                    } else if (b.games[i].statusNum == 2) {
                        str += " | Q" + b.games[i].period.current + " " + b.games[i].clock;
                    } else {
                        str += " | FINAL";
                    }
                    if (!b.games[i].nugget.text && str2 == "") {
                        str2 = "...";
                    } else if (b.games[i].nugget.text) {
                        str2 += "\n" + b.games[i].nugget.text;
                    }
                    try {
                        embed.addField(str, str2);

                    } catch (e) {
                        continue;
                    }
                }
                me.edit(embed);
            });

            break;

        /* Server-specific configurations
        case 'prefix':
            if (!args[0]) {
                embed = new Discord.RichEmbed()
                    .setColor(0x3498DB)
                    .setFooter("nba help")
                    .setTimestamp()
                    .setTitle(`The prefix for this server, ${message.guild.name}, is "${serverList.get(message.guild.id, "prefix")}"`)
                    message.channel.send(embed);
            }
            break; */

    }

    if (sendEmbed) {
        let embed = new Discord.RichEmbed()
            .setTitle(eTitle)
            .setColor(0xff4242)
            .setDescription(eDescription)
            .setFooter("nba help")
            .setImage(eImage)
            .setThumbnail(eThumbnail)
            .setTimestamp();
        message.channel.send(embed);
    }
});

client.on('error', console.error);

client.on("guildCreate", g => {
    console.log("[JOINED] " + g.name + ", " + g.members.size + " members.");
    client.users.get("401649168948396032").send("[JOINED] " + g.name + ", " + g.members.size + " members.");
    if (g.channels.find(c => c.name == "general")) g.channels.find(c => c.name == "general").send("**Thank you for adding me to your server! Check out https://nbabot.js.org for the available commands.**");
});

client.on("guildDelete", g => {
    console.log("[LEFT] " + g.name + ", " + g.members.size + " members.");
    client.users.get("401649168948396032").send("[LEFT] " + g.name + ", " + g.members.size + " members.");
});

setInterval(() => {
    request({
        uri: "http://data.nba.net/10s/prod/v1/today.json",
        json: true
    }, (e, r, b) => {
        currentDate = b.links.currentDate;
    });

    if (clientReady) {
        Boats.postStats(client.guilds.size, "544017840760422417");
        dbl.postStats(client.guilds.size);
    }

}, 60000);

setInterval(() => {
    request({
        uri: "http://data.nba.net/10s/prod/v1/today.json",
        json: true
    }, (e, r, b) => {
        seasonScheduleYear = b.seasonScheduleYear;
    });
}, 86400000);

setInterval(() => {
    client.user.setActivity("nba help | nbabot.js.org | " + client.guilds.size + " servers, thanks for 250! :)", {
        type: "PLAYING"
    });
}, 60000);

client.login(secrets.token);
