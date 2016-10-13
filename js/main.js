var serverUrl = "http://" + serverIp + ":" + serverPort;
var socket = io.connect(serverUrl);
var username = 'skillsalfa';
var stats = {status: false, skillsalfa: 0, bot: 0};
var myId = '';

var lati = '0';
var longi = '0';
var lid = '0';
var profiles = {};
var myProfObject = {}

function initGeolocation() {
    if( navigator.geolocation ) {
        navigator.geolocation.getCurrentPosition( success, fail );
        
    }
}

function success(position) {
    longi = String(position.coords.longitude);
    lati = String(position.coords.latitude);
    sendGetProfiles();
}

function fail() {
    sendGetProfiles();
}

function sendGetProfiles() {
    if($('section').hasClass('hide')) {
        $('#selectProfile').openModal();
        socket.emit('get_profile');
    }
}

function addMsg(msgText, owner) {
    var bubbleName = '<span class="blue-text" style="float:right"><b>Bot: </b></span><br>';
    if (owner == 'me') {
        bubbleName = '<span class="green-text"><b>' + myProfObject.name + ': </b></span><br>'
    }
    var msgHtml = '<div class="bubble ' + owner + '">' + bubbleName + '<span>' + msgText + '</span></div><div class="clear"></div>';
    $(".messages_window").append(msgHtml)
    var scrollDiv = $('.messages_window');
    scrollDiv.scrollTop(scrollDiv.prop("scrollHeight"));
}

function changeStats(stats) {
    var status = stats.status;
    if (status == true) {
        $('.com-status').removeClass('red');
        $('.com-status').addClass('green');
    } else {
        $('.com-status').removeClass('green');
        $('.com-status').addClass('red');
    }
}

function searchInProfiles(lid) {
    var randCA = ['cyan-text text-accent-2', 'green-text text-accent-2', 'purple-text text-accent-2',];
    var rand = randCA[Math.floor(Math.random() * randCA.length)];
    for (var key in profiles) {
        if (profiles.hasOwnProperty(key)) {
            var profObject = profiles[key];
            if (profObject.lid === lid) {
                myProfObject = profObject;
                $('.profileName').html('<b>' + profObject.name + '</b>');
                $('.profileRole').html('<h6>(' + profObject.role + ')</h6>');
                $('.profile_identity').addClass(rand);
                var skillsObj = profObject.skill_set;
                for (var keySkillObj in skillsObj) {
                    if (skillsObj.hasOwnProperty(keySkillObj)) {
                        skillHtm = '<div class="col s9" style="text-align: left; padding-left: 5px;"><i>' + skillsObj[keySkillObj].skill_name + '</i>: </div><div class="col s3" style="padding-left: 0px;">' + skillsObj[keySkillObj].percentage + '% </div>'
                        $('.profileSkills').append(skillHtm);
                    }
                }
            }
        }
    }
}

socket.on('connect', function(){
    socket.emit('authenticate', {token: username});
});

socket.on('resp_message', function(data) {
    var lidSelected = $(".messages_window").attr("learner");
    if (lidSelected == data.lid) {
        var msgHtml = '<div class="row typing" style="float:right; clear:both; padding-right:20px;"><img src="image/typing.gif"></div>';
        $(".messages_window").append(msgHtml);
        var scrollDiv = $('.messages_window');
        scrollDiv.scrollTop(scrollDiv.prop("scrollHeight"));
        setTimeout(function(){
            $(".typing").remove();
            addMsg(data.chat_text, 'you');
        }, 1000);
    }
});

function liProfiles(lid, title, role, skills) {
    var liProfiles = '<li lid="' + lid + '" class="collection-item avatar selectProfile">' +
        '<i class="large material-icons circle gray">perm_identity</i>' +
        '<span class="title">' + title + '</span><br>' +
        '<span class="title">Role: ' + role + '</span><br>'
        if (skills !== '' && skills.length > 1) {
            if (skills.charAt(skills.length - 2) == ',') {
                skills = skills.substr(0, skills.length - 2);
            }
            liProfiles = liProfiles + '<span class="title">(' + skills + ')</span><br>';
        }
        liProfiles = liProfiles + '<a href="javascript:void(0)" class="selectProfileIcon"><i class="material-icons">done</i></a>' +
    '</li>';
    return liProfiles;
}

