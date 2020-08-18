// COOKIES/TOKEN //
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function get_token() {
    return getCookie("AoPSCoin") //Get their token that's saved
}

function set_token(result) {
    document.cookie = "AoPSCoin=" + result.token + "; expires=1 Jan 3000 12:00:00 UTC;" // Add the token as a cookie
    location.reload()
}

// TEXT MANAGEMENT //
function encode(e) {
    return e.replace(/[^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";"
    })
}

// TIME SECTION //
function elapsedTime(time) { // This is for less than or equal to 6 hours ago
    if (time <= 60000) {
        return ("a few seconds ago")
    } // For less than a minute
    else if (time <= 3540000) { // For 1 minute - 59 minutes
        let minutes = Math.round(time / 60000) // Get the number of minutes
        if (minutes === 1) {
            return ("1 minute ago")
        } // 1 minute since the English Language won't let me plug it into the other formula
        else {
            return (minutes.toString() + " minutes ago")
        } // x minutes ago
    } else { // For any other time given (1 hour - 6 hours)
        let hours = Math.round(time / 3600000); // Get the number of hours
        if (hours === 1) {
            return ("1 hour ago")
        } // 1 hour in the singular
        else {
            return (hours.toString() + " hours ago")
        }
        // x hours ago
    }
}

function meridian(hour, minute) { // For AM and PM
    minute = minute.toString();
    if (minute.length === 1) {
        minute = "0" + minute
    } // Turns 9:5 into 9:05
    if (hour === 0) {
        return ("12:" + minute + " AM")
    } // 12 AM
    else if (hour < 12) {
        return (hour.toString() + ":" + minute + " AM")
    } // 1 AM - 11 AM
    else if (hour === 12) {
        return ("12:" + minute + " PM")
    } // 12 PM
    else {
        return ((hour - 12).toString() + ":" + minute + " PM")
    } // 1 PM - 11 PM
}

function dateFormat(time) { // NOTE: This takes anything, Dates, times, milliseconds since 1970, etc.
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] // Month list, this is global
    // Format date
    let now = new Date()
    let date = new Date(time)
    let day = date.getDate()
    let month = months[date.getMonth()]
    let year = date.getFullYear()
    let hour = date.getHours()
    let minute = date.getMinutes()
    let theday;
    //Print based on today, yesterday, or else
    if (day === now.getDate()) {
        theday = "Today"
    } // Check if the date posted was today
    else if (day === (now.getDate() - 1)) {
        theday = "Yesterday"
    } // Check if the date posted was yesterday
    else {
        theday = (month + " " + day + ", " + year)
    } // Otherwise, format as July 4, 1776
    return (theday + " at " + meridian(hour, minute)) // e.g. July 4, 1776 at 9:30 AM
}

function formatTime(date) { // Master function for the time formatting
    let nowDate = new Date(); // Get the date now
    let thenDate = new Date(date + " GMT-00:00"); // Make the input into a date
    // Get time since now and the posting time
    let then = thenDate.getTime() - (thenDate.getTimezoneOffset() * 60);
    let now = nowDate.getTime();
    let timeElapsed = now - then;

    if (timeElapsed <= 21600000) {
        return (elapsedTime(timeElapsed))
    } // If it's less than or equal to 6 hours, use the elapsed time module
    else {
        return dateFormat(date)
    } // Otherwise, just post the date sent
}

function fetch_token(name) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({"token": get_token(), "user": name});

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/get_token", requestOptions)
        .then(response => response.json())
        .then(result => handle_result("The token of " + name + " is " + result.token))
        .catch(error => console.log(error));
}

// VIEW FEED //

function setFeedHeader() {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({"token": get_token(), "user_id": 225381});

    let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/get_user", requestOptions)
        .then(response => response.json())
        .then(result => formatHeader(result))
        .catch(error => console.log('error', error));
}

function formatHeader(userdata) {
    let balance = userdata.balance
    let isValid = userdata.isValid === 1
    $("#balance").text(balance.toString() + " AoPSCoins")
    $(".username-box").text("You are logged in as " + userdata.name + ".")
    if (isValid === false) {
        $("#balance").css("color", "red") //Balance is if invalid
    } else {
        $("#balance").css("color", "#fff") // This way we auto-update the validate setting every time the feed is opened, not just on reload.
    }
}

function setFeedTopics() { // The AJAX call for getting the feed topics.
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({"token": token, "user_id": 225381});

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/get_transactions", requestOptions)
        .then(response => response.json())
        .then(result => formatFeedTopics(result))
        .catch(error => console.log('error', error));
}

function formatFeedTopics(transactions) { // Function for formatting and constructing feed. This takes a list of objects {name:"",amount:"",reason:"",timestamp: Date(),notes:""}
    let feedList = $(".tab-pane .list-group")[0] // This is where the feed content will go
    transactionList = ""
    transactions.sort(function (a, b) {
        let dateA = new Date(a.transferTime), dateB = new Date(b.transferTime);
        return dateA - dateB;
    }); // Function I found online to sort the transactions by date
    transactions.sort().reverse() // Sort the transactions by date from newest to oldest
    var transaction;
    for (transaction of transactions) { // Go through all the transactions
        // Set up the variables for simplicity
        let name = transaction.name
        let amount = transaction.amount
        let time = formatTime(transaction.transferTime)
        let notes = encode(transaction.notes)
        // Some formatting to show whether the transaction was sent or received
        if (transaction.received) {
            name = ("From " + name)
        } else {
            name = ("To " + name)
        }
        // Add the HTML with the variables added
        transactionList += (`<div class="list-group-item flex-column align-items-start">
<div class="d-flex w-100 justify-content-between">
<h5 class="mb-1">${name}</h5> 
<small>${time}</small> 
</div> 
<small>${amount} AoPSCoins</small> 
<p class="mb-1">${notes}</p> 
</div>`);
    }
    feedList.innerHTML = '<div class="list-group">' + transactionList + '</div>'
}

