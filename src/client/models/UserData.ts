import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReadState {
    lastReadTime: number,
    currentPage: number,
    totalPages: number,
    finished: boolean
}

interface State {
    books: { [key: string]: ReadState }
    stateForPath: (key: string) => ReadState | undefined,
    setStateForPath(key: string, readState: ReadState): void
}

export const useUserData = create<State>()(
    persist(
        (set, get) => ({
            books: {},
            stateForPath: (key: string) => get().books[key],
            setStateForPath: (key: string, readState: ReadState) => set((state) => ({ books: { ...state.books, [key]: readState } })),
            clear: () => set({ books: {} }),
        }),
        {
            name: 'userData-storage'
        }
    ))