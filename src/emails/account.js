// Sendgrid sending emails when users login/delete their account (Not currently in use)

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ahmedhatem777@hotmail.com',
        subject: 'Welcome!',
        text: `A welcoming email from me. \n ${name}.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ahmedhatem777@hotmail.com',
        subject: 'Bye!',
        text: `Sad to see you go. \n ${name}.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}