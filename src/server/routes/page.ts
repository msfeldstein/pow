import fs from 'fs/promises'
import path from 'path'
import { Directory } from '../../types'
import { META_PATH } from '../../paths'
import { Request, Response } from 'express'

type Data = {
    contents: Directory
}

export default async function page(
    req: Request,
    res: Response<Buffer>
) {
    const root = process.env.ROOT!
    const file = req.query.file as string
    const comicMetaPath = path.join(META_PATH, file, '__PAGES__')
    let contents = await fs.readFile(path.join(comicMetaPath, req.query.page + ".jpg"))
    res.setHeader('Content-Type', 'image/jpg')
    res.status(200).send(contents)
}
