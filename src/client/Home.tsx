import styles from './Home.module.css'
import { Book, Comic, Directory } from '../types'
import { useEffect, useState } from 'react'

function pathFromHash() {
  return window.location.hash.substring(1).split('/').map(part => decodeURIComponent(part)) || []
}

export default function Home() {
  const [db, setDb] = useState<Directory | null>(null)
  const [path, setPath] = useState<string[]>([])

  // Grab the initial location from the hash
  useEffect(() => {
    if (window.location.hash.length < 2) return
    const initialPath = pathFromHash()
    setPath(initialPath)
  }, [])

  // Update the location as the hash changes (pressing the back button)
  useEffect(() => {
    const hashChange = () => {
      setPath(pathFromHash())
    }
    window.addEventListener("hashchange", hashChange)
    return () => {
      window.removeEventListener('hashchange', hashChange)
    }
  }, [])

  // Fetch the full db list
  useEffect(function fetchDirectory() {
    fetch('/api/list')
      .then((res) => res.json())
      .then((data) => setDb(data))
      .catch((err) => console.error(err))
  }, [])


  if (!db) {
    return <div>Loading</div>
  }

  function nav(file: Directory | Comic | Book) {
    const newPath = [...path, file.name]
    if (file.type === 'comic') {
      window.location.href = `/view?file=${newPath.join('/')}`
    } else if (file.type === 'book') {
      window.location.href = `/book?file=${newPath.join('/')}`
    } else {
      setPath(newPath)
      window.location.hash = newPath.join('/')
    }
  }

  function up() {
    const newPath = [...path.slice(0, path.length - 1)]
    setPath(newPath)
    window.location.hash = newPath.join('/')
  }
  // find the object in db that matches the path
  let dir = db
  for (const p of path) {
    if (!dir || !dir.files) {
      dir = db
      setPath([])
      break
    }
    dir = dir.files.find((f) => f.name === p) as Directory
  }

  const upButton = path.length > 0 ? <span onClick={up}> .. </span> : null

  const folders = dir.files.filter((f) => f.type === 'directory')
  const comics = dir.files.filter((f) => f.type === 'comic' && f.valid)
  const books = dir.files.filter(f => f.type === 'book')

  const divider = folders.length > 0 && comics.length > 0 ? <div className={styles.divider}></div> : null

  return (
    <>
      <main className={styles.main}>
        <h1 className={styles.title}>{upButton}{dir.name} </h1>
        <div className={styles.DirectoryList}>
          {folders.map((file) => {
            return (<div key={file.name} className={styles.DirectoryItem} onClick={e => nav(file)}>{file.name}</div>)
          })}
        </div>
        {divider}
        <div className={styles.CardGrid}>
          {books.map((file) => {
            return (<div key={file.name} className={styles.Card} onClick={e => nav(file)}><img alt="" width="200" src={`/api/thumb?dir=${[...path].join("/")}&file=${file.name}`} />{file.name}</div>)
          })}
        </div>
        <div className={styles.CardGrid}>
          {comics.map((file) => {
            return (<div key={file.name} className={styles.Card} onClick={e => nav(file)}><img alt="" width="200" src={`/api/thumb?dir=${[...path].join("/")}&file=${file.name}`} /></div>)
          })}
        </div>
      </main>
    </>
  )
}
