// Libraries
const Discord = require('discord.js');
const request = require('request-promise');
const Enmap = require('enmap');
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
const botStats = new Enmap({
    name: "botStats"
});

let clientReady = false;

let currentScoreboard,
    currentDate,
    seasonScheduleYear,
    players = {},
    teams = {},
    jerseyNumbers = {};

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
                if (b.league.standard[i].isNBAFranchise) teams[b.league.standard[i].teamId] = b.league.standard[i];
            }
        });
    });

    request({
        uri: "http://data.nba.net/10s/prod/v1/today.json",
        json: true
    }, (e, r, b) => {
        currentDate = b.links.currentDate;
    });

    client.user.setActivity('nba help | nbabot.js.org', {
        type: 'LISTENING'
    });
});

client.on('message', async message => {

    if (message.content.split(' ')[0].toLowerCase() != "nba" || message.author.bot) return;

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

            embed = new Discord.RichEmbed()
                .setTitle("Stats on NBABot:")
                .setAuthor("NBABot", client.user.displayAvatarURL)
                .setColor(0xff4242)
                .setFooter("nba [command]")
                .setTimestamp()
                .addField("NBA Commands", "`scores player-info player-stats boxscore teams standings roster`")
                .addField("Other Commands", "`help ping uptime invite vote github bot-stats`")
                .setDescription("To view detailed usage, visit [nbabot.js.org](https://nbabot.js.org/)")
            message.channel.send(embed);
            // sendEmbed = true;
            // eTitle = "Help";
            // eDescription = "```prolog\nNormal Commands\n'nba help' 'nba ping' 'nba uptime' 'nba invite' 'nba vote' 'nba github'\nNBA Commands\n'nba scores' - displays the scores for today.\n'nba player-info [player name]' - displays basic information about that player.\n'nba player-stats [player name]' - displays stats on that user (ppg, trb, apg, etc).\n'nba boxscore [team]' - displays the boxscore for that team.\n'nba teams' - displays the teams, more specifically the codes which I use for this bot, nicknames are coming soon.\n'nba standings' - displays the league-wide standings.\n'nba standings west' - displays the standings for the western conference.\n'nba standings east' - displays the standings for the eastern conference.```";
            // eDescription = "These are the command that you can use:\n```prolog\nNormal Commands\nhelp ping uptime invite vote github\nNBA Commands\nscores player-info player-stats boxscore teams standings```\nTo view detailed usage, visit [nbabot.js.org](https://nbabot.js.org)\nFeel free to vote for this bot so other people hear about it [here](https://discordbots.org/bot/544017840760422417/vote).";
            // eDescription = "**NBA Commands**:\n`scores player-info player-stats boxscore teams standings`\n\n**Other Commands**:\n`help ping uptime invite vote github bot-stats`\n_To view detailed usage, visit [nbabot.js.org](https://nbabot.js.org/)._";
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

        case 'github':
            message.channel.send("**https://github.com/EliotChignell/NBABot**");
            break;

        case 'bot-stats':
            embed = new Discord.RichEmbed()
                .setTitle("Stats on NBABot:")
                .setAuthor("NBABot", client.user.displayAvatarURL)
                .setColor(0xff4242)
                .setFooter("nba [command]")
                .setTimestamp()
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

        case 'scores':

            me = await message.channel.send('Loading scores...');

            embed = new Discord.RichEmbed()
                .setTitle("Scores for today:")
                .setAuthor("NBABot", client.user.displayAvatarURL)
                .setColor(0xff4242)
                .setFooter("nba [command]")
                .setTimestamp();

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/scoreboard.json",
                json: true
            }, (e, r, b) => {
                for (var i = 0; i < b.games.length; i++) {

                    let str = "";
                    let str2 = "";
                    if (b.games[i].statusNum == 2) str += ":red_circle: ";
                    str += b.games[i].vTeam.triCode + " " + b.games[i].vTeam.score + " - " + b.games[i].hTeam.score + " " + b.games[i].hTeam.triCode;
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
                    // console.log(str, str2);
                    try {
                        embed.addField(str, str2);

                    } catch (e) {
                        continue;
                    }
                    // if (str != "" && str2 != "") embed.addField(str, str2);

                }
                me.edit(embed);
            });

            break;

        case 'player-info':
            if (!args[0] || !args[1] || args[0].split('').includes("[") || args[1].split('').includes("]")) return message.channel.send("Please specifiy a player, e.g. `nba player-info lebron james`");
            playerFound = false;
            me = await message.channel.send("Loading...");

            request({
                uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players.json',
                json: true
            }, (e, r, b) => {
                for (var i = 0; i < b.league.standard.length; i++) {
                    if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
                        playerFound = true;
                        let draftStr = "#" + b.league.standard[i].draft.pickNum + " (" + b.league.standard[i].draft.seasonYear + ")";
                        if (draftStr == "# ()") draftStr = "Undrafted";
                        let embed = new Discord.RichEmbed()
                            .setTitle("Basic Information on the player `" + b.league.standard[i].firstName + " " + b.league.standard[i].lastName + "`:")
                            .setAuthor("NBABot", client.user.displayAvatarURL)
                            .setColor(0xff4242)
                            // .setDescription("Jersey Number: `" + b.league.standard[i].jersey + "`\nPosition: `" + b.league.standard[i].pos + "`\nHeight: `" + b.league.standard[i].heightFeet + "'" + b.league.standard[i].heightInches + '" (' + b.league.standard[i].heightMeters + "m)`\nWeight: `" + b.league.standard[i].weightKilograms + "kg`\nDate of Birth: `" + b.league.standard[i].dateOfBirthUTC + "`\nDrafted: " + draftStr + "\n\n_Type `nba player-stats " + args[0] + " " + args[1] + "` to view stats on that player._")
                            .setFooter("nba [command]")
                            .setTimestamp()
                            .addField("Jersey Number", b.league.standard[i].jersey, true)
                            .addField("Position", b.league.standard[i].pos, true)
                            .addField("Height", b.league.standard[i].heightFeet + "'" + b.league.standard[i].heightInches + '" (' + b.league.standard[i].heightMeters + "m", true)
                            .addField("Weight", b.league.standard[i].weightKilograms, true)
                            .addField("Date of Birth", b.league.standard[i].dateOfBirthUTC, true)
                            .addField("Drafted", draftStr, true)
                            .addField("...", "Type `nba player-stats " + args.join(' ') + "` to view stats on that player.");

                        return me.edit(embed);

                        break;
                    }
                }
            }).then(() => {
                if (!playerFound) me.edit("Player not found.");
            });

            break;

        case 'player-stats':
            if (!args[0] || !args[1] || args[0].split('').includes("[") || args[1].split('').includes(']')) return message.channel.send("Please specifiy a player, e.g. `nba player-stats lebron james`");
            playerFound = false;
            me = await message.channel.send("Loading...");
            request({
                uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players.json',
                json: true
            }, (e, r, b) => {

                for (var i = 0; i < b.league.standard.length; i++) {
                    if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
                        playerFound = true;
                        let playerName = b.league.standard[i].firstName + " " + b.league.standard[i].lastName;

                        request({
                            uri: 'http://data.nba.net/10s/prod/v1/' + seasonScheduleYear + '/players/' + b.league.standard[i].personId + '_profile.json',
                            json: true
                        }, (e, r, b) => {
                            let player = b.league.standard.stats.latest;

                            let embed = new Discord.RichEmbed()
                                .setTitle("Stats on the player `" + playerName + "`:")
                                .setAuthor("NBABot", client.user.displayAvatarURL)
                                .setColor(0xff4242)
                                // .setDescription("PPG: `" + player.ppg + "`\nAPG: `" + player.apg + "`\nRPG: `" + player.rpg + "`\nMPG: `" + player.mpg + "`\nTOPG: `" + player.topg + "`\nSPG: `" + player.spg + "`\nFT%: `" + player.ftp + "%`\nFG%: `" + player.fgp + "%`\n+/-: `" + player.plusMinus + "`\n\n_Type `nba player-info " + args[0] + " " + args[1] + "` to view info on that player._")
                                .addField("PPG", player.ppg, true)
                                .addField("APG", player.apg, true)
                                .addField("RPG", player.rpg, true)
                                .addField("MPG", player.mpg, true)
                                .addField("TOPG", player.topg, true)
                                .addField("SPG", player.spg, true)
                                .addField("FT%", player.ftp, true)
                                .addField("FG%", player.fgp, true)
                                .addField("Total +/-", player.plusMinus, true)
                                .addField("...", "Type `nba player-info " + args.join(" ") + "` to view basic information on that player.")
                                .setFooter("nba [command]")
                                .setTimestamp();
                            return me.edit(embed);
                        });
                    }
                }
            }).then(() => {
                if (!playerFound) me.edit("Player not found.");
            });

            break;

            /*
            case 'predictions':

                me = await message.channel.send("Loading games...");

                embed = new Discord.RichEmbed()
                            .setTitle("Available games to predict:")
                            .setAuthor("NBABot",client.user.displayAvatarURL)
                            .setColor(0xff4242)
                            .setFooter("nba [command]")
                            .setTimestamp();
                
                request({
                    uri: "https://api.myjson.com/bins/k7xwk",
                    json: true
                }, (e,r,b) => {

                    let availableTeams = [];

                    for (var i=0;i<b.games.length;i++) {
                        let game = b.games[i];

                        if (game.statusNum == 1) {
                            embed.addField(game.vTeam.triCode+" @ "+game.hTeam.triCode,"Game starts in "+msToTime(new Date(game.startTimeUTC).getTime() - new Date().getTime())+".");
                            availableTeams.push(game.vTeam.triCode+"/"+game.hTeam.triCode);
                        }

                    }

                    if (availableTeams.length == 0) return me.edit("There are no games left to predict today.");

                    embed.addField("Enter this to predict today's games:","`nba predict "+availableTeams.join(' ')+"`");

                    me.edit(embed);
                });
                
                break;

            case 'predict':
                break;
            */

        case 'boxscore':

            me = await message.channel.send("Loading...");

            if (!args[0]) return me.edit("Please specify a team. E.g. `nba boxscore PHX`.");

            let gameFound = false;

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + currentDate + "/scoreboard.json",
                json: true
            }, (e, r, b) => {
                for (var i = 0; i < b.games.length; i++) {
                    let team, otherTeam, vTeam, hTeam, gameId, gameStartedAt;

                    gameId = b.games[i].gameId;
                    let randomDateObject = new Date(b.games[i].startTimeUTC);
                    gameStartedAt = randomDateObject.getFullYear()+"-"+(randomDateObject.getMonth()+1)+"-"+randomDateObject.getDate();

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
                            .setTitle(vTeam + " " + b.basicGameData.vTeam.score + " - " + b.basicGameData.hTeam.score + " " + hTeam + "\nGame Played on `"+gameStartedAt+"`")
                            .setAuthor("NBABot", client.user.displayAvatarURL)
                            .setColor(0xff4242)
                            .setFooter("nba [command]")
                            .setTimestamp();

                        if (team == "h") embed.setThumbnail(teamLogoURLs[hTeam]);
                        if (team == "v") embed.setThumbnail(teamLogoURLs[vTeam]);

                        // description = "";

                        // description += "\n```prolog\n";
                        let playerNames = "";
                        let playerStats = "";

                        for (var i = 0; i < b.stats.activePlayers.length; i++) {
                            if ((b.stats.activePlayers[i].teamId == vTeamId && team == "v") || (b.stats.activePlayers[i].teamId == hTeamId && team == "h")) {
                                if (players[b.stats.activePlayers[i].personId].split('').includes("'")) players[b.stats.activePlayers[i].personId] = players[b.stats.activePlayers[i].personId].replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
                                // if (b.stats.activePlayers[i].isOnCourt) description += b.stats.activePlayers[i].pos+" ";
                                // description += players[b.stats.activePlayers[i].personId].split(' ')[1] + ": " + b.stats.activePlayers[i].points + " pts, " + b.stats.activePlayers[i].totReb + " trb, " + b.stats.activePlayers[i].assists + " ast\n"
                                playerNames += players[b.stats.activePlayers[i].personId] + "\n";
                                playerStats += b.stats.activePlayers[i].points + " / " + b.stats.activePlayers[i].totReb + " / " + b.stats.activePlayers[i].assists + "\n";
                            }

                        }

                        embed.addField("Player", playerNames, true);
                        embed.addField("Pts/Trb/Ast", playerStats, true);

                        // description += "```";

                        // embed.setDescription(description);

                        me.edit(embed);

                    });

                }
            }).then(() => {
                if (!gameFound) return me.edit("That team aren't playing today or that team doesn't exist.");
            });

            break;


        case 'teams':

            me = await message.channel.send("Loading...");

            embed = new Discord.RichEmbed()
                .setTitle("Teams for the " + seasonScheduleYear + "/" + (parseInt(seasonScheduleYear) + 1) + " season:")
                .setAuthor("NBABot", client.user.displayAvatarURL)
                .setColor(0xff4242)
                .setFooter("nba [command]")
                .setTimestamp();

            let cDescription = "";
            for (var key in teams) {
                cDescription += "`" + teams[key].tricode + "` ";
            }
            embed.setDescription(cDescription);
            me.edit(embed);

            break;

        case 'standings':

            me = await message.channel.send("Loading...");

            if (!args[0]) {
                // League Standings
                request({
                    uri: "http://data.nba.net/10s/prod/v1/current/standings_all_no_sort_keys.json",
                    json: true
                }, (e, r, b) => {
                    embed = new Discord.RichEmbed()
                        .setTitle("League Standings:")
                        .setAuthor("NBABot", client.user.displayAvatarURL)
                        .setColor(0xff4242)
                        .setFooter("nba [command]")
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
                        .setAuthor("NBABot", client.user.displayAvatarURL)
                        .setColor(0xff4242)
                        .setFooter("nba [command]")
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
                        .setAuthor("NBABot", client.user.displayAvatarURL)
                        .setColor(0xff4242)
                        .setFooter("nba [command]")
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

            me = await message.channel.send("Loading...");

            if (!args[0] || !swap(teams)[args[0].toUpperCase()]) return me.edit("Please specify a team. E.g. `nba roster PHX`.");

            let teamIdd = swap(teams)[args[0].toUpperCase()];

            request({
                uri: "http://data.nba.net/10s/prod/v1/" + seasonScheduleYear + "/teams/" + teamIdd + "/roster.json",
                json: true
            }, (e, r, b) => {
                embed = new Discord.RichEmbed()
                    .setTitle("Roster for the " + (seasonScheduleYear + "-" + (parseInt(seasonScheduleYear) + 1)) + " team of " + args[0].toUpperCase() + ":")
                    .setAuthor("NBABot", client.user.displayAvatarURL)
                    .setColor(0xff4242)
                    .setFooter("nba [command]")
                    .setThumbnail(teamLogoURLs[teams[teamIdd].tricode])
                    .setTimestamp();
                eDescription = "`";
                let playerNumbers = "";
                let playerNamez = "";

                for (var i = 0; i < b.league.standard.players.length; i++) {
                    playerNamez += players[b.league.standard.players[i].personId] + "\n";
                    playerNumbers += jerseyNumbers[b.league.standard.players[i].personId] + "\n";
                }

                eDescription += "`";
                // embed.setDescription(eDescription);
                embed.addField("Number",playerNumbers, true);
                embed.addField("Name",playerNamez, true);
                me.edit(embed);
            });

            break;



    }

    if (sendEmbed) {
        let embed = new Discord.RichEmbed()
            .setTitle(eTitle)
            .setAuthor("NBABot", client.user.displayAvatarURL)
            .setColor(0xff4242)
            .setDescription(eDescription)
            .setFooter("nba [command]")
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
    g.channels.find(c => c.name == "general").send("**Thank you for adding me to your server! Check out https://nbabot.js.org for the available commands.**");
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

    Boats.postStats(client.guilds.size, "544017840760422417");
    dbl.postStats(client.guilds.size);
}, 60000);

setInterval(() => {
    request({
        uri: "http://data.nba.net/10s/prod/v1/today.json",
        json: true
    }, (e, r, b) => {
        seasonScheduleYear = b.seasonScheduleYear;
    });
}, 86400000);

client.login(secrets.token);