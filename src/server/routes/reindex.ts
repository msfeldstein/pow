import fs from 'fs/promises'
import fsDirect from 'fs'
import path from 'path'
import sharp from 'sharp'
import { Directory } from '../../types'
import { MAIN_PATH, META_PATH } from '../../paths'
import { Archive } from '../util/archive'
import { Request, Response } from 'express'

// include and initialize the rollbar library with your access token
var Rollbar = require('rollbar')
var rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
})


type Data = {
    contents: Directory
}

const mainRoot = MAIN_PATH
const metaRoot = META_PATH

export async function recursivelyFetchFiles(curPath: string, name: string): Promise<Directory> {
    const absPath = path.join(mainRoot, curPath)
    console.log("Recursing to directory", absPath)
    let files = await fs.readdir(absPath)
    let directory: Directory = { name, type: "directory", files: [] }
    const thumbsPath = path.join(metaRoot, curPath)
    if (!fsDirect.existsSync(thumbsPath)) {
        await fs.mkdir(thumbsPath)
    }
    for (let file of files) {
        const filePath = path.join(curPath, file)
        const absFilePath = path.join(mainRoot, filePath)
        let stat = await fs.stat(absFilePath)
        if (stat.isDirectory() && !file.startsWith("__")) {
            directory.files.push(await recursivelyFetchFiles(filePath, file))
        } else if (file.toLowerCase().endsWith(".cbz") || file.toLocaleLowerCase().endsWith(".cbr")) {
            console.log("handling file", file)
            let valid = true
            let numPages = 0
            try {

                const fileContents = await fs.readFile(absFilePath)
                const buffer = Uint8Array.from(fileContents)
                const archive = await Archive.init(buffer)
                const names = archive.getFilenames()
                numPages = names.length
                const firstPage = archive.extract(names[0])
                // Write out the full size image and a thumbnail
                const comicMetaPath = path.join(thumbsPath, file)
                if (!fsDirect.existsSync(comicMetaPath)) {
                    await fs.mkdir(comicMetaPath)
                }
                await fs.writeFile(path.join(comicMetaPath, "fullsize.jpg"), firstPage)
                await sharp(firstPage).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))

            } catch (e: any) {
                valid = false
                console.error("Error unzipping", e, file)
                rollbar.error("Error unzipping", e, { file })
            }
            directory.files.push({ type: "comic", name: file, valid, numPages })
        }
    }
    return directory
}

export default async function reindex(
    req: Request,
    res: Response<Data>
) {
    let contents = await recursivelyFetchFiles("", "~")

    await fs.writeFile(process.env.ROOT! + "/db.json", JSON.stringify(contents, null, 2))
    res.status(200).json({ contents })
}
