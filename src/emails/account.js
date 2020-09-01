const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY); //access env variable

const sendWelcomeEmail = (email, name) => {
    const msg ={
        to: email,
        from: "tomcruzana@ymail.com",
        subject: "Welcome to the app!",
        text: `Welcome to the app, ${name}. Enjoy!`
    }
    sgMail.send(msg);
}

const sendCancelationEmail = (email, name) => {
    const msg ={
        to: email,
        from: "tomcruzana@ymail.com",
        subject: "We hate to see you go!",
        text: `Hey ${name}, why did you cancel? Is there anything we could do to make you stay? Let us know!`
    }
    sgMail.send(msg);
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}

/* Template
const msg = {
    to: "tomcruzana@ymail.com",
    from: "tomcruzana@ymail.com",
    subject: "lorem ipsum dolor",
    text: "Test mail"
};

sgMail.send(msg);
*/