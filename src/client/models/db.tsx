import { useEffect, useState } from "react"
import { Directory } from "../../types"

import { createContext } from 'react';
import { Dir } from "fs";

export const DBContext = createContext<Directory | null>(null);

export const DBProvider = ({ children }: { children: React.ReactNode }) => {
    const [db, setDb] = useState<Directory | null>(null)
    // Fetch the full db list
    useEffect(function fetchDirectory() {
        fetch('/api/list')
            .then((res) => res.json())
            .then((data) => setDb(data))
            .catch((err) => console.error(err))
    }, [])

    return (
        <DBContext.Provider value={db}>
            {children}
        </DBContext.Provider>
    );
}

export const findSeries = (db: Directory, file: string): Directory | null => {
    const path = file.split("/")
    path.pop()
    let dir = db
    for (const p of path) {
        dir = dir.files.find((child) => child.name === p) as Directory
        if (!dir) return null
    }
    return dir
}

export const dir = (file: string) => {
    const parts = file.split("/")
    parts.pop()
    return parts.join("/")
}

export const filename = (file: string) => {
    const parts = file.split("/")
    return parts.pop()
}