socket.on('save_profile', function(data) {
    var lis = ''
    profiles = data;
    for (var key in profiles) {
        if (profiles.hasOwnProperty(key)) {
            var profObject = profiles[key];
            var skillsObj = profObject.skill_set;
            var skills = '';
            for (var keySkillObj in skillsObj) {
                if (skillsObj.hasOwnProperty(keySkillObj)) {
                    skills = skills + skillsObj[keySkillObj].skill_name + ', ';
                }
            }
            lis = lis + liProfiles(profObject.lid, profObject.name, profObject.role, skills);
        }
    }
    $('.selectProfileUl').html(lis);
});

//socket.on('disconnect', function(msg) { //disconnect event
//    if (msg == "io server disconnect") {
//        Materialize.toast('Not authorized, only one login at a time. You are online from somewhere else. !!!', 3000, 'rounded red')
//    }
//    stats = {status: false, skillsalfa: 0, bot: 0};
//    changeStats(stats);
//});

socket.on('disc_count', function(data) { //connected event
    stats = data.stats;
    changeStats(stats);
});

socket.on('got_history', function(data) { //connected event
    var chat_msg = data.chat_msg;
    for (var key in chat_msg) {
        if (chat_msg.hasOwnProperty(key)) {
            var chatObj = chat_msg[key];
            for (var keyObj in chatObj) {
                if (chatObj.hasOwnProperty(keyObj)) {
                    if (keyObj == "bot") {
                        addMsg(chatObj[keyObj], 'you');
                    } else {
                        addMsg(chatObj[keyObj], 'me');
                    }
                }
            }
        }
    }
    socket.emit('welcome', {latitude: lati, longitude: longi, lid:lid});
});

socket.on('cli_connected', function(data) { //connected event
    stats = data.stats;
    changeStats(stats);
});

socket.on('ur_id', function(data) { //connected event
    stats = data.stats;
    changeStats(stats);
    myId = data.conId;
});

socket.on('receipt_message', function(data) { //connected event
    var lidSelected = $(".messages_window").attr("learner");
    if (lidSelected == data.lid) {
        addMsg(data.chat_text, 'me');
    }
});

$( document ).ready(function() {
    
    $(document).on('click', '.selectProfile', function(){
        lid = $(this).attr('lid');
        $(".messages_window").attr("learner", lid);
        $('#selectProfile').closeModal();
        $('section').removeClass('hide');
        $('.wrapper').removeClass('hide');
        //if (lati !== '0' && longi !== '0') {
        //    socket.emit('get_history', {lid: lid});
        //    //socket.emit('welcome', {latitude: lati, longitude: longi, lid:lid});
        //}
        socket.emit('get_history', {lid: lid});
        searchInProfiles(lid);
    });
    
    $(document).on('mouseenter', '.selectProfile', function() {
        $( this ).children('i').removeClass('gray').addClass('green');
        $( this ).children('.selectProfileIcon').css('color', 'green');
    });
    
    $(document).on('mouseleave', '.selectProfile', function() {
        $( this ).children('i').removeClass('green').addClass('gray');
        $( this ).children('.selectProfileIcon').css('color', '#ccc');
    });
    
    function sendChat() {
        var chatMsg = $("#chatBox").val();
        if (stats.status === true) {
            if (chatMsg.trim() !== '') {
                var dataTosSend = {'chat_text': chatMsg, latitude: lati, longitude: longi, lid: lid};
                socket.emit('message', dataTosSend);
                $("#chatBox").val('');
                //$('#chatBox').siblings('label').removeClass('active');
            }
        } else {
            Materialize.toast('Communication status is offline!!!', 3000, 'rounded red')
        }
    }
    $('#chatBox').keypress(function(event) {
        var keycode = event.keyCode || event.which;
        if(keycode == '13') {
            sendChat();
        }
    });
    $('.sendChat').click(function() {
        sendChat();
    });
});