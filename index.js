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
      user;

    switch(command) {
        
        case 'help':
            sendEmbed = true;
            eTitle = "Help";
            eDescription = "These are the command that you can use:\n```help ping scores```";
            break;
        
        case 'ping':
            const m = await message.channel.send("Ping?");
            m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);  
            break;

        case 'scores':

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
                    str += b.games[i].vTeam.triCode+" "+b.games[i].vTeam.score+" - "+b.games[i].hTeam.score+" "+b.games[i].hTeam.triCode;
                    if (b.games[i].statusNum == 1) {
                        str += ", Starts at "+resp.games[i].startTimeEastern;
                    } else if (b.games[i].statusNum == 2) {
                        str += ", Q"+resp.games[i].period.current+" "+resp.games[i].clock;
                    } else {
                        str += ", FINAL";
                    }
                    console.log(str);
                    embed.addField(str, b.games[i].nugget.text);
                    
                }
                message.channel.send(embed);
            });
            
            
            break;

        default:
            sendEmbed = true;
            eTitle = "Invalid Command";
            eDescription = "Type `nba help` to find out the available commands.";
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

client.login(secrets.token);