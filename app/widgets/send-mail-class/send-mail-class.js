const config = require('config');
const nodemailer = require('nodemailer');

const SEND_FROM_EMAIL = config.sendEndResultEmail.from.addr,
    SEND_FROM_EMAIL_PWD = config.sendEndResultEmail.from.pwd,
    SEND_TO_EMAIL = config.sendEndResultEmail.to,
    HOST = config.sendEndResultEmail.host;

class SendMail {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: HOST,
            auth: {
                user: SEND_FROM_EMAIL,
                pass: SEND_FROM_EMAIL_PWD
            }
        });
    }

    async result() {
        let mailOptions = {
            from: SEND_FROM_EMAIL,
            to: SEND_TO_EMAIL,
            subject: 'finished scraping',
            text: 'scraping ahs been finished, check out the results'
        };
        
        await this.send(mailOptions);
    }
    
    async err(err) {
        if (err instanceof Error) {
            err = err.toString();
        } else {
            err = JSON.stringify(err);
        }

        let mailOptions = {
            from: SEND_FROM_EMAIL,
            to: SEND_TO_EMAIL,
            subject: 'an err terminated the run of the scraper',
            text: JSON.stringify(err)
        };

        await this.send(mailOptions);
    }
    
    send(mailOptions) {
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    reject(err);
                    console.log(error);
                } else {
                    resolve();
                    console.log('Email sent: ');
                }
            });
        });
    }
}

module.exports = SendMail;