import { Reveal } from './reveals'
import { WeightText } from './weight-text'

type Props = { children: string; id?: string; className?: string }

/**
 * A page <h1>: the focus target after navigation. It reveals as "lines"
 * (order 0) on direct loads and client navigations; after a play or switch
 * the card → hero morph delivers it and it is not revealed again. On home,
 * <FirstLoadSequence> runs its own title sequence. Word boxes are reserved at
 * the final weight and optical size (WeightText).
 */
export function PageTitle({ children, id = 'page-heading', className = 'page-title' }: Props) {
  return (
    <Reveal as="h1" kind="lines" order={0} id={id} className={className} tabIndex={-1}>
      <WeightText text={children} final="h1" />
    </Reveal>
  )
}
