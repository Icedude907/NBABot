// Libraries
const Discord = require('discord.js');
const request = require('request-promise');
const Enmap = require('enmap');
const DiscordBotList = require('dblapi.js');

// JSON Files
const secrets = require('./secrets.json');

// Client
const client = new Discord.Client();

const dbl = new DiscordBotList(secrets.dbl);

// Prefix
const prefix = "nba ";

// Enmaps
const botStats = new Enmap({name: "botStats"});

let clientReady = false;

let currentScoreboard;

function msToTime(e){parseInt(e%1e3/100);var n=parseInt(e/1e3%60),r=parseInt(e/6e4%60),s=parseInt(e/36e5%24),t=parseInt(e/864e5%7);return(t=t<10?"0"+t:t)+"d:"+(s=s<10?"0"+s:s)+"h:"+(r=r<10?"0"+r:r)+"m:"+(n=n<10?"0"+n:n)+"s."}

client.once('ready', () => {
    console.log(client.user.tag+" is ready!");
    clientReady = true;
    client.user.setActivity('nba help | Serving '+client.users.size+' users among '+client.guilds.size+' servers. | chig.js.org/NBABot', {type: 'LISTENING'});
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

	// Logging
    console.log('('+message.author.tag+') '+message.content);

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    let sendEmbed = false,
      eTitle = "",
      eDescription = "",
      eThumbnail = "",
      eImage = "",
      user,
      me,
      playerFound;

    switch(command) {
        
        case 'help':
        case 'commands':
            sendEmbed = true;
            eTitle = "Help";
            eDescription = "These are the command that you can use:\n```help ping uptime scores player-info player-stats```\nTo view detailed usage, visit [chig.js.org/NBABot](https://chig.js.org/NBABot)\nFeel free to vote for this bot so other people hear about it [here](https://discordbots.org/bot/544017840760422417/vote).";
            break;
        
        case 'ping':
            const m = await message.channel.send("Ping?");
            m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);  
            break;

        case "uptime":
            sendEmbed = true;
            eTitle = "Uptime";
            eDescription = "This session of NBABot has been online for\n```"+msToTime(client.uptime)+"```";
            break;

        case 'eval':
        	if (message.author.id == 401649168948396032) message.channel.send("```"+eval(args.join(' '))+"```");
        	break;

        case 'servers':
        	if (message.author.id == 401649168948396032) {
        		let strServers = '```';
        		client.guilds.forEach(g => {
        			strServers += g.name+", "+g.members.size+"\n";
        		});
        		strServers += "```";
        		message.author.send(strServers);
        	}
        	break;

        case 'scores':

            sendEmbed = false;

            me = await message.channel.send('Loading scores...');

            embed = new Discord.RichEmbed()
                        .setTitle("Scores for today:")
                        .setAuthor("NBABot",client.user.displayAvatarURL)
                        .setColor(0xff4242)
                        .setFooter("nba [command]")
                        .setTimestamp();

            request({
                uri: "https://api.myjson.com/bins/k7xwk",
                json: true
            }, (e,r,b) => {
                for (var i=0;i<b.games.length;i++) {
                    
                    let str = "";
                    let str2 = "";
                    if (b.games[i].statusNum == 2) str += ":red_circle: ";
                    str += b.games[i].vTeam.triCode+" "+b.games[i].vTeam.score+" - "+b.games[i].hTeam.score+" "+b.games[i].hTeam.triCode;
                    if (b.games[i].statusNum == 1) {
                    	if (new Date(b.games[i].startTimeUTC).getTime()-new Date().getTime() < 0) {
                    		str2 += "Starting soon"
                    	} else {
                    		str2 += "Starts in "+msToTime(new Date(b.games[i].startTimeUTC).getTime()-new Date().getTime());
                    	}
                    } else if (b.games[i].statusNum == 2) {
                        str += " | Q"+b.games[i].period.current+" "+b.games[i].clock;
                    } else {
                        str += " | FINAL";
                    }
                    if (!b.games[i].nugget.text && str2 == "") str2 = "...";
                    if (b.games[i].nugget.text) str2 = b.games[i].nugget.text;
                    embed.addField(str, str2);
                    
                }
                me.edit(embed);
            });
            
            break;

        case 'player-info':
            if (!args[0] || !args[1]) return message.channel.send("Please specifiy a player, e.g. `nba player-info lebron james`");
            playerFound = false;
            me = await message.channel.send("Loading...");

            request({
            	uri:'http://data.nba.net/10s/prod/v1/2018/players.json',
            	json: true
            }, (e,r,b) => {
            	for (var i=0;i<b.league.standard.length;i++) {
            		if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
                        playerFound = true;
                        let draftStr = "`#"+b.league.standard[i].draft.pickNum+" ("+b.league.standard[i].draft.seasonYear+")`";
                        if (draftStr == "`# ()`") draftStr = "`Undrafted`";
            			let embed = new Discord.RichEmbed()
     			            .setTitle("Basic Information on the player `"+b.league.standard[i].firstName+" "+b.league.standard[i].lastName+"`:")
     			            .setAuthor("NBABot",client.user.displayAvatarURL)
     			            .setColor(0xff4242)
     			            .setDescription("Jersey Number: `"+b.league.standard[i].jersey+"`\nPosition: `"+b.league.standard[i].pos+"`\nHeight: `"+b.league.standard[i].heightFeet+"'"+b.league.standard[i].heightInches+'" ('+b.league.standard[i].heightMeters+"m)`\nWeight: `"+b.league.standard[i].weightKilograms+"kg`\nDate of Birth: `"+b.league.standard[i].dateOfBirthUTC+"`\nDrafted: "+draftStr+"\n\n_Type `nba player-stats "+args[0]+" "+args[1]+"` to view stats on that player._")
     			            .setFooter("nba [command]")
     			            .setTimestamp();
     			            return me.edit(embed);
            			
            			break;
            		}
           		}
            }).then(() => {
                if (!playerFound) me.edit("Player not found.");
            });

        	break;

        case 'player-stats':
            if (!args[0] || !args[1]) return message.channel.send("Please specifiy a player, e.g. `nba player-stats lebron james`");
            playerFound = false;
        	me = await message.channel.send("Loading...");
        	request({
        		uri:'http://data.nba.net/10s/prod/v1/2018/players.json',
        		json: true
        	}, (e,r,b) => {
        		
        		for (var i=0;i<b.league.standard.length;i++) {
        			if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
                        playerFound = true;
        				let playerName = b.league.standard[i].firstName+" "+b.league.standard[i].lastName;
        				
        				request({
        					uri: 'http://data.nba.net/10s/prod/v1/2018/players/'+b.league.standard[i].personId+'_profile.json',
        					json: true
        				}, (e,r,b) => {
        					let player = b.league.standard.stats.latest;
        					
        					let embed = new Discord.RichEmbed()
	    			            .setTitle("Stats on the player `"+playerName+"`:")
	    			            .setAuthor("NBABot",client.user.displayAvatarURL)
	    			            .setColor(0xff4242)
	    			            .setDescription("PPG: `"+player.ppg+"`\nAPG: `"+player.apg+"`\nRPG: `"+player.rpg+"`\nMPG: `"+player.mpg+"`\nTOPG: `"+player.topg+"`\nSPG: `"+player.spg+"`\nFT%: `"+player.ftp+"%`\nFG%: `"+player.fgp+"%`\n+/-: `"+player.plusMinus+"`\n\n_Type `nba player-info "+args[0]+" "+args[1]+"` to view info on that player._")
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

                embed.addField("Enter this to predict today's games:","nba predict "+availableTeams.join(' '));

                me.edit(embed);
            });
            
            break;

        case 'predict':
            break;
        
        

    }

    if (sendEmbed) {
        let embed = new Discord.RichEmbed()
            .setTitle(eTitle)
            .setAuthor("NBABot",client.user.displayAvatarURL)
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

setInterval(() => {
    if (clientReady) client.user.setActivity('nba help | Serving '+client.users.size+' users among '+client.guilds.size+' servers. | chig.js.org/NBABot', {type: 'LISTENING'});
    dbl.postStats(client.guilds.size);
}, 30000);

client.login(secrets.token);
