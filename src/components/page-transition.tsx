import { ViewTransition } from 'react'
import { pageEnter, pageExit } from '@/motion/transitions'

/** Page content enter/exit per transition type. Put it in each page, not a layout. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={pageEnter} exit={pageExit} default="none">
      {children}
    </ViewTransition>
  )
}
