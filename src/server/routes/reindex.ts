
import { Request, Response } from 'express'
import { writeIndex } from '../util/reindex'

type Data = {
    success: boolean
}

export default async function reindex(
    _req: Request,
    res: Response<Data>
) {
    const contents = await writeIndex()
    if (!contents) {
        res.status(500).send({ success: false })
        return
    }
    res.status(200).json({ success: true })
}
