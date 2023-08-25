import fs from 'fs/promises'
import path from 'path'
import { Directory } from '../../types'
import { MAIN_PATH, META_PATH } from '../../paths'
import { Request, Response } from 'express'
import nodemailer from 'nodemailer'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'

type Data = {
    success: boolean
    message: string
}

export default async function sendToKindle(
    req: Request,
    res: Response<Data>
) {
    const root = process.env.ROOT!
    const mailgunAPI = process.env.MAILGUN_API_KEY!
    const kindleAddress = "msfeldstein_uSuzcT@kindle.com"
    if (!root || !mailgunAPI) {
        res.status(500).json({ success: false, message: "Ensure you have ROOT and MAILGUN_API_KEY env vars" })
    }
    const file = req.query.file as string
    const filename = file.split("/").pop()!
    const absFilePath = path.join(MAIN_PATH, file)
    const fileContents = await fs.readFile(absFilePath)
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: mailgunAPI });

    console.log("Sending...")
    await mg.messages.create('pow.macromeez.com', {
        from: "Excited User <mailgun@pow.macromeez.com>",
        to: [kindleAddress, "msfeldstein@gmail.com"],
        subject: "Hello",
        text: "Sending a book",
        html: "<h1>Testing some Mailgun awesomeness!</h1>",
        attachment: [{ data: fileContents, filename: filename }]
    })
        .then(msg => console.log(msg)) // logs response data
        .catch(err => console.log(err)); // logs any error
    console.log("SENT")
    res.json({ success: true, message: "" })

}
