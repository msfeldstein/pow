export type Comic = {
    name: string
    fullPath: string
    type: "comic"
    valid: boolean
    numPages: number
}

export type Book = {
    name: string
    fullPath: string
    type: "book"
    valid: boolean
}

export type Directory = {
    name: string
    fullPath: string
    type: "directory"
    files: (Directory | Comic | Book)[]
    thumbnails: string[]
}

export type File = Comic | Book | Directory