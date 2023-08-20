
import fs from 'fs/promises'
import path from 'path'
import { MAIN_PATH, META_PATH } from '../../paths'
import sharp from 'sharp'
import fsDirect from 'fs'
import { Request, Response } from 'express'
import { Archive } from '../util/archive'

type Data = {
    success: boolean
    numPages: number
}

/// Prep a file to be viewed
/// Currently it just extracts all the pages of a comic into the __PAGES__ metadata directory
export default async function prep(
    req: Request,
    res: Response<Data>
) {
    const file = req.query.file as string


    const comicMetaPath = path.join(META_PATH, file)
    const comicPagesPath = path.join(comicMetaPath, '__PAGES__')
    if (!fsDirect.existsSync(comicPagesPath)) {
        await fs.mkdir(comicPagesPath)
    } else {
        const existingFiles = await fs.readdir(comicPagesPath)
        res.status(200).send({ success: true, numPages: existingFiles.length })
        return
    }

    const absFilePath = path.join(MAIN_PATH, file)
    const fileContents = await fs.readFile(absFilePath)
    const archive = await Archive.init(Uint8Array.from(fileContents))
    let names = archive.getFilenames("jpg")
    const extracted = archive.extractFiles(names)


    for (var i = 0; i < extracted.length; i++) {
        const extractedFile = extracted[i]
        await fs.writeFile(path.join(comicPagesPath, `${i}.jpg`), extractedFile)
    }
    let scaledHeight = 300



    // create a sharp image with the stripWidth and stripHeight
    let stripHeight = 0
    let stripWidth = 0
    let x = 0
    let toComposite = []
    let aspect = 0
    for (var i = 0; i < extracted.length; i++) {
        const extractedFile = extracted[i]
        let incomingImage = sharp(extractedFile)
        const { width, height } = await incomingImage.metadata()
        if (!width || !height) continue
        if (stripHeight === 0 && height) {
            stripHeight = height
            aspect = scaledHeight / stripHeight
        }
        if (width) {
            stripWidth += width
        }
        incomingImage.resize(Math.floor(aspect * width), scaledHeight)
        toComposite.push({ input: await incomingImage.toBuffer(), left: x, top: 0 })
        x += Math.floor(width * aspect)
    }
    let scaledWidth = Math.floor(aspect * stripWidth)
    const strip = sharp({ create: { width: scaledWidth, height: scaledHeight, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    strip.composite(toComposite)
    fs.writeFile(path.join(comicMetaPath, `strip.jpg`), await strip.jpeg().toBuffer())

    res.status(200).send({ success: true, numPages: extracted.length })
}