// NAV //

function build_nav() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({"token": get_token()});

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/get_username", requestOptions)
        .then(response => response.json())
        .then(result => nav_is_admin(result.username))
        .catch(error => console.log('error', error));
}

function nav_is_admin(name) {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/is_aopscoin_admin?user=" + name, requestOptions)
        .then(response => response.text())
        .then(result => nav_is_forum(name, result === "true"))
        .catch(error => console.log('error', error));
}

function nav_is_forum(name, is_admin) {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/is_forum?user=" + name, requestOptions)
        .then(response => response.text())
        .then(result => construct_nav(name, is_admin, result === "true"))
        .catch(error => console.log('error', error));
}

function construct_nav(name, is_admin, is_forum) {
    if (is_forum) {
        $("#tabs").append(`
    <li class="nav-item">
        <a class="nav-link" id="forum-admin-tab" data-toggle="tab" href="#forum-admin" role="tab" aria-controls="help" aria-selected="false">Forum</a>
    </li>
`)
        add_forum_graph(true, name)
    }
    if (is_admin) {
        $("#tabs").append(`
    <li class="nav-item">
        <a class="nav-link" id="aopscoin-admin-tab" data-toggle="tab" href="#aopscoin-admin" role="tab" aria-controls="help" aria-selected="false">Admin</a>
    </li>
`)
    }

}

// FORUM ADMIN TOOLBOX //

function add_forum_graph(go, forum) {
    if (go) {
        $("#forum-admin").append(`<hr>
            <img width="50%" src="${"https://quantlaw.com/forum_history?forum=" + forum}" alt=""/>
            `)
    }
}

// ADMIN TOOLBOX //
function make_admin(name) {
    let token = get_token()
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({"token": token, "user": name});

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://quantlaw.com/admin/make_admin", requestOptions)
        .then(response => response.text())
        .then(result => handle_result(result))
        .catch(error => handle_result("Either you're not casi or you're casi. In case #1, you don't need to do anything. In case #2, go fix the bug!"));
}

// HANDLING FUNCTIONS //
function handle_result(result) {
    $("#successModal-body").text(result)
    $('#successModal').modal('show');
}

function handle_error(result) {
    $("#errorModal-body").text(result)
    $('#errorModal').modal('show');
}


var token = getCookie("AoPSCoin") //Get their token that's saved
if (token) {
    setInterval(function () {
        setFeedTopics();
        setFeedHeader();
    }, 1000)
    build_nav()
    $("#transaction-form").submit(function (e) {
        e.preventDefault()
        let inputs = $("#transaction-form :input").toArray()
        let toUsers = [inputs[0].value]
        let amount = parseInt(inputs[1].value)
        let notes = inputs[2].value
        let raw = JSON.stringify({"token": get_token(), "toUsers": toUsers, "amount": amount, "notes": notes});
        console.log(raw)
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://quantlaw.com/transfer", requestOptions)
            .then(response => response.text())
            .then(result => handle_result(result))
            .catch(error => handle_error(error))
    })
    $("#fetch-token-update-form").submit(function (e) {
        e.preventDefault()
        let username = $('#token-fetch-input')[0].value
        $("#token-fetch-input")[0].value = ""
        fetch_token(username)
    })
    $("#forum-adder-form").submit(function (e) {
        e.preventDefault()
        let forum = $("#forum-name")[0].value
        let admins = $("#forum-admins")[0].value.split(",").map(admin => admin.trim())
        let token = get_token()
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({"token": token, "forum": forum, "admins": admins});

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://quantlaw.com/admin/add_forum", requestOptions)
            .then(response => response.text())
            .then(result => handle_result(result))
            .catch(handle_result('There was an error. If you are a valid admin, report this on the AoPSCoin Support Forum. Otherwise, don\'t bother.'));
    })
    $("#make-admin-form").submit(function (e) {
        e.preventDefault()
        let username = $('#make-admin-input')[0].value
        $("#make-admin-input")[0].value = ""
        make_admin(username)
    })
    $("#lgt-button").click(function () {
        document.cookie = "AoPSCoin=; expires=1 Jan 3000 12:00:00 UTC;" // Add the token as a cookie
        location.reload()
    })

} else {
    $("#loginModal").modal('show')
    $("#login-form").submit(function (e) {
        e.preventDefault()
        let inputs = $("#login-form :input").toArray()
        let username = inputs[0].value
        let password = inputs[1].value
        // Set up the settings for the request
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({"username": username, "password": password});

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://quantlaw.com/login", requestOptions)
            .then(response => response.json())
            .then(result => set_token(result))
            .catch(error => alert('Incorrect username or password'));

    });
    $("#token-login-form").submit(function (e) {
        e.preventDefault()
        let inputs = $("#token-login-form :input").toArray()
        let token = inputs[0].value
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({"token": token});

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://quantlaw.com/get_username", requestOptions)
            .then(response => response.json())
            .then(result => set_token(result))
            .catch(error => alert("Incorrect token!"));
    })
}
