import fs from 'fs/promises'
import path from 'path'
import { Directory } from '../../types'
import { META_PATH } from '../../paths'
import { Request, Response } from 'express'

type Data = {
    contents: Directory
}

export default async function thumb(
    req: Request,
    res: Response<Buffer | string>
) {
    try {
        console.log("Reading", path.join(META_PATH, req.query.dir as string, req.query.file as string, "thumb.png"))
        let contents = await fs.readFile(path.join(META_PATH, req.query.dir as string, req.query.file as string, "thumb.png"))
        console.log("Contents", contents)
        res.setHeader('Content-Type', 'image/jpg')
        res.status(200).send(contents)
    } catch (e) {
        console.error(e)
        res.status(404).send("Not found")
    }
}
