import styles from './View.module.css'
import { useCallback, useEffect, useState } from 'react'
import { useRef } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useGesture } from '@use-gesture/react'

function Page({ file, index, x }: { file: string, index: number, x: number }) {
    return <div className={styles.carouselItem} style={{ left: x }} key={index}>
        <img alt="" className={styles.carouselItemImage} src={`/api/page?file=${file}&page=${index}`} />
        <div className={styles.carouselItemOverlay}>{index}</div>
    </div>
}

function currentPageKey(file: string) {
    return `currentPage:${file}`
}

function convertFilePathToTitle(file: string) {

    const fileName = file.substring(0, file.length - 4).split("/").pop()
    return fileName
    // if (!fileName) return file
    // const titleParts = fileName.split(" ")
    // if (isNaN(titleParts[titleParts.length - 1] as any)) {
    //     return titleParts.join(" ")
    // }
    // titleParts[titleParts.length - 1] = `#${parseInt(titleParts[titleParts.length - 1])}`
    // return titleParts.join(" ")
}

function Overlay({ file, index, hideOverlay, visible }: { file: string, index: number, visible: boolean, hideOverlay: () => void }) {
    const title = convertFilePathToTitle(file)
    const goBack = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation()
        const path = file.split("/").slice(0, -1).join("")
        const newLoc = window.location
        newLoc.href = "/#" + path
        console.log(newLoc)
        debugger

    }, [])
    let className = [styles.overlay, !visible ? styles.hidden : null].join(" ")
    console.log({ className, visible })
    return <div className={className} onClick={hideOverlay}>
        <div className={styles.overlayHeader}>
            <div className={styles.overlayBack} onClick={goBack}></div>
            <div className={styles.overlayTitle}>{title}</div>
            <div className={styles.closeOverlay} onClick={hideOverlay}></div>
        </div>
    </div>
}

function Carousel({ file, numPages }: { file: string, numPages: number }) {
    const [showOverlay, setShowOverlay] = useState(false)
    const hideOverlay = useCallback(() => setShowOverlay(false), [])
    const savedPage = localStorage.getItem(currentPageKey(file))
    const [index, setIndex] = useState(savedPage ? parseInt(savedPage) : 0)
    useEffect(() => {
        localStorage.setItem(currentPageKey(file), index.toString())
    }, [index])
    const swipeIndex = useRef(0)
    const isAnimating = useRef(false)
    const width = window.innerWidth

    const [props, api] = useSpring(() => ({
        x: 0,
        config: {
            tension: 210,
            bounce: 0,
            friction: 20,
            clamp: true,
            immediate: true,
        },
        onRest: () => {
            isAnimating.current = false
        }
    }))

    const bind = useGesture({

        onDrag: ({ active, movement: [mx], direction: [xDir], cancel }) => {
            isAnimating.current = true
            if (active && Math.abs(mx) > width / 5) {
                // swipeIndex.current = clamp(swipeIndex.current + (xDir > 0 ? -1 : 1), -1, 1)
                // In order to allow rapid paging, set the index here and offset the animation to animate back to center
                // rather than waiting for the animation to finish before setting up the next page
                if (xDir > 0) {
                    api.start((value) => { return { from: { x: value - width }, to: { x: 0 } } })
                    setIndex((index) => Math.max(index - 1, 0))
                } else {
                    api.start((value) => { return { from: { x: value + width }, to: { x: 0 } } })
                    setIndex((index) => Math.min(index + 1, numPages - 1))
                }
                cancel()
            } else {
                api.start(i => {
                    const x = (i - swipeIndex.current) * width + (active ? mx : 0)
                    const scale = active ? 1 - Math.abs(mx) / width / 2 : 1
                    return { x, scale, display: 'block' }
                })
            }
        },
        onClick: ({ event }) => {
            if (isAnimating.current) return
            if (event.screenX < width / 4) {
                setIndex((index) => Math.max(index - 1, 0))
            } else if (event.screenX > width * 3 / 4) {
                setIndex((index) => Math.min(index + 1, numPages - 1))
            } else {
                setShowOverlay((showOverlay) => !showOverlay)
            }
        }
    }, {
        drag: {
            preventScroll: true,
            threshold: 10,
            pointer: {
                touch: true
            },
        }
    })

    const left = index > 0 ? Page({ file, index: index - 1, x: -width }) : null
    const center = Page({ file, index, x: 0 })
    const right = index < numPages - 1 ? Page({ file, index: index + 1, x: width }) : null

    return (<>
        <animated.div className={styles.carousel} {...bind()} style={props} onDragStart={e => e.preventDefault()}>
            {[left, center, right]}
        </animated.div>
        <Overlay file={file} index={index} hideOverlay={hideOverlay} visible={showOverlay} />
    </>
    )
}

export default function View() {
    const [metadata, setMetadata] = useState<{ numPages: number } | null>(null)
    const [path, setPath] = useState<string[]>([])
    useEffect(function fetchDirectory() {
        const file = new URL(document.location.href).searchParams.get('file')
        fetch(`/api/prep?file=${file}`)
            .then((res) => res.json())
            .then((data) => setMetadata(data))
            .catch((err) => console.error(err))
    }, [])

    if (!metadata) {
        return <div>Loading</div>
    }

    const file = new URL(document.location.href).searchParams.get('file')
    if (!file)
        return <div>No file</div>


    return (
        <>
            <main className={styles.main}>
                <Carousel file={file} numPages={metadata.numPages} />
            </main>
        </>
    )
}
