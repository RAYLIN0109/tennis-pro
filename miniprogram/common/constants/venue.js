const COURT_TYPES = [
  { value: 'hard', label: '硬地' },
  { value: 'clay', label: '红土' },
  { value: 'grass', label: '草地' },
  { value: 'carpet', label: '地毯' },
  { value: 'indoor', label: '室内' },
  { value: 'outdoor', label: '室外' }
]

const VENUE_AMENITIES = [
  { value: 'shower', label: '淋浴' },
  { value: 'locker', label: '储物柜' },
  { value: 'parking', label: '停车场' },
  { value: 'pro_shop', label: '网球商店' },
  { value: 'cafe', label: '咖啡厅' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'changing_room', label: '更衣室' },
  { value: 'lighting', label: '灯光' }
]

const SLOT_DURATION = 30 // minutes
const DAY_START = '07:00'
const DAY_END = '22:00'

function generateTimeSlots() {
  const slots = []
  const [startH, startM] = DAY_START.split(':').map(Number)
  const [endH, endM] = DAY_END.split(':').map(Number)
  let current = startH * 60 + startM
  const end = endH * 60 + endM

  while (current + SLOT_DURATION <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    const nextMin = current + SLOT_DURATION
    const nh = Math.floor(nextMin / 60)
    const nm = nextMin % 60
    slots.push({
      start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      end: `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
    })
    current += SLOT_DURATION
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

module.exports = {
  COURT_TYPES,
  VENUE_AMENITIES,
  SLOT_DURATION,
  DAY_START,
  DAY_END,
  TIME_SLOTS
}
