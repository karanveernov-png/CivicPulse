import type { Ward } from '../types'
import { DELHI_NEIGHBORHOODS } from '../lib/geo'

export const SEED_WARDS: Ward[] = Array.from(
  new Map(DELHI_NEIGHBORHOODS.map((n) => [n.ward, n])).values(),
).map((n, i) => ({
  id: `ward-${i + 1}`,
  name: n.ward,
  neighborhoods: DELHI_NEIGHBORHOODS.filter((x) => x.ward === n.ward).map((x) => x.name),
}))
