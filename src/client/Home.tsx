import styles from './Home.module.css'
import { Book, Comic, Directory } from '../types'
import { useContext, useEffect, useState } from 'react'
import ComicCard from './ComicCard'
import Recents from './Recents'
import DirectoryCard from './DirectoryCard'
import { DBContext } from './models/db'

function pathFromHash() {
  return window.location.hash.substring(1).split('/').filter(p => p.length > 0).map(part => decodeURIComponent(part)) || []
}

export default function Home() {
  const db = useContext(DBContext)
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
      console.log("Path from hash", pathFromHash())
      setPath(pathFromHash())
    }
    window.addEventListener("hashchange", hashChange)
    return () => {
      window.removeEventListener('hashchange', hashChange)
    }
  }, [])



  if (!db) {
    return <div>Loading</div>
  }

  function nav(file: Directory | Comic | Book) {
    const newPath = [...path, file.name]
    if (file.type === 'comic') {
      window.location.href = `/view?file=${encodeURIComponent(newPath.join('/'))}`
    } else if (file.type === 'book') {
      window.location.href = `/book?file=${encodeURIComponent(newPath.join('/'))}`
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

  const folders = dir.files.filter((f) => f.type === 'directory') as Directory[]
  const comics = dir.files.filter((f) => f.type === 'comic' && f.valid) as Comic[]
  const books = dir.files.filter(f => f.type === 'book') as Book[]

  const divider = folders.length > 0 && comics.length > 0 ? <div className={styles.divider}></div> : null
  const recents = path.length === 0 ? <Recents /> : null
  const breadcrumbs = path.length > 0 ? <h1 className={styles.title}>{upButton}{dir.name} </h1> : null
  return (
    <>
      <main className={styles.main}>
        {recents}
        {breadcrumbs}
        {folders.length > 0 && <div className={styles.DirectoryContainer} ><h1>Folders</h1>
          <div className={styles.DirectoryList}>
            {folders.map((file) => <DirectoryCard nav={nav} key={file.name} directory={file} />)}
          </div>
        </div>}
        {divider}
        {books.length > 0 && <div className={styles.CardGrid}>
          {books.map((file) => {
            return (<div key={file.name} className={styles.Card} onClick={e => nav(file)}><img alt="" width="200" src={`/api/thumb?dir=${encodeURIComponent([...path].join("/"))}&file=${encodeURIComponent(file.name)}`} />{file.name}</div>)
          })}
        </div>}
        {comics.length > 0 && <div className={styles.CardGrid}>
          {comics.map((file) => {
            return (<ComicCard path={path} key={file.name} file={file} nav={nav} />)
          })}
        </div>}
      </main>
    </>
  )
}
