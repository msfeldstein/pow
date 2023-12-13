import path from "path"
import { MAIN_PATH, META_PATH } from "../../paths"
import { Directory } from "../../types"
import fs from 'fs/promises'
import fsDirect from 'fs'
import { Archive } from "./archive"
import sharp from "sharp"

const IGNORED = [".DS_Store", "__MACOSX", "@eaDir"]

const dbgLog = function (msg: any, optionalParams: any) {
    console.log(msg, optionalParams)
}



class Indexer {
    dir: string
    totalFiles: number = 0
    filesProcessed: number = 0
    constructor(dir: string) {
        this.dir = dir
    }

    async init() {
        this.totalFiles = await this.countCbrFiles(this.dir)
        console.log("Ready to process", this.totalFiles, "files")
    }

    async countCbrFiles(dir: string) {
        let count = 0;

        async function recurse(currentPath: string) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (let entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    await recurse(fullPath);
                } else if (entry.isFile() && [".cbr", ".cbz", ".epub"].includes(path.extname(entry.name).toLowerCase())) {
                    count++;
                }
            }
        }

        await recurse(dir);
        return count;
    }

    async buildIndex() {
        this.filesProcessed = 0
        return await this.recursivelyFetchFiles("", "~")
    }

    fileProcessed(name: string) {
        this.filesProcessed++
        console.log(`Processed ${this.filesProcessed} / ${this.totalFiles}: ${name}`)
    }

    async recursivelyFetchFiles(curPath: string, name: string): Promise<Directory | null> {
        if (IGNORED.includes(name)) return null
        const absPath = path.join(MAIN_PATH, curPath)
        dbgLog("Enter", absPath)
        let files = await fs.readdir(absPath)
        let directory: Directory = { name, type: "directory", files: [] }
        const thumbsPath = path.join(META_PATH, curPath)
        if (!fsDirect.existsSync(thumbsPath)) {
            await fs.mkdir(thumbsPath, { recursive: true })
        }
        for (let file of files) {
            const filePath = path.join(curPath, file)
            const absFilePath = path.join(MAIN_PATH, filePath)
            let stat = await fs.stat(absFilePath)
            if (stat.isDirectory() && !file.startsWith("__") && !file.startsWith(".")) {
                const subdirectory = await this.recursivelyFetchFiles(filePath, file)
                if (subdirectory) directory.files.push(subdirectory)
            } else if (file.toLowerCase().endsWith(".epub")) {
                let valid = true
                try {

                    const fileContents = await fs.readFile(absFilePath)
                    const buffer = Uint8Array.from(fileContents)

                    const archive = await Archive.init(buffer)
                    const names = archive.getFilenames("")
                    const coverPath = names.find(n => n.includes("cover"))
                    if (!coverPath) {
                        valid = false
                        dbgLog("NO COVER FOR", file)
                    } else {

                        const firstPage = archive.extract(coverPath)
                        // Write out the full size image and a thumbnail
                        const comicMetaPath = path.join(thumbsPath, file)
                        if (!fsDirect.existsSync(comicMetaPath)) {
                            await fs.mkdir(comicMetaPath)
                        }
                        await fs.writeFile(path.join(comicMetaPath, "fullsize.jpg"), firstPage)
                        await sharp(firstPage).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))
                    }
                } catch (e: any) {
                    valid = false
                    console.error("Error unzipping", e, file)
                }
                this.fileProcessed(file)
                directory.files.push({ type: "book", name: file, valid })
            } else if (file.toLowerCase().endsWith(".cbz") || file.toLocaleLowerCase().endsWith(".cbr")) {
                let valid = true
                let numPages = 0
                try {
                    const comicMetaPath = path.join(thumbsPath, file)
                    const coverPath = path.join(comicMetaPath, "fullsize.jpg")
                    const fileContents = await fs.readFile(absFilePath)
                    const buffer = Uint8Array.from(fileContents)
                    const archive = await Archive.init(buffer)
                    const names = archive.getFilenames("jpg")
                    numPages = names.length
                    const firstPage = archive.extract(names[0])
                    // Write out the full size image and a thumbnail
                    if (!fsDirect.existsSync(comicMetaPath)) {
                        await fs.mkdir(comicMetaPath)
                    }
                    await fs.writeFile(coverPath, firstPage)
                    await sharp(firstPage).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))

                } catch (e: any) {
                    valid = false
                    console.error("Error unzipping", e, file)
                }
                this.fileProcessed(file)
                directory.files.push({ type: "comic", name: file, valid, numPages })
            }
        }
        return directory
    }
}



export async function writeIndex() {
    const indexer = new Indexer(MAIN_PATH)
    await indexer.init()
    let contents = await indexer.buildIndex()
    await fs.writeFile(path.join(META_PATH, "db.json"), JSON.stringify(contents, null, 2))
    return contents
}