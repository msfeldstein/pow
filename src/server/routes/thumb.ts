import fs from 'fs/promises'
import path from 'path'
import { Directory } from '../../types'
import { META_PATH } from '../../paths'
import { Request, Response } from 'express'

const oneYearInSeconds = 365 * 24 * 60 * 60;

export default async function thumb(
    req: Request,
    res: Response<Buffer | string>
) {
    try {
        let contents = await fs.readFile(path.join(META_PATH, req.query.dir as string, req.query.file as string, "thumb.png"))
        res.setHeader('Content-Type', 'image/jpg')
        res.set('Cache-Control', `public, max-age=${oneYearInSeconds}`);
        res.status(200).send(contents)
    } catch (e) {
        console.error(e)
        res.status(404).send("Not found")
    }
}
