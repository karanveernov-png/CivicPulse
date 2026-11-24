import type { IssueCategory } from '../types'

export const TEMPLATES: Record<IssueCategory, { title: string; description: string }[]> = {
  pothole: [
    { title: 'Deep pothole near {n} main road', description: 'A large pothole has formed on the main stretch near {n}, causing vehicles to swerve dangerously, especially after the recent rain.' },
    { title: 'Pothole cluster outside {n} market', description: 'Several interconnected potholes have opened up outside the {n} market area, making the lane difficult for two-wheelers at night.' },
    { title: 'Road caved in near {n} bus stop', description: 'A section of the road near the {n} bus stop has caved in, exposing loose gravel and posing a risk to pedestrians and cyclists.' },
    { title: 'Crumbling road surface near {n} crossing', description: 'The road surface near the {n} crossing has crumbled badly over the past few weeks, creating an uneven and hazardous stretch for commuters.' },
  ],
  garbage: [
    { title: 'Overflowing garbage bin near {n} park', description: 'The community garbage bin near {n} park has not been cleared in several days and is now overflowing onto the footpath.' },
    { title: 'Uncollected waste pile near {n} market', description: 'A large pile of uncollected household waste has accumulated near the {n} market entrance, attracting stray animals.' },
    { title: 'Dumping ground forming near {n} lane', description: 'Residents have started dumping waste on an empty plot near {n}, and it is quickly turning into an unofficial dumping ground.' },
    { title: 'Garbage spillover blocking {n} footpath', description: 'Garbage has spilled over from the community bin and is partially blocking the footpath near {n}, forcing pedestrians onto the road.' },
  ],
  streetlight: [
    { title: 'Streetlight outage near {n} junction', description: 'Multiple streetlights near the {n} junction have stopped working, leaving the stretch dark after sunset.' },
    { title: 'Flickering streetlight near {n} park', description: 'A streetlight near {n} park has been flickering on and off for over a week and may need the fitting replaced.' },
    { title: 'Damaged streetlight pole near {n}', description: 'A streetlight pole near {n} appears to have been damaged, possibly by a vehicle, and is now leaning precariously.' },
    { title: 'Dark stretch near {n} underpass', description: 'The stretch near the {n} underpass has no functioning streetlights, making it unsafe for pedestrians at night.' },
  ],
  waterlogging: [
    { title: 'Waterlogging near {n} main road after rain', description: 'Heavy waterlogging has been reported on the main road near {n} after recent rainfall, with water levels rising above the curb.' },
    { title: 'Flooded intersection near {n}', description: 'The intersection near {n} floods within minutes of moderate rain, disrupting traffic flow significantly.' },
    { title: 'Stagnant water near {n} residential block', description: 'Stagnant rainwater has been collecting near a residential block in {n} for several days, raising concerns about mosquito breeding.' },
    { title: 'Submerged footpath near {n} market', description: 'The footpath near {n} market remains submerged under rainwater, forcing pedestrians to walk on the road.' },
  ],
  drainage: [
    { title: 'Blocked drain near {n} lane', description: 'A stormwater drain near {n} appears to be blocked with debris, causing water to back up onto the lane.' },
    { title: 'Broken drain cover near {n}', description: 'A drain cover near {n} is broken and partially missing, creating a fall hazard for pedestrians.' },
    { title: 'Overflowing sewer line near {n}', description: 'A sewer line near {n} has been overflowing intermittently, causing an unpleasant smell in the area.' },
    { title: 'Clogged culvert near {n} crossing', description: 'The culvert near the {n} crossing is clogged with silt and plastic waste, reducing water flow during rain.' },
  ],
  water_supply: [
    { title: 'Irregular water supply in {n}', description: 'Residents of {n} have reported irregular and low-pressure water supply over the past week.' },
    { title: 'Leaking water pipeline near {n}', description: 'A water pipeline near {n} appears to be leaking, with visible water pooling on the road surface.' },
    { title: 'Discoloured water complaint near {n}', description: 'Residents near {n} have reported discoloured water from their taps and are requesting an inspection.' },
    { title: 'No water supply in parts of {n}', description: 'Several households in {n} have had no piped water supply for more than two days.' },
  ],
  infrastructure: [
    { title: 'Damaged footpath railing near {n}', description: 'A section of the footpath railing near {n} has been damaged and poses a risk to pedestrians, especially children.' },
    { title: 'Broken public bench near {n} park', description: 'A public bench in {n} park has broken and now has exposed sharp edges.' },
    { title: 'Collapsed boundary wall near {n}', description: 'A section of a boundary wall near a public facility in {n} has partially collapsed after recent weather.' },
    { title: 'Damaged bus shelter near {n}', description: 'The bus shelter near {n} has a cracked roof panel that leaks during rain.' },
  ],
  other: [
    { title: 'Encroachment blocking footpath near {n}', description: 'Vendors have encroached onto the footpath near {n}, forcing pedestrians to walk on the busy road.' },
    { title: 'Stray animal concern near {n} school', description: 'Residents have raised concerns about stray animals gathering near a school in {n}.' },
    { title: 'Construction debris left near {n}', description: 'Construction debris has been left unattended on a public lane near {n} for over a week.' },
  ],
}

export const REPORTER_NAMES = [
  'Ananya Sharma', 'Rohit Verma', 'Priya Nair', 'Karan Mehta', 'Simran Kaur',
  'Aditya Rao', 'Neha Gupta', 'Vikram Singh', 'Isha Malhotra', 'Arjun Khanna',
  'Divya Joshi', 'Sanjay Kapoor', 'Fatima Ansari', 'Rahul Chawla', 'Meera Pillai',
]
