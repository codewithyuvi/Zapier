import nodemailer from "nodemailer";
import { parseDynamicData } from "../parser";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function executeEmail(config: any, webhookPayload: any){
    const rawEmailTo = (config as any)?.to || "yuvrajbansal30dec@gmail.com";
    const emailTo = parseDynamicData(rawEmailTo, webhookPayload);
    
    if (!emailTo || emailTo.trim() === "") {
      throw new Error(`Cannot send email: 'To' address resolved to empty string. Check your webhook payload.`);        
    }

    const rawEmailBody = (config as any)?.body || "This email was automatically sent by your worker process.";
    const emailBody = parseDynamicData(rawEmailBody, webhookPayload) || rawEmailBody;

    console.log(`✉️ SIMULATED: Sending email to ${emailTo}`);

    await transporter.sendMail({
        from: '"Zapier" <bot@zapier.com>',
        to: emailTo,
        subject: "Automated Zap Execution!",
        text: emailBody,
    });
    console.log(`✉️ REAL EMAIL SENT to ${emailTo}!`);
}