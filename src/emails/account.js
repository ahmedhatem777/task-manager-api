const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ahmedhatem777@hotmail.com',
        subject: 'Welcome Welcome!!',
        text: `A welcoming email from me to me. \n ${name}`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ahmedhatem777@hotmail.com',
        subject: 'Bye baby bye bye!!',
        text: `Sad to see you go. \n ${name}`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}