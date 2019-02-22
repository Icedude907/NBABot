// Libraries
const Discord = require('discord.js');
const request = require('request');
const Enmap = require('enmap');

// JSON Files
const secrets = require('./secrets.json');

// Client
const client = new Discord.Client();

// Prefix
const prefix = "nba ";

let currentScoreboard;

// Favourites enmap
let favourites = new Enmap({name:'favourites'});
 
// Getting team triCodes
let triCodes = [];
request({
    uri:'http://data.nba.net/10s/prod/v2/2018/teams.json',
    json: true
}, (e,r,b) => {
    let teams = b.league.vegas;
    for (var i=0;i<teams.length;i++) {
        triCodes.push(teams[i].tricode);
    }
});

// Getting team nicknames
let nicknames = [];
request({
    uri:'http://data.nba.net/10s/prod/v2/2018/teams.json',
    json: true
}, (e,r,b) => {
    let teams = b.league.vegas;
    for (var i=0;i<teams.length;i++) {
        triCodes.push(teams[i].nickname);
    }
});

function msToTime(e){parseInt(e%1e3/100);var n=parseInt(e/1e3%60),r=parseInt(e/6e4%60),s=parseInt(e/36e5%24),t=parseInt(e/864e5%7);return(t=t<10?"0"+t:t)+"d:"+(s=s<10?"0"+s:s)+"h:"+(r=r<10?"0"+r:r)+"m:"+(n=n<10?"0"+n:n)+"s."}

client.once('ready', () => {
    console.log(client.user.tag+" is ready!");
    client.user.setActivity('nba help', {type: 'LISTENING'});
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    let sendEmbed = false,
      eTitle = "",
      eDescription = "",
      eThumbnail = "",
      eImage = "",
      user,
      me;

    switch(command) {
        
        case 'help':
            sendEmbed = true;
            eTitle = "Help";
            eDescription = "These are the command that you can use:\n```help ping uptime scores player-info player-stats```\nTo view detailed usage, visit [eliotchignell.github.io/NBABot](https://eliotchignell.github.io/NBABot)";
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

        case 'scores':

            sendEmbed = false;

            me = await message.channel.send('Loading information...');

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
                    str += b.games[i].vTeam.triCode+" "+b.games[i].vTeam.score+" - "+b.games[i].hTeam.score+" "+b.games[i].hTeam.triCode;
                    if (b.games[i].statusNum == 1) {
                        str2 += "Starts in "+msToTime(new Date(b.games[i].startTimeUTC).getTime()-new Date().getTime());
                    } else if (b.games[i].statusNum == 2) {
                        str += " | Q"+b.games[i].period.current+" "+b.games[i].clock;
                    } else {
                        str += ", FINAL";
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
            request({
            	uri:'http://data.nba.net/10s/prod/v1/2018/players.json',
            	json: true
            }, (e,r,b) => {
            	for (var i=0;i<b.league.standard.length;i++) {
            		if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
            			console.log("Player found.");
            			let embed = new Discord.RichEmbed()
     			            .setTitle("Basic Information on the player `"+b.league.standard[i].firstName+" "+b.league.standard[i].lastName+"`:")
     			            .setAuthor("NBABot",client.user.displayAvatarURL)
     			            .setColor(0xff4242)
     			            .setDescription("Jersey Number: `"+b.league.standard[i].jersey+"`\nPosition: `"+b.league.standard[i].pos+"`\nHeight: `"+b.league.standard[i].heightFeet+"'"+b.league.standard[i].heightInches+'" ('+b.league.standard[i].heightMeters+"m)`\nWeight: `"+b.league.standard[i].weightKilograms+"kg`")
     			            .setFooter("nba [command]")
     			            .setTimestamp();
     			            return message.channel.send(embed);
            			
            			break;
            		}
           		}
            });
        	break;

        case 'player-stats':
        	if (!args[0] || !args[1]) return message.channel.send("Please specifiy a player, e.g. `nba player-stats lebron james`");
        	request({
        		uri:'http://data.nba.net/10s/prod/v1/2018/players.json',
        		json: true
        	}, (e,r,b) => {
        		
        		for (var i=0;i<b.league.standard.length;i++) {
        			if (b.league.standard[i].firstName.toLowerCase() == args[0].toLowerCase() && b.league.standard[i].lastName.toLowerCase() == args[1].toLowerCase()) {
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
	    			            .setDescription("PPG: `"+player.ppg+"`\nAPG: `"+player.apg+"`\nRPG: `"+player.rpg+"`\nMPG: `"+player.mpg+"`\nTOPG: `"+player.topg+"`\nSPG: `"+player.spg+"`")
	    			            .setFooter("nba [command]")
	    			            .setTimestamp();
	    			            message.channel.send(embed);
	           	
        				});
        			}
        		}
        	})
        	break;

        case 'favourite':
            if (!args[0]) {
                sendEmbed = true;
                eTitle = "Favourite Team";
                eDescription = "Please specifiy a team, e.g. `nba favourite suns`\nOnce you favourite a team, you will recieve DMs with the results of your favourite team's latest game.\nType `nba favourite cancel` to cancel.\nAvailable teams: ```"+triCodes.join(' ')+"```";
                if (favourites.get(message.author.id)) eDescription += "Your current favourite team: `"+favourites.get(message.author.id)+"`";
            } else if (args[0] && args[0].toLowerCase() != "cancel") {
                if (!triCodes.includes(args[0].toUpperCase())) return message.channel.send("Please specify a valid team!");
                favourites.set(message.author.id, args[0].toUpperCase());
                sendEmbed = true;
                eTitle = "Favourite Team";
                eDescription = "Well Done!\nYou favourited the team `"+args[0].toUpperCase()+"`\nOnce you favourite a team, you will recieve DMs with the results of your favourite team's latest game.\nType `nba favourite cancel` to cancel.";
            } else if (args[0].toLowerCase() == "cancel") {
                favourites.delete(message.author.id);
                sendEmbed = true;
                eTitle = "Favourite Team";
                eDescription = "You cancelled your favourite team.";
            }
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
client.login(secrets.token);