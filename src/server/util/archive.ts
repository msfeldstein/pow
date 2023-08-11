import * as unrar from 'node-unrar-js'
import AdmZip from 'adm-zip'

type ComicMetadata = {
    numPages: number
    firstPage: Uint8Array
}

enum ArchiveType {
    ZIP = 0,
    RAR = 1,
}
export class Archive {
    type: ArchiveType = ArchiveType.RAR
    unzip?: AdmZip
    unrar?: unrar.Extractor<Uint8Array>
    static async init(buffer: Uint8Array) {
        const archive = new Archive()
        const text = new TextDecoder().decode(buffer.slice(0, 4))
        if (text.startsWith("PK")) {
            archive.type = ArchiveType.ZIP
            archive.unzip = new AdmZip(Buffer.from(buffer))
        } else if (text.startsWith("Rar!")) {
            archive.type = ArchiveType.RAR
            archive.unrar = await unrar.createExtractorFromData({ data: buffer })
        } else {
            console.error("Unknown header magic, falling back to rar", text)
            archive.type = ArchiveType.RAR
            archive.unrar = await unrar.createExtractorFromData({ data: buffer })
        }
        return archive
    }

    getFilenames(): string[] {
        let names: string[] = []
        if (this.type == ArchiveType.ZIP) {
            const zipEntries = this.unzip!.getEntries()
            names = zipEntries.filter(ze => !ze.isDirectory).map(ze => ze.entryName)
        } else {
            const list = this.unrar!.getFileList()
            for (let fileHeader of list.fileHeaders) {
                if (fileHeader.flags.directory) continue
                names.push(fileHeader.name)
            }
        }

        return names.sort().filter(name => name.toLowerCase().endsWith("jpg"))
    }

    extract(filename: string): Uint8Array {
        if (this.type == ArchiveType.ZIP) {
            const file = this.unzip!.readFile(filename)
            if (!file) throw new Error("Could not read file")
            return Uint8Array.from(file)
        } else {
            const extracted = this.unrar!.extract({ files: [filename] })
            let extraction = extracted.files.next().value.extraction
            while (!extracted.files.next().done) { }
            return extraction
        }
    }

    extractFiles(filenames: string[]): Uint8Array[] {
        if (this.type == ArchiveType.ZIP) {
            return filenames.map(name => this.unzip!.readFile(name)!)
        } else {
            const extracted = this.unrar!.extract({ files: filenames })
            let extractions: any = []
            for (const extractedFile of extracted.files) {
                extractions.push(extractedFile)
            }
            return extractions.sort((a: any, b: any) => {
                return a.fileHeader.name.localeCompare(b.fileHeader.name)
            }).map((extractedFile: any) => extractedFile.extraction)
        }

    }
}