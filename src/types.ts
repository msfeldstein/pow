export type Comic = {
    name: string
    type: "comic"
    valid: boolean
    numPages: number
}

export type Book = {
    name: string
    type: "book"
    valid: boolean
}

export type Directory = {
    name: string
    type: "directory"
    files: (Directory | Comic | Book)[]
}
