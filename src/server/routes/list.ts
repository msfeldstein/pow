import fs from 'fs/promises'
import { Request, Response } from 'express'
import { META_PATH } from '../../paths'


export default async function list(
    req: Request,
    res: Response<Buffer>
) {
    console.log("lets get the list", META_PATH + "/db.json")
    try {

        let contents = JSON.parse((await fs.readFile(META_PATH + "/db.json")).toString())
        console.log("Got contents of size", Object.keys(contents).length)
        res.status(200).json(contents)
    } catch (e) {
        console.log("Error", e)
        // res.status(500).send("hello")
    }
}
