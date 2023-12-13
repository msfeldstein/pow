
import { Request, Response } from 'express'
import { writeIndex } from '../util/reindex'

type Data = {
    success: boolean
}

export default async function reindex(
    _req: Request,
    res: Response<Data>
) {
    res.status(200)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');
    const contents = await writeIndex((msg) => {
        res.write(msg)
        res.write("<br/>")
    })
    if (!contents) {
        res.status(500).send({ success: false })
        return
    }
    // res.status(200).json({ success: true })
    res.end()
}